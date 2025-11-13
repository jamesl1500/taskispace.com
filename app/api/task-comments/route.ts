import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateTaskCommentData } from '@/types/tasks'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('GET /api/task-comments - Unauthorized:', { authError, user: !!user })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const task_id = searchParams.get('task_id')
    const parent_id = searchParams.get('parent_id')

    if (!task_id) {
      console.log('GET /api/task-comments - Missing task_id')
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 })
    }

    // Verify user has access to the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, list_id')
      .eq('id', task_id)
      .single()

    if (taskError || !task) {
      console.log('GET /api/task-comments - Task not found:', { task_id, taskError })
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Check workspace ownership or task collaboration
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('workspace_id, workspaces!inner(owner_id)')
      .eq('id', task.list_id)
      .single()

    if (listError || !list) {
      console.log('GET /api/task-comments - List access denied:', { list_id: task.list_id, listError })
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
        console.log('GET /api/task-comments - Access denied:', { task_id, user_id: user.id, isOwner })
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Build query
    let query = supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', task_id)

    // Filter by parent_id if provided (for threaded comments)
    if (parent_id) {
      query = query.eq('parent_id', parent_id)
    } else {
      query = query.is('parent_id', null) // Get top-level comments only
    }

    const { data: comments, error } = await query
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      console.log('GET /api/task-comments - Failed to fetch comments:', { task_id, parent_id, error })
      return NextResponse.json({ error: 'Failed to fetch task comments' }, { status: 500 })
    }

    console.log('GET /api/task-comments - Success:', { task_id, parent_id, commentCount: comments?.length || 0 })
    return NextResponse.json(comments || [])
  } catch (error) {
    console.error('Unexpected error:', error)
    console.log('GET /api/task-comments - Internal server error:', error)
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

    const body: CreateTaskCommentData = await request.json()
    const { task_id, content, parent_id } = body

    if (!task_id || !content) {
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
      console.log('POST /api/task-comments - List access denied:', { list_id: task.list_id, listError })
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
        console.log('POST /api/task-comments - Collaborator access denied:', { task_id, user_id: user.id })
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // If this is a reply, verify parent comment exists
    if (parent_id) {
      const { data: parentComment, error: parentError } = await supabase
        .from('task_comments')
        .select('id')
        .eq('id', parent_id)
        .eq('task_id', task_id)
        .single()

      if (parentError || !parentComment) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 400 })
      }
    }

    // Create comment
    const { data: comment, error } = await supabase
      .from('task_comments')
      .insert({
        task_id,
        content,
        author: user.id,
        parent_id: parent_id || null
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create task comment' }, { status: 500 })
    }

    // Log activity
    await supabase.from('task_activity').insert({
      task_id,
      actor: user.id,
      type: parent_id ? 'comment_reply_added' : 'comment_added',
      payload: {
        comment_id: comment.id,
        content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        parent_id
      }
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}