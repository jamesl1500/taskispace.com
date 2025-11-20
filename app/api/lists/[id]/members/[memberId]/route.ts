import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{
    id: string // list id
    memberId: string // member id (user_id)
  }>
}

// DELETE /api/lists/[id]/members/[memberId] - Remove a member from a list
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const resolvedParams = await params

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const listId = resolvedParams.id
    const memberId = resolvedParams.memberId

    if (!listId || !memberId) {
      return NextResponse.json({ error: 'List ID and Member ID are required' }, { status: 400 })
    }

    // First verify the list exists
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id, workspace_id, created_by')
      .eq('id', listId)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Then verify workspace ownership
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, owner_id')
      .eq('id', list.workspace_id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Only workspace owner or list creator can remove members
    const isWorkspaceOwner = workspace.owner_id === user.id
    const isListCreator = list.created_by === user.id

    if (!isWorkspaceOwner && !isListCreator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Prevent removing the list creator
    if (memberId === list.created_by) {
      return NextResponse.json({ error: 'Cannot remove list creator' }, { status: 400 })
    }

    // Delete the member
    const { error: deleteError } = await supabase
      .from('list_members')
      .delete()
      .eq('list_id', listId)
      .eq('user_id', memberId)

    if (deleteError) {
      console.error('Error removing member:', deleteError)
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
