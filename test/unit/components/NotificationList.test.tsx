import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { NotificationList } from '@/components/notifications/NotificationList'
import * as hooks from '@/hooks/useNotifications'

vi.mock('@/hooks/useNotifications', () => ({
  useNotifications: vi.fn(),
  useMarkNotificationRead: vi.fn(),
  useMarkNotificationUnread: vi.fn(),
  useDeleteNotification: vi.fn(),
}))

vi.mock('@/components/user/UserAvatar', () => ({
  default: ({ userId }: { userId: string }) => <div>Avatar-{userId}</div>,
}))

describe('components/notifications/NotificationList', () => {
  describe('NotificationList component', () => {
    const mockNotifications = [
      {
        id: 'notif-1',
        user_id: 'user-1',
        type: 'task_assigned',
        title: 'Task assigned',
        message: 'You have been assigned to Task 1',
        read: false,
        created_at: '2024-01-01T10:00:00Z',
        triggered_by: 'user-2',
        triggered_by_profile: {
          user_name: 'john_doe',
          display_name: 'John Doe',
          avatar_url: null,
        },
      },
      {
        id: 'notif-2',
        user_id: 'user-1',
        type: 'task_comment',
        title: 'New comment',
        message: 'Jane commented on your task',
        read: true,
        created_at: '2024-01-01T09:00:00Z',
        triggered_by: 'user-3',
        triggered_by_profile: {
          user_name: 'jane_doe',
          display_name: 'Jane Doe',
          avatar_url: null,
        },
      },
    ]

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should render loading state', () => {
      vi.mocked(hooks.useNotifications).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any)
      vi.mocked(hooks.useMarkNotificationRead).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(hooks.useMarkNotificationUnread).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(hooks.useDeleteNotification).mockReturnValue({ mutate: vi.fn() } as any)

      render(<NotificationList />)
      
      // Should show skeleton loaders
      const skeletons = screen.getAllByRole('generic')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should render notifications list', () => {
      vi.mocked(hooks.useNotifications).mockReturnValue({
        data: mockNotifications,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(hooks.useMarkNotificationRead).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(hooks.useMarkNotificationUnread).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(hooks.useDeleteNotification).mockReturnValue({ mutate: vi.fn() } as any)

      render(<NotificationList />)
      
      expect(screen.getByText('Task assigned')).toBeInTheDocument()
      expect(screen.getByText('New comment')).toBeInTheDocument()
    })

    it('should show empty state when no notifications', () => {
      vi.mocked(hooks.useNotifications).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(hooks.useMarkNotificationRead).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(hooks.useMarkNotificationUnread).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(hooks.useDeleteNotification).mockReturnValue({ mutate: vi.fn() } as any)

      render(<NotificationList />)
      
      expect(screen.getByText(/No notifications/i)).toBeInTheDocument()
    })

    it('should mark notification as read', async () => {
      const mockMarkRead = vi.fn()
      vi.mocked(hooks.useNotifications).mockReturnValue({
        data: mockNotifications,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(hooks.useMarkNotificationRead).mockReturnValue({ mutate: mockMarkRead } as any)
      vi.mocked(hooks.useMarkNotificationUnread).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(hooks.useDeleteNotification).mockReturnValue({ mutate: vi.fn() } as any)

      render(<NotificationList showActions={true} />)
      
      const markReadButtons = screen.getAllByRole('button', { name: /Mark as read/i })
      fireEvent.click(markReadButtons[0])
      
      await waitFor(() => {
        expect(mockMarkRead).toHaveBeenCalledWith('notif-1')
      })
    })

    it('should mark notification as unread', async () => {
      const mockMarkUnread = vi.fn()
      vi.mocked(hooks.useNotifications).mockReturnValue({
        data: mockNotifications,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(hooks.useMarkNotificationRead).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(hooks.useMarkNotificationUnread).mockReturnValue({ mutate: mockMarkUnread } as any)
      vi.mocked(hooks.useDeleteNotification).mockReturnValue({ mutate: vi.fn() } as any)

      render(<NotificationList showActions={true} />)
      
      const markUnreadButtons = screen.getAllByRole('button', { name: /Mark as unread/i })
      fireEvent.click(markUnreadButtons[0])
      
      await waitFor(() => {
        expect(mockMarkUnread).toHaveBeenCalledWith('notif-2')
      })
    })

    it('should delete notification', async () => {
      const mockDelete = vi.fn()
      vi.mocked(hooks.useNotifications).mockReturnValue({
        data: mockNotifications,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(hooks.useMarkNotificationRead).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(hooks.useMarkNotificationUnread).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(hooks.useDeleteNotification).mockReturnValue({ mutate: mockDelete } as any)

      render(<NotificationList showActions={true} />)
      
      const deleteButtons = screen.getAllByRole('button', { name: /Delete/i })
      fireEvent.click(deleteButtons[0])
      
      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith('notif-1')
      })
    })

    it('should not show action buttons when showActions is false', () => {
      vi.mocked(hooks.useNotifications).mockReturnValue({
        data: mockNotifications,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(hooks.useMarkNotificationRead).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(hooks.useMarkNotificationUnread).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(hooks.useDeleteNotification).mockReturnValue({ mutate: vi.fn() } as any)

      render(<NotificationList showActions={false} />)
      
      expect(screen.queryByRole('button', { name: /Mark as read/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Delete/i })).not.toBeInTheDocument()
    })

    it('should display unread badge for unread notifications', () => {
      vi.mocked(hooks.useNotifications).mockReturnValue({
        data: mockNotifications,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(hooks.useMarkNotificationRead).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(hooks.useMarkNotificationUnread).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(hooks.useDeleteNotification).mockReturnValue({ mutate: vi.fn() } as any)

      render(<NotificationList />)
      
      const unreadNotif = screen.getByText('Task assigned').closest('div')
      expect(unreadNotif).toHaveClass(/unread/i)
    })

    it('should display correct icon for each notification type', () => {
      vi.mocked(hooks.useNotifications).mockReturnValue({
        data: mockNotifications,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(hooks.useMarkNotificationRead).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(hooks.useMarkNotificationUnread).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(hooks.useDeleteNotification).mockReturnValue({ mutate: vi.fn() } as any)

      render(<NotificationList />)
      
      // Icons are rendered for each notification type
      const icons = screen.getAllByRole('img', { hidden: true })
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should format relative time correctly', () => {
      vi.mocked(hooks.useNotifications).mockReturnValue({
        data: mockNotifications,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(hooks.useMarkNotificationRead).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(hooks.useMarkNotificationUnread).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(hooks.useDeleteNotification).mockReturnValue({ mutate: vi.fn() } as any)

      render(<NotificationList />)
      
      // date-fns formatDistanceToNow should be used
      const timeElements = screen.getAllByText(/ago/i)
      expect(timeElements.length).toBeGreaterThan(0)
    })

    it('should handle error state', () => {
      vi.mocked(hooks.useNotifications).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load'),
      } as any)
      vi.mocked(hooks.useMarkNotificationRead).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(hooks.useMarkNotificationUnread).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(hooks.useDeleteNotification).mockReturnValue({ mutate: vi.fn() } as any)

      render(<NotificationList />)
      
      expect(screen.getByText(/Failed to load/i)).toBeInTheDocument()
    })

    it('should limit notifications based on limit prop', () => {
      const manyNotifications = Array.from({ length: 50 }, (_, i) => ({
        id: `notif-${i}`,
        user_id: 'user-1',
        type: 'task_assigned',
        title: `Task ${i}`,
        message: `Message ${i}`,
        read: false,
        created_at: '2024-01-01T10:00:00Z',
        triggered_by: 'user-2',
      }))

      vi.mocked(hooks.useNotifications).mockReturnValue({
        data: manyNotifications.slice(0, 10),
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(hooks.useMarkNotificationRead).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(hooks.useMarkNotificationUnread).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(hooks.useDeleteNotification).mockReturnValue({ mutate: vi.fn() } as any)

      render(<NotificationList limit={10} />)
      
      const notifications = screen.getAllByText(/Task \d+/)
      expect(notifications.length).toBe(10)
    })
  })
})
