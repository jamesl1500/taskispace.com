import { NextRequest, NextResponse } from 'next/server'
import { friendshipService } from '@/lib/services/friendship-service'

/**
 * GET /api/friendships
 * Get all friendships for the current user
 * Query params: ?status=pending|accepted|rejected
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'pending' | 'accepted' | 'rejected' | null
    
    const friendships = await friendshipService.getFriendships(status || undefined)
    return NextResponse.json(friendships)
  } catch (error) {
    console.error('Error in friendships API:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message === 'Not authenticated' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * POST /api/friendships
 * Send a friend request
 * Body: { friendUsername: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { friendUsername } = body

    if (!friendUsername) {
      return NextResponse.json({ error: 'Friend username is required' }, { status: 400 })
    }

    const friendship = await friendshipService.sendFriendRequest(friendUsername)
    return NextResponse.json(friendship)
  } catch (error) {
    console.error('Error in send friend request API:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    let status = 500
    
    if (message === 'Not authenticated') status = 401
    else if (message.includes('not found') || message.includes('required')) status = 400
    else if (message.includes('already')) status = 409
    
    return NextResponse.json({ error: message }, { status })
  }
}
