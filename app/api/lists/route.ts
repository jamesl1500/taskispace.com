/**
 * List API service
 * Handles API routes related to task lists.
 * 
 * @module api/lists/route
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateListData } from '@/types/lists'

/**
 * GET /api/lists
 * Retrieves lists for a specific workspace.
 * @param request - The NextRequest object containing query parameters.
 * @returns A JSON response with the lists array or an error message.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspace_id = searchParams.get('workspace_id')

    if (!workspace_id) {
      return NextResponse.json({ error: 'workspace_id is required' }, { status: 400 })
    }

    // First verify workspace exists and user owns it (avoid RLS conflicts)
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, owner_id')
      .eq('id', workspace_id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Check ownership manually to avoid RLS recursion
    if (workspace.owner_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get lists for the workspace (simple query to avoid RLS recursion)
    const { data: lists, error: listsError } = await supabase
      .from('lists')
      .select('id, workspace_id, name, created_by, created_at, updated_at')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: true })

    if (listsError) {
      console.error('Database error:', listsError)
      return NextResponse.json({ error: 'Failed to fetch lists' }, { status: 500 })
    }

    return NextResponse.json(lists || [])
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * POST /api/lists
 * Creates a new list within a workspace.
 * 
 * @param request - The NextRequest object containing the request data.
 * @param param1 - The route parameters including the workspace ID.
 * @returns A JSON response with the created list or an error message.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateListData = await request.json()

    // Verify workspace exists and user owns it (avoid RLS recursion)
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id, owner_id')
      .eq('id', body.workspace_id)
      .single()

    if (workspaceError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Check ownership manually to avoid RLS recursion
    if (workspace.owner_id !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Determine list location
    let location: number

    const { data: existingLists, error: listsError } = await supabase
      .from('lists')
      .select('location')
      .eq('workspace_id', body.workspace_id)
      .order('location', { ascending: false })
      .limit(1)

    if (listsError) {
      console.error('Database error fetching existing lists:', listsError)
      return NextResponse.json({ error: 'Failed to determine list location' }, { status: 500 })
    }

    if (existingLists && existingLists.length > 0) {
      location = existingLists[0].location + 1
    } else {
      location = 1
    }

    // Create new list
    const { data: newList, error: createError } = await supabase
      .from('lists')
      .insert({
        workspace_id: body.workspace_id,
        color: body.color,
        location: location,
        name: body.name,
        created_by: user.id
      })
      .select()
      .single()

    if (createError || !newList) {
      console.error('Create list error:', createError)
      return NextResponse.json({ error: 'Failed to create list' }, { status: 500 })
    }

    // Create list member - user who creates the list gets admin role
    const { data: listMember, error: memberError } = await supabase
      .from('list_members')
      .insert({
        list_id: newList.id,
        user_id: user.id,
        role: 'admin'
      })
      .select()
      .single()

    if (memberError || !listMember) {
      console.error('Create list member error:', memberError)
      return NextResponse.json({ error: 'Failed to create list member' }, { status: 500 })
    }

    // Log list creation activity (optional, but good for audit trail)
    const { error: activityError } = await supabase
      .from('activity')
      .insert({
        actor: user.id,
        list_id: newList.id,
        type: 'list_created',
        payload: {
          list_name: newList.name,
          workspace_id: newList.workspace_id
        }
      })

    if (activityError) {
      console.error('Failed to log list creation activity:', activityError)
      // Don't fail the list creation if activity logging fails
    }

    return NextResponse.json(newList, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}