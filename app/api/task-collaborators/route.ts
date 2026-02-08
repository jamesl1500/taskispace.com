import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateTaskCollaboratorData } from '@/types/tasks'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('GET task-collaborators: Unauthorized - auth error or no user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const task_id = searchParams.get('task_id')

    if (!task_id) {
      console.log('GET task-collaborators: Missing task_id parameter')
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 })
    }

    // Verify user has access to the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, list_id')
      .eq('id', task_id)
      .single()

    if (taskError || !task) {
      console.log('GET task-collaborators: Task not found', { task_id, taskError })
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check workspace ownership or task collaboration
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('workspace_id, workspaces!inner(owner_id)')
      .eq('id', task.list_id)
      .single()

    if (listError || !list) {
      console.log('GET task-collaborators: List access denied', { list_id: task.list_id, listError })
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const isOwner = (list.workspaces as { owner_id?: string })?.owner_id === user.id

    if (!isOwner) {
      const { data: collaborator } = await supabase
        .from('task_collaborators')
        .select('user_id')
        .eq('task_id', task_id)
        .eq('user_id', user.id)
        .single()

      if (!collaborator) {
        console.log('GET task-collaborators: Access denied - not owner or collaborator', { task_id, user_id: user.id })
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Get task collaborators
    const { data: collaborators, error } = await supabase
      .from('task_collaborators')
      .select('*')
      .eq('task_id', task_id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      console.log('GET task-collaborators: Failed to fetch collaborators', { task_id, error })
      return NextResponse.json({ error: 'Failed to fetch task collaborators' }, { status: 500 })
    }

    console.log('GET task-collaborators: Success', { task_id, collaborators_count: collaborators?.length || 0 })
    return NextResponse.json(collaborators || [])
  } catch (error) {
    console.error('Unexpected error:', error)
    console.log('GET task-collaborators: Internal server error', { error })
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

    const body: CreateTaskCollaboratorData = await request.json()
    const { task_id, user_id, role } = body

    if (!task_id || !user_id || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user has access to manage the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, list_id, created_by')
      .eq('id', task_id)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check permissions (workspace owner or task creator)
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('workspace_id, workspaces!inner(owner_id)')
      .eq('id', task.list_id)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const isOwner = (list.workspaces as { owner_id?: string })?.owner_id === user.id
    const isCreator = task.created_by === user.id

    if (!isOwner && !isCreator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if user is already a collaborator
    const { data: existingCollaborator } = await supabase
      .from('task_collaborators')
      .select('user_id')
      .eq('task_id', task_id)
      .eq('user_id', user_id)
      .single()

    if (existingCollaborator) {
      return NextResponse.json({ error: 'User is already a collaborator on this task' }, { status: 409 })
    }

    // Add collaborator
    const { data: collaborator, error } = await supabase
      .from('task_collaborators')
      .insert({
        task_id,
        user_id,
        role,
        added_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to add task collaborator' }, { status: 500 })
    }

    // Log activity
    await supabase.from('task_activity').insert({
      task_id,
      actor: user.id,
      type: 'collaborator_added',
      payload: { 
        collaborator_id: user_id,
        role,
        added_by: user.id
      }
    })

    return NextResponse.json(collaborator)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}