'use client'

import { useState } from 'react'
import { Check, Sparkles, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FREE_FEATURES, PRO_FEATURES } from '@/types/subscriptions'

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const router = useRouter()

  const handleUpgrade = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: 'pro',
          billingPeriod
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error upgrading:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start upgrade process')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            <Sparkles className="w-3 h-3 mr-1" />
            Simple Pricing
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Start free and upgrade when you need more power. No credit card required to start.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingPeriod === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                billingPeriod === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Yearly
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                6 Free Months!
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto mb-20 justify-center items-stretch">
          {/* Free Plan */}
          <Card className="relative border-2 border-gray-200 dark:border-gray-700 flex-1 max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl">Free</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="mt-4">
            <span className="text-4xl font-bold">$0</span>
            <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
            {FREE_FEATURES.map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
              </div>
            ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/signup')}
              >
            Get Started Free
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Plan */}
          <Card className="relative border-2 border-blue-600 dark:border-blue-500 shadow-lg flex-1 max-w-md">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className="bg-blue-600 text-white dark:bg-blue-500 px-4 py-1">
            <Zap className="w-3 h-3 mr-1" />
            Most Popular
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <CardDescription>For power users and teams</CardDescription>
              <div className="mt-4">
            <span className="text-4xl font-bold">
              ${billingPeriod === 'monthly' ? '5' : '60'}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              /{billingPeriod === 'monthly' ? 'month' : 'year'}
            </span>
            {billingPeriod === 'yearly' && (
              <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                6 Free Months!
              </div>
            )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
            {PRO_FEATURES.map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
              </div>
            ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            onClick={handleUpgrade}
            disabled={isLoading}
              >
            {isLoading ? 'Processing...' : 'Upgrade to Pro'}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                Can I upgrade or downgrade anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Yes! You can upgrade to Pro anytime. If you downgrade, you&apos;ll keep Pro features until the end of your billing period.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                What happens to my data if I downgrade?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your data is never deleted. If you exceed Free tier limits after downgrading, you&apos;ll need to remove some content or upgrade again to access everything.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                Is there a free trial for Pro?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                The Free plan is generous enough to try all features. If you need more capacity, upgrading to Pro is month-to-month with no long-term commitment.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Yes! If you&apos;re not satisfied within the first 7 days, contact support for a full refund.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                We accept all major credit cards (Visa, Mastercard, American Express) via secure Stripe payment processing.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 rounded-2xl p-12 shadow-xl">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to supercharge your productivity?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of users who are getting more done with TaskiSpace Pro.
            </p>
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 dark:bg-gray-900 dark:text-blue-400 dark:hover:bg-gray-800"
              onClick={handleUpgrade}
              disabled={isLoading}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isLoading ? 'Processing...' : 'Start Your Upgrade'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
