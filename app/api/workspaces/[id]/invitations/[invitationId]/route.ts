import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// DELETE - Revoke an invitation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; invitationId: string } }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user owns the workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('owner_id')
      .eq('id', params.id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    if (workspace.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update invitation status to revoked
    const { error: updateError } = await supabase
      .from('workspace_invitations')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('id', params.invitationId)
      .eq('workspace_id', params.id)

    if (updateError) {
      console.error('Error revoking invitation:', updateError)
      return NextResponse.json({ error: 'Failed to revoke invitation' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Invitation revoked' })
  } catch (error) {
    console.error('Error in DELETE /api/workspaces/[id]/invitations/[invitationId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
