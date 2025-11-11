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

    // First verify the list exists and user has access to the workspace
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select(`
        id,
        workspace_id,
        workspaces!inner(owner_id)
      `)
      .eq('id', resolvedParams.id)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    if ((list.workspaces as { owner_id: string }[])[0]?.owner_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get list members with user details
    const { data: members, error } = await supabase
      .from('list_members')
      .select(`
        *,
        user:profiles(id, email, full_name, avatar_url)
      `)
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
    const { user_id, role = 'editor' } = body

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
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
      .select('id, owner')
      .eq('id', list.workspace_id)
      .single()

    if (workspaceError || !workspace || workspace.owner !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if user is already a member
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('list_members')
      .select('user_id')
      .eq('list_id', resolvedParams.id)
      .eq('user_id', user_id)
      .single()

    if (!memberCheckError && existingMember) {
      return NextResponse.json({ error: 'User is already a member of this list' }, { status: 409 })
    }

    const { data: member, error } = await supabase
      .from('list_members')
      .insert({
        list_id: resolvedParams.id,
        user_id,
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