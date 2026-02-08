import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Verify invitation token and get details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('workspace_invitations')
      .select(`
        *,
        workspace:workspaces(id, name, description),
        invited_by_profile:invited_by(id, user_name, display_name, avatar_url)
      `)
      .eq('token', token)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 })
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
    }

    // Check if invitation is already accepted or revoked
    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: `Invitation is ${invitation.status}` }, { status: 400 })
    }

    return NextResponse.json(invitation)
  } catch (error) {
    console.error('Error in GET /api/invitations/verify:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
