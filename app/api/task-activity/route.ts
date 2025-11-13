import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('GET task-activity: Unauthorized - auth error or no user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const task_id = searchParams.get('task_id')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')
    const activity_type = searchParams.get('type')

    if (!task_id) {
      console.log('GET task-activity: Missing task_id parameter')
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 })
    }

    // Verify user has access to the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, list_id')
      .eq('id', task_id)
      .single()

    if (taskError || !task) {
      console.log('GET task-activity: Task not found', { task_id, taskError })
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check workspace ownership or task collaboration
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('workspace_id, workspaces!inner(owner_id)')
      .eq('id', task.list_id)
      .single()

    if (listError || !list) {
      console.log('GET task-activity: List access denied', { list_id: task.list_id, listError })
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const isOwner = (list.workspaces as { owner_id?: string }).owner_id === user.id

    if (!isOwner) {
      const { data: collaborator } = await supabase
        .from('task_collaborators')
        .select('user_id')
        .eq('task_id', task_id)
        .eq('user_id', user.id)
        .single()

      if (!collaborator) {
        console.log('GET task-activity: User not owner or collaborator', { user_id: user.id, task_id })
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Build query
    let query = supabase
      .from('task_activity')
      .select('*')
      .eq('task_id', task_id)

    // Filter by activity type if provided
    if (activity_type) {
      query = query.eq('type', activity_type)
    }

    // Apply pagination
    if (limit) {
      query = query.limit(parseInt(limit))
    }
    if (offset) {
      const offsetNum = parseInt(offset)
      const limitNum = limit ? parseInt(limit) : 50
      query = query.range(offsetNum, offsetNum + limitNum - 1)
    }

    const { data: activities, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      console.log('GET task-activity: Database error fetching activities', { task_id, error })
      return NextResponse.json({ error: 'Failed to fetch task activity' }, { status: 500 })
    }

    console.log('GET task-activity: Successfully fetched activities', { task_id, count: activities?.length })
    return NextResponse.json(activities || [])
  } catch (error) {
    console.error('Unexpected error:', error)
    console.log('GET task-activity: Unexpected error occurred', { error })
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
    const { task_id, type, payload } = body

    if (!task_id || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user has access to the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, list_id')
      .eq('id', task_id)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
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
        .eq('task_id', task_id)
        .eq('user_id', user.id)
        .single()

      if (!collaborator) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Create activity log entry
    const { data: activity, error } = await supabase
      .from('task_activity')
      .insert({
        task_id,
        actor: user.id,
        type,
        payload: payload || {}
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create task activity' }, { status: 500 })
    }

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}