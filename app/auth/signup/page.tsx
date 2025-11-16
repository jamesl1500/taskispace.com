"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react"

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    user_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Validate username format in real-time
    if (field === 'user_name' && typeof value === 'string') {
      if (value.length > 0 && !/^[a-zA-Z0-9_-]{3,30}$/.test(value)) {
        setErrors(prev => ({ 
          ...prev, 
          user_name: 'Username must be 3-30 characters long and contain only letters, numbers, underscores, and hyphens' 
        }))
      }
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required'
    }
    
    if (!formData.user_name.trim()) {
      newErrors.user_name = 'Username is required'
    } else if (!/^[a-zA-Z0-9_-]{3,30}$/.test(formData.user_name)) {
      newErrors.user_name = 'Username must be 3-30 characters long and contain only letters, numbers, underscores, and hyphens'
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long'
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords don't match"
    }
    
    if (!formData.agreeToTerms) {
      newErrors.terms = 'Please agree to the terms and conditions'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    
    try {
      // First check if username is available
      const usernameResponse = await fetch(`/api/profiles/check-username?username=${encodeURIComponent(formData.user_name)}`)
      const usernameData = await usernameResponse.json()
      
      if (!usernameData.available) {
        setErrors({ user_name: 'Username is already taken' })
        toast.error('Username is already taken')
        setIsLoading(false)
        return
      }
      
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      console.log('Attempting signup with metadata:', {
        email: formData.email,
        full_name: formData.name,
        user_name: formData.user_name
      })
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            user_name: formData.user_name,
          }
        }
      })
      
      console.log('Signup result:', { data, error })
      
      if (error) {
        console.error('Signup error details:', {
          message: error.message,
          status: error.status,
          details: error
        })
        
        // Handle specific error types with more detailed logging
        if (error.message.includes('already registered')) {
          setErrors({ email: 'Email is already registered' })
          toast.error('Email is already registered')
        } else if (error.message.includes('Password')) {
          setErrors({ password: error.message })
          toast.error(error.message)
        } else {
          // For any other error, show the full message for debugging
          console.error('Unexpected signup error:', error)
          toast.error(`Signup failed: ${error.message}`)
        }
      } else if (data.user) {
        console.log('Signup successful, user created:', data.user.id)
        
        // Create the profile manually after successful user creation
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              user_name: formData.user_name,
              display_name: formData.name,
            })
          
          if (profileError) {
            console.error('Profile creation error:', profileError)
            
            // Handle username conflicts specifically
            if (profileError.message.includes('duplicate key value violates unique constraint') || 
                profileError.message.includes('profiles_user_name_key')) {
              toast.error('Username is already taken. Please contact support as your account was created but profile setup failed.')
            } else {
              toast.error('Account created but profile setup failed. Please contact support.')
            }
          } else {
            console.log('Profile created successfully')
            toast.success('Account created! Please check your email for a verification link.')
            // Redirect to verify email page with email parameter
            window.location.href = `/auth/verify-email?email=${encodeURIComponent(formData.email)}`;
          }
        } catch (profileError) {
          console.error('Unexpected profile creation error:', profileError)
          toast.error('Account created but profile setup failed. Please contact support.')
        }
      } else {
        console.log('Signup completed but no user returned')
        toast.success('Account created! Please check your email for a verification link.')
        window.location.href = `/auth/verify-email?email=${encodeURIComponent(formData.email)}`;
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full shadow-2xl border-1 backdrop-blur-md ring-1 ring-gray-200/50 dark:ring-gray-600/60">
      <CardHeader className="space-y-1 text-center relative">
        {/* Dark accent stripe mimicking laptop edge */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-gray-700 via-slate-800 to-zinc-700 rounded-full opacity-40 dark:opacity-70" />
        
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-6 drop-shadow-sm">Create your account</CardTitle>
        <CardDescription className="text-gray-700/80 dark:text-gray-300/80">
          Join TaskiSpace and start organizing your tasks today
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-5 p-6 relative">
          
          <div className="space-y-2 relative">
            <Label htmlFor="name" className="text-gray-800 dark:text-gray-200 font-medium drop-shadow-sm">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600/70 dark:text-gray-400/70 h-4 w-4 drop-shadow-sm" />
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="pl-10 bg-gray-50/50 dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-600/60 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-gray-400/20 dark:focus:ring-gray-500/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-600/50 dark:placeholder:text-gray-400/50 shadow-sm ring-1 ring-gray-700/10 dark:ring-gray-300/10"
                required
              />
            </div>
          </div>

          <div className="space-y-2 relative">
            <Label htmlFor="user_name" className="text-gray-800 dark:text-gray-200 font-medium drop-shadow-sm">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600/70 dark:text-gray-400/70 h-4 w-4 drop-shadow-sm" />
              <Input
                id="user_name"
                type="text"
                placeholder="Choose a username"
                value={formData.user_name}
                onChange={(e) => handleChange("user_name", e.target.value)}
                className={`pl-10 bg-gray-50/50 dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-600/60 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-gray-400/20 dark:focus:ring-gray-500/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-600/50 dark:placeholder:text-gray-400/50 shadow-sm ring-1 ring-gray-700/10 dark:ring-gray-300/10 ${
                  errors.user_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                }`}
                required
              />
            </div>
            {errors.user_name && (
              <p className="text-sm text-red-500 mt-1">{errors.user_name}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              3-30 characters, letters, numbers, underscore, or hyphen only
            </p>
          </div>
          
          <div className="space-y-2 relative">
            <Label htmlFor="email" className="text-gray-800 dark:text-gray-200 font-medium drop-shadow-sm">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600/70 dark:text-gray-400/70 h-4 w-4 drop-shadow-sm" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
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
                placeholder="Create a password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
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
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Password must be at least 8 characters long
            </p>
          </div>
          
          <div className="space-y-2 relative">
            <Label htmlFor="confirmPassword" className="text-gray-800 dark:text-gray-200 font-medium drop-shadow-sm">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600/70 dark:text-gray-400/70 h-4 w-4 drop-shadow-sm" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                className="pl-10 pr-10 bg-gray-50/50 dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-600/60 focus:border-gray-400 dark:focus:border-gray-500 focus:ring-gray-400/20 dark:focus:ring-gray-500/20 text-gray-900 dark:text-gray-100 placeholder:text-gray-600/50 dark:placeholder:text-gray-400/50 shadow-sm ring-1 ring-gray-700/10 dark:ring-gray-300/10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600/70 hover:text-gray-700 dark:text-gray-400/70 dark:hover:text-gray-300 transition-colors drop-shadow-sm"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => handleChange("agreeToTerms", !!checked)}
              />
              <Label htmlFor="terms" className="text-sm text-gray-700 dark:text-gray-300">
                I agree to the{" "}
                <Link href="/terms" className="text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:hover:text-gray-100 hover:underline font-medium transition-colors">
                  Terms of Service
                </Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:hover:text-gray-100 hover:underline font-medium transition-colors">
                  Privacy Policy
                </Link>
              </Label>
            </div>
            {errors.terms && (
              <p className="text-sm text-red-500">{errors.terms}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 px-6 pb-6 relative">
          
          <Button type="submit" className="relative w-full bg-gradient-to-r from-gray-600 via-slate-600 to-zinc-600 hover:from-gray-700 hover:via-slate-700 hover:to-zinc-700 text-white shadow-lg shadow-gray-500/25 border-0 ring-1 ring-gray-600/20 dark:ring-gray-400/30" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
          
          <div className="text-center text-sm text-gray-700 dark:text-gray-300">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-gray-800 hover:text-gray-900 dark:text-gray-200 dark:hover:text-gray-100 hover:underline font-medium transition-colors">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}