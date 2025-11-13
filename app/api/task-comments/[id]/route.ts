import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: { id: string }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const commentId = params.id

    // Get the comment
    const { data: comment, error: commentError } = await supabase
      .from('task_comments')
      .select('*')
      .eq('id', commentId)
      .single()

    if (commentError || !comment) {
      return NextResponse.json({ error: 'Task comment not found' }, { status: 404 })
    }

    // Verify user has access to the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, list_id')
      .eq('id', comment.task_id)
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
        .eq('task_id', comment.task_id)
        .eq('user_id', user.id)
        .single()

      if (!collaborator) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const commentId = params.id
    const { content } = await request.json()

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Get the existing comment
    const { data: existingComment, error: commentError } = await supabase
      .from('task_comments')
      .select('*')
      .eq('id', commentId)
      .single()

    if (commentError || !existingComment) {
      return NextResponse.json({ error: 'Task comment not found' }, { status: 404 })
    }

    // Verify user is the author of the comment or workspace owner
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, list_id')
      .eq('id', existingComment.task_id)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
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
    const isAuthor = existingComment.author === user.id

    if (!isOwner && !isAuthor) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update comment
    const { data: comment, error } = await supabase
      .from('task_comments')
      .update({
        content,
        edited_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update task comment' }, { status: 500 })
    }

    // Log activity
    await supabase.from('task_activity').insert({
      task_id: existingComment.task_id,
      actor: user.id,
      type: 'comment_edited',
      payload: {
        comment_id: commentId,
        old_content: existingComment.content.substring(0, 100) + (existingComment.content.length > 100 ? '...' : ''),
        new_content: content.substring(0, 100) + (content.length > 100 ? '...' : '')
      }
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const commentId = params.id

    // Get the comment to delete
    const { data: existingComment, error: commentError } = await supabase
      .from('task_comments')
      .select('*')
      .eq('id', commentId)
      .single()

    if (commentError || !existingComment) {
      return NextResponse.json({ error: 'Task comment not found' }, { status: 404 })
    }

    // Verify user is the author of the comment or workspace owner
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, list_id')
      .eq('id', existingComment.task_id)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
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
    const isAuthor = existingComment.author === user.id

    if (!isOwner && !isAuthor) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if comment has replies
    const { data: replies, error: repliesError } = await supabase
      .from('task_comments')
      .select('id')
      .eq('parent_id', commentId)

    if (repliesError) {
      console.error('Database error checking replies:', repliesError)
      return NextResponse.json({ error: 'Failed to check comment replies' }, { status: 500 })
    }

    if (replies && replies.length > 0) {
      // Soft delete - mark as deleted but keep for thread integrity
      const { data: comment, error } = await supabase
        .from('task_comments')
        .update({
          content: '[This comment has been deleted]',
          is_deleted: true,
          deleted_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json({ error: 'Failed to delete task comment' }, { status: 500 })
      }

      // Log activity
      await supabase.from('task_activity').insert({
        task_id: existingComment.task_id,
        actor: user.id,
        type: 'comment_deleted',
        payload: {
          comment_id: commentId,
          soft_delete: true,
          had_replies: true
        }
      })

      return NextResponse.json(comment)
    } else {
      // Hard delete - no replies to preserve
      const { error } = await supabase
        .from('task_comments')
        .delete()
        .eq('id', commentId)

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json({ error: 'Failed to delete task comment' }, { status: 500 })
      }

      // Log activity
      await supabase.from('task_activity').insert({
        task_id: existingComment.task_id,
        actor: user.id,
        type: 'comment_deleted',
        payload: {
          comment_id: commentId,
          soft_delete: false,
          content: existingComment.content.substring(0, 100) + (existingComment.content.length > 100 ? '...' : '')
        }
      })

      return NextResponse.json({ message: 'Task comment deleted successfully' })
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}