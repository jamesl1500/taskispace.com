import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{
    id: string // list id
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const resolvedParams = await params

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // First verify the list exists (avoid complex joins that cause RLS recursion)
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id, workspace_id')
      .eq('id', resolvedParams.id)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Then verify workspace ownership separately
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, owner_id')
      .eq('id', list.workspace_id)
      .single()

    if (workspaceError || !workspace || workspace.owner_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get list members (simple query to avoid foreign key issues)
    const { data: members, error } = await supabase
      .from('list_members')
      .select('list_id, user_id, role, added_at, created_at, updated_at')
      .eq('list_id', resolvedParams.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch list members' }, { status: 500 })
    }

    return NextResponse.json(members || [])
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const resolvedParams = await params

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, user_id, role = 'editor' } = body

    // First verify the list exists (avoid complex joins that cause RLS recursion)
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id, workspace_id')
      .eq('id', resolvedParams.id)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    // Then verify workspace ownership separately
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, owner_id')
      .eq('id', list.workspace_id)
      .single()

    if (workspaceError || !workspace || workspace.owner_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // If email provided, look up user by email from profiles
    let targetUserId = user_id
    if (email && !user_id) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (profileError || !profile) {
        return NextResponse.json({ error: 'User not found with that email' }, { status: 404 })
      }

      targetUserId = profile.id
    }

    if (!targetUserId) {
      return NextResponse.json({ error: 'User ID or email is required' }, { status: 400 })
    }

    // Check if user is already a member
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('list_members')
      .select('user_id')
      .eq('list_id', resolvedParams.id)
      .eq('user_id', targetUserId)
      .single()

    if (!memberCheckError && existingMember) {
      return NextResponse.json({ error: 'User is already a member of this list' }, { status: 409 })
    }

    const { data: member, error } = await supabase
      .from('list_members')
      .insert({
        list_id: resolvedParams.id,
        user_id: targetUserId,
        role,
        added_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to add list member' }, { status: 500 })
    }

    return NextResponse.json(member)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}