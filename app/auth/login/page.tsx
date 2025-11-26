"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Mail, Lock, Sparkles } from "lucide-react"

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
    <div className="w-full">
      {/* Decorative header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl shadow-xl mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 via-pink-700 to-orange-700 bg-clip-text text-transparent mb-2">
          Welcome back!
        </h1>
        <p className="text-gray-600">
          Sign in to continue your productivity journey
        </p>
      </div>

      <Card className="w-full shadow-xl border-purple-100 bg-white/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 p-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-800 font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 h-5 w-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400/20 bg-white"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-800 font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-500 h-5 w-5" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400/20 bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
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
                  className="rounded border-purple-300 text-purple-600 focus:ring-purple-500/20"
                />
                <Label htmlFor="remember" className="text-sm text-gray-700">
                  Remember me
                </Label>
              </div>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-purple-600 hover:text-purple-700 hover:underline transition-colors font-medium"
              >
                Forgot password?
              </Link>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 px-6 pb-6">
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
                  Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </Button>
            
            <div className="text-center text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link 
                href="/auth/signup" 
                className="text-purple-600 hover:text-purple-700 hover:underline font-semibold transition-colors"
              >
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}