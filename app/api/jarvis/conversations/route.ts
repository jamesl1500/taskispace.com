import { NextRequest, NextResponse } from 'next/server'
import { jarvisService } from '@/lib/services/jarvis-service'
import { SubscriptionService } from '@/lib/services/subscription-service'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/jarvis/conversations
 * Create a new Jarvis conversation
 * Body: { title?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check subscription limit for Jarvis conversations
    const subscriptionService = new SubscriptionService()
    const limitCheck = await subscriptionService.checkLimit(user.id, 'jarvisConversationsPerMonth')

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
    const { title } = body

    const conversation = await jarvisService.createConversation(title)
    
    // Track usage
    await subscriptionService.incrementUsage(user.id, 'jarvis_conversations')

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Error creating conversation:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message === 'Not authenticated' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
