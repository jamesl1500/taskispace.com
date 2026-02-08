import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST - Accept an invitation (user must be authenticated)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Fetch invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('workspace_invitations')
      .select('*')
      .eq('token', token)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 })
    }

    // Verify user email matches invitation
    if (user.email !== invitation.email) {
      return NextResponse.json({ error: 'This invitation was sent to a different email address' }, { status: 403 })
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from('workspace_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)
      
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
    }

    // Check if invitation is already accepted or revoked
    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: `Invitation is ${invitation.status}` }, { status: 400 })
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', invitation.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      return NextResponse.json({ error: 'You are already a member of this workspace' }, { status: 400 })
    }

    // Add user to workspace
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: invitation.workspace_id,
        user_id: user.id,
        role: invitation.role
      })

    if (memberError) {
      console.error('Error adding workspace member:', memberError)
      return NextResponse.json({ error: 'Failed to add you to the workspace' }, { status: 500 })
    }

    // Get all lists in the workspace
    const { data: lists, error: listsError } = await supabase
      .from('lists')
      .select('id')
      .eq('workspace_id', invitation.workspace_id)

    if (!listsError && lists && lists.length > 0) {
      // Add user to all lists in the workspace
      const listMemberships = lists.map(list => ({
        list_id: list.id,
        user_id: user.id,
        role: 'editor'
      }))

      const { error: listMemberError } = await supabase
        .from('list_members')
        .insert(listMemberships)

      if (listMemberError) {
        console.error('Error adding list members:', listMemberError)
        // Don't fail the whole operation if list membership fails
      }
    }

    // Update invitation status
    const { error: updateError } = await supabase
      .from('workspace_invitations')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('Error updating invitation:', updateError)
      // Don't fail since user was already added
    }

    // Fetch workspace details to return
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', invitation.workspace_id)
      .single()

    return NextResponse.json({ 
      message: 'Successfully joined workspace',
      workspace
    })
  } catch (error) {
    console.error('Error in POST /api/invitations/accept:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
