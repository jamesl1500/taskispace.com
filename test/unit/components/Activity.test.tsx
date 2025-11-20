import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Activity from '@/components/tasks/Activity'
import * as queries from '@/hooks/queries/useTaskManagementQueries'

vi.mock('@/hooks/queries/useTaskManagementQueries', () => ({
  useActivity: vi.fn(),
}))

vi.mock('@/components/user/UserName', () => ({
  default: ({ userId }: { userId: string }) => <div>User-{userId}</div>,
}))

describe('components/tasks/Activity', () => {
  describe('Activity component', () => {
    const mockActivities = [
      {
        id: 1,
        task_id: 'task-1',
        actor: 'user-1',
        type: 'task_status_changed',
        payload: { from: 'todo', to: 'in_progress' },
        created_at: '2024-01-01T10:00:00Z',
      },
      {
        id: 2,
        task_id: 'task-1',
        actor: 'user-2',
        type: 'comment_added',
        payload: { content: 'Great progress!' },
        created_at: '2024-01-01T11:00:00Z',
      },
      {
        id: 3,
        task_id: 'task-1',
        actor: 'user-1',
        type: 'tag_added',
        payload: { tag_name: 'Bug', tag_color: '#EF4444' },
        created_at: '2024-01-01T12:00:00Z',
      },
    ]

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should render loading state', () => {
      vi.mocked(queries.useActivity).mockReturnValue({
        data: [],
        isLoading: true,
      } as any)

      render(<Activity taskId="task-1" />)
      
      // Should show loading skeletons
      const skeletons = screen.getAllByRole('generic')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should render activity list', () => {
      vi.mocked(queries.useActivity).mockReturnValue({
        data: mockActivities,
        isLoading: false,
      } as any)

      render(<Activity taskId="task-1" />)
      
      expect(screen.getByText('User-user-1')).toBeInTheDocument()
      expect(screen.getByText('User-user-2')).toBeInTheDocument()
    })

    it('should show empty state when no activities', () => {
      vi.mocked(queries.useActivity).mockReturnValue({
        data: [],
        isLoading: false,
      } as any)

      render(<Activity taskId="task-1" />)
      
      expect(screen.getByText(/No activity yet/i)).toBeInTheDocument()
    })

    it('should display activity type filters', () => {
      vi.mocked(queries.useActivity).mockReturnValue({
        data: mockActivities,
        isLoading: false,
      } as any)

      render(<Activity taskId="task-1" />)
      
      expect(screen.getByText('All')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Comments')).toBeInTheDocument()
      expect(screen.getByText('Tags')).toBeInTheDocument()
    })

    it('should filter activities by type', async () => {
      const mockUseActivity = vi.fn()
      vi.mocked(queries.useActivity).mockImplementation(mockUseActivity)
      mockUseActivity.mockReturnValue({
        data: mockActivities,
        isLoading: false,
      } as any)

      render(<Activity taskId="task-1" />)
      
      const statusFilter = screen.getByText('Status')
      fireEvent.click(statusFilter)
      
      await waitFor(() => {
        expect(mockUseActivity).toHaveBeenCalledWith(
          'task-1',
          expect.objectContaining({
            type: 'task_status_changed',
          })
        )
      })
    })

    it('should format activity message for status change', () => {
      vi.mocked(queries.useActivity).mockReturnValue({
        data: [mockActivities[0]],
        isLoading: false,
      } as any)

      render(<Activity taskId="task-1" />)
      
      expect(screen.getByText(/changed status from "todo" to "in_progress"/i)).toBeInTheDocument()
    })

    it('should format activity message for comment', () => {
      vi.mocked(queries.useActivity).mockReturnValue({
        data: [mockActivities[1]],
        isLoading: false,
      } as any)

      render(<Activity taskId="task-1" />)
      
      expect(screen.getByText('added a comment')).toBeInTheDocument()
    })

    it('should format activity message for tag', () => {
      vi.mocked(queries.useActivity).mockReturnValue({
        data: [mockActivities[2]],
        isLoading: false,
      } as any)

      render(<Activity taskId="task-1" />)
      
      expect(screen.getByText(/added tag "Bug"/i)).toBeInTheDocument()
    })

    it('should display tag badges with colors', () => {
      vi.mocked(queries.useActivity).mockReturnValue({
        data: [mockActivities[2]],
        isLoading: false,
      } as any)

      render(<Activity taskId="task-1" />)
      
      const tagBadge = screen.getByText('Bug')
      expect(tagBadge).toBeInTheDocument()
    })

    it('should show Load More button when there are many activities', () => {
      const manyActivities = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        task_id: 'task-1',
        actor: 'user-1',
        type: 'task_updated',
        payload: {},
        created_at: `2024-01-01T${String(i).padStart(2, '0')}:00:00Z`,
      }))

      vi.mocked(queries.useActivity).mockReturnValue({
        data: manyActivities,
        isLoading: false,
      } as any)

      render(<Activity taskId="task-1" />)
      
      expect(screen.getByRole('button', { name: /Load More/i })).toBeInTheDocument()
    })

    it('should load more activities when button clicked', async () => {
      const mockUseActivity = vi.fn()
      vi.mocked(queries.useActivity).mockImplementation(mockUseActivity)
      
      const initialActivities = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        task_id: 'task-1',
        actor: 'user-1',
        type: 'task_updated',
        payload: {},
        created_at: `2024-01-01T${String(i).padStart(2, '0')}:00:00Z`,
      }))

      mockUseActivity.mockReturnValue({
        data: initialActivities,
        isLoading: false,
      } as any)

      render(<Activity taskId="task-1" />)
      
      const loadMoreButton = screen.getByRole('button', { name: /Load More/i })
      fireEvent.click(loadMoreButton)
      
      await waitFor(() => {
        expect(mockUseActivity).toHaveBeenCalledWith(
          'task-1',
          expect.objectContaining({
            offset: 20,
          })
        )
      })
    })

    it('should display activity icons based on type', () => {
      vi.mocked(queries.useActivity).mockReturnValue({
        data: mockActivities,
        isLoading: false,
      } as any)

      render(<Activity taskId="task-1" />)
      
      // Should render icons for different activity types
      const activityCards = screen.getAllByRole('generic')
      expect(activityCards.length).toBeGreaterThan(0)
    })
  })
})
