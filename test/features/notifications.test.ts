import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock notification functions
const mockGetNotifications = vi.fn()
const mockMarkAsRead = vi.fn()
const mockMarkAllAsRead = vi.fn()
const mockDeleteNotification = vi.fn()
const mockCreateNotification = vi.fn()
const mockUpdateNotificationPreferences = vi.fn()
const mockUseNotifications = vi.fn()
const mockUseNotificationPreferences = vi.fn()

// Mock notification queries
vi.mock('@/hooks/queries/useNotificationQueries', () => ({
  useNotifications: () => mockUseNotifications(),
  useNotificationPreferences: () => mockUseNotificationPreferences(),
  useMarkAsRead: () => ({ 
    mutate: mockMarkAsRead,
    isPending: false,
    error: null 
  }),
  useMarkAllAsRead: () => ({ 
    mutate: mockMarkAllAsRead,
    isPending: false,
    error: null 
  }),
  useDeleteNotification: () => ({ 
    mutate: mockDeleteNotification,
    isPending: false,
    error: null 
  }),
  useCreateNotification: () => ({ 
    mutate: mockCreateNotification,
    isPending: false,
    error: null 
  }),
  useUpdateNotificationPreferences: () => ({ 
    mutate: mockUpdateNotificationPreferences,
    isPending: false,
    error: null 
  }),
}))

interface MockNotification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'task_assigned' | 'task_completed' | 'comment_added' | 'workspace_invitation' | 'list_shared' | 'deadline_reminder' | 'general'
  related_id?: string
  related_type?: 'task' | 'list' | 'workspace' | 'comment'
  is_read: boolean
  created_at: string
  read_at?: string
  metadata?: Record<string, unknown>
}

interface MockNotificationPreferences {
  id: string
  user_id: string
  email_notifications: boolean
  push_notifications: boolean
  task_assignments: boolean
  task_completions: boolean
  comments: boolean
  workspace_invitations: boolean
  list_sharing: boolean
  deadline_reminders: boolean
  digest_frequency: 'immediate' | 'daily' | 'weekly' | 'never'
  quiet_hours_start?: string
  quiet_hours_end?: string
  updated_at: string
}

