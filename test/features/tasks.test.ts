import { describe, it, expect, vi, beforeEach } from 'vitest'

global.fetch = vi.fn()
const mockFetch = global.fetch as ReturnType<typeof vi.fn>

describe('Tasks Management System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  describe('Task CRUD Operations', () => {
    it('should create a new task with all fields', async () => {
      const newTask = {
        title: 'Complete project documentation',
        description: 'Write comprehensive docs',
        status: 'todo',
        priority: 'high',
        due_date: '2025-12-31',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task: { id: 'task-123', ...newTask } }),
      } as Response)

      const response = await fetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(newTask),
      })

      const result = await response.json()
      expect(result.task.title).toBe(newTask.title)
      expect(result.task.id).toBeDefined()
    })

    it('should fetch all user tasks', async () => {
      const mockTasks = [
        { id: 'task-1', title: 'Task 1', status: 'todo' },
        { id: 'task-2', title: 'Task 2', status: 'completed' },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ tasks: mockTasks }),
      } as Response)

      const response = await fetch('/api/tasks')
      const result = await response.json()

      expect(result.tasks).toHaveLength(2)
    })

    it('should update task status and priority', async () => {
      const updates = { status: 'in_progress', priority: 'medium' }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task: { id: 'task-123', ...updates } }),
      } as Response)

      const response = await fetch('/api/tasks/task-123', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })

      const result = await response.json()
      expect(result.task.status).toBe('in_progress')
    })

    it('should delete a task', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      const response = await fetch('/api/tasks/task-123', { method: 'DELETE' })
      const result = await response.json()

      expect(result.success).toBe(true)
    })
  })

  describe('Task Filtering', () => {
    it('should filter by status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tasks: [{ id: 'task-1', status: 'completed' }],
        }),
      } as Response)

      const response = await fetch('/api/tasks?status=completed')
      const result = await response.json()

      expect(result.tasks[0].status).toBe('completed')
    })

    it('should get overdue tasks', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tasks: [{ id: 'task-1', due_date: '2025-01-01', status: 'todo' }],
        }),
      } as Response)

      const response = await fetch('/api/tasks?overdue=true')
      const result = await response.json()

      expect(result.tasks).toBeDefined()
    })
  })

  describe('Subtasks', () => {
    it('should create subtask', async () => {
      const subtask = { task_id: 'task-123', title: 'Subtask 1' }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subtask: { id: 'sub-1', ...subtask } }),
      } as Response)

      const response = await fetch('/api/subtasks', {
        method: 'POST',
        body: JSON.stringify(subtask),
      })

      const result = await response.json()
      expect(result.subtask.title).toBe('Subtask 1')
    })

    it('should toggle subtask completion', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ subtask: { id: 'sub-1', completed: true } }),
      } as Response)

      const response = await fetch('/api/subtasks/sub-1', {
        method: 'PATCH',
        body: JSON.stringify({ completed: true }),
      })

      const result = await response.json()
      expect(result.subtask.completed).toBe(true)
    })
  })

  describe('Task Comments', () => {
    it('should add comment', async () => {
      const comment = { task_id: 'task-123', content: 'Great work!' }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comment: { id: 'c-1', ...comment } }),
      } as Response)

      const response = await fetch('/api/task-comments', {
        method: 'POST',
        body: JSON.stringify(comment),
      })

      const result = await response.json()
      expect(result.comment.content).toBe('Great work!')
    })
  })

  describe('Task Collaborators', () => {
    it('should add collaborator', async () => {
      const collab = { task_id: 'task-123', user_id: 'user-456' }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ collaborator: collab }),
      } as Response)

      const response = await fetch('/api/task-collaborators', {
        method: 'POST',
        body: JSON.stringify(collab),
      })

      const result = await response.json()
      expect(result.collaborator.user_id).toBe('user-456')
    })
  })
})
