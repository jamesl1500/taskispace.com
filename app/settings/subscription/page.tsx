'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, ExternalLink, Crown, AlertCircle, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { SubscriptionWithUsage } from '@/types/subscriptions'
import { isUnlimited, isLimitReached } from '@/types/subscriptions'

export default function SubscriptionManagementPage() {
  const [subscription, setSubscription] = useState<SubscriptionWithUsage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchSubscription()
  }, [])

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscription')
      if (!response.ok) {
        throw new Error('Failed to fetch subscription')
      }
      const data = await response.json()
      setSubscription(data)
    } catch (error) {
      console.error('Error fetching subscription:', error)
      toast.error('Failed to load subscription details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManageBilling = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/stripe/portal')
      if (!response.ok) {
        throw new Error('Failed to create portal session')
      }
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error opening billing portal:', error)
      toast.error('Failed to open billing portal')
      setIsProcessing(false)
    }
  }

  const getUsagePercentage = (current: number, limit: number): number => {
    if (isUnlimited(limit)) return 0
    return Math.min((current / limit) * 100, 100)
  }

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-600 dark:text-red-400'
    if (percentage >= 70) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
            <CardTitle>Subscription Not Found</CardTitle>
            <CardDescription>
              We couldn&apos;t load your subscription details. Please try again later.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const isPro = subscription.plan?.name === 'pro'
  const limits = subscription.plan?.limits || {}

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isPro && <Crown className="w-5 h-5 text-yellow-500" />}
                {subscription.plan?.name === 'free' ? 'Free Plan' : 'Pro Plan'}
              </CardTitle>
              <CardDescription>
                {isPro
                  ? `$${subscription.plan?.price_monthly || 5}/month - Unlimited productivity`
                  : 'Get started with essential features'}
              </CardDescription>
            </div>
            {subscription.status === 'active' && (
              <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPro ? (
            <>
              {subscription.current_period_end && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your subscription renews on{' '}
                  <strong>
                    {new Date(subscription.current_period_end).toLocaleDateString()}
                  </strong>
                </p>
              )}
              <Button onClick={handleManageBilling} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Manage Billing
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => router.push('/pricing')}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Pro
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Usage This Month</CardTitle>
          <CardDescription>Track your resource usage against plan limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tasks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Tasks Created</span>
              <span className={getUsageColor(getUsagePercentage(subscription.usage.tasks, limits.maxTasks || 50))}>
                {subscription.usage.tasks} / {isUnlimited(limits.maxTasks || 50) ? '∞' : limits.maxTasks || 50}
              </span>
            </div>
            {!isUnlimited(limits.maxTasks || 50) && (
              <Progress value={getUsagePercentage(subscription.usage.tasks, limits.maxTasks || 50)} />
            )}
          </div>

          {/* Workspaces */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Workspaces</span>
              <span className={getUsageColor(getUsagePercentage(subscription.usage.workspaces, limits.maxWorkspaces || 1))}>
                {subscription.usage.workspaces} / {isUnlimited(limits.maxWorkspaces || 1) ? '∞' : limits.maxWorkspaces || 1}
              </span>
            </div>
            {!isUnlimited(limits.maxWorkspaces || 1) && (
              <Progress value={getUsagePercentage(subscription.usage.workspaces, limits.maxWorkspaces || 1)} />
            )}
          </div>

          {/* Friends */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Friends</span>
              <span className={getUsageColor(getUsagePercentage(subscription.usage.friends, limits.maxFriends || 10))}>
                {subscription.usage.friends} / {isUnlimited(limits.maxFriends || 10) ? '∞' : limits.maxFriends || 10}
              </span>
            </div>
            {!isUnlimited(limits.maxFriends || 10) && (
              <Progress value={getUsagePercentage(subscription.usage.friends, limits.maxFriends || 10)} />
            )}
          </div>

          {/* Nudges Today */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Nudges Sent Today</span>
              <span className={getUsageColor(getUsagePercentage(subscription.usage.nudgesToday, limits.maxNudgesPerDay || 3))}>
                {subscription.usage.nudgesToday} / {isUnlimited(limits.maxNudgesPerDay || 3) ? '∞' : limits.maxNudgesPerDay || 3}
              </span>
            </div>
            {!isUnlimited(limits.maxNudgesPerDay || 3) && (
              <Progress value={getUsagePercentage(subscription.usage.nudgesToday, limits.maxNudgesPerDay || 3)} />
            )}
          </div>

          {/* Jarvis Conversations */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Jarvis Conversations</span>
              <span className={getUsageColor(getUsagePercentage(subscription.usage.jarvisConversationsThisMonth, limits.jarvisConversationsPerMonth || 5))}>
                {subscription.usage.jarvisConversationsThisMonth} / {isUnlimited(limits.jarvisConversationsPerMonth || 5) ? '∞' : limits.jarvisConversationsPerMonth || 5}
              </span>
            </div>
            {!isUnlimited(limits.jarvisConversationsPerMonth || 5) && (
              <Progress value={getUsagePercentage(subscription.usage.jarvisConversationsThisMonth, limits.jarvisConversationsPerMonth || 5)} />
            )}
          </div>

          {/* Jarvis Tokens */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Jarvis AI Tokens</span>
              <span className={getUsageColor(getUsagePercentage(subscription.usage.jarvisTokensThisMonth, limits.jarvisTokensPerMonth || 10000))}>
                {subscription.usage.jarvisTokensThisMonth.toLocaleString()} / {isUnlimited(limits.jarvisTokensPerMonth || 10000) ? '∞' : (limits.jarvisTokensPerMonth || 10000).toLocaleString()}
              </span>
            </div>
            {!isUnlimited(limits.jarvisTokensPerMonth || 10000) && (
              <Progress value={getUsagePercentage(subscription.usage.jarvisTokensThisMonth, limits.jarvisTokensPerMonth || 10000)} />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Need More? */}
      {!isPro && (
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">
              Need More Capacity?
            </CardTitle>
            <CardDescription>
              Upgrade to Pro for unlimited tasks, workspaces, friends, and enhanced Jarvis AI capabilities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/pricing')}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              <Crown className="w-4 h-4 mr-2" />
              View Pro Features
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
