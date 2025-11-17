import { NextRequest, NextResponse } from 'next/server'
import { friendshipService } from '@/lib/services/friendship-service'

/**
 * GET /api/friendships/search
 * Search for users by username
 * Query params: ?q=username&limit=10
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    const users = await friendshipService.searchUsers(query, limit)
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error in search users API:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    let status = 500
    
    if (message === 'Not authenticated') status = 401
    else if (message.includes('required') || message.includes('at least')) status = 400
    
    return NextResponse.json({ error: message }, { status })
  }
}
