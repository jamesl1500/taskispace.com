"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        console.error('Login error:', error.message)
        
        // Handle specific error cases
        if (error.message.includes('Email not confirmed')) {
          alert('Please verify your email address before signing in. Check your inbox for a verification link.')
          window.location.href = `/auth/verify-required?email=` + encodeURIComponent(email)
        } else {
          alert(error.message)
        }
      } else if (data.user) {
        // Check if user's email is verified
        if (!data.user.email_confirmed_at) {
          alert('Please verify your email address before signing in. Check your inbox for a verification link.')
          window.location.href = `/auth/verify-required?email=` + encodeURIComponent(email)
        } else {
          // Check if user has a profile, create one if not
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', data.user.id)
            .single()

          if (!existingProfile) {
            // Generate a username if none exists in metadata
            const username = data.user.user_metadata.user_name || 
                           data.user.email?.split('@')[0] || 
                           `user_${data.user.id.substring(0, 8)}`

            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                user_name: username,
                display_name: data.user.user_metadata.full_name || null,
                avatar_url: data.user.user_metadata.avatar_url || null,
              })

            if (profileError) {
              console.error('Profile creation error:', profileError.message)
              alert('Error creating user profile')
              return
            }
          }

          // Redirect to timeline on success
          window.location.href = '/timeline'
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      alert('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full shadow-2xl border-1 backdrop-blur-md ring-1 ring-gray-200/50 dark:ring-gray-600/60">
      <CardHeader className="space-y-1 text-center relative">
      {/* Dark accent stripe mimicking laptop edge */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-gray-700 via-slate-800 to-zinc-700 rounded-full opacity-40 dark:opacity-70" />
      
      <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-6 drop-shadow-sm">Welcome back</CardTitle>
      <CardDescription className="text-gray-700/80 dark:text-gray-300/80">
        Sign in to your TaskiSpace account to continue
      </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
      <CardContent className="space-y-5 p-6 relative">
        {/* Subtle dark accent in background */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gray-700/5 to-black/10 rounded-full blur-2xl dark:from-gray-800/20 dark:to-black/30" />
        
        <div className="space-y-2 relative">
        <Label htmlFor="email" className="text-gray-800 dark:text-gray-200 font-medium drop-shadow-sm">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600/70 dark:text-gray-400/70 h-4 w-4 drop-shadow-sm" />
          <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-10 bg-gray-50/50 dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-600/60 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-gray-400/20 dark:focus:ring-gray-500/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-600/50 dark:placeholder:text-gray-400/50 shadow-sm ring-1 ring-gray-700/10 dark:ring-gray-300/10"
          required
          />
        </div>
        </div>
        <div className="space-y-2 relative">
        <Label htmlFor="password" className="text-gray-800 dark:text-gray-200 font-medium drop-shadow-sm">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600/70 dark:text-gray-400/70 h-4 w-4 drop-shadow-sm" />
          <Input
          id="password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="pl-10 pr-10 bg-gray-50/50 dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-600/60 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-gray-400/20 dark:focus:ring-gray-500/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-600/50 dark:placeholder:text-gray-400/50 shadow-sm ring-1 ring-gray-700/10 dark:ring-gray-300/10"
          required
          />
          <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600/70 hover:text-gray-700 dark:text-gray-400/70 dark:hover:text-gray-300 transition-colors drop-shadow-sm"
          >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        </div>
        <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input
          type="checkbox"
          id="remember"
          className="rounded border-gray-300 dark:border-gray-600 text-gray-600 focus:ring-gray-500/20 bg-gray-50 dark:bg-gray-900/30"
          />
          <Label htmlFor="remember" className="text-sm text-gray-700 dark:text-gray-300">
          Remember me
          </Label>
        </div>
        <Link
          href="/auth/forgot-password"
          className="text-sm text-gray-700 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-200 hover:underline transition-colors"
        >
          Forgot password?
        </Link>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 px-6 pb-6 relative">        
        <Button type="submit" className="relative w-full bg-gradient-to-r from-gray-600 via-slate-600 to-zinc-600 hover:from-gray-700 hover:via-slate-700 hover:to-zinc-700 text-white shadow-lg shadow-gray-500/25 border-0 ring-1 ring-gray-600/20 dark:ring-gray-400/30" disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign in"}
        </Button>
        
        <div className="text-center text-sm text-gray-700 dark:text-gray-300">
          Don&apos;t have an account?{" "}
          <Link href="/auth/signup" className="text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:hover:text-gray-100 hover:underline font-medium transition-colors">
            Sign up
          </Link>
        </div>
      </CardFooter>
      </form>
    </Card>
  )
}