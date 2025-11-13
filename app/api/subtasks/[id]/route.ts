import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UpdateSubtaskData } from '@/types/tasks'

interface RouteParams {
  params: Promise<{
    id: string // subtask id
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const resolvedParams = await params

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: subtask, error } = await supabase
      .from('subtasks')
      .select('*')
      .eq('id', resolvedParams.id)
      .single()

    if (error || !subtask) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 })
    }

    // Verify access to the parent task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, list_id')
      .eq('id', subtask.task_id)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Parent task not found' }, { status: 404 })
    }

    // Check workspace ownership or task collaboration
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('workspace_id, workspaces!inner(owner_id)')
      .eq('id', task.list_id)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const isOwner = (list.workspaces as { owner_id: string }[])[0]?.owner_id === user.id

    if (!isOwner) {
      const { data: collaborator } = await supabase
        .from('task_collaborators')
        .select('user_id')
        .eq('task_id', subtask.task_id)
        .eq('user_id', user.id)
        .single()

      if (!collaborator) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    return NextResponse.json(subtask)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const resolvedParams = await params

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: UpdateSubtaskData = await request.json()

    // Get subtask with access verification
    const { data: subtask, error: subtaskError } = await supabase
      .from('subtasks')
      .select('*')
      .eq('id', resolvedParams.id)
      .single()

    if (subtaskError || !subtask) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 })
    }

    // Verify access (similar to GET)
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, list_id, created_by')
      .eq('id', subtask.task_id)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Parent task not found' }, { status: 404 })
    }

    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('workspace_id, workspaces!inner(owner_id)')
      .eq('id', task.list_id)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const isOwner = (list.workspaces as { owner_id: string }[])[0]?.owner_id === user.id
    const isCreator = task.created_by === user.id

    if (!isOwner && !isCreator) {
      const { data: collaborator } = await supabase
        .from('task_collaborators')
        .select('role')
        .eq('task_id', subtask.task_id)
        .eq('user_id', user.id)
        .single()

      if (!collaborator || collaborator.role === 'observer') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Update subtask
    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.done !== undefined) updateData.done = body.done
    if (body.description !== undefined) updateData.description = body.description.trim()

    const { data: updatedSubtask, error } = await supabase
      .from('subtasks')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', resolvedParams.id, error)
      return NextResponse.json({ error: 'Failed to update subtask' }, { status: 500 })
    }

    // Log activity if completion status changed
    if (body.done !== undefined && body.done !== subtask.done) {
      await supabase.from('task_activity').insert({
        task_id: subtask.task_id,
        actor: user.id,
        type: body.done ? 'subtask_completed' : 'subtask_reopened',
        payload: { subtask_id: subtask.id, title: subtask.title }
      })
    }

    return NextResponse.json(updatedSubtask)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const resolvedParams = await params

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get subtask with access verification
    const { data: subtask, error: subtaskError } = await supabase
      .from('subtasks')
      .select('*')
      .eq('id', resolvedParams.id)
      .single()

    if (subtaskError || !subtask) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 })
    }

    // Verify access (workspace owner, task creator, or assignee/reviewer)
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, list_id, created_by')
      .eq('id', subtask.task_id)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Parent task not found' }, { status: 404 })
    }

    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('workspace_id, workspaces!inner(owner_id)')
      .eq('id', task.list_id)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const isOwner = (list.workspaces as { owner_id: string }[])[0]?.owner_id === user.id
    const isCreator = task.created_by === user.id

    if (!isOwner && !isCreator) {
      const { data: collaborator } = await supabase
        .from('task_collaborators')
        .select('role')
        .eq('task_id', subtask.task_id)
        .eq('user_id', user.id)
        .single()

      if (!collaborator || collaborator.role === 'observer') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Delete subtask
    const { error } = await supabase
      .from('subtasks')
      .delete()
      .eq('id', resolvedParams.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete subtask' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Subtask deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}