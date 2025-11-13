import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TaskTagWithTag } from '@/types/tasks'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('GET /api/task-tags: Unauthorized access attempt', { authError, user: !!user })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const task_id = searchParams.get('task_id')
    const workspace_id = searchParams.get('workspace_id')

    // If task_id is provided, get tags for that task
    if (task_id) {
      // Verify user has access to the task
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('id, list_id')
        .eq('id', task_id)
        .single()

      if (taskError || !task) {
        console.log('GET /api/task-tags: Task not found', { task_id, taskError, task })
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }

      // Check workspace ownership or task collaboration
      const { data: list, error: listError } = await supabase
        .from('lists')
        .select('workspace_id, workspaces!inner(owner_id)')
        .eq('id', task.list_id)
        .single()

      if (listError || !list) {
        console.log('GET /api/task-tags: List access denied', { list_id: task.list_id, listError, list })
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
          console.log('GET /api/task-tags: Access denied - not owner or collaborator', { task_id, user_id: user.id, owner_id: list.workspaces[0].owner_id, isOwner, collaborator })
          return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }
      }

      // Get task tags
      const { data: taskTags, error } = await supabase
        .from('task_tags')
        .select('*, tags!inner(*)')
        .eq('task_id', task_id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('GET /api/task-tags: Database error fetching task tags', { task_id, error })
        return NextResponse.json({ error: 'Failed to fetch task tags' }, { status: 500 })
      }

      // Extract the tag information
      const tags = (taskTags || []).map((taskTag: TaskTagWithTag) => ({
        id: taskTag.tags.id,
        name: taskTag.tags.name,
        color: taskTag.tags.color,
        workspace_id: taskTag.tags.workspace_id,
        created_at: taskTag.tags.created_at,
        task_tag_id: taskTag.id,
        assigned_at: taskTag.created_at
      }))

      console.log('GET /api/task-tags: Successfully fetched task tags', { task_id, tagCount: tags.length })
      return NextResponse.json(tags)
    }

    // If workspace_id is provided, get all tags for that workspace
    if (workspace_id) {
      // Verify user has access to the workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('owner_id')
        .eq('id', workspace_id)
        .single()

      if (workspaceError || !workspace) {
        console.log('GET /api/task-tags: Workspace not found', { workspace_id, workspaceError, workspace })
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
      }

      if (workspace.owner_id !== user.id) {
        console.log('GET /api/task-tags: Workspace access denied', { workspace_id, owner_id: workspace.owner_id, user_id: user.id })
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      // Get all tags for the workspace
      const { data: tags, error } = await supabase
        .from('tags')
        .select('*')
        .eq('workspace_id', workspace_id)
        .order('name', { ascending: true })

      if (error) {
        console.error('GET /api/task-tags: Database error fetching workspace tags', { workspace_id, error })
        return NextResponse.json({ error: 'Failed to fetch workspace tags' }, { status: 500 })
      }

      console.log('GET /api/task-tags: Successfully fetched workspace tags', { workspace_id, tagCount: (tags || []).length })
      return NextResponse.json(tags || [])
    }

    console.log('GET /api/task-tags: Missing required parameters', { task_id, workspace_id })
    return NextResponse.json({ error: 'Either task_id or workspace_id is required' }, { status: 400 })
  } catch (error) {
    console.error('GET /api/task-tags: Unexpected error', error)
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
    const { task_id, tag_id, tag_name, tag_color } = body

    if (!task_id) {
      return NextResponse.json({ error: 'task_id is required' }, { status: 400 })
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

    const workspaceId = (list.workspaces as { owner_id: string }[])[0] && list.workspace_id
    const isOwner = (list.workspaces as { owner_id: string }[])[0]?.owner_id === user.id

    if (!isOwner) {
      const { data: collaborator } = await supabase
        .from('task_collaborators')
        .select('user_id, role')
        .eq('task_id', task_id)
        .eq('user_id', user.id)
        .single()

      if (!collaborator || (collaborator.role !== 'assignee' && collaborator.role !== 'reviewer')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    let finalTagId = tag_id

    // If tag_id is not provided, create a new tag
    if (!finalTagId && tag_name) {
      if (!workspaceId) {
        return NextResponse.json({ error: 'Workspace ID could not be determined' }, { status: 400 })
      }

      // Check if tag with this name already exists in workspace
      const { data: existingTag, error: existingError } = await supabase
        .from('tags')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('name', tag_name)
        .single()

      if (existingError && existingError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Database error checking existing tag:', existingError)
        return NextResponse.json({ error: 'Failed to check existing tags' }, { status: 500 })
      }

      if (existingTag) {
        finalTagId = existingTag.id
      } else {
        // Create new tag
        const { data: newTag, error: createError } = await supabase
          .from('tags')
          .insert({
            name: tag_name,
            color: tag_color || '#3B82F6', // Default blue color
            workspace_id: workspaceId
          })
          .select()
          .single()

        if (createError) {
          console.error('Database error creating tag:', createError)
          return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
        }

        finalTagId = newTag.id
      }
    }

    if (!finalTagId) {
      return NextResponse.json({ error: 'Either tag_id or tag_name is required' }, { status: 400 })
    }

    // Check if task is already tagged with this tag
    const { data: existingTaskTag } = await supabase
      .from('task_tags')
      .select('id')
      .eq('task_id', task_id)
      .eq('tag_id', finalTagId)
      .single()

    if (existingTaskTag) {
      return NextResponse.json({ error: 'Task is already tagged with this tag' }, { status: 409 })
    }

    // Add tag to task
    const { data: taskTag, error } = await supabase
      .from('task_tags')
      .insert({
        task_id,
        tag_id: finalTagId
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to add tag to task' }, { status: 500 })
    }

    // Get the tag details for response
    const { data: tagDetails, error: tagError } = await supabase
      .from('tags')
      .select('*')
      .eq('id', finalTagId)
      .single()

    if (tagError) {
      console.error('Database error fetching tag details:', tagError)
      return NextResponse.json({ error: 'Failed to fetch tag details' }, { status: 500 })
    }

    // Log activity
    await supabase.from('task_activity').insert({
      task_id,
      actor: user.id,
      type: 'tag_added',
      payload: {
        tag_id: finalTagId,
        tag_name: tagDetails.name,
        tag_color: tagDetails.color
      }
    })

    return NextResponse.json({
      ...tagDetails,
      task_tag_id: taskTag.id,
      assigned_at: taskTag.created_at
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}