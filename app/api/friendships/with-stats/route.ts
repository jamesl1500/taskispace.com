import { NextRequest, NextResponse } from 'next/server'
import { friendshipService } from '@/lib/services/friendship-service'

/**
 * GET /api/friendships/with-stats
 * Get all accepted friends with their task statistics
 */
export async function GET() {
  try {
    const friends = await friendshipService.getFriendsWithStats()
    return NextResponse.json(friends)
  } catch (error) {
    console.error('Error in friends with stats API:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message === 'Not authenticated' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
