import { NextRequest, NextResponse } from 'next/server'
import { friendshipService } from '@/lib/services/friendship-service'

/**
 * DELETE /api/nudges/[id]
 * Delete a sent nudge
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const result = await friendshipService.deleteNudge(id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in delete nudge API:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message === 'Not authenticated' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
