import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateSubtaskData } from '@/types/tasks'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('GET subtasks - Unauthorized:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const task_id = searchParams.get('task_id')

    if (!task_id) {
      console.log('GET subtasks - Missing task_id parameter')
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 })
    }

    // Verify user has access to the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, list_id')
      .eq('id', task_id)
      .single()

    if (taskError || !task) {
      console.log('GET subtasks - Task not found:', taskError)
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Get workspace ownership info
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('workspace_id, workspaces!inner(owner_id)')
      .eq('id', task.list_id)
      .single()

    if (listError || !list) {
      console.log('GET subtasks - List not found:', listError)
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    const isOwner = (list.workspaces as { owner_id?: string }).owner_id === user.id

    if (!isOwner) {
      // Check if user is a collaborator on this task
      const { data: collaborator } = await supabase
        .from('task_collaborators')
        .select('user_id')
        .eq('task_id', task_id)
        .eq('user_id', user.id)
        .single()

      if (!collaborator) {
        console.log('GET subtasks - Access denied for user:', user.id, 'task:', task_id)
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Get subtasks for the task
    const { data: subtasks, error } = await supabase
      .from('subtasks')
      .select('*')
      .eq('task_id', task_id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      console.log('GET subtasks - Failed to fetch subtasks:', error)
      return NextResponse.json({ error: 'Failed to fetch subtasks' }, { status: 500 })
    }

    console.log('GET subtasks - Success, found', subtasks?.length || 0, 'subtasks for task:', task_id)
    return NextResponse.json(subtasks || [])
  } catch (error) {
    console.error('Unexpected error:', error)
    console.log('GET subtasks - Internal server error:', error)
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

    const body: CreateSubtaskData = await request.json()
    const { task_id, title } = body

    if (!task_id || !title?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user has access to the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, created_by, list_id')
      .eq('id', task_id)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Get workspace ownership info
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('workspace_id, workspaces!inner(owner_id)')
      .eq('id', task.list_id)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Check permissions (workspace owner, task creator, or task collaborator)
    const isOwner = (list.workspaces as { owner_id: string }[])[0]?.owner_id === user.id
    const isCreator = task.created_by === user.id

    if (!isOwner && !isCreator) {
      const { data: collaborator } = await supabase
        .from('task_collaborators')
        .select('role')
        .eq('task_id', task_id)
        .eq('user_id', user.id)
        .single()

      if (!collaborator || collaborator.role === 'observer') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Create subtask
    const { data: subtask, error } = await supabase
      .from('subtasks')
      .insert({
        task_id,
        title: title.trim()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create subtask' }, { status: 500 })
    }

    // Log activity
    await supabase.from('task_activity').insert({
      task_id,
      actor: user.id,
      type: 'subtask_added',
      payload: { subtask_id: subtask.id, title: subtask.title }
    })

    return NextResponse.json(subtask)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}