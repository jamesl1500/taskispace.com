import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

// GET - List all invitations for a workspace
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Fetch invitations
    const { data: invitations, error: invitationsError } = await supabase
      .from('workspace_invitations')
      .select(`
        *,
        invited_by_profile:invited_by(id, user_name, display_name, avatar_url)
      `)
      .eq('workspace_id', params.id)
      .order('created_at', { ascending: false })

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError)
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 })
    }

    return NextResponse.json(invitations)
  } catch (error) {
    console.error('Error in GET /api/workspaces/[id]/invitations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new invitation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, role = 'member' } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check if user owns the workspace
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', params.id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    if (workspace.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', params.id)
      .eq('user_id', (
        await supabase
          .from('profiles')
          .select('id')
          .eq('user_name', email.split('@')[0])
          .single()
      )?.data?.id || '')
      .single()

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
    }

    // Check if there's a pending invitation
    const { data: existingInvitation } = await supabase
      .from('workspace_invitations')
      .select('id, status')
      .eq('workspace_id', params.id)
      .eq('email', email)
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      return NextResponse.json({ error: 'Invitation already sent to this email' }, { status: 400 })
    }

    // Generate unique token
    const token = randomBytes(32).toString('hex')

    // Create invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('workspace_invitations')
      .insert({
        workspace_id: params.id,
        invited_by: user.id,
        email,
        token,
        role,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single()

    if (invitationError) {
      console.error('Error creating invitation:', invitationError)
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    // TODO: Send email with invitation link
    // The link should be: ${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${token}

    return NextResponse.json(invitation, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/workspaces/[id]/invitations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
