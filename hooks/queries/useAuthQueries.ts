/**
 * React Query hooks for authentication
 * Replaces the existing useAuth hook with proper caching and state management
 * 
 * @module hooks/queries/useAuthQueries
 */
'use client'

import React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
  user: () => [...authKeys.all, 'user'] as const,
}

// Auth service functions
const authService = {
  getSession: async () => {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },

  signOut: async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return true
  },

  signIn: async (email: string, password: string) => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  },

  signUp: async (email: string, password: string, metadata?: Record<string, unknown>) => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })
    if (error) throw error
    return data
  },

  resetPassword: async (email: string) => {
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
    return true
  },
}

/**
 * Hook for getting current user session
 */
export function useSession() {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: authService.getSession,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 60 * 1000, // 30 minutes
  })
}

/**
 * Hook for getting current user
 */
export function useUser() {
  const { data: session, isLoading, error } = useSession()
  
  return {
    user: session?.user ?? null,
    isLoading,
    error,
  }
}

/**
 * Hook for authentication state with real-time updates
 */
export function useAuth() {
  const queryClient = useQueryClient()
  const { user, isLoading, error } = useUser()

  // Set up real-time auth state listener
  React.useEffect(() => {
    const supabase = createClient()
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Update session cache
      queryClient.setQueryData(authKeys.session(), session)
    })

    return () => subscription.unsubscribe()
  }, [queryClient])

  return {
    user,
    loading: isLoading,
    error,
  }
}

/**
 * Mutation hook for signing out
 */
export function useSignOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authService.signOut,
    onSuccess: () => {
      // Clear all auth-related cache
      queryClient.setQueryData(authKeys.session(), null)
      // Optionally clear all cache
      queryClient.clear()
    },
  })
}

/**
 * Mutation hook for signing in
 */
export function useSignIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.signIn(email, password),
    onSuccess: (data) => {
      // Update session cache
      queryClient.setQueryData(authKeys.session(), data.session)
    },
  })
}

/**
 * Mutation hook for signing up
 */
export function useSignUp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ 
      email, 
      password, 
      metadata 
    }: { 
      email: string; 
      password: string; 
      metadata?: Record<string, unknown>
    }) => authService.signUp(email, password, metadata),
    onSuccess: (data) => {
      // Update session cache if sign up includes session
      if (data.session) {
        queryClient.setQueryData(authKeys.session(), data.session)
      }
    },
  })
}

/**
 * Mutation hook for password reset
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: (email: string) => authService.resetPassword(email),
  })
}