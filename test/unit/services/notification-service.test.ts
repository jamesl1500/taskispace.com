import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotificationService } from '@/lib/services/notification-service'
import type { NotificationFilters, NotificationType } from '@/types/notifications'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          in: vi.fn(() => ({
            eq: vi.fn(() => ({
              limit: vi.fn(() => ({
                range: vi.fn(() => Promise.resolve({
                  data: mockNotifications,
                  error: null
                }))
              }))
            }))
          }))
        })),
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { user_name: 'testuser', display_name: 'Test User', avatar_url: null },
            error: null
          }))
        })),
        single: vi.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'new-notif', type: 'task_assigned' },
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  })
}))

const mockNotifications = [
  {
    id: '1',
    user_id: 'user1',
    type: 'task_assigned' as NotificationType,
    title: 'New Task',
    message: 'You have been assigned a task',
    read: false,
    triggered_by: 'user2',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    user_id: 'user1',
    type: 'task_comment' as NotificationType,
    title: 'New Comment',
    message: 'Someone commented on your task',
    read: true,
    triggered_by: 'user3',
    created_at: new Date().toISOString()
  }
]

describe('lib/services/notification-service', () => {
  describe('NotificationService', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should get notifications without filters', async () => {
      const notifications = await NotificationService.getNotifications()
      expect(notifications).toBeDefined()
      expect(Array.isArray(notifications)).toBe(true)
    })

    it('should get notifications with type filter', async () => {
      const filters: NotificationFilters = { type: ['task_assigned'] }
      const notifications = await NotificationService.getNotifications(filters)
      expect(notifications).toBeDefined()
    })

    it('should get notifications with read filter', async () => {
      const filters: NotificationFilters = { read: false }
      const notifications = await NotificationService.getNotifications(filters)
      expect(notifications).toBeDefined()
    })

    it('should get notifications with workspace filter', async () => {
      const filters: NotificationFilters = { workspace_id: 'workspace1' }
      const notifications = await NotificationService.getNotifications(filters)
      expect(notifications).toBeDefined()
    })

    it('should get notifications with pagination', async () => {
      const filters: NotificationFilters = { limit: 10, offset: 0 }
      const notifications = await NotificationService.getNotifications(filters)
      expect(notifications).toBeDefined()
    })

    it('should get notification statistics', async () => {
      const stats = await NotificationService.getNotificationStats()
      expect(stats).toBeDefined()
      expect(stats).toHaveProperty('unread_count')
      expect(stats).toHaveProperty('total_count')
      expect(stats).toHaveProperty('by_type')
    })

    it('should mark notification as read', async () => {
      await expect(
        NotificationService.markAsRead('notification1')
      ).resolves.not.toThrow()
    })

    it('should mark all notifications as read', async () => {
      await expect(
        NotificationService.markAllAsRead()
      ).resolves.not.toThrow()
    })

    it('should delete notification', async () => {
      await expect(
        NotificationService.deleteNotification('notification1')
      ).resolves.not.toThrow()
    })

    it('should create notification', async () => {
      const payload = {
        user_id: 'user1',
        type: 'task_assigned' as NotificationType,
        title: 'Test',
        message: 'Test message'
      }
      const result = await NotificationService.createNotification(payload)
      expect(result).toBeDefined()
      expect(result).toHaveProperty('id')
    })
  })
})
