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

    console.log('[useAuth] Hook initialized')
    console.log('[useAuth] Supabase client created:', { 
      hasClient: !!supabase, 
      hasAuth: !!supabase?.auth,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL 
    })

    // Get initial session
    const getInitialSession = async () => {
      console.log('[useAuth] Getting initial session...')
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('[useAuth] Session retrieved:', { hasSession: !!session, hasUser: !!session?.user })
        if (isMounted) {
          setUser(session?.user ?? null)
          setLoading(false)
          console.log('[useAuth] Loading set to false')
        }
      } catch (err) {
        console.error('[useAuth] Error getting session:', err)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth] Auth state changed:', { event, hasSession: !!session })
        if (isMounted) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      }
    )

    return () => {
      console.log('[useAuth] Cleanup')
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  console.log('[useAuth] Render state:', { hasUser: !!user, loading })

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

    console.log('[useAuthWithProfile] Hook initialized')
    console.log('[useAuthWithProfile] Supabase client created:', { 
      hasClient: !!supabase, 
      hasAuth: !!supabase?.auth,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL 
    })

    const fetchUserAndProfile = async (user: User | null) => {
      console.log('[useAuthWithProfile] fetchUserAndProfile called', {
        hasUser: !!user,
        userId: user?.id,
        isMounted,
        isInitialLoad
      })

      if (!user) {
        console.log('[useAuthWithProfile] No user, clearing profile')
        if (isMounted) {
          setUserWithProfile(null)
          setError(null)
        }
        return
      }

      console.log('[useAuthWithProfile] Fetching profile for user:', user.id)

      try {
        // Use API endpoint instead of direct Supabase query
        const response = await fetch(`/api/profiles?userId=${user.id}`)

        console.log('[useAuthWithProfile] Profile API response:', {
          ok: response.ok,
          status: response.status
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error('[useAuthWithProfile] Error fetching profile:', {
            status: response.status,
            error: errorData.error
          })
          
          // If profile doesn't exist (404), try to create one
          if (response.status === 404) {
            console.log('[useAuthWithProfile] No profile found (404), attempting to create one for user:', user.id)
            try {
              // Call the API endpoint to create profile which handles username conflicts
              const response = await fetch('/api/profiles/create-profile', {
                method: 'POST'
              })

              console.log('[useAuthWithProfile] Create profile API response:', {
                ok: response.ok,
                status: response.status,
                statusText: response.statusText
              })

              if (!response.ok) {
                console.error('[useAuthWithProfile] Error creating profile via API:', response.statusText)
                if (isMounted) {
                  setError('Failed to create profile. Please try signing out and back in.')
                }
                return
              }

              const { profile: newProfile } = await response.json()

              console.log('[useAuthWithProfile] New profile created:', {
                hasProfile: !!newProfile,
                profileId: newProfile?.id,
                username: newProfile?.user_name
              })

              if (!newProfile) {
                console.error('[useAuthWithProfile] No profile returned from API')
                if (isMounted) {
                  setError('Failed to create profile. Please try signing out and back in.')
                }
                return
              }

              if (isMounted) {
                console.log('[useAuthWithProfile] Setting userWithProfile with new profile')
                setUserWithProfile({ user, profile: newProfile })
                setError(null)
              }
            } catch (createErr) {
              console.error('[useAuthWithProfile] Error in profile creation:', createErr)
              if (isMounted) {
                setError('Failed to create user profile. Please contact support.')
              }
            }
          } else {
            // Other error (not 404)
            console.error('[useAuthWithProfile] Profile fetch error (not 404):', {
              status: response.status,
              error: errorData.error
            })
            if (isMounted) {
              setError('Failed to load profile')
            }
          }
          return
        }

        // Success - parse profile from response
        const profile = await response.json()
        console.log('[useAuthWithProfile] Profile fetched successfully:', {
          profileId: profile?.id,
          username: profile?.user_name,
          displayName: profile?.display_name
        })

        if (isMounted) {
          setUserWithProfile({ user, profile })
          setError(null)
        }
      } catch (err) {
        console.error('[useAuthWithProfile] Unexpected error in fetchUserAndProfile:', err)
        if (isMounted) {
          setError('Failed to load user profile')
        }
      }
    }

    // Get initial session
    const getInitialSession = async () => {
      console.log('[useAuthWithProfile] Getting initial session...')
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('[useAuthWithProfile] Initial session retrieved:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id
        })
        await fetchUserAndProfile(session?.user ?? null)
        console.log('[useAuthWithProfile] fetchUserAndProfile completed in getInitialSession')
      } catch (err) {
        console.error('[useAuthWithProfile] Error getting initial session:', err)
        if (isMounted) {
          setError('Failed to load session')
        }
      } finally {
        if (isMounted) {
          console.log('[useAuthWithProfile] Setting loading to false, isInitialLoad to false')
          setLoading(false)
          isInitialLoad = false
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuthWithProfile] Auth state changed:', {
          event,
          hasSession: !!session,
          hasUser: !!session?.user,
          userId: session?.user?.id,
          isInitialLoad,
          isMounted
        })

        // Only show loading state on initial load, not on subsequent auth changes
        if (!isInitialLoad && isMounted) {
          console.log('[useAuthWithProfile] Setting loading to true for auth change')
          setLoading(true)
        }
        await fetchUserAndProfile(session?.user ?? null)
        if (isMounted) {
          console.log('[useAuthWithProfile] Setting loading to false after auth change')
          setLoading(false)
        }
      }
    )

    return () => {
      console.log('[useAuthWithProfile] Cleanup: unsubscribing and setting isMounted to false')
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const signOut = async () => {
    console.log('[useAuthWithProfile] Sign out called')
    await supabase.auth.signOut()
  }

  console.log('[useAuthWithProfile] Render state:', {
    hasUserWithProfile: !!userWithProfile,
    hasUser: !!userWithProfile?.user,
    hasProfile: !!userWithProfile?.profile,
    loading,
    error
  })

  return {
    userWithProfile,
    user: userWithProfile?.user || null,
    profile: userWithProfile?.profile || null,
    loading,
    error,
    signOut
  }
}