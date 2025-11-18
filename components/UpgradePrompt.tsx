'use client'

import { AlertCircle, Sparkles } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface UpgradePromptProps {
  feature: string
  current: number
  limit: number
  message?: string
  className?: string
}

export function UpgradePrompt({ feature, current, limit, message, className }: UpgradePromptProps) {
  const router = useRouter()

  return (
    <Alert className={className} variant="default">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Upgrade to Pro</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p>
          {message || `You've reached your ${feature} limit (${current}/${limit}).`}
        </p>
        <p className="text-sm">
          Upgrade to <strong>Pro</strong> for unlimited access, plus advanced features like analytics, themes, and priority support.
        </p>
        <div className="flex gap-3 pt-2">
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            onClick={() => router.push('/pricing')}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            View Pricing
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push('/settings/subscription')}
          >
            Manage Subscription
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

interface InlineUpgradeButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function InlineUpgradeButton({ 
  variant = 'default',
  size = 'default',
  className 
}: InlineUpgradeButtonProps) {
  const router = useRouter()

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => router.push('/pricing')}
    >
      <Sparkles className="w-4 h-4 mr-2" />
      Upgrade to Pro
    </Button>
  )
}
