"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Mail, Loader2, CheckCircle } from "lucide-react"

interface User {
  email?: string
}

function VerifyRequiredContent() {
  const searchParams = useSearchParams()
  const emailParam = searchParams.get('email')
  
  const [isResending, setIsResending] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [hasResent, setHasResent] = useState(false)
  const [email, setEmail] = useState(emailParam || '')

  useEffect(() => {
    const getUser = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        console.log('Fetching user session...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Error fetching session:', sessionError)
          console.log('No valid session - allowing unauthenticated access')
          return
        }
        
        if (session?.user) {
          console.log('User session found:', session.user)
          setUser(session.user)
          
          // If user has email and no email param was provided, use user's email
          if (session.user.email && !emailParam) {
            setEmail(session.user.email)
          }
        } else {
          console.log('No authenticated session - allowing unauthenticated access')
        }
      } catch (err) {
        console.error('Error in getUser:', err)
        console.log('Error occurred - allowing unauthenticated access')
      }
    }
    
    getUser()
  }, [emailParam])

  const handleResendEmail = async () => {
    console.log('Button clicked! Email:', email)
    
    if (!email || !email.trim()) {
      alert('Please enter an email address.')
      return
    }
    
    if (!email.includes('@')) {
      alert('Please enter a valid email address.')
      return
    }
    
    setIsResending(true)
    
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      console.log('Starting resend process for:', email)
      
      console.log('Calling supabase.auth.resend...')
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim()
      })
      
      if (error) {
        console.error('Resend error:', error)
        alert(`Error: ${error.message}`)
      } else {
        console.log('Resend successful!')
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
  
  const handleGoToLogin = () => {
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
            {user ? 'Enter your email address to resend verification:' : 'Enter your email address to receive a verification email:'}
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-left block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full"
              disabled={isResending}
            />
          </div>
          
          {hasResent && (
            <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-2 rounded">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Verification email sent to {email}!</span>
            </div>
          )}
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Click the verification link in your email to activate your account. 
            If you don&apos;t see the email, check your spam folder.
          </p>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-3">
          <Button
            onClick={(e) => {
              e.preventDefault()
              console.log('Button onClick triggered')
              handleResendEmail()
            }}
            disabled={isResending || hasResent || !email.trim()}
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
                {user ? 'Resend verification email' : 'Send verification email'}
              </>
            )}
          </Button>
          
          {user ? (
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Sign out and use different account
            </Button>
          ) : (
            <Button
              onClick={handleGoToLogin}
              variant="ghost"
              className="w-full text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Already have an account? Sign in
            </Button>
          )}
        </CardFooter>
      </Card>
  )
}

export default function VerifyRequiredPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyRequiredContent />
    </Suspense>
  )
}