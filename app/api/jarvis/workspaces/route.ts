/**
 * Jarvis Workspaces API Route
 * 
 * Returns available workspaces and lists for the current user
 * Used by Jarvis AI to help users select where to create tasks
 * 
 * @module app/api/jarvis/workspaces/route
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get workspaces where user is owner or member
    const { data: ownedWorkspaces } = await supabase
      .from('workspaces')
      .select('id, name, description')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false })

    const { data: memberWorkspaces } = await supabase
      .from('workspace_members')
      .select('workspace_id, workspaces(id, name, description)')
      .eq('user_id', user.id)

    // Combine and deduplicate workspaces
    const workspaceMap = new Map()
    
    ownedWorkspaces?.forEach(ws => {
      workspaceMap.set(ws.id, ws)
    })

    memberWorkspaces?.forEach((membership: { workspace_id: string; workspaces: unknown }) => {
      const ws = membership.workspaces as { id: string; name: string; description: string | null } | null
      if (ws && !workspaceMap.has(ws.id)) {
        workspaceMap.set(ws.id, ws)
      }
    })

    const workspaces = Array.from(workspaceMap.values())

    // For each workspace, get its lists
    const workspacesWithLists = await Promise.all(
      workspaces.map(async (workspace) => {
        const { data: lists } = await supabase
          .from('lists')
          .select('id, name')
          .eq('workspace_id', workspace.id)
          .order('location', { ascending: true })

        return {
          ...workspace,
          lists: lists || []
        }
      })
    )

    return NextResponse.json(workspacesWithLists)
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
