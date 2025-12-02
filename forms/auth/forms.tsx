/**
 * Auth forms
 * 
 * This module contains React components for authentication forms including
 * signup, login, and password reset forms.
 * 
 * @module forms/auth/forms
 */
import { useState } from 'react'
import { z } from 'zod'
import { signupFormSchema, loginFormSchema, passwordResetFormSchema, newPasswordFormSchema } from './schema'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertCircleIcon } from 'lucide-react'

import ActivityService from '@/lib/services/activity-service'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

import Link from 'next/link'

/**
 * Login Form Component
 * 
 * This component renders the login form for user authentication.
 * It includes fields for email and password, along with validation
 * and submission handling.
 * 
 * @component 
 */
export const LoginForm = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const router = useRouter()

    // Initialize React Hook Form with Zod schema
    const form = useForm<z.infer<typeof loginFormSchema>>({
        resolver: zodResolver(loginFormSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    const onSubmit: SubmitHandler<z.infer<typeof loginFormSchema>> = async (data) => {
        if(data) {
            setIsLoading(true);

            try {
                const supabase = createClient()

                const { data: loginData, error } = await supabase.auth.signInWithPassword({
                    email: data.email,
                    password: data.password,
                })

                if (error) {
                    // Handle specific error cases
                    if (error.message.includes('Email not confirmed')) {
                        setError('Please verify your email address before signing in. Check your inbox for a verification link.')
                    } else {
                        // Trigger shadcn alert
                        setError(error.message)
                    }
                } else if (loginData.user) {
                    // Check if user's email is verified
                    if (!loginData.user.email_confirmed_at) {
                        setError('Please verify your email address before signing in. Check your inbox for a verification link.')
                    } else {
                        // Check if user has a profile, create one if not
                        const { data: existingProfile } = await supabase
                            .from('profiles')
                            .select('id')
                            .eq('user_id', loginData.user.id)
                            .single()

                        if (!existingProfile) {
                            // Generate a username if none exists in metadata
                            const username = loginData.user.user_metadata.user_name || 
                            loginData.user.email?.split('@')[0] || 
                            `user_${loginData.user.id.substring(0, 8)}`

                            const { error: profileError } = await supabase
                            .from('profiles')
                            .insert({
                                id: loginData.user.id,
                                user_name: username,
                                display_name: loginData.user.user_metadata.full_name || null,
                                avatar_url: loginData.user.user_metadata.avatar_url || null,
                            })

                            if (profileError) {
                                console.error('Profile creation error:', profileError.message)
                                setError('Error creating user profile')
                                return
                            }
                        }

                        // Log login activity
                        const activityService = new ActivityService(loginData.user.id)
                        await activityService.logActivity('login')

                        // Redirect to timeline or intended page
                        router.push('/timeline')
                    }
                }
            } catch (error) {
                console.error('Unexpected error:', error)
                alert('An unexpected error occurred')
            } finally {
                setIsLoading(false)
            }
        } else {
            // Handle form errors
            setError('Please fill in all required fields correctly.')
        }
    };

    return (
        <Form {...form}>
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircleIcon className="h-4 w-4 mr-2" />
                    <AlertTitle>Error Occurred:</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="Email" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="Password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full mb-2 cursor-pointer">{isLoading ? "Loading..." : "Login"}</Button>
                <Link href="/auth/signup" className="no-underline border border-gray-300 w-full text-center py-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 font-semibold block">
                    Don't have an account? Sign up
                </Link>
            </form>
        </Form>
    );
}

/**
 * Signup Form Component
 * 
 * This component renders the signup form for new user registration.
 * It includes fields for full name, username, email, password, and
 * confirm password, along with validation and submission handling.
 * 
 * @component 
 */
export const SignupForm = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const router = useRouter()

    // Initialize React Hook Form with Zod schema
    const form = useForm<z.infer<typeof signupFormSchema>>({
        resolver: zodResolver(signupFormSchema),
        defaultValues: {
            full_name: '',
            user_name: '',
            email: '',
            password: '',
            confirm_password: '',
            agree_to_terms: false,
        },
    });

    const onSubmit: SubmitHandler<z.infer<typeof signupFormSchema>> = async (data) => {
        // Implementation for signup submission
    }

    return (
        <Form {...form}>
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircleIcon className="h-4 w-4 mr-2" />
                    <AlertTitle>Error Occurred:</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mb-6">
                <FormField 
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Full Name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField 
                    control={form.control}
                    name="user_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input placeholder="Username" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="Email" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="Password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="confirm_password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="Confirm Password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField 
                    control={form.control}
                    name="agree_to_terms"
                    render={({ field }) => (    
                        <FormItem className="flex items-center space-x-2">
                            <FormControl>
                                <Input 
                                    type="checkbox" 
                                    checked={field.value || false}
                                    onChange={(e) => field.onChange(e.target.checked)} 
                                    className="h-4 w-4"
                                />
                            </FormControl>
                            <FormLabel className="mb-1">I agree to the Terms and Conditions</FormLabel>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full">{isLoading ? "Loading..." : "Sign Up"}</Button>
            </form>
        </Form>
    );
}

/**
 * Password Reset Form Component
 * 
 * This component renders the password reset form for users who have
 * forgotten their password. It includes a field for email, along with
 * validation and submission handling.
 * 
 * @component 
 */
export const PasswordResetForm = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isEmailSent, setIsEmailSent] = useState(false)

    const router = useRouter()

    // Initialize React Hook Form with Zod schema
    const form = useForm<z.infer<typeof passwordResetFormSchema>>({
        resolver: zodResolver(passwordResetFormSchema),
        defaultValues: {
            email: '',
        },
    });

    const onSubmit: SubmitHandler<z.infer<typeof passwordResetFormSchema>> = async (data) => {
        if(data) {
            setIsLoading(true);

            try {
                const supabase = createClient()

                const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
                    redirectTo: `${window.location.origin}/auth/reset-password`
                })

                if (error) {
                    // Handle specific error cases
                    setError(error.message)
                    setIsLoading(false)
                } else {
                    // Successfully sent reset email
                    setIsEmailSent(true)
                    setIsLoading(false)
                    router.push('/auth/forgot-password?sent=true&email=' + encodeURIComponent(data.email))
                }
            } catch (error) {
                console.error('Unexpected error:', error)
                alert('An unexpected error occurred')
            } finally {
                setIsLoading(false)
            }
        }else{
            // Handle form errors
            setError('Please fill in all required fields correctly.')
            setIsLoading(false)
        }
    }

    if (isEmailSent) {
        return (
            <div className="w-full text-center">
                <p className="text-green-600 font-semibold">
                    If an account with that email exists, a password reset link has been sent.
                </p>
            </div>
        )
    }

    return (
        <Form {...form}>
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircleIcon className="h-4 w-4 mr-2" />
                    <AlertTitle>Error Occurred:</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="Email" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full">{isLoading ? "Loading..." : "Send Reset Instructions"}</Button>
            </form>
        </Form>
    );
}