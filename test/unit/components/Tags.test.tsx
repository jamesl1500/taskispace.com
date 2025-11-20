import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Tags from '@/components/tasks/Tags'
import * as queries from '@/hooks/queries/useTaskManagementQueries'

vi.mock('@/hooks/queries/useTaskManagementQueries', () => ({
  useTaskTags: vi.fn(),
  useWorkspaceTags: vi.fn(),
  useAddTaskTag: vi.fn(),
  useRemoveTaskTag: vi.fn(),
}))

describe('components/tasks/Tags', () => {
  describe('Tags component', () => {
    const mockTaskTags = [
      { id: 'tag-1', name: 'Bug', color: '#EF4444', workspace_id: 'ws-1', created_at: '2024-01-01', task_tag_id: 'tt-1' },
      { id: 'tag-2', name: 'Feature', color: '#10B981', workspace_id: 'ws-1', created_at: '2024-01-02', task_tag_id: 'tt-2' },
    ]

    const mockWorkspaceTags = [
      { id: 'tag-1', name: 'Bug', color: '#EF4444', workspace_id: 'ws-1', created_at: '2024-01-01' },
      { id: 'tag-2', name: 'Feature', color: '#10B981', workspace_id: 'ws-1', created_at: '2024-01-02' },
      { id: 'tag-3', name: 'Documentation', color: '#3B82F6', workspace_id: 'ws-1', created_at: '2024-01-03' },
    ]

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should render loading state', () => {
      vi.mocked(queries.useTaskTags).mockReturnValue({
        data: [],
        isLoading: true,
      } as any)
      vi.mocked(queries.useWorkspaceTags).mockReturnValue({
        data: [],
        isLoading: true,
      } as any)
      vi.mocked(queries.useAddTaskTag).mockReturnValue({ mutateAsync: vi.fn() } as any)
      vi.mocked(queries.useRemoveTaskTag).mockReturnValue({ mutate: vi.fn() } as any)

      render(<Tags taskId="task-1" workspaceId="ws-1" canEdit={true} />)
      
      expect(screen.getByText('Loading tags...')).toBeInTheDocument()
    })

    it('should render task tags', () => {
      vi.mocked(queries.useTaskTags).mockReturnValue({
        data: mockTaskTags,
        isLoading: false,
      } as any)
      vi.mocked(queries.useWorkspaceTags).mockReturnValue({
        data: mockWorkspaceTags,
        isLoading: false,
      } as any)
      vi.mocked(queries.useAddTaskTag).mockReturnValue({ mutateAsync: vi.fn() } as any)
      vi.mocked(queries.useRemoveTaskTag).mockReturnValue({ mutate: vi.fn() } as any)

      render(<Tags taskId="task-1" workspaceId="ws-1" canEdit={true} />)
      
      expect(screen.getByText('Bug')).toBeInTheDocument()
      expect(screen.getByText('Feature')).toBeInTheDocument()
    })

    it('should show empty state when no tags', () => {
      vi.mocked(queries.useTaskTags).mockReturnValue({
        data: [],
        isLoading: false,
      } as any)
      vi.mocked(queries.useWorkspaceTags).mockReturnValue({
        data: mockWorkspaceTags,
        isLoading: false,
      } as any)
      vi.mocked(queries.useAddTaskTag).mockReturnValue({ mutateAsync: vi.fn() } as any)
      vi.mocked(queries.useRemoveTaskTag).mockReturnValue({ mutate: vi.fn() } as any)

      render(<Tags taskId="task-1" workspaceId="ws-1" canEdit={true} />)
      
      expect(screen.getByText(/No tags yet/i)).toBeInTheDocument()
    })

    it('should show Add Tag button when canEdit is true', () => {
      vi.mocked(queries.useTaskTags).mockReturnValue({
        data: [],
        isLoading: false,
      } as any)
      vi.mocked(queries.useWorkspaceTags).mockReturnValue({
        data: mockWorkspaceTags,
        isLoading: false,
      } as any)
      vi.mocked(queries.useAddTaskTag).mockReturnValue({ mutateAsync: vi.fn() } as any)
      vi.mocked(queries.useRemoveTaskTag).mockReturnValue({ mutate: vi.fn() } as any)

      render(<Tags taskId="task-1" workspaceId="ws-1" canEdit={true} />)
      
      expect(screen.getByRole('button', { name: /Add Tag/i })).toBeInTheDocument()
    })

    it('should not show Add Tag button when canEdit is false', () => {
      vi.mocked(queries.useTaskTags).mockReturnValue({
        data: [],
        isLoading: false,
      } as any)
      vi.mocked(queries.useWorkspaceTags).mockReturnValue({
        data: mockWorkspaceTags,
        isLoading: false,
      } as any)
      vi.mocked(queries.useAddTaskTag).mockReturnValue({ mutateAsync: vi.fn() } as any)
      vi.mocked(queries.useRemoveTaskTag).mockReturnValue({ mutate: vi.fn() } as any)

      render(<Tags taskId="task-1" workspaceId="ws-1" canEdit={false} />)
      
      expect(screen.queryByRole('button', { name: /Add Tag/i })).not.toBeInTheDocument()
    })

    it('should open add tag dialog', () => {
      vi.mocked(queries.useTaskTags).mockReturnValue({
        data: [],
        isLoading: false,
      } as any)
      vi.mocked(queries.useWorkspaceTags).mockReturnValue({
        data: mockWorkspaceTags,
        isLoading: false,
      } as any)
      vi.mocked(queries.useAddTaskTag).mockReturnValue({ mutateAsync: vi.fn() } as any)
      vi.mocked(queries.useRemoveTaskTag).mockReturnValue({ mutate: vi.fn() } as any)

      render(<Tags taskId="task-1" workspaceId="ws-1" canEdit={true} />)
      
      const addButton = screen.getByRole('button', { name: /Add Tag/i })
      fireEvent.click(addButton)
      
      expect(screen.getByText('Add Tag to Task')).toBeInTheDocument()
    })

    it('should add existing tag', async () => {
      const mockMutateAsync = vi.fn().mockResolvedValue({})
      vi.mocked(queries.useTaskTags).mockReturnValue({
        data: [],
        isLoading: false,
      } as any)
      vi.mocked(queries.useWorkspaceTags).mockReturnValue({
        data: mockWorkspaceTags,
        isLoading: false,
      } as any)
      vi.mocked(queries.useAddTaskTag).mockReturnValue({ mutateAsync: mockMutateAsync } as any)
      vi.mocked(queries.useRemoveTaskTag).mockReturnValue({ mutate: vi.fn() } as any)

      render(<Tags taskId="task-1" workspaceId="ws-1" canEdit={true} />)
      
      const addButton = screen.getByRole('button', { name: /Add Tag/i })
      fireEvent.click(addButton)
      
      // Select existing tag from dropdown (mocked interaction)
      const submitButton = screen.getByRole('button', { name: /Add$/i })
      fireEvent.click(submitButton)
      
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled()
      })
    })

    it('should remove tag', async () => {
      const mockMutate = vi.fn()
      vi.mocked(queries.useTaskTags).mockReturnValue({
        data: mockTaskTags,
        isLoading: false,
      } as any)
      vi.mocked(queries.useWorkspaceTags).mockReturnValue({
        data: mockWorkspaceTags,
        isLoading: false,
      } as any)
      vi.mocked(queries.useAddTaskTag).mockReturnValue({ mutateAsync: vi.fn() } as any)
      vi.mocked(queries.useRemoveTaskTag).mockReturnValue({ mutate: mockMutate } as any)

      render(<Tags taskId="task-1" workspaceId="ws-1" canEdit={true} />)
      
      // Find and click remove button for first tag
      const removeButtons = screen.getAllByRole('button', { name: '' })
      fireEvent.click(removeButtons[0])
      
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith('tt-1')
      })
    })

    it('should display tag colors', () => {
      vi.mocked(queries.useTaskTags).mockReturnValue({
        data: mockTaskTags,
        isLoading: false,
      } as any)
      vi.mocked(queries.useWorkspaceTags).mockReturnValue({
        data: mockWorkspaceTags,
        isLoading: false,
      } as any)
      vi.mocked(queries.useAddTaskTag).mockReturnValue({ mutateAsync: vi.fn() } as any)
      vi.mocked(queries.useRemoveTaskTag).mockReturnValue({ mutate: vi.fn() } as any)

      render(<Tags taskId="task-1" workspaceId="ws-1" canEdit={true} />)
      
      const bugTag = screen.getByText('Bug').closest('span')
      const featureTag = screen.getByText('Feature').closest('span')
      
      expect(bugTag).toHaveStyle({ backgroundColor: expect.stringContaining('EF4444') })
      expect(featureTag).toHaveStyle({ backgroundColor: expect.stringContaining('10B981') })
    })
  })
})
