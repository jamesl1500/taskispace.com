import { createClient } from '@/lib/supabase/server'
import { supabaseAdminClient } from '@/lib/supabase/auth'
import Stripe from 'stripe'
import type { 
  Subscription, 
  SubscriptionPlan, 
  SubscriptionWithUsage,
  SubscriptionLimits 
} from '@/types/subscriptions'
import { isUnlimited, isLimitReached } from '@/types/subscriptions'

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-10-29.clover'
})

export class SubscriptionService {
  /**
   * Get the current user's subscription with plan details
   */
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('Error fetching subscription:', error)
      return null
    }

    return data
  }

  /**
   * Get user's subscription with usage statistics
   */
  async getUserSubscriptionWithUsage(userId: string): Promise<SubscriptionWithUsage | null> {
    const subscription = await this.getUserSubscription(userId)
    if (!subscription) return null

    // Get current usage counts
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

    const [tasksCount, workspacesCount, friendsCount, nudgesCount, jarvisConvCount, jarvisTokensCount] = await Promise.all([
      this.getUsageCount(userId, 'tasks_created'),
      this.getUsageCount(userId, 'workspaces_created'),
      this.getUsageCount(userId, 'friends_count'),
      this.getUsageCount(userId, 'nudges_sent', startOfDay),
      this.getUsageCount(userId, 'jarvis_conversations', startOfMonth),
      this.getUsageCount(userId, 'jarvis_tokens', startOfMonth),
    ])

    return {
      ...subscription,
      usage: {
        tasks: tasksCount,
        workspaces: workspacesCount,
        friends: friendsCount,
        nudgesToday: nudgesCount,
        jarvisConversationsThisMonth: jarvisConvCount,
        jarvisTokensThisMonth: jarvisTokensCount,
      }
    }
  }

  /**
   * Get current usage count for a specific metric
   */
  private async getUsageCount(userId: string, metricName: string, periodStart?: string): Promise<number> {
    const supabase = await createClient()
    const query = supabase
      .from('subscription_usage')
      .select('current_value')
      .eq('user_id', userId)
      .eq('metric_name', metricName)

    if (periodStart) {
      query.gte('period_start', periodStart)
    }

    const { data } = await query.maybeSingle()
    return data?.current_value || 0
  }

  /**
   * Check if user has reached a specific limit
   */
  async checkLimit(userId: string, limitKey: keyof SubscriptionLimits): Promise<{ allowed: boolean; current: number; limit: number; reason?: string }> {
    const subscription = await this.getUserSubscription(userId)
    
    if (!subscription?.plan) {
      return { allowed: false, current: 0, limit: 0, reason: 'No active subscription' }
    }

    const limits = subscription.plan.limits as SubscriptionLimits
    const limit = limits[limitKey]

    // Unlimited (-1) always allows
    if (isUnlimited(limit)) {
      return { allowed: true, current: 0, limit: -1 }
    }

    // Map limit keys to usage metrics
    const metricMap: Record<keyof SubscriptionLimits, string | null> = {
      maxTasks: 'tasks_created',
      maxWorkspaces: 'workspaces_created',
      maxFriends: 'friends_count',
      maxNudgesPerDay: 'nudges_sent',
      jarvisConversationsPerMonth: 'jarvis_conversations',
      jarvisTokensPerMonth: 'jarvis_tokens',
      conversationHistoryDays: null, // Not a countable metric
      maxFileSize: null, // Checked per-upload
    }

    const metricName = metricMap[limitKey]
    if (!metricName) {
      // For non-tracked metrics, just return the limit
      return { allowed: true, current: 0, limit }
    }

    // Get period start based on metric type
    const now = new Date()
    let periodStart: string | undefined
    if (limitKey.includes('PerMonth')) {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    } else if (limitKey.includes('PerDay')) {
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
    }

    const current = await this.getUsageCount(userId, metricName, periodStart)
    const allowed = !isLimitReached(current, limit)

    return {
      allowed,
      current,
      limit,
      reason: allowed ? undefined : `You've reached your ${limitKey} limit of ${limit}. Upgrade to Pro for unlimited access.`
    }
  }

  /**
   * Increment usage for a specific metric
   */
  async incrementUsage(userId: string, metricName: string, amount: number = 1): Promise<void> {
    const supabase = await createClient()
    const now = new Date()
    let periodStart: Date
    let periodEnd: Date | null = null

    // Determine period based on metric type
    if (metricName.includes('month') || metricName.includes('jarvis')) {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    } else if (metricName.includes('day') || metricName.includes('nudges')) {
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    } else {
      // Permanent counters (tasks, workspaces, friends)
      periodStart = new Date(0) // Unix epoch
    }

    const { error } = await supabase
      .from('subscription_usage')
      .upsert({
        user_id: userId,
        metric_name: metricName,
        current_value: amount,
        period_start: periodStart.toISOString(),
        period_end: periodEnd?.toISOString(),
      }, {
        onConflict: 'user_id,metric_name',
        ignoreDuplicates: false,
      })

    if (error) {
      console.error('Error incrementing usage:', error)
    }
  }

  /**
   * Decrement usage for a specific metric (e.g., when deleting a task)
   */
  async decrementUsage(userId: string, metricName: string, amount: number = 1): Promise<void> {
    const supabase = await createClient()
    const current = await this.getUsageCount(userId, metricName)
    const newValue = Math.max(0, current - amount)

    const { error } = await supabase
      .from('subscription_usage')
      .update({ current_value: newValue })
      .eq('user_id', userId)
      .eq('metric_name', metricName)

    if (error) {
      console.error('Error decrementing usage:', error)
    }
  }

  /**
   * Get all available subscription plans
   */
  async getPlans(): Promise<SubscriptionPlan[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true })

    if (error) {
      console.error('Error fetching plans:', error)
      return []
    }

    return data || []
  }

  /**
   * Create Stripe checkout session for Pro subscription
   */
  async createCheckoutSession(userId: string, planId: string, billingPeriod: 'monthly' | 'yearly'): Promise<{ url: string | null; error?: string }> {
    try {
      const supabase = await createClient()
      // Get the plan
      const { data: plan } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single()

      if (!plan) {
        return { url: null, error: 'Plan not found' }
      }

      const priceId = billingPeriod === 'monthly' 
        ? plan.stripe_price_id_monthly 
        : plan.stripe_price_id_yearly

      if (!priceId) {
        return { url: null, error: 'Price ID not configured' }
      }

      // Get or create Stripe customer
      const subscription = await this.getUserSubscription(userId)
      let customerId = subscription?.stripe_customer_id

      if (!customerId) {
        // Get user email
        const { data: { user } } = await supabase.auth.getUser()
        if (!user?.email) {
          return { url: null, error: 'User email not found' }
        }

        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { user_id: userId }
        })
        customerId = customer.id

        // Save customer ID
        await supabase
          .from('subscriptions')
          .update({ stripe_customer_id: customerId })
          .eq('user_id', userId)
      }

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1,
        }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true&tab=subscription`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
        metadata: {
          user_id: userId,
          plan_id: planId,
        }
      })

      return { url: session.url }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      return { url: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Create Stripe customer portal session
   */
  async createPortalSession(userId: string): Promise<{ url: string | null; error?: string }> {
    try {
      const subscription = await this.getUserSubscription(userId)
      
      if (!subscription?.stripe_customer_id) {
        return { url: null, error: 'No Stripe customer found' }
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=subscription`,
      })

      return { url: session.url }
    } catch (error) {
      console.error('Error creating portal session:', error)
      return { url: null, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    console.log('Processing webhook event:', event.type)
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log('Checkout completed for session:', session.id)
        await this.handleCheckoutComplete(session)
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        await this.handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await this.handleSubscriptionCanceled(subscription)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await this.handlePaymentSucceeded(invoice)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await this.handlePaymentFailed(invoice)
        break
      }
    }
  }

  /**
   * Handle successful checkout completion
   */
  private async handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
    const supabase = supabaseAdminClient() // Use admin client to bypass RLS
    const userId = session.metadata?.user_id
    const planId = session.metadata?.plan_id

    console.log('Handling checkout complete:', { userId, planId, sessionId: session.id })

    if (!userId || !planId) {
      console.error('Missing user_id or plan_id in checkout session metadata')
      return
    }

    // See if subscription record exists
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (!existingSubscription) {
      // Create new subscription record
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_id: planId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          status: 'active',
          created_at: new Date().toISOString(),
        })

      if (error) {
        console.error('Error creating subscription after checkout:', error)
      } else {
        console.log('✅ Created new subscription for user:', userId)
      }
      return
    }

    console.log('Updating existing subscription for user:', userId)

    // Update existing subscription record
    const { error } = await supabase
      .from('subscriptions')
      .update({
        plan_id: planId,
        stripe_subscription_id: session.subscription as string,
        status: 'active',
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating subscription after checkout:', error)
    } else {
      console.log('✅ Updated subscription for user:', userId)
    }
  }

  /**
   * Handle subscription updates
   */
  private async handleSubscriptionUpdate(stripeSubscription: Stripe.Subscription): Promise<void> {
    const supabase = supabaseAdminClient() // Use admin client to bypass RLS
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', stripeSubscription.id)
      .single()

    if (!subscription) {
      console.error('Subscription not found for Stripe subscription:', stripeSubscription.id)
      return
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: stripeSubscription.status as Subscription['status'],
        current_period_start: (stripeSubscription as any).current_period_start
          ? new Date((stripeSubscription as any).current_period_start * 1000).toISOString()
          : null,
        current_period_end: (stripeSubscription as any).current_period_end
          ? new Date((stripeSubscription as any).current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: stripeSubscription.cancel_at_period_end,
        canceled_at: stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000).toISOString() : null,
      })
      .eq('id', subscription.id)

    if (error) {
      console.error('Error updating subscription:', error)
    }
  }

  /**
   * Handle subscription cancellation - downgrade to free tier
   */
  private async handleSubscriptionCanceled(stripeSubscription: Stripe.Subscription): Promise<void> {
    const supabase = supabaseAdminClient() // Use admin client to bypass RLS
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', stripeSubscription.id)
      .single()

    if (!subscription) {
      console.error('Subscription not found for Stripe subscription:', stripeSubscription.id)
      return
    }

    // Get the free plan
    const { data: freePlan } = await supabase
      .from('subscription_plans')
      .select('id')
      .eq('name', 'free')
      .single()

    if (!freePlan) {
      console.error('Free plan not found')
      return
    }

    const { error } = await supabase
      .from('subscriptions')
      .update({
        plan_id: freePlan.id,
        status: 'canceled',
        canceled_at: new Date().toISOString(),
      })
      .eq('id', subscription.id)

    if (error) {
      console.error('Error downgrading subscription to free:', error)
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const supabase = supabaseAdminClient() // Use admin client to bypass RLS
    if (!invoice.subscription) return

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', invoice.subscription as string)
      .single()

    if (!subscription) return

    // Reset monthly usage counters on successful payment
    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    await supabase
      .from('subscription_usage')
      .delete()
      .eq('user_id', subscription.user_id)
      .or('metric_name.eq.jarvis_conversations,metric_name.eq.jarvis_tokens')
      .gte('period_start', periodStart)
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const supabase = supabaseAdminClient() // Use admin client to bypass RLS
    if (!invoice.subscription) return

    const { error } = await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', invoice.subscription as string)

    if (error) {
      console.error('Error updating subscription status to past_due:', error)
    }
  }
}
