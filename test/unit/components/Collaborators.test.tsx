import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Collaborators from '@/components/tasks/Collaborators'
import * as api from '@/lib/api/taskManagement'

vi.mock('@/lib/api/taskManagement', () => ({
  collaboratorsApi: {
    getByTaskId: vi.fn(),
    add: vi.fn(),
    updateRole: vi.fn(),
    remove: vi.fn(),
  },
}))

vi.mock('@/components/user/UserAvatar', () => ({
  default: ({ userId }: { userId: string }) => <div>Avatar-{userId}</div>,
}))

vi.mock('@/components/user/UserName', () => ({
  default: ({ userId }: { userId: string }) => <div>User-{userId}</div>,
}))

describe('components/tasks/Collaborators', () => {
  describe('Collaborators component', () => {
    const mockCollaborators = [
      {
        id: 'collab-1',
        task_id: 'task-1',
        user_id: 'user-1',
        role: 'owner',
        added_by: 'admin',
        added_at: '2024-01-01',
      },
      {
        id: 'collab-2',
        task_id: 'task-1',
        user_id: 'user-2',
        role: 'assignee',
        added_by: 'admin',
        added_at: '2024-01-02',
      },
    ]

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should render loading state', async () => {
      vi.mocked(api.collaboratorsApi.getByTaskId).mockImplementation(
        () => new Promise(() => {})
      )

      render(<Collaborators taskId="task-1" canManage={true} />)
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should render collaborators list', async () => {
      vi.mocked(api.collaboratorsApi.getByTaskId).mockResolvedValue(mockCollaborators)

      render(<Collaborators taskId="task-1" canManage={true} />)
      
      await waitFor(() => {
        expect(screen.getByText('User-user-1')).toBeInTheDocument()
        expect(screen.getByText('User-user-2')).toBeInTheDocument()
      })
    })

    it('should show empty state when no collaborators', async () => {
      vi.mocked(api.collaboratorsApi.getByTaskId).mockResolvedValue([])

      render(<Collaborators taskId="task-1" canManage={true} />)
      
      await waitFor(() => {
        expect(screen.getByText(/No collaborators/i)).toBeInTheDocument()
      })
    })

    it('should show Add Collaborator button when canManage is true', async () => {
      vi.mocked(api.collaboratorsApi.getByTaskId).mockResolvedValue([])

      render(<Collaborators taskId="task-1" canManage={true} />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Add Collaborator/i })).toBeInTheDocument()
      })
    })

    it('should not show Add Collaborator button when canManage is false', async () => {
      vi.mocked(api.collaboratorsApi.getByTaskId).mockResolvedValue([])

      render(<Collaborators taskId="task-1" canManage={false} />)
      
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Add Collaborator/i })).not.toBeInTheDocument()
      })
    })

    it('should open add dialog when button clicked', async () => {
      vi.mocked(api.collaboratorsApi.getByTaskId).mockResolvedValue([])

      render(<Collaborators taskId="task-1" canManage={true} />)
      
      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /Add Collaborator/i })
        fireEvent.click(addButton)
      })
      
      expect(screen.getByText('Add Collaborator to Task')).toBeInTheDocument()
    })

    it('should add collaborator', async () => {
      const newCollaborator = {
        id: 'collab-3',
        task_id: 'task-1',
        user_id: 'user-3',
        role: 'observer',
        added_by: 'admin',
        added_at: '2024-01-03',
      }
      
      vi.mocked(api.collaboratorsApi.getByTaskId).mockResolvedValue([])
      vi.mocked(api.collaboratorsApi.add).mockResolvedValue(newCollaborator)

      render(<Collaborators taskId="task-1" canManage={true} />)
      
      await waitFor(() => {
        const addButton = screen.getByRole('button', { name: /Add Collaborator/i })
        fireEvent.click(addButton)
      })
      
      const userIdInput = screen.getByPlaceholderText(/Enter user ID/i)
      fireEvent.change(userIdInput, { target: { value: 'user-3' } })
      
      const submitButton = screen.getByRole('button', { name: /Add/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(api.collaboratorsApi.add).toHaveBeenCalledWith({
          task_id: 'task-1',
          user_id: 'user-3',
          role: expect.any(String),
        })
      })
    })

    it('should display role badges', async () => {
      vi.mocked(api.collaboratorsApi.getByTaskId).mockResolvedValue(mockCollaborators)

      render(<Collaborators taskId="task-1" canManage={true} />)
      
      await waitFor(() => {
        expect(screen.getByText('owner')).toBeInTheDocument()
        expect(screen.getByText('assignee')).toBeInTheDocument()
      })
    })

    it('should handle error when loading collaborators', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(api.collaboratorsApi.getByTaskId).mockRejectedValue(new Error('Load failed'))

      render(<Collaborators taskId="task-1" canManage={true} />)
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load collaborators:', expect.any(Error))
      })
      
      consoleSpy.mockRestore()
    })
  })
})
