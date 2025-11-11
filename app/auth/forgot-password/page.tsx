"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, ArrowLeft, CheckCircle } from "lucide-react"

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
      <Card className="w-full shadow-2xl border-1 backdrop-blur-md ring-1 ring-gray-200/50 dark:ring-gray-600/60">
        <CardHeader className="space-y-1 text-center relative">
          {/* Dark accent stripe mimicking laptop edge */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-gray-700 via-slate-800 to-zinc-700 rounded-full opacity-40 dark:opacity-70" />
          
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 mt-6">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 drop-shadow-sm">Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent a password reset link to <br />
            <span className="font-medium text-slate-700 dark:text-slate-300">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Didn&apos;t receive the email? Check your spam folder or try again.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            onClick={() => {
              setIsEmailSent(false)
              setEmail("")
            }}
            variant="outline"
            className="w-full"
          >
            Try different email
          </Button>
          <Link href="/auth/login" className="w-full">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full shadow-2xl border-1 backdrop-blur-md ring-1 ring-gray-200/50 dark:ring-gray-600/60">
      <CardHeader className="space-y-1 text-center relative">
        {/* Dark accent stripe mimicking laptop edge */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-gray-700 via-slate-800 to-zinc-700 rounded-full opacity-40 dark:opacity-70" />
        
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-6 drop-shadow-sm">Forgot your password?</CardTitle>
        <CardDescription className="text-gray-700/80 dark:text-gray-300/80">
          No worries! Enter your email address and we&apos;ll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5 p-6 relative">
          
          <div className="space-y-2 relative">
            <Label htmlFor="email" className="text-gray-800 dark:text-gray-200 font-medium drop-shadow-sm">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600/70 dark:text-gray-400/70 h-4 w-4 drop-shadow-sm" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-gray-50/50 dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-600/60 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-gray-400/20 dark:focus:ring-gray-500/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-600/50 dark:placeholder:text-gray-400/50 shadow-sm ring-1 ring-gray-700/10 dark:ring-gray-300/10"
                required
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 px-6 relative">
          {/* Dark accent shadow at bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-700/10 to-transparent rounded-b-lg dark:from-gray-900/30" />
          
          <Button type="submit" className="relative w-full bg-gradient-to-r from-gray-600 via-slate-600 to-zinc-600 hover:from-gray-700 hover:via-slate-700 hover:to-zinc-700 text-white shadow-lg shadow-gray-500/25 border-0 ring-1 ring-gray-600/20 dark:ring-gray-400/30" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send reset link"}
          </Button>
          
          <Link href="/auth/login" className="w-full">
            <Button variant="ghost" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}