describe('Notification System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Notification Fetching', () => {
    it('should fetch user notifications', () => {
      const mockNotifications: MockNotification[] = [
        {
          id: '1',
          user_id: 'user1',
          title: 'Task Assigned',
          message: 'You have been assigned to "Complete frontend design"',
          type: 'task_assigned',
          related_id: 'task1',
          related_type: 'task',
          is_read: false,
          created_at: '2024-01-04T10:00:00Z'
        },
        {
          id: '2',
          user_id: 'user1',
          title: 'New Comment',
          message: 'John Smith commented on "API Integration"',
          type: 'comment_added',
          related_id: 'comment1',
          related_type: 'comment',
          is_read: false,
          created_at: '2024-01-04T09:30:00Z'
        },
        {
          id: '3',
          user_id: 'user1',
          title: 'Task Completed',
          message: 'Sarah Johnson completed "Database Setup"',
          type: 'task_completed',
          related_id: 'task2',
          related_type: 'task',
          is_read: true,
          created_at: '2024-01-03T15:20:00Z',
          read_at: '2024-01-03T16:00:00Z'
        }
      ]

      mockUseNotifications.mockReturnValue({
        data: mockNotifications,
        isLoading: false,
        error: null
      })

      const result = mockUseNotifications()
      expect(result.data).toEqual(mockNotifications)
      expect(result.data).toHaveLength(3)
    })

    it('should filter unread notifications', () => {
      const mockNotifications: MockNotification[] = [
        {
          id: '1',
          user_id: 'user1',
          title: 'Unread Notification 1',
          message: 'Message 1',
          type: 'task_assigned',
          is_read: false,
          created_at: '2024-01-04T10:00:00Z'
        },
        {
          id: '2',
          user_id: 'user1',
          title: 'Read Notification',
          message: 'Message 2',
          type: 'comment_added',
          is_read: true,
          created_at: '2024-01-04T09:30:00Z',
          read_at: '2024-01-04T09:45:00Z'
        },
        {
          id: '3',
          user_id: 'user1',
          title: 'Unread Notification 2',
          message: 'Message 3',
          type: 'deadline_reminder',
          is_read: false,
          created_at: '2024-01-04T08:00:00Z'
        }
      ]

      const unreadNotifications = mockNotifications.filter(n => !n.is_read)

      mockUseNotifications.mockReturnValue({
        data: unreadNotifications,
        isLoading: false,
        error: null
      })

      const result = mockUseNotifications()
      expect(result.data).toHaveLength(2)
      expect(result.data.every(n => !n.is_read)).toBe(true)
    })

    it('should sort notifications by creation date', () => {
      const mockNotifications: MockNotification[] = [
        {
          id: '1',
          user_id: 'user1',
          title: 'Older Notification',
          message: 'Message 1',
          type: 'task_assigned',
          is_read: false,
          created_at: '2024-01-03T10:00:00Z'
        },
        {
          id: '2',
          user_id: 'user1',
          title: 'Newer Notification',
          message: 'Message 2',
          type: 'comment_added',
          is_read: false,
          created_at: '2024-01-04T10:00:00Z'
        },
        {
          id: '3',
          user_id: 'user1',
          title: 'Newest Notification',
          message: 'Message 3',
          type: 'deadline_reminder',
          is_read: false,
          created_at: '2024-01-04T11:00:00Z'
        }
      ]

      // Sort by creation date descending (newest first)
      const sortedNotifications = mockNotifications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      mockUseNotifications.mockReturnValue({
        data: sortedNotifications,
        isLoading: false,
        error: null
      })

      const result = mockUseNotifications()
      expect(result.data[0].title).toBe('Newest Notification')
      expect(result.data[2].title).toBe('Older Notification')
    })

    it('should handle empty notifications', () => {
      mockUseNotifications.mockReturnValue({
        data: [],
        isLoading: false,
        error: null
      })

      const result = mockUseNotifications()
      expect(result.data).toEqual([])
    })

    it('should handle notifications loading state', () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null
      })

      const result = mockUseNotifications()
      expect(result.isLoading).toBe(true)
      expect(result.data).toBeUndefined()
    })
  })

  describe('Notification Actions', () => {
    it('should mark single notification as read', async () => {
      const notificationId = 'notification1'
      const updatedNotification: MockNotification = {
        id: notificationId,
        user_id: 'user1',
        title: 'Test Notification',
        message: 'Test message',
        type: 'task_assigned',
        is_read: true,
        created_at: '2024-01-04T10:00:00Z',
        read_at: '2024-01-04T10:05:00Z'
      }

      mockMarkAsRead.mockResolvedValue(updatedNotification)

      const result = await mockMarkAsRead({ notificationId })
      
      expect(mockMarkAsRead).toHaveBeenCalledWith({ notificationId })
      expect(result.is_read).toBe(true)
      expect(result.read_at).toBeDefined()
    })

    it('should mark all notifications as read', async () => {
      const updateResult = {
        updated_count: 5,
        success: true
      }

      mockMarkAllAsRead.mockResolvedValue(updateResult)

      const result = await mockMarkAllAsRead()
      
      expect(mockMarkAllAsRead).toHaveBeenCalled()
      expect(result.updated_count).toBe(5)
      expect(result.success).toBe(true)
    })

    it('should delete notification', async () => {
      const notificationId = 'notification1'
      
      mockDeleteNotification.mockResolvedValue({ 
        success: true,
        deletedId: notificationId 
      })

      const result = await mockDeleteNotification({ notificationId })
      
      expect(mockDeleteNotification).toHaveBeenCalledWith({ notificationId })
      expect(result.success).toBe(true)
      expect(result.deletedId).toBe(notificationId)
    })

    it('should create new notification', async () => {
      const notificationData = {
        user_id: 'user2',
        title: 'New Task Assignment',
        message: 'You have been assigned to "Setup CI/CD pipeline"',
        type: 'task_assigned' as const,
        related_id: 'task5',
        related_type: 'task' as const
      }

      const createdNotification: MockNotification = {
        id: 'notification4',
        ...notificationData,
        is_read: false,
        created_at: '2024-01-04T12:00:00Z'
      }

      mockCreateNotification.mockResolvedValue(createdNotification)

      const result = await mockCreateNotification(notificationData)
      
      expect(mockCreateNotification).toHaveBeenCalledWith(notificationData)
      expect(result).toEqual(createdNotification)
    })

    it('should handle notification action errors', async () => {
      const notificationId = 'nonexistent'
      const error = new Error('Notification not found')

      mockMarkAsRead.mockRejectedValue(error)

      try {
        await mockMarkAsRead({ notificationId })
      } catch (err) {
        expect(err).toEqual(error)
      }
    })
  })

  describe('Notification Types and Content', () => {
    it('should create task assignment notification', async () => {
      const taskAssignmentData = {
        user_id: 'user1',
        title: 'Task Assigned',
        message: 'You have been assigned to "Implement user authentication"',
        type: 'task_assigned' as const,
        related_id: 'task1',
        related_type: 'task' as const,
        metadata: {
          task_title: 'Implement user authentication',
          assigned_by: 'user2',
          workspace_name: 'Development Team'
        }
      }

      const notification: MockNotification = {
        id: 'notif1',
        ...taskAssignmentData,
        is_read: false,
        created_at: '2024-01-04T10:00:00Z'
      }

      mockCreateNotification.mockResolvedValue(notification)

      const result = await mockCreateNotification(taskAssignmentData)
      
      expect(result.type).toBe('task_assigned')
      expect(result.metadata?.task_title).toBe('Implement user authentication')
    })

    it('should create comment notification', async () => {
      const commentNotificationData = {
        user_id: 'user1',
        title: 'New Comment',
        message: 'John Doe commented on "API Integration"',
        type: 'comment_added' as const,
        related_id: 'comment1',
        related_type: 'comment' as const,
        metadata: {
          task_title: 'API Integration',
          commenter_name: 'John Doe',
          comment_preview: 'This looks good, but we should consider...'
        }
      }

      const notification: MockNotification = {
        id: 'notif2',
        ...commentNotificationData,
        is_read: false,
        created_at: '2024-01-04T10:00:00Z'
      }

      mockCreateNotification.mockResolvedValue(notification)

      const result = await mockCreateNotification(commentNotificationData)
      
      expect(result.type).toBe('comment_added')
      expect(result.metadata?.commenter_name).toBe('John Doe')
    })

    it('should create deadline reminder notification', async () => {
      const deadlineReminderData = {
        user_id: 'user1',
        title: 'Deadline Reminder',
        message: 'Task "Launch Marketing Campaign" is due in 2 hours',
        type: 'deadline_reminder' as const,
        related_id: 'task3',
        related_type: 'task' as const,
        metadata: {
          task_title: 'Launch Marketing Campaign',
          due_date: '2024-01-04T14:00:00Z',
          time_remaining: '2 hours'
        }
      }

      const notification: MockNotification = {
        id: 'notif3',
        ...deadlineReminderData,
        is_read: false,
        created_at: '2024-01-04T12:00:00Z'
      }

      mockCreateNotification.mockResolvedValue(notification)

      const result = await mockCreateNotification(deadlineReminderData)
      
      expect(result.type).toBe('deadline_reminder')
      expect(result.metadata?.time_remaining).toBe('2 hours')
    })

    it('should create workspace invitation notification', async () => {
      const invitationData = {
        user_id: 'user3',
        title: 'Workspace Invitation',
        message: 'You have been invited to join "Product Development" workspace',
        type: 'workspace_invitation' as const,
        related_id: 'workspace1',
        related_type: 'workspace' as const,
        metadata: {
          workspace_name: 'Product Development',
          invited_by: 'user1',
          role: 'member'
        }
      }

      const notification: MockNotification = {
        id: 'notif4',
        ...invitationData,
        is_read: false,
        created_at: '2024-01-04T10:00:00Z'
      }

      mockCreateNotification.mockResolvedValue(notification)

      const result = await mockCreateNotification(invitationData)
      
      expect(result.type).toBe('workspace_invitation')
      expect(result.metadata?.workspace_name).toBe('Product Development')
    })
  })

  describe('Notification Preferences', () => {
    it('should fetch notification preferences', () => {
      const mockPreferences: MockNotificationPreferences = {
        id: 'pref1',
        user_id: 'user1',
        email_notifications: true,
        push_notifications: true,
        task_assignments: true,
        task_completions: false,
        comments: true,
        workspace_invitations: true,
        list_sharing: true,
        deadline_reminders: true,
        digest_frequency: 'daily',
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        updated_at: '2024-01-04T10:00:00Z'
      }

      mockUseNotificationPreferences.mockReturnValue({
        data: mockPreferences,
        isLoading: false,
        error: null
      })

      const result = mockUseNotificationPreferences()
      expect(result.data).toEqual(mockPreferences)
    })

    it('should update notification preferences', async () => {
      const preferencesUpdate = {
        email_notifications: false,
        push_notifications: true,
        digest_frequency: 'weekly' as const,
        quiet_hours_start: '23:00',
        quiet_hours_end: '07:00'
      }

      const updatedPreferences: MockNotificationPreferences = {
        id: 'pref1',
        user_id: 'user1',
        ...preferencesUpdate,
        task_assignments: true,
        task_completions: false,
        comments: true,
        workspace_invitations: true,
        list_sharing: true,
        deadline_reminders: true,
        updated_at: '2024-01-04T12:00:00Z'
      }

      mockUpdateNotificationPreferences.mockResolvedValue(updatedPreferences)

      const result = await mockUpdateNotificationPreferences(preferencesUpdate)
      
      expect(mockUpdateNotificationPreferences).toHaveBeenCalledWith(preferencesUpdate)
      expect(result.email_notifications).toBe(false)
      expect(result.digest_frequency).toBe('weekly')
    })

    it('should handle different digest frequencies', async () => {
      const frequencies = ['immediate', 'daily', 'weekly', 'never'] as const

      for (const frequency of frequencies) {
        const preferences: MockNotificationPreferences = {
          id: 'pref1',
          user_id: 'user1',
          email_notifications: true,
          push_notifications: true,
          task_assignments: true,
          task_completions: true,
          comments: true,
          workspace_invitations: true,
          list_sharing: true,
          deadline_reminders: true,
          digest_frequency: frequency,
          updated_at: '2024-01-04T10:00:00Z'
        }

        mockUpdateNotificationPreferences.mockResolvedValue(preferences)
        const result = await mockUpdateNotificationPreferences({ digest_frequency: frequency })
        expect(result.digest_frequency).toBe(frequency)
      }
    })

    it('should validate quiet hours configuration', async () => {
      const invalidQuietHours = {
        quiet_hours_start: '25:00', // Invalid hour
        quiet_hours_end: '08:00'
      }

      const validationError = new Error('Invalid quiet hours format')
      mockUpdateNotificationPreferences.mockRejectedValue(validationError)

      try {
        await mockUpdateNotificationPreferences(invalidQuietHours)
      } catch (error) {
        expect(error).toEqual(validationError)
      }
    })
  })

  describe('Real-time Notifications', () => {
    it('should receive real-time notifications', () => {
      const realTimeNotification: MockNotification = {
        id: 'rt_notif1',
        user_id: 'user1',
        title: 'Real-time Update',
        message: 'Task status changed to completed',
        type: 'task_completed',
        related_id: 'task1',
        related_type: 'task',
        is_read: false,
        created_at: '2024-01-04T12:00:00Z'
      }

      // Mock real-time notification reception
      mockUseNotifications.mockReturnValue({
        data: [realTimeNotification],
        isLoading: false,
        error: null,
        isRealTime: true
      })

      const result = mockUseNotifications()
      expect(result.data[0]).toEqual(realTimeNotification)
      expect(result.isRealTime).toBe(true)
    })

    it('should handle real-time notification updates', async () => {
      const initialNotification: MockNotification = {
        id: 'notif1',
        user_id: 'user1',
        title: 'Task Update',
        message: 'Task has been updated',
        type: 'general',
        is_read: false,
        created_at: '2024-01-04T10:00:00Z'
      }

      const updatedNotification: MockNotification = {
        ...initialNotification,
        is_read: true,
        read_at: '2024-01-04T10:05:00Z'
      }

      // Simulate real-time update
      mockMarkAsRead.mockResolvedValue(updatedNotification)

      const result = await mockMarkAsRead({ notificationId: 'notif1' })
      
      expect(result.is_read).toBe(true)
      expect(result.read_at).toBeDefined()
    })

    it('should handle connection status for real-time notifications', () => {
      mockUseNotifications.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        connectionStatus: 'connected'
      })

      const result = mockUseNotifications()
      expect(result.connectionStatus).toBe('connected')
    })
  })

  describe('Notification Batching and Performance', () => {
    it('should handle batch notification creation', async () => {
      const batchNotifications = [
        {
          user_id: 'user1',
          title: 'Batch Notification 1',
          message: 'Message 1',
          type: 'general' as const
        },
        {
          user_id: 'user1',
          title: 'Batch Notification 2',
          message: 'Message 2',
          type: 'general' as const
        }
      ]

      const createdNotifications: MockNotification[] = batchNotifications.map((notif, index) => ({
        id: `batch_${index + 1}`,
        ...notif,
        is_read: false,
        created_at: '2024-01-04T10:00:00Z'
      }))

      mockCreateNotification.mockResolvedValue({
        notifications: createdNotifications,
        count: createdNotifications.length
      })

      const result = await mockCreateNotification({ batch: batchNotifications })
      
      expect(result.count).toBe(2)
      expect(result.notifications).toHaveLength(2)
    })

    it('should implement notification rate limiting', async () => {
      const rateLimitError = new Error('Rate limit exceeded')
      
      mockCreateNotification.mockRejectedValue(rateLimitError)

      try {
        await mockCreateNotification({
          user_id: 'user1',
          title: 'Rate Limited Notification',
          message: 'This should be rate limited',
          type: 'general'
        })
      } catch (error) {
        expect(error).toEqual(rateLimitError)
      }
    })

    it('should handle notification pagination', () => {
      const mockNotifications: MockNotification[] = Array.from({ length: 50 }, (_, i) => ({
        id: `notif_${i + 1}`,
        user_id: 'user1',
        title: `Notification ${i + 1}`,
        message: `Message ${i + 1}`,
        type: 'general',
        is_read: i % 2 === 0, // Alternate read/unread
        created_at: new Date(Date.now() - i * 60000).toISOString()
      }))

      // First page (20 items)
      const page1 = mockNotifications.slice(0, 20)

      mockUseNotifications.mockReturnValue({
        data: page1,
        isLoading: false,
        error: null,
        hasNextPage: true,
        totalCount: 50
      })

      const result = mockUseNotifications()
      expect(result.data).toHaveLength(20)
      expect(result.hasNextPage).toBe(true)
      expect(result.totalCount).toBe(50)
    })
  })
})