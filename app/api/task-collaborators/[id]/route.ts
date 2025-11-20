import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TaskCollaboratorWithTask } from '@/types/tasks'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: collaboratorId } = await params

    // Get the collaborator
    const { data: collaborator, error: collaboratorError } = await supabase
      .from('task_collaborators')
      .select('*, tasks!inner(list_id)')
      .eq('id', collaboratorId)
      .single()

    if (collaboratorError || !collaborator) {
      return NextResponse.json({ error: 'Task collaborator not found' }, { status: 404 })
    }

    // Verify user has access to the task
    const taskCollaborator = collaborator as TaskCollaboratorWithTask
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('workspace_id, workspaces!inner(owner_id)')
      .eq('id', taskCollaborator.tasks.list_id)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const isOwner = (list.workspaces as { owner_id?: string })?.owner_id === user.id

    if (!isOwner) {
      const { data: userCollaborator } = await supabase
        .from('task_collaborators')
        .select('user_id')
        .eq('task_id', taskCollaborator.task_id)
        .eq('user_id', user.id)
        .single()

      if (!userCollaborator) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    return NextResponse.json(collaborator)
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

    const { id: collaboratorId } = await params
    const { role } = await request.json()

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 })
    }

    // Get the collaborator to update
    const { data: existingCollaborator, error: collaboratorError } = await supabase
      .from('task_collaborators')
      .select('*, tasks!inner(list_id, created_by)')
      .eq('id', collaboratorId)
      .single()

    if (collaboratorError || !existingCollaborator) {
      return NextResponse.json({ error: 'Task collaborator not found' }, { status: 404 })
    }

    // Verify user has permission to update (workspace owner or task creator)
    const taskCollaborator = existingCollaborator as TaskCollaboratorWithTask
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('workspace_id, workspaces!inner(owner_id)')
      .eq('id', taskCollaborator.tasks.list_id)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const isOwner = (list.workspaces as { owner_id?: string })?.owner_id === user.id
    const isCreator = taskCollaborator.tasks.created_by === user.id

    if (!isOwner && !isCreator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update collaborator role
    const { data: collaborator, error } = await supabase
      .from('task_collaborators')
      .update({ role })
      .eq('id', collaboratorId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update task collaborator' }, { status: 500 })
    }

    // Log activity
    await supabase.from('task_activity').insert({
      task_id: taskCollaborator.task_id,
      actor: user.id,
      type: 'collaborator_role_updated',
      payload: {
        collaborator_id: taskCollaborator.user_id,
        old_role: existingCollaborator.role,
        new_role: role
      }
    })

    return NextResponse.json(collaborator)
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

    const { id: collaboratorId } = await params

    // Get the collaborator to delete
    const { data: existingCollaborator, error: collaboratorError } = await supabase
      .from('task_collaborators')
      .select('*, tasks!inner(list_id, created_by)')
      .eq('id', collaboratorId)
      .single()

    if (collaboratorError || !existingCollaborator) {
      return NextResponse.json({ error: 'Task collaborator not found' }, { status: 404 })
    }

    // Verify user has permission to remove (workspace owner, task creator, or self)
    const taskCollaborator = existingCollaborator as TaskCollaboratorWithTask
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('workspace_id, workspaces!inner(owner_id)')
      .eq('id', taskCollaborator.tasks.list_id)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const isOwner = (list.workspaces as { owner_id?: string })?.owner_id === user.id
    const isCreator = taskCollaborator.tasks.created_by === user.id
    const isSelf = existingCollaborator.user_id === user.id

    if (!isOwner && !isCreator && !isSelf) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Remove collaborator
    const { error } = await supabase
      .from('task_collaborators')
      .delete()
      .eq('id', collaboratorId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to remove task collaborator' }, { status: 500 })
    }

    // Log activity
    await supabase.from('task_activity').insert({
      task_id: taskCollaborator.task_id,
      actor: user.id,
      type: 'collaborator_removed',
      payload: {
        collaborator_id: existingCollaborator.user_id,
        role: existingCollaborator.role,
        removed_by: user.id,
        self_removed: isSelf
      }
    })

    return NextResponse.json({ message: 'Task collaborator removed successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}