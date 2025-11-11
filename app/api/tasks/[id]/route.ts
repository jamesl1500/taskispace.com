import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UpdateTaskData } from '@/types'

interface RouteParams {
  params: Promise<{
    id: string // task id
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

    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        workspace:workspaces(*)
      `)
      .eq('id', resolvedParams.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
    }

    // Verify user has access to the workspace
    if (task.workspace?.owner !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(task)
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

    // First verify the task exists and user has access
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select(`
        id, 
        status,
        workspace:workspaces(owner)
      `)
      .eq('id', resolvedParams.id)
      .single()

    if (fetchError || !existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if ((existingTask.workspace as { owner: string }[])?.[0]?.owner !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body: UpdateTaskData = await request.json()

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.description !== undefined) updateData.description = body.description?.trim() || null
    if (body.status !== undefined) {
      updateData.status = body.status
      // Set completion timestamp when marking as completed
      if (body.status === 'completed' && (existingTask as { status: string }).status !== 'completed') {
        updateData.completed_at = new Date().toISOString()
      } else if (body.status !== 'completed') {
        updateData.completed_at = null
      }
    }
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.assignee_id !== undefined) updateData.assignee_id = body.assignee_id
    if (body.due_date !== undefined) updateData.due_date = body.due_date
    if (body.tags !== undefined) updateData.tags = body.tags

    // Validate title if provided
    if (body.title !== undefined && body.title.trim().length === 0) {
      return NextResponse.json({ error: 'Task title cannot be empty' }, { status: 400 })
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
    }

    return NextResponse.json(task)
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

    // First verify the task exists and user has access
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select(`
        id,
        workspace_id,
        workspaces!inner(owner)
      `)
      .eq('id', resolvedParams.id)
      .single()

    if (fetchError || !existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if ((existingTask.workspaces as { owner: string }[])?.[0]?.owner !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', resolvedParams.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}