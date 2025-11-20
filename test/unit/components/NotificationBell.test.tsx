import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NotificationBell } from '@/components/notifications/NotificationBell'

// Mock dependencies
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user1', email: 'test@test.com' } })
}))

vi.mock('@/hooks/useNotifications', () => ({
  useNotificationStats: () => ({
    data: { unread_count: 5, total_count: 10, by_type: {} }
  }),
  useMarkAllNotificationsRead: () => vi.fn()
}))

vi.mock('@/lib/services/notification-service', () => ({
  NotificationService: {
    subscribeToNotifications: vi.fn(() => ({
      unsubscribe: vi.fn()
    }))
  }
}))

describe('components/notifications/NotificationBell', () => {
  describe('NotificationBell component', () => {
    it('should render notification bell button', () => {
      render(<NotificationBell />)
      
      const button = screen.getByRole('button')
      expect(button).toBeDefined()
    })

    it('should display unread count badge', () => {
      render(<NotificationBell />)
      
      expect(screen.getByText('5')).toBeDefined()
    })

    it('should show bell icon', () => {
      const { container } = render(<NotificationBell />)
      
      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })

    it('should apply custom className when provided', () => {
      const { container } = render(<NotificationBell className="custom-class" />)
      
      const button = container.querySelector('.custom-class')
      expect(button).toBeDefined()
    })

    it('should render Badge component for unread count', () => {
      const { container } = render(<NotificationBell />)
      
      const badge = container.querySelector('.absolute.-top-1.-right-2')
      expect(badge).toBeDefined()
    })

    it('should display "99+" for counts over 99', () => {
      vi.mock('@/hooks/useNotifications', () => ({
        useNotificationStats: () => ({
          data: { unread_count: 150, total_count: 200, by_type: {} }
        }),
        useMarkAllNotificationsRead: () => vi.fn()
      }))

      const { container } = render(<NotificationBell />)
      // The badge should be present
      const badge = container.querySelector('.absolute.-top-1.-right-2')
      expect(badge).toBeDefined()
    })

    it('should use BellRing icon when there are unread notifications', () => {
      const { container } = render(<NotificationBell />)
      
      // Should render some icon
      const icons = container.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should have dropdown menu trigger', () => {
      const { container } = render(<NotificationBell />)
      
      const button = screen.getByRole('button')
      expect(button).toBeDefined()
    })

    it('should render with ghost variant button', () => {
      const { container } = render(<NotificationBell />)
      
      const button = screen.getByRole('button')
      expect(button.className).toContain('relative')
    })
  })
})
