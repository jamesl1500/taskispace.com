import { NextRequest, NextResponse } from 'next/server'
import { friendshipService } from '@/lib/services/friendship-service'
import { SubscriptionService } from '@/lib/services/subscription-service'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/friendships/[id]
 * Accept or reject a friend request
 * Body: { action: 'accept' | 'reject' }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "accept" or "reject"' },
        { status: 400 }
      )
    }

    if (action === 'accept') {
      // Check subscription limit for friends before accepting
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      }

      const subscriptionService = new SubscriptionService()
      const limitCheck = await subscriptionService.checkLimit(user.id, 'maxFriends')

      if (!limitCheck.allowed) {
        return NextResponse.json(
          { 
            error: limitCheck.reason,
            upgrade: true,
            current: limitCheck.current,
            limit: limitCheck.limit
          },
          { status: 403 }
        )
      }

      const friendship = await friendshipService.acceptFriendRequest(id)
      
      // Track usage
      await subscriptionService.incrementUsage(user.id, 'friends_count')

      return NextResponse.json(friendship)
    } else {
      const result = await friendshipService.rejectFriendRequest(id)
      return NextResponse.json(result)
    }
  } catch (error) {
    console.error('Error in update friendship API:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    let status = 500
    
    if (message === 'Not authenticated') status = 401
    else if (message.includes('not found')) status = 404
    
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * DELETE /api/friendships/[id]
 * Remove a friend
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await friendshipService.removeFriend(id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in remove friend API:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message === 'Not authenticated' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
