'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Loader2, ExternalLink, Crown, AlertCircle, CheckCircle, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { SubscriptionWithUsage } from '@/types/subscriptions'
import { isUnlimited } from '@/types/subscriptions'

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

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return '[&>div]:bg-red-500'
    if (percentage >= 70) return '[&>div]:bg-yellow-500'
    return '[&>div]:bg-green-500'
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
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 py-12">
        <div className="container max-w-2xl px-4">
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <AlertCircle className="w-8 h-8 text-red-600 mb-2" />
              <CardTitle>Subscription Not Found</CardTitle>
              <CardDescription>
                We couldn&apos;t load your subscription details. Please try again later.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  const isPro = subscription.plan?.name === 'pro'
  const limits = subscription.plan?.limits || {}

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="container max-w-5xl py-12 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Subscription & Usage
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your subscription plan and track resource usage
          </p>
        </div>

        <div className="space-y-6">
          {/* Current Plan */}
          <Card className="border-2 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    {isPro ? (
                      <Crown className="w-6 h-6 text-yellow-500" />
                    ) : (
                      <Sparkles className="w-6 h-6 text-gray-400" />
                    )}
                    {subscription.plan?.name === 'free' ? 'Free Plan' : 'Pro Plan'}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {isPro
                      ? `$${subscription.plan?.price_monthly || 5}/month · Unlimited productivity power`
                      : 'Essential features to get you started'}
                  </CardDescription>
                </div>
                {subscription.status === 'active' && (
                  <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 h-fit px-3 py-1">
                    <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                    Active
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {isPro ? (
                <div className="space-y-4">
                  {subscription.current_period_end && (
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          Next billing date
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Your subscription will automatically renew
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                        {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  <Button 
                    onClick={handleManageBilling} 
                    disabled={isProcessing}
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
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
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      🚀 Unlock unlimited tasks, workspaces, and premium AI features with Pro
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push('/pricing')}
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Card className="border shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">Usage This Month</CardTitle>
              <CardDescription>Track your resource usage against plan limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tasks */}
              <UsageItem
                label="Tasks Created"
                current={subscription.usage.tasks}
                limit={limits.maxTasks || 50}
                getUsagePercentage={getUsagePercentage}
                getUsageColor={getUsageColor}
                getProgressColor={getProgressColor}
              />

              {/* Workspaces */}
              <UsageItem
                label="Workspaces"
                current={subscription.usage.workspaces}
                limit={limits.maxWorkspaces || 1}
                getUsagePercentage={getUsagePercentage}
                getUsageColor={getUsageColor}
                getProgressColor={getProgressColor}
              />

              {/* Friends */}
              <UsageItem
                label="Friends"
                current={subscription.usage.friends}
                limit={limits.maxFriends || 10}
                getUsagePercentage={getUsagePercentage}
                getUsageColor={getUsageColor}
                getProgressColor={getProgressColor}
              />

              {/* Nudges Today */}
              <UsageItem
                label="Nudges Sent Today"
                current={subscription.usage.nudgesToday}
                limit={limits.maxNudgesPerDay || 3}
                getUsagePercentage={getUsagePercentage}
                getUsageColor={getUsageColor}
                getProgressColor={getProgressColor}
              />

              {/* Jarvis Conversations */}
              <UsageItem
                label="Jarvis Conversations"
                current={subscription.usage.jarvisConversationsThisMonth}
                limit={limits.jarvisConversationsPerMonth || 5}
                getUsagePercentage={getUsagePercentage}
                getUsageColor={getUsageColor}
                getProgressColor={getProgressColor}
              />

              {/* Jarvis Tokens */}
              <UsageItem
                label="Jarvis AI Tokens"
                current={subscription.usage.jarvisTokensThisMonth}
                limit={limits.jarvisTokensPerMonth || 10000}
                getUsagePercentage={getUsagePercentage}
                getUsageColor={getUsageColor}
                getProgressColor={getProgressColor}
                formatNumber
              />
            </CardContent>
          </Card>

          {/* Upgrade Prompt */}
          {!isPro && (
            <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Need More Capacity?
                </CardTitle>
                <CardDescription className="text-blue-800 dark:text-blue-200">
                  Upgrade to Pro for unlimited tasks, workspaces, friends, and enhanced Jarvis AI capabilities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.push('/pricing')}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  View Pro Features
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// Usage Item Component
function UsageItem({
  label,
  current,
  limit,
  getUsagePercentage,
  getUsageColor,
  getProgressColor,
  formatNumber = false
}: {
  label: string
  current: number
  limit: number
  getUsagePercentage: (current: number, limit: number) => number
  getUsageColor: (percentage: number) => string
  getProgressColor: (percentage: number) => string
  formatNumber?: boolean
}) {
  const percentage = getUsagePercentage(current, limit)
  const displayCurrent = formatNumber ? current.toLocaleString() : current
  const displayLimit = isUnlimited(limit) ? '∞' : formatNumber ? limit.toLocaleString() : limit

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className={`font-semibold ${getUsageColor(percentage)}`}>
          {displayCurrent} / {displayLimit}
        </span>
      </div>
      {!isUnlimited(limit) && (
        <Progress 
          value={percentage} 
          className={`h-2 ${getProgressColor(percentage)}`}
        />
      )}
    </div>
  )
}
