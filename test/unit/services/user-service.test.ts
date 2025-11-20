import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserService } from '@/lib/services/user-service'

// Mock Supabase admin client
vi.mock('@/lib/supabase/auth', () => ({
  supabaseAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: mockUser,
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: { id: 'user1', name: 'Updated Name' },
          error: null
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: null,
          error: null
        }))
      }))
    }))
  }))
}))

const mockUser = {
  id: 'user1',
  email: 'test@example.com',
  user_name: 'testuser',
  display_name: 'Test User',
  avatar_url: null,
  created_at: new Date().toISOString()
}

describe('lib/services/user-service', () => {
  let userService: UserService

  beforeEach(() => {
    userService = new UserService()
    vi.clearAllMocks()
  })

  describe('UserService', () => {
    it('should get user by ID', async () => {
      const user = await userService.getUserById('user1')
      
      expect(user).toBeDefined()
      expect(user.id).toBe('user1')
      expect(user.email).toBe('test@example.com')
    })

    it('should update user profile', async () => {
      const profileData = {
        name: 'Updated Name',
        avatar_url: 'https://example.com/avatar.jpg'
      }
      
      const result = await userService.updateUserProfile('user1', profileData)
      expect(result).toBeDefined()
    })

    it('should delete user', async () => {
      const result = await userService.deleteUser('user1')
      expect(result).toBeDefined()
    })

    it('should handle partial profile updates', async () => {
      const profileData = {
        name: 'Only Name Updated'
      }
      
      await expect(
        userService.updateUserProfile('user1', profileData)
      ).resolves.not.toThrow()
    })

    it('should handle errors when fetching user', async () => {
      vi.mock('@/lib/supabase/auth', () => ({
        supabaseAdminClient: vi.fn(() => ({
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({
                  data: null,
                  error: { message: 'User not found' }
                }))
              }))
            }))
          }))
        }))
      }))

      await expect(userService.getUserById('invalid')).rejects.toThrow()
    })
  })
})
