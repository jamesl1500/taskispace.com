"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock, User, Sparkles } from "lucide-react"

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
    <div className="w-full">
      {/* Decorative header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl shadow-xl mb-4">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-700 via-pink-700 to-orange-700 bg-clip-text text-transparent mb-2">
          Join TaskiSpace
        </h1>
        <p className="text-gray-600">
          Create your account and start your productivity journey
        </p>
      </div>

      <Card className="w-full shadow-xl border-purple-100 bg-white/80 backdrop-blur-sm">
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 p-6">
          
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-800 font-medium">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 h-5 w-5" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="pl-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400/20 bg-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user_name" className="text-gray-800 font-medium">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-500 h-5 w-5" />
                <Input
                  id="user_name"
                  type="text"
                  placeholder="Choose a username"
                  value={formData.user_name}
                  onChange={(e) => handleChange("user_name", e.target.value)}
                  className={`pl-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400/20 bg-white ${
                    errors.user_name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                  }`}
                  required
                />
              </div>
              {errors.user_name && (
                <p className="text-sm text-red-500 mt-1">{errors.user_name}</p>
              )}
              <p className="text-xs text-gray-500">
                3-30 characters, letters, numbers, underscore, or hyphen only
              </p>
            </div>
          
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-800 font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-orange-500 h-5 w-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
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
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 h-5 w-5" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
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
              <p className="text-xs text-gray-500">
                Password must be at least 8 characters long
              </p>
            </div>
          
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-800 font-medium">
                Confirm Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-500 h-5 w-5" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  className="pl-10 pr-10 border-purple-200 focus:border-purple-400 focus:ring-purple-400/20 bg-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => handleChange("agreeToTerms", !!checked)}
                  className="mt-1 border-purple-300 text-purple-600 focus:ring-purple-500/20"
                />
                <Label htmlFor="terms" className="text-sm text-gray-700">
                  I agree to the{" "}
                  <Link href="/terms" className="text-purple-600 hover:text-purple-700 hover:underline font-medium transition-colors">
                    Terms of Service
                  </Link>
                  {" "}and{" "}
                  <Link href="/privacy" className="text-purple-600 hover:text-purple-700 hover:underline font-medium transition-colors">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              {errors.terms && (
                <p className="text-sm text-red-500">{errors.terms}</p>
              )}
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
                  Creating account...
                </span>
              ) : (
                "Create account"
              )}
            </Button>
            
            <div className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <Link 
                href="/auth/login" 
                className="text-purple-600 hover:text-purple-700 hover:underline font-semibold transition-colors"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}