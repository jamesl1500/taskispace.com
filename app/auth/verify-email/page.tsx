"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertCircle, Mail, Loader2 } from "lucide-react"

function VerifyEmailForm() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [isResending, setIsResending] = useState(false)
  
  const token = searchParams.get('token')
  const email = searchParams.get('email')
  const isValidToken = !!token

  // Simulate verification process
  useState(() => {
    if (isValidToken) {
      const timer = setTimeout(() => {
        // TODO: Implement actual verification with backend
        setIsLoading(false)
        setIsVerified(true) // Simulate successful verification
      }, 2000)
      return () => clearTimeout(timer)
    } else {
      setIsLoading(false)
    }
  })

  const handleResendEmail = async () => {
    setIsResending(true)
    // TODO: Implement resend verification email
    console.log("Resending verification email to:", email)
    
    setTimeout(() => {
      setIsResending(false)
      alert("Verification email has been resent!")
    }, 2000)
  }

  // Loading state
  if (isLoading && isValidToken) {
    return (
      <Card className="w-full shadow-xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md ring-1 ring-gray-200/50 dark:ring-gray-700/50">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Verifying your email...</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Please wait while we verify your email address.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Invalid token state
  if (!isValidToken) {
    return (
      <Card className="w-full shadow-xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md ring-1 ring-gray-200/50 dark:ring-gray-700/50">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Invalid verification link</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            This email verification link is invalid or has expired.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            If you need to verify your email, please request a new verification link.
          </p>
          {email && (
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Email: {email}
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          {email && (
            <Button
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-medium"
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend verification email
                </>
              )}
            </Button>
          )}
          <Link href="/auth/login" className="w-full">
            <Button variant="outline" className="w-full border-gray-200 dark:border-gray-700 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
              Back to login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  // Success state
  if (isVerified) {
    return (
      <Card className="w-full shadow-xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md ring-1 ring-gray-200/50 dark:ring-gray-700/50">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Email verified!</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Your email address has been successfully verified. You can now access all features of TaskiSpace.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Welcome to TaskiSpace! You&apos;re all set to start organizing your tasks and managing your workspaces.
          </p>
          {email && (
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
              Verified: {email}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Link href="/auth/login" className="w-full">
            <Button className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-medium">Continue to TaskiSpace</Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  // Error state
  return (
    <Card className="w-full shadow-xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md ring-1 ring-gray-200/50 dark:ring-gray-700/50">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Verification failed</CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          We encountered an error while verifying your email address.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Please try clicking the verification link again, or request a new one.
        </p>
        {email && (
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Email: {email}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-3">
        {email && (
          <Button
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-medium"
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Resend verification email
              </>
            )}
          </Button>
        )}
        <Link href="/auth/login" className="w-full">
          <Button variant="outline" className="w-full border-gray-200 dark:border-gray-700 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            Back to login
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <Card className="w-full shadow-xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md ring-1 ring-gray-200/50 dark:ring-gray-700/50">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Loading...</CardTitle>
        </CardHeader>
      </Card>
    }>
      <VerifyEmailForm />
    </Suspense>
  )
}