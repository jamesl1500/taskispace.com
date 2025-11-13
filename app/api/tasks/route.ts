import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const list_id = searchParams.get('list_id')
    const workspace_id = searchParams.get('workspace_id')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    let query = supabase
      .from('tasks')
      .select('*')

    // Filter by list_id if provided
    if (list_id) {
      query = query.eq('list_id', list_id)
    }
    
    // Filter by workspace_id if provided
    if (workspace_id) {
      query = query.eq('workspace_id', workspace_id)
    }

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
    }
    if (status) {
      query = query.eq('status', status)
    }
    if (priority) {
      query = query.eq('priority', priority)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    const { data: tasks, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
    }

    return NextResponse.json(tasks || [])
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, status, priority, workspace_id, list_id, assignee_id, due_date } = body

    if (!title || !workspace_id || !list_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user has access to the workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspace_id)
      .eq('owner_id', user.id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 403 })
    }

    // Verify the list exists and belongs to the workspace
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id')
      .eq('id', list_id)
      .eq('workspace_id', workspace_id)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title,
        description,
        status: status || 'todo',
        priority: priority || 'medium',
        list_id,
        created_by: user.id,
        assignee_id,
        due_date,
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
    }

    // Automatically add the creator as a task collaborator with 'assignee' role
    const { error: collaboratorError } = await supabase
      .from('task_collaborators')
      .insert({
        task_id: task.id,
        user_id: user.id,
        role: 'assignee',
        added_by: user.id
      })

    if (collaboratorError) {
      console.error('Failed to add task collaborator:', collaboratorError)
      // Don't fail the task creation if collaborator addition fails
      // Just log the error for debugging
    }

    // Log task creation activity
    const { error: activityError } = await supabase
      .from('task_activity')
      .insert({
        task_id: task.id,
        actor: user.id,
        type: 'task_created',
        payload: {
          title: task.title,
          status: task.status,
          priority: task.priority
        }
      })

    if (activityError) {
      console.error('Failed to log task activity:', activityError)
      // Don't fail the task creation if activity logging fails
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}