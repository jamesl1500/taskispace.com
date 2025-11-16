'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { Profile, UserWithProfile } from '@/types/user'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

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
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const fetchUserAndProfile = async (user: User | null) => {
      if (!user) {
        if (isMounted) {
          setUserWithProfile(null)
          setError(null)
        }
        return
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          
          // If profile doesn't exist, try to create one
          if (profileError.code === 'PGRST116') {
            console.log('No profile found, attempting to create one for user:', user.id)
            try {
              // Call the API endpoint to create profile which handles username conflicts
              const response = await fetch('/api/profiles/create-profile', {
                method: 'POST'
              })

              if (!response.ok) {
                console.error('Error creating profile via API:', response.statusText)
                if (isMounted) {
                  setError('Failed to create profile. Please try signing out and back in.')
                }
                return
              }

              const { profile: newProfile } = await response.json()

              if (!newProfile) {
                console.error('No profile returned from API')
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
              console.error('Error in profile creation:', createErr)
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

        if (isMounted) {
          setUserWithProfile({ user, profile })
          setError(null)
        }
      } catch (err) {
        console.error('Error in fetchUserAndProfile:', err)
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
        console.error('Error getting initial session:', err)
        if (isMounted) {
          setError('Failed to load session')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setLoading(true)
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