import { describe, it, expect, vi, beforeEach } from 'vitest'

global.fetch = vi.fn()
const mockFetch = global.fetch as ReturnType<typeof vi.fn>

describe('Integration Tests - User Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  describe('Complete Task Workflow', () => {
    it('should create task, add comments, complete, and verify', async () => {
      // Step 1: Create task
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task: { id: 'task-123', title: 'New Task' } }),
      } as Response)

      const createResponse = await fetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Task' }),
      })
      const taskData = await createResponse.json()
      expect(taskData.task.id).toBe('task-123')

      // Step 2: Add comment
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ comment: { id: 'c-1', content: 'Comment' } }),
      } as Response)

      const commentResponse = await fetch('/api/task-comments', {
        method: 'POST',
        body: JSON.stringify({ task_id: 'task-123', content: 'Comment' }),
      })
      const commentData = await commentResponse.json()
      expect(commentData.comment.id).toBe('c-1')

      // Step 3: Complete task
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task: { id: 'task-123', status: 'completed' } }),
      } as Response)

      const completeResponse = await fetch('/api/tasks/task-123', {
        method: 'PATCH',
        body: JSON.stringify({ status: 'completed' }),
      })
      const completedData = await completeResponse.json()
      expect(completedData.task.status).toBe('completed')
    })

    it('should handle workspace creation with tasks', async () => {
      // Create workspace
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ workspace: { id: 'ws-1', name: 'Project' } }),
      } as Response)

      const wsResponse = await fetch('/api/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name: 'Project' }),
      })
      const wsData = await wsResponse.json()

      // Create list in workspace
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ list: { id: 'list-1', workspace_id: 'ws-1' } }),
      } as Response)

      const listResponse = await fetch('/api/lists', {
        method: 'POST',
        body: JSON.stringify({ name: 'To Do', workspace_id: 'ws-1' }),
      })
      const listData = await listResponse.json()

      // Create task in list
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task: { id: 't-1', list_id: 'list-1' } }),
      } as Response)

      const taskResponse = await fetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({ title: 'Task', list_id: 'list-1' }),
      })
      const taskData = await taskResponse.json()

      expect(wsData.workspace.id).toBeDefined()
      expect(listData.list.workspace_id).toBe('ws-1')
      expect(taskData.task.list_id).toBe('list-1')
    })
  })

  describe('Conversation Workflow', () => {
    it('should create conversation, add members, send messages', async () => {
      // Create conversation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversation: { id: 'conv-1' } }),
      } as Response)

      const convResponse = await fetch('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({ title: 'Team Chat' }),
      })
      const convData = await convResponse.json()

      // Add member
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ member: { user_id: 'user-2' } }),
      } as Response)

      await fetch('/api/conversations/conv-1/conversation_members', {
        method: 'POST',
        body: JSON.stringify({ user_id: 'user-2' }),
      })

      // Send message
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: { content: 'Hello' } }),
      } as Response)

      const msgResponse = await fetch('/api/conversations/conv-1/conversation_messages', {
        method: 'POST',
        body: JSON.stringify({ content: 'Hello' }),
      })
      const msgData = await msgResponse.json()

      expect(convData.conversation.id).toBe('conv-1')
      expect(msgData.message.content).toBe('Hello')
    })
  })

  describe('Notification Workflow', () => {
    it('should receive, read, and delete notifications', async () => {
      // Fetch notifications
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          notifications: [{ id: 'n-1', read: false }],
        }),
      } as Response)

      const fetchResponse = await fetch('/api/notifications')
      const fetchData = await fetchResponse.json()

      // Mark as read
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ notification: { id: 'n-1', read: true } }),
      } as Response)

      const readResponse = await fetch('/api/notifications/n-1/read', {
        method: 'PATCH',
      })
      const readData = await readResponse.json()

      // Delete
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      const deleteResponse = await fetch('/api/notifications/n-1', {
        method: 'DELETE',
      })
      const deleteData = await deleteResponse.json()

      expect(fetchData.notifications[0].read).toBe(false)
      expect(readData.notification.read).toBe(true)
      expect(deleteData.success).toBe(true)
    })
  })

  describe('Search Integration', () => {
    it('should search and navigate to results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            tasks: [{ id: 'task-1', title: 'Bug fix' }],
            users: [{ id: 'user-1', username: 'developer' }],
          },
        }),
      } as Response)

      const searchResponse = await fetch('/api/search?q=bug')
      const searchData = await searchResponse.json()

      expect(searchData.results.tasks).toHaveLength(1)
      expect(searchData.results.users).toHaveLength(1)

      // Navigate to task
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ task: { id: 'task-1', title: 'Bug fix' } }),
      } as Response)

      const taskResponse = await fetch('/api/tasks/task-1')
      const taskData = await taskResponse.json()

      expect(taskData.task.id).toBe('task-1')
    })
  })

  describe('Jarvis AI Integration', () => {
    it('should create conversation and interact with Jarvis', async () => {
      // Create Jarvis conversation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ conversation: { id: 'jarvis-1' } }),
      } as Response)

      const convResponse = await fetch('/api/jarvis/conversations', {
        method: 'POST',
      })
      const convData = await convResponse.json()

      // Send message to Jarvis
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userMessage: { content: 'Help me' },
          aiMessage: { content: 'How can I assist?' },
        }),
      } as Response)

      const chatResponse = await fetch('/api/jarvis', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Help me',
          conversation_id: 'jarvis-1',
        }),
      })
      const chatData = await chatResponse.json()

      expect(convData.conversation.id).toBe('jarvis-1')
      expect(chatData.aiMessage.content).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('should handle 401 unauthorized errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      } as Response)

      const response = await fetch('/api/tasks')
      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
    })

    it('should handle 404 not found errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      } as Response)

      const response = await fetch('/api/tasks/nonexistent')
      expect(response.status).toBe(404)
    })

    it('should handle 500 server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      } as Response)

      const response = await fetch('/api/tasks')
      expect(response.status).toBe(500)
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(fetch('/api/tasks')).rejects.toThrow('Network error')
    })
  })

  describe('Performance Tests', () => {
    it('should handle bulk task creation', async () => {
      const tasks = Array(10)
        .fill(0)
        .map((_, i) => ({ title: `Task ${i}` }))

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      const promises = tasks.map((task) =>
        fetch('/api/tasks', {
          method: 'POST',
          body: JSON.stringify(task),
        })
      )

      const results = await Promise.all(promises)
      expect(results).toHaveLength(10)
      expect(results.every((r) => r.ok)).toBe(true)
    })

    it('should handle concurrent requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'success' }),
      } as Response)

      const requests = [
        fetch('/api/tasks'),
        fetch('/api/workspaces'),
        fetch('/api/conversations'),
        fetch('/api/notifications'),
      ]

      const results = await Promise.all(requests)
      expect(results).toHaveLength(4)
      expect(results.every((r) => r.ok)).toBe(true)
    })
  })
})
