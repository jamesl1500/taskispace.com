import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{
    id: string // list id
  }>
}

// GET /api/lists/[id] - Get a specific list
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const resolvedParams = await params

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const listId = resolvedParams.id

    if (!listId) {
      return NextResponse.json({ error: 'List ID is required' }, { status: 400 })
    }

    // Get the list
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('*')
      .eq('id', listId)
      .single()

    if (listError || !list) {
      console.error('Error fetching list:', listError)
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Verify user has access to this list (through workspace ownership or list membership)
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('owner_id')
      .eq('id', list.workspace_id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Check if user is workspace owner or list member
    const isWorkspaceOwner = workspace.owner_id === user.id

    const { data: membership } = await supabase
      .from('list_members')
      .select('id')
      .eq('list_id', listId)
      .eq('user_id', user.id)
      .single()

    if (!isWorkspaceOwner && !membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json(list)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/lists/[id] - Update a list
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const resolvedParams = await params

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const listId = resolvedParams.id
    const body = await request.json()
    const { name, color } = body

    if (!listId) {
      return NextResponse.json({ error: 'List ID is required' }, { status: 400 })
    }

    // Get the list to verify ownership
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('*, workspaces(owner_id)')
      .eq('id', listId)
      .single()

    if (listError || !list) {
      console.error('Error fetching list:', listError)
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Only workspace owner or list creator can update the list
    const isWorkspaceOwner = list.workspaces?.owner_id === user.id
    const isListCreator = list.created_by === user.id

    if (!isWorkspaceOwner && !isListCreator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update the list
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (color !== undefined) updateData.color = color

    const { data: updatedList, error: updateError } = await supabase
      .from('lists')
      .update(updateData)
      .eq('id', listId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating list:', updateError)
      return NextResponse.json({ error: 'Failed to update list' }, { status: 500 })
    }

    return NextResponse.json(updatedList)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/lists/[id] - Delete a list
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const resolvedParams = await params

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const listId = resolvedParams.id

    if (!listId) {
      return NextResponse.json({ error: 'List ID is required' }, { status: 400 })
    }

    // Get the list to verify ownership
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('*, workspaces(owner_id)')
      .eq('id', listId)
      .single()

    if (listError || !list) {
      console.error('Error fetching list:', listError)
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Only workspace owner or list creator can delete the list
    const isWorkspaceOwner = list.workspaces?.owner_id === user.id
    const isListCreator = list.created_by === user.id

    if (!isWorkspaceOwner && !isListCreator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete the list (cascade will handle tasks and members)
    const { error: deleteError } = await supabase
      .from('lists')
      .delete()
      .eq('id', listId)

    if (deleteError) {
      console.error('Error deleting list:', deleteError)
      return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
