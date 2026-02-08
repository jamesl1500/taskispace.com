/**
 * Jarvis AI Bot API Route
 * 
 * This API route handles POST requests to interact with the Jarvis AI Bot.
 * It receives user messages, processes them with token-efficient strategies,
 * and returns AI-generated replies with conversation history.
 * 
 * Token optimization strategies:
 * - Uses gpt-4o-mini (60% cheaper than gpt-3.5-turbo)
 * - Sliding window: Only last N messages sent for context
 * - Persistent storage: Conversations saved in database
 * - Token tracking: Monitor usage per message
 * 
 * @module app/api/jarvis/route
 */
import { NextRequest, NextResponse } from 'next/server'
import { jarvisService } from '@/lib/services/jarvis-service'
import { SubscriptionService } from '@/lib/services/subscription-service'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/jarvis
 * Send a message to Jarvis and get a response
 * 
 * Body: {
 *   message: string,
 *   conversationId?: string,
 *   maxHistoryMessages?: number (default: 10)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { message, conversationId, maxHistoryMessages } = await request.json()

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Check subscription limit for Jarvis tokens
    const subscriptionService = new SubscriptionService()
    const limitCheck = await subscriptionService.checkLimit(user.id, 'jarvisTokensPerMonth')

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

    // Send message with token-efficient context management
    const result = await jarvisService.sendMessage(
      message.trim(),
      conversationId,
      maxHistoryMessages
    )

    // Track token usage (estimate ~500-1000 tokens per conversation turn)
    const estimatedTokens = Math.ceil((message.length + result.reply.length) / 4) // ~4 chars per token
    await subscriptionService.incrementUsage(user.id, 'jarvis_tokens', estimatedTokens)

    return NextResponse.json({
      reply: result.reply,
      conversation: result.conversation,
      taskCreated: result.taskCreated, // Include task creation info if any
      needsWorkspaceSelection: result.needsWorkspaceSelection // Flag if user needs to select workspace
    })
  } catch (error) {
    console.error('Error in Jarvis API:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message === 'Not authenticated' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * GET /api/jarvis
 * Get all conversations for the current user
 */
export async function GET() {
  try {
    const conversations = await jarvisService.getConversations()
    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message === 'Not authenticated' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}