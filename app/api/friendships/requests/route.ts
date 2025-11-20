import { NextResponse } from 'next/server'
import { friendshipService } from '@/lib/services/friendship-service'

/**
 * GET /api/friendships/requests
 * Get pending friend requests received by current user
 */
export async function GET() {
  try {
    const requests = await friendshipService.getPendingRequests()
    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error in friend requests API:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message === 'Not authenticated' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
