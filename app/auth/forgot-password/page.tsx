"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, ArrowLeft, CheckCircle, KeyRound } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      
      if (error) {
        console.error('Password reset error:', error.message)
        alert(error.message)
        setIsLoading(false)
      } else {
        setIsEmailSent(true)
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  if (isEmailSent) {
    return (
      <div className="w-full">
        <Card className="w-full shadow-xl border-purple-100 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-lg">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-700 via-pink-700 to-orange-700 bg-clip-text text-transparent">
              Check your email
            </CardTitle>
            <CardDescription className="text-gray-600">
              We&apos;ve sent a password reset link to <br />
              <span className="font-semibold text-gray-900">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-gray-600">
              Didn&apos;t receive the email? Check your spam folder or try again.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3">
            <Button
              onClick={() => {
                setIsEmailSent(false)
                setEmail("")
              }}
              variant="outline"
              className="w-full border-purple-200 hover:bg-purple-50"
            >
              Try different email
            </Button>
            <Link href="/auth/login" className="w-full">
              <Button variant="ghost" className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Decorative header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl shadow-xl mb-4">
          <KeyRound className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 via-pink-700 to-orange-700 bg-clip-text text-transparent mb-2">
          Forgot your password?
        </h1>
        <p className="text-gray-600">
          No worries! We&apos;ll send you reset instructions
        </p>
      </div>

      <Card className="w-full shadow-xl border-purple-100 bg-white/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-800 font-medium">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 h-5 w-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400/20 bg-white"
                  required
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-3 px-6 pb-6">
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 hover:from-purple-700 hover:via-pink-700 hover:to-orange-700 text-white shadow-lg shadow-purple-500/30 border-0"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                "Send reset link"
              )}
            </Button>
            
            <Link href="/auth/login" className="w-full">
              <Button variant="ghost" className="w-full text-purple-600 hover:text-purple-700 hover:bg-purple-50">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}