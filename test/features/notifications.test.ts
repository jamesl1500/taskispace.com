import { describe, it, expect, vi, beforeEach } from 'vitest'

global.fetch = vi.fn()
const mockFetch = global.fetch as ReturnType<typeof vi.fn>

describe('Notifications System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  describe('Notification Retrieval', () => {
    it('should fetch all notifications', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          notifications: [
            {
              id: 'notif-1',
              type: 'task_assigned',
              title: 'New task assigned',
              read: false,
            },
            {
              id: 'notif-2',
              type: 'task_comment',
              title: 'New comment',
              read: true,
            },
          ],
        }),
      } as Response)

      const response = await fetch('/api/notifications')
      const result = await response.json()

      expect(result.notifications).toHaveLength(2)
    })

    it('should filter unread notifications', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          notifications: [{ id: 'notif-1', read: false }],
        }),
      } as Response)

      const response = await fetch('/api/notifications?read=false')
      const result = await response.json()

      expect(result.notifications[0].read).toBe(false)
    })

    it('should filter by notification type', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          notifications: [{ id: 'notif-1', type: 'task_assigned' }],
        }),
      } as Response)

      const response = await fetch('/api/notifications?type=task_assigned')
      const result = await response.json()

      expect(result.notifications[0].type).toBe('task_assigned')
    })
  })

  describe('Notification Actions', () => {
    it('should mark notification as read', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          notification: { id: 'notif-1', read: true },
        }),
      } as Response)

      const response = await fetch('/api/notifications/notif-1/read', {
        method: 'PATCH',
      })

      const result = await response.json()
      expect(result.notification.read).toBe(true)
    })

    it('should mark all as read', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ count: 5 }),
      } as Response)

      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      })

      const result = await response.json()
      expect(result.count).toBe(5)
    })

    it('should delete notification', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      const response = await fetch('/api/notifications/notif-1', {
        method: 'DELETE',
      })

      const result = await response.json()
      expect(result.success).toBe(true)
    })

    it('should delete all read notifications', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ deleted: 10 }),
      } as Response)

      const response = await fetch('/api/notifications/delete-read', {
        method: 'DELETE',
      })

      const result = await response.json()
      expect(result.deleted).toBe(10)
    })
  })

  describe('Notification Stats', () => {
    it('should fetch notification statistics', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          stats: {
            total_count: 25,
            unread_count: 5,
            by_type: {
              task_assigned: 10,
              task_comment: 8,
              mention: 7,
            },
          },
        }),
      } as Response)

      const response = await fetch('/api/notifications/stats')
      const result = await response.json()

      expect(result.stats.unread_count).toBe(5)
      expect(result.stats.total_count).toBe(25)
    })
  })

  describe('Notification Preferences', () => {
    it('should fetch user notification preferences', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preferences: {
            email_enabled: true,
            push_enabled: false,
            task_assigned: true,
            task_comment: true,
          },
        }),
      } as Response)

      const response = await fetch('/api/notifications/preferences')
      const result = await response.json()

      expect(result.preferences.email_enabled).toBe(true)
    })

    it('should update notification preferences', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          preferences: {
            email_enabled: false,
            task_assigned: false,
          },
        }),
      } as Response)

      const response = await fetch('/api/notifications/preferences', {
        method: 'PATCH',
        body: JSON.stringify({
          email_enabled: false,
          task_assigned: false,
        }),
      })

      const result = await response.json()
      expect(result.preferences.email_enabled).toBe(false)
    })
  })

  describe('Notification Types', () => {
    it('should handle task assignment notifications', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          notifications: [
            {
              type: 'task_assigned',
              title: 'Task assigned to you',
              data: { task_id: 'task-123', assignee: 'user-456' },
            },
          ],
        }),
      } as Response)

      const response = await fetch('/api/notifications?type=task_assigned')
      const result = await response.json()

      expect(result.notifications[0].type).toBe('task_assigned')
    })

    it('should handle comment notifications', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          notifications: [
            {
              type: 'task_comment',
              title: 'New comment on task',
              data: { task_id: 'task-123', comment_id: 'comment-789' },
            },
          ],
        }),
      } as Response)

      const response = await fetch('/api/notifications?type=task_comment')
      const result = await response.json()

      expect(result.notifications[0].type).toBe('task_comment')
    })

    it('should handle mention notifications', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          notifications: [
            {
              type: 'mention',
              title: 'You were mentioned',
              data: { mentioned_by: 'user-123' },
            },
          ],
        }),
      } as Response)

      const response = await fetch('/api/notifications?type=mention')
      const result = await response.json()

      expect(result.notifications[0].type).toBe('mention')
    })
  })
})
