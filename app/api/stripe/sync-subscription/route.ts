import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

/**
 * POST /api/stripe/sync-subscription
 * Manually sync subscription status from Stripe (useful when webhooks don't fire)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's subscription from database
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json({ 
        error: 'No Stripe customer found. Please try upgrading again.' 
      }, { status: 404 })
    }

    console.log('Syncing subscription for customer:', subscription.stripe_customer_id)

    // Get subscriptions from Stripe for this customer
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: subscription.stripe_customer_id,
      limit: 1,
      status: 'active'
    })

    if (stripeSubscriptions.data.length === 0) {
      return NextResponse.json({ 
        message: 'No active subscription found in Stripe',
        synced: false 
      })
    }

    const stripeSubscription = stripeSubscriptions.data[0]

    // Get the Pro plan ID
    const { data: proPlan } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('name', 'pro')
      .single()

    if (!proPlan) {
      return NextResponse.json({ error: 'Pro plan not found' }, { status: 500 })
    }

    // Update subscription in database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        plan_id: proPlan.id,
        stripe_subscription_id: stripeSubscription.id,
        status: 'active',
        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Error updating subscription:', updateError)
      return NextResponse.json({ error: 'Failed to sync subscription' }, { status: 500 })
    }

    console.log('✅ Subscription synced successfully for user:', user.id)

    return NextResponse.json({ 
      message: 'Subscription synced successfully',
      synced: true,
      plan: 'pro'
    })
  } catch (error) {
    console.error('Error syncing subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
