"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Mail, Loader2, CheckCircle } from "lucide-react"

interface User {
  email?: string
}

export default function VerifyRequiredPage() {
  const [isResending, setIsResending] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [hasResent, setHasResent] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    
    getUser()
  }, [])

  const handleResendEmail = async () => {
    if (!user?.email) return
    
    setIsResending(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      })
      
      if (error) {
        console.error('Resend error:', error)
        alert(`Error: ${error.message}`)
      } else {
        setHasResent(true)
      }
    } catch (error) {
      console.error('Resend error:', error)
      alert("Error resending verification email")
    } finally {
      setIsResending(false)
    }
  }

  const handleSignOut = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  return (
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md ring-1 ring-gray-200/50 dark:ring-gray-700/50">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Email verification required
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Please verify your email address to continue using TaskiSpace
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We&apos;ve sent a verification email to:
          </p>
          {user?.email && (
            <p className="font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded">
              {user.email}
            </p>
          )}
          
          {hasResent && (
            <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-2 rounded">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Verification email sent!</span>
            </div>
          )}
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Click the verification link in your email to activate your account. 
            If you don&apos;t see the email, check your spam folder.
          </p>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-3">
          <Button
            onClick={handleResendEmail}
            disabled={isResending || hasResent}
            variant="outline"
            className="w-full"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : hasResent ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Email sent!
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Resend verification email
              </>
            )}
          </Button>
          
          <Button
            onClick={handleSignOut}
            variant="ghost"
            className="w-full text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Sign out and use different account
          </Button>
        </CardFooter>
      </Card>
  )
}