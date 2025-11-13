import { NextRequest, NextResponse } from 'next/server'
import { UpdateWorkspaceData } from '@/types/workspaces'
import { WorkspaceService } from '@/lib/services/workspace-service'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const ws = new WorkspaceService()
    const supabase = await ws['getSupabaseClient']()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const resolvedParams = await params

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspace = await ws.getWorkspace(user.id, resolvedParams.id)

    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const ws = new WorkspaceService()
    const supabase = await ws['getSupabaseClient']()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: UpdateWorkspaceData = await request.json()

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {}
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.color !== undefined) updateData.color = body.color
    if (body.description !== undefined) updateData.description = body.description

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .update(updateData)
      .eq('id', body.id)
      .eq('owner_id', user.id)
      .single()

    if (error) {
      console.error('Error updating workspace:', error)
      return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 })
    }

    return NextResponse.json(workspace)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const ws = new WorkspaceService()
    const supabase = await ws['getSupabaseClient']()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('id')

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 })
    }

    const deleted = await ws.deleteWorkspace(user.id, workspaceId)

    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete workspace' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Workspace deleted successfully' })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
