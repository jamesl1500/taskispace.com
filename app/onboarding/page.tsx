'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed, onboarding_stage')
          .eq('id', user.id)
          .single()

        if (profile?.onboarding_completed) {
          router.push('/timeline')
          return
        }

        // Redirect to appropriate stage
        const stage = profile?.onboarding_stage || 1
        router.push(`/onboarding/stage_${stage}`)
      } catch (err) {
        console.error('Error checking onboarding:', err)
        router.push('/onboarding/stage_1')
      }
    }
    checkOnboarding()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
    </div>
  )
}
