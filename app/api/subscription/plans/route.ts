import { NextResponse } from 'next/server'
import { SubscriptionService } from '@/lib/services/subscription-service'

/**
 * GET /api/subscription/plans
 * Get all available subscription plans
 */
export async function GET() {
  try {
    const subscriptionService = new SubscriptionService()
    const plans = await subscriptionService.getPlans()

    return NextResponse.json(plans)
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
