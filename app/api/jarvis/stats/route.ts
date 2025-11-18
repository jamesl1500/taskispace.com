import { NextResponse } from 'next/server'
import { jarvisService } from '@/lib/services/jarvis-service'

/**
 * GET /api/jarvis/stats
 * Get token usage statistics for the current user
 */
export async function GET() {
  try {
    const stats = await jarvisService.getTokenUsageStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching token stats:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message === 'Not authenticated' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
