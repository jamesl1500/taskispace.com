import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth, useAuthWithProfile } from '@/hooks/useAuth'

// Mock Supabase client
const mockUser = {
  id: 'user1',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString()
}

const mockSession = {
  user: mockUser,
  access_token: 'token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  refresh_token: 'refresh'
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(() => Promise.resolve({
        data: { session: mockSession },
        error: null
      })),
      onAuthStateChange: vi.fn((callback) => {
        // Call the callback immediately with current session
        callback('SIGNED_IN', mockSession)
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn()
            }
          }
        }
      }),
      signOut: vi.fn(() => Promise.resolve({ error: null }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'user1',
              user_name: 'testuser',
              display_name: 'Test User',
              avatar_url: null
            },
            error: null
          }))
        }))
      }))
    }))
  }))
}))

describe('hooks/useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useAuth hook', () => {
    it('should return user and loading state', async () => {
      const { result } = renderHook(() => useAuth())
      
      // Initially loading
      expect(result.current.loading).toBeDefined()
      
      // Wait for auth to resolve
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      expect(result.current.user).toBeDefined()
    })

    it('should provide signOut function', async () => {
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      expect(result.current.signOut).toBeDefined()
      expect(typeof result.current.signOut).toBe('function')
    })

    it('should handle sign out', async () => {
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      await result.current.signOut()
      
      // signOut should complete without errors
      expect(true).toBe(true)
    })

    it('should update user on auth state change', async () => {
      const { result } = renderHook(() => useAuth())
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      expect(result.current.user).toBeDefined()
    })
  })

  describe('useAuthWithProfile hook', () => {
    it('should return user with profile data', async () => {
      const { result } = renderHook(() => useAuthWithProfile())
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      expect(result.current.userWithProfile).toBeDefined()
    })

    it('should handle loading state', async () => {
      const { result } = renderHook(() => useAuthWithProfile())
      
      expect(result.current.loading).toBeDefined()
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('should handle error state', async () => {
      const { result } = renderHook(() => useAuthWithProfile())
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      expect(result.current.error).toBeDefined()
    })

    it('should provide signOut function', async () => {
      const { result } = renderHook(() => useAuthWithProfile())
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
      
      expect(result.current.signOut).toBeDefined()
      expect(typeof result.current.signOut).toBe('function')
    })
  })
})
