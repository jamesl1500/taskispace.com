/**
 * Jarvis Task Creation API Route
 * 
 * This endpoint handles task creation requests from the Jarvis AI assistant.
 * It validates user input, checks workspace/list access, and creates tasks with AI context.
 * 
 * @module app/api/jarvis/create-task/route
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SubscriptionService } from '@/lib/services/subscription-service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      title, 
      description, 
      priority = 'medium', 
      due_date,
      workspace_id,
      list_id 
    } = body

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 })
    }

    if (!workspace_id || !list_id) {
      return NextResponse.json({ 
        error: 'Workspace and list are required. Please specify which workspace and list to add the task to.',
        needsWorkspace: true
      }, { status: 400 })
    }

    // Check subscription limit for tasks
    const subscriptionService = new SubscriptionService()
    const limitCheck = await subscriptionService.checkLimit(user.id, 'maxTasks')

    if (!limitCheck.allowed) {
      return NextResponse.json(
        { 
          error: limitCheck.reason,
          upgrade: true,
          current: limitCheck.current,
          limit: limitCheck.limit
        },
        { status: 403 }
      )
    }

    // Verify user has access to the workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('workspace_id', workspace_id)
      .eq('user_id', user.id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json({ 
        error: 'You do not have access to this workspace',
        needsWorkspace: true 
      }, { status: 403 })
    }

    // Verify the list exists and belongs to the workspace
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id, name, workspace_id')
      .eq('id', list_id)
      .eq('workspace_id', workspace_id)
      .single()

    if (listError || !list) {
      return NextResponse.json({ 
        error: 'List not found in this workspace',
        needsWorkspace: true 
      }, { status: 404 })
    }

    // Create the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        status: 'todo',
        priority: priority,
        list_id: list_id,
        created_by: user.id,
        assignee: user.id,
        due_date: due_date || null,
      })
      .select()
      .single()

    if (taskError) {
      console.error('Database error creating task:', taskError)
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }

    // Add creator as collaborator
    await supabase
      .from('task_collaborators')
      .insert({
        task_id: task.id,
        user_id: user.id,
        role: 'assignee',
        added_by: user.id
      })

    // Log task creation activity
    await supabase
      .from('task_activity')
      .insert({
        task_id: task.id,
        actor: user.id,
        type: 'task_created',
        payload: {
          title: task.title,
          status: task.status,
          priority: task.priority,
          created_via: 'jarvis_ai'
        }
      })

    // Track usage for subscription limits
    await subscriptionService.incrementUsage(user.id, 'tasks_created')

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        due_date: task.due_date,
        list_name: list.name
      }
    })
  } catch (error) {
    console.error('Error in Jarvis task creation:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
