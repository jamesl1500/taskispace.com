'use client'

import { useState, useEffect, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { UserWithProfile } from '@/types/user'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let isMounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (isMounted) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isMounted) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return {
    user,
    loading,
    signOut
  }
}

// Extended auth hook that includes profile information
export function useAuthWithProfile() {
  const [userWithProfile, setUserWithProfile] = useState<UserWithProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let isMounted = true
    let isInitialLoad = true

    const fetchUserAndProfile = async (user: User | null) => {

      if (!user) {
        if (isMounted) {
          setUserWithProfile(null)
          setError(null)
        }
        return
      }

      try {
        // Use API endpoint instead of direct Supabase query
        const response = await fetch(`/api/profiles?userId=${user.id}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          
          // If profile doesn't exist (404), try to create one
          if (response.status === 404) {
            try {
              // Call the API endpoint to create profile which handles username conflicts
              const response = await fetch('/api/profiles/create-profile', {
                method: 'POST'
              })

              if (!response.ok) {
                if (isMounted) {
                  setError('Failed to create profile. Please try signing out and back in.')
                }
                return
              }

              const { profile: newProfile } = await response.json()

              if (!newProfile) {
                if (isMounted) {
                  setError('Failed to create profile. Please try signing out and back in.')
                }
                return
              }

              if (isMounted) {
                setUserWithProfile({ user, profile: newProfile })
                setError(null)
              }
            } catch (createErr) {
              if (isMounted) {
                setError('Failed to create user profile. Please contact support.')
              }
            }
          } else {
            if (isMounted) {
              setError('Failed to load profile')
            }
          }
          return
        }

        // Success - parse profile from response
        const profile = await response.json()

        if (isMounted) {
          setUserWithProfile({ user, profile })
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load user profile')
        }
      }
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        await fetchUserAndProfile(session?.user ?? null)
      } catch (err) {
        if (isMounted) {
          setError('Failed to load session')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
          isInitialLoad = false
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {

        // Only show loading state on initial load, not on subsequent auth changes
        if (!isInitialLoad && isMounted) {
          setLoading(true)
        }
        await fetchUserAndProfile(session?.user ?? null)
        if (isMounted) {
          setLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return {
    userWithProfile,
    user: userWithProfile?.user || null,
    profile: userWithProfile?.profile || null,
    loading,
    error,
    signOut
  }
}