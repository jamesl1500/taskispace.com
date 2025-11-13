import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TaskTagWithTaskAndTag } from '@/types/tasks'

interface RouteParams {
  params: { id: string }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const taskTagId = params.id

    // Get the task tag to delete
    const { data: existingTaskTag, error: taskTagError } = await supabase
      .from('task_tags')
      .select('*, tasks!inner(list_id), tags!inner(name, color)')
      .eq('id', taskTagId)
      .single()

    if (taskTagError || !existingTaskTag) {
      return NextResponse.json({ error: 'Task tag not found' }, { status: 404 })
    }

    // Verify user has access to the task
    const taskTag = existingTaskTag as TaskTagWithTaskAndTag
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('workspace_id, workspaces!inner(owner_id)')
      .eq('id', taskTag.tasks.list_id)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const isOwner = (list.workspaces as { owner_id: string }[])[0]?.owner_id === user.id

    if (!isOwner) {
      const { data: collaborator } = await supabase
        .from('task_collaborators')
        .select('user_id, role')
        .eq('task_id', existingTaskTag.task_id)
        .eq('user_id', user.id)
        .single()

      if (!collaborator || (collaborator.role !== 'assignee' && collaborator.role !== 'reviewer')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Remove tag from task
    const { error } = await supabase
      .from('task_tags')
      .delete()
      .eq('id', taskTagId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to remove tag from task' }, { status: 500 })
    }

    // Log activity
    await supabase.from('task_activity').insert({
      task_id: existingTaskTag.task_id,
      actor: user.id,
      type: 'tag_removed',
      payload: {
        tag_id: existingTaskTag.tag_id,
        tag_name: taskTag.tags.name,
        tag_color: taskTag.tags.color
      }
    })

    return NextResponse.json({ message: 'Tag removed from task successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}