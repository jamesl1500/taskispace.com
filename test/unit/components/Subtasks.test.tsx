import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import Subtasks from '@/components/tasks/Subtasks'
import * as queries from '@/hooks/queries/useTaskManagementQueries'

vi.mock('@/hooks/queries/useTaskManagementQueries', () => ({
  useSubtasks: vi.fn(),
  useCreateSubtask: vi.fn(),
  useUpdateSubtask: vi.fn(),
  useDeleteSubtask: vi.fn(),
}))

describe('components/tasks/Subtasks', () => {
  describe('Subtasks component', () => {
    const mockSubtasks = [
      { id: 'sub-1', task_id: 'task-1', title: 'Subtask 1', completed: false, description: 'Description 1' },
      { id: 'sub-2', task_id: 'task-1', title: 'Subtask 2', completed: true, description: 'Description 2' },
    ]

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should render loading state', () => {
      vi.mocked(queries.useSubtasks).mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      } as any)
      vi.mocked(queries.useCreateSubtask).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(queries.useUpdateSubtask).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(queries.useDeleteSubtask).mockReturnValue({ mutate: vi.fn() } as any)

      render(<Subtasks taskId="task-1" canEdit={true} />)
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should render empty state when no subtasks', () => {
      vi.mocked(queries.useSubtasks).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(queries.useCreateSubtask).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(queries.useUpdateSubtask).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(queries.useDeleteSubtask).mockReturnValue({ mutate: vi.fn() } as any)

      render(<Subtasks taskId="task-1" canEdit={true} />)
      
      expect(screen.getByText('No subtasks yet.')).toBeInTheDocument()
    })

    it('should render subtasks list', () => {
      vi.mocked(queries.useSubtasks).mockReturnValue({
        data: mockSubtasks,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(queries.useCreateSubtask).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(queries.useUpdateSubtask).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(queries.useDeleteSubtask).mockReturnValue({ mutate: vi.fn() } as any)

      render(<Subtasks taskId="task-1" canEdit={true} />)
      
      expect(screen.getByText('Subtask 1')).toBeInTheDocument()
      expect(screen.getByText('Subtask 2')).toBeInTheDocument()
    })

    it('should show completion badge', () => {
      vi.mocked(queries.useSubtasks).mockReturnValue({
        data: mockSubtasks,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(queries.useCreateSubtask).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(queries.useUpdateSubtask).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(queries.useDeleteSubtask).mockReturnValue({ mutate: vi.fn() } as any)

      render(<Subtasks taskId="task-1" canEdit={true} />)
      
      expect(screen.getByText('1/2')).toBeInTheDocument()
    })

    it('should open create dialog when Add Subtask clicked', () => {
      vi.mocked(queries.useSubtasks).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(queries.useCreateSubtask).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(queries.useUpdateSubtask).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(queries.useDeleteSubtask).mockReturnValue({ mutate: vi.fn() } as any)

      render(<Subtasks taskId="task-1" canEdit={true} />)
      
      const addButton = screen.getByRole('button', { name: /Add Subtask/i })
      fireEvent.click(addButton)
      
      expect(screen.getByText('Create New Subtask')).toBeInTheDocument()
    })

    it('should handle subtask toggle', async () => {
      const mockMutate = vi.fn()
      vi.mocked(queries.useSubtasks).mockReturnValue({
        data: mockSubtasks,
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(queries.useCreateSubtask).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(queries.useUpdateSubtask).mockReturnValue({ mutate: mockMutate } as any)
      vi.mocked(queries.useDeleteSubtask).mockReturnValue({ mutate: vi.fn() } as any)

      render(<Subtasks taskId="task-1" canEdit={true} />)
      
      const checkboxes = screen.getAllByRole('checkbox')
      fireEvent.click(checkboxes[0])
      
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled()
      })
    })

    it('should not show Add Subtask button when canEdit is false', () => {
      vi.mocked(queries.useSubtasks).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(queries.useCreateSubtask).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(queries.useUpdateSubtask).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(queries.useDeleteSubtask).mockReturnValue({ mutate: vi.fn() } as any)

      render(<Subtasks taskId="task-1" canEdit={false} />)
      
      expect(screen.queryByRole('button', { name: /Add Subtask/i })).not.toBeInTheDocument()
    })

    it('should handle error state', () => {
      vi.mocked(queries.useSubtasks).mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error('Failed to load'),
      } as any)
      vi.mocked(queries.useCreateSubtask).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(queries.useUpdateSubtask).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(queries.useDeleteSubtask).mockReturnValue({ mutate: vi.fn() } as any)

      render(<Subtasks taskId="task-1" canEdit={true} />)
      
      expect(screen.getByText(/Failed to load subtasks/i)).toBeInTheDocument()
    })

    it('should create new subtask', async () => {
      const mockMutate = vi.fn((data, options) => {
        options?.onSuccess?.()
      })
      vi.mocked(queries.useSubtasks).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any)
      vi.mocked(queries.useCreateSubtask).mockReturnValue({ mutate: mockMutate } as any)
      vi.mocked(queries.useUpdateSubtask).mockReturnValue({ mutate: vi.fn() } as any)
      vi.mocked(queries.useDeleteSubtask).mockReturnValue({ mutate: vi.fn() } as any)

      render(<Subtasks taskId="task-1" canEdit={true} />)
      
      const addButton = screen.getByRole('button', { name: /Add Subtask/i })
      fireEvent.click(addButton)
      
      const titleInput = screen.getByPlaceholderText(/Enter subtask title/i)
      fireEvent.change(titleInput, { target: { value: 'New Subtask' } })
      
      const createButton = screen.getByRole('button', { name: /Create Subtask/i })
      fireEvent.click(createButton)
      
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            task_id: 'task-1',
            title: 'New Subtask',
          }),
          expect.any(Object)
        )
      })
    })
  })
})
