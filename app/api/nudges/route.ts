import { NextRequest, NextResponse } from 'next/server'
import { friendshipService } from '@/lib/services/friendship-service'
import { SubscriptionService } from '@/lib/services/subscription-service'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/nudges
 * Get nudges (received or sent)
 * Query params: ?type=received|sent&limit=20
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'received'
    const limit = parseInt(searchParams.get('limit') || '20')

    let nudges
    if (type === 'sent') {
      nudges = await friendshipService.getSentNudges(limit)
    } else {
      nudges = await friendshipService.getReceivedNudges(limit)
    }

    return NextResponse.json(nudges)
  } catch (error) {
    console.error('Error in get nudges API:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message === 'Not authenticated' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * POST /api/nudges
 * Send a nudge to a friend
 * Body: { friendId: string, taskId?: string, message?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check subscription limit for nudges per day
    const subscriptionService = new SubscriptionService()
    const limitCheck = await subscriptionService.checkLimit(user.id, 'maxNudgesPerDay')

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

    const body = await request.json()
    const { friendId, taskId, message } = body

    if (!friendId) {
      return NextResponse.json({ error: 'Friend ID is required' }, { status: 400 })
    }

    const nudge = await friendshipService.sendNudge(friendId, taskId, message)
    
    // Track usage
    await subscriptionService.incrementUsage(user.id, 'nudges_sent')

    return NextResponse.json(nudge)
  } catch (error) {
    console.error('Error in send nudge API:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    let status = 500
    
    if (message === 'Not authenticated') status = 401
    else if (message.includes('required') || message.includes('too long') || message.includes('not found')) status = 400
    else if (message.includes('must be friends')) status = 403
    
    return NextResponse.json({ error: message }, { status })
  }
}
