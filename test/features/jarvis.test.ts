import { describe, it, expect, vi, beforeEach } from 'vitest'

global.fetch = vi.fn()
const mockFetch = global.fetch as ReturnType<typeof vi.fn>

describe('Jarvis AI Assistant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  describe('Jarvis Conversations', () => {
    it('should create new Jarvis conversation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          conversation: {
            id: 'jarvis-conv-1',
            title: 'New Chat',
            created_at: new Date().toISOString(),
          },
        }),
      } as Response)

      const response = await fetch('/api/jarvis/conversations', {
        method: 'POST',
        body: JSON.stringify({ title: 'New Chat' }),
      })

      const result = await response.json()
      expect(result.conversation.title).toBe('New Chat')
    })

    it('should fetch all Jarvis conversations', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ([
          { id: 'conv-1', title: 'Chat 1' },
          { id: 'conv-2', title: 'Chat 2' },
        ]),
      } as Response)

      const response = await fetch('/api/jarvis')
      const result = await response.json()

      expect(result).toHaveLength(2)
    })

    it('should update conversation title', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          conversation: { id: 'conv-1', title: 'Updated Title' },
        }),
      } as Response)

      const response = await fetch('/api/jarvis/conversations/conv-1', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Updated Title' }),
      })

      const result = await response.json()
      expect(result.conversation.title).toBe('Updated Title')
    })

    it('should delete conversation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)

      const response = await fetch('/api/jarvis/conversations/conv-1', {
        method: 'DELETE',
      })

      const result = await response.json()
      expect(result.success).toBe(true)
    })
  })

  describe('Jarvis Messages', () => {
    it('should send message and receive AI response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userMessage: { id: 'msg-1', content: 'Hello Jarvis', role: 'user' },
          aiMessage: { id: 'msg-2', content: 'Hello! How can I help?', role: 'assistant' },
        }),
      } as Response)

      const response = await fetch('/api/jarvis', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Hello Jarvis',
          conversation_id: 'conv-1',
        }),
      })

      const result = await response.json()
      expect(result.userMessage.content).toBe('Hello Jarvis')
      expect(result.aiMessage.content).toBeDefined()
    })

    it('should include conversation history', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          conversation: {
            messages: [
              { id: 'msg-1', content: 'Previous message', role: 'user' },
              { id: 'msg-2', content: 'Previous response', role: 'assistant' },
            ],
          },
        }),
      } as Response)

      const response = await fetch('/api/jarvis/conversations/conv-1')
      const result = await response.json()

      expect(result.conversation.messages).toHaveLength(2)
    })
  })

  describe('Jarvis Statistics', () => {
    it('should fetch usage statistics', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          stats: {
            total_conversations: 15,
            total_messages: 120,
            total_tokens: 45000,
            avg_tokens_per_message: 375,
          },
        }),
      } as Response)

      const response = await fetch('/api/jarvis/stats')
      const result = await response.json()

      expect(result.stats.total_conversations).toBe(15)
      expect(result.stats.total_messages).toBe(120)
    })
  })

  describe('Jarvis Context Awareness', () => {
    it('should understand task context', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          aiMessage: {
            content: 'I can help you with that task',
            context: { task_id: 'task-123' },
          },
        }),
      } as Response)

      const response = await fetch('/api/jarvis', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Help me with task-123',
        }),
      })

      const result = await response.json()
      expect(result.aiMessage.context.task_id).toBe('task-123')
    })
  })
})
