import { NextRequest, NextResponse } from 'next/server'
import { friendshipService } from '@/lib/services/friendship-service'

/**
 * GET /api/friends/[id]/tasks
 * Get tasks for a specific friend
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: friendId } = params
    const tasks = await friendshipService.getFriendTasks(friendId)
    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error in get friend tasks API:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    let status = 500
    
    if (message === 'Not authenticated') status = 401
    else if (message.includes('must be friends')) status = 403
    
    return NextResponse.json({ error: message }, { status })
  }
}
