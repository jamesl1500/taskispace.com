import { NextRequest, NextResponse } from 'next/server'
import { CreateWorkspaceData, UpdateWorkspaceData, Workspace } from '@/types/workspaces'
import { WorkspaceService } from '@/lib/services/workspace-service'

export async function GET(request: NextRequest) {
  try {
    const ws = new WorkspaceService()
    const supabase = await ws['getSupabaseClient']()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspaces = await ws.getWorkspaces(user.id)

    return NextResponse.json(workspaces)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const ws = new WorkspaceService()
    const supabase = await ws['getSupabaseClient']()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateWorkspaceData = await request.json()
    const workspace = await ws.createWorkspace(user.id, body)

    if (!workspace) {
      return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
    }

    return NextResponse.json(workspace, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}