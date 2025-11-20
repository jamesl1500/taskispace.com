import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SearchService } from '@/lib/services/search-service'
import type { SearchFilters, SearchResponse } from '@/lib/services/search-service'

// Mock global fetch
global.fetch = vi.fn()

describe('lib/services/search-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('SearchService', () => {
    it('should perform global search', async () => {
      const mockResponse: SearchResponse = {
        results: [
          { id: '1', type: 'task', title: 'Task 1', url: '/tasks/1' }
        ],
        total: 1,
        query: 'test',
        filters: {},
        execution_time: 100
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })

      const result = await SearchService.search('test')
      
      expect(result).toBeDefined()
      expect(result.results).toHaveLength(1)
      expect(result.query).toBe('test')
      expect(global.fetch).toHaveBeenCalled()
    })

    it('should search with filters', async () => {
      const mockResponse: SearchResponse = {
        results: [],
        total: 0,
        query: 'test',
        filters: { type: 'task', workspace_id: 'ws1' },
        execution_time: 50
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })

      const filters: SearchFilters = {
        type: 'task',
        workspace_id: 'ws1',
        status: 'todo',
        priority: 'high'
      }

      const result = await SearchService.search('test', filters)
      
      expect(result).toBeDefined()
      expect(result.filters).toMatchObject({ type: 'task', workspace_id: 'ws1' })
    })

    it('should search users specifically', async () => {
      const mockResponse: SearchResponse = {
        results: [
          { id: 'u1', type: 'user', title: 'John Doe', url: '/profiles/john' }
        ],
        total: 1,
        query: 'john',
        filters: { type: 'user' },
        execution_time: 75
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })

      const result = await SearchService.searchUsers('john')
      
      expect(result).toBeDefined()
      expect(result.results[0].type).toBe('user')
      expect(global.fetch).toHaveBeenCalled()
    })

    it('should search workspaces specifically', async () => {
      const mockResponse: SearchResponse = {
        results: [
          { id: 'ws1', type: 'workspace', title: 'My Workspace', url: '/workspaces/ws1' }
        ],
        total: 1,
        query: 'workspace',
        filters: { type: 'workspace' },
        execution_time: 60
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      })

      const result = await SearchService.searchWorkspaces('workspace')
      
      expect(result).toBeDefined()
      expect(result.results[0].type).toBe('workspace')
    })

    it('should handle search errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Internal Server Error'
      })

      await expect(
        SearchService.search('test')
      ).rejects.toThrow('Search failed: Internal Server Error')
    })

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

      await expect(
        SearchService.search('test')
      ).rejects.toThrow('Network error')
    })

    it('should build correct query parameters', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ results: [], total: 0, query: 'test', filters: {}, execution_time: 0 })
      })

      const filters: SearchFilters = {
        type: 'task',
        workspace_id: 'ws1',
        status: 'in_progress',
        priority: 'high',
        assignee_id: 'user1',
        limit: 20,
        offset: 10
      }

      await SearchService.search('test query', filters)
      
      expect(global.fetch).toHaveBeenCalled()
      const callArg = (global.fetch as any).mock.calls[0][0]
      expect(callArg).toContain('q=test+query')
      expect(callArg).toContain('type=task')
      expect(callArg).toContain('workspace_id=ws1')
      expect(callArg).toContain('limit=20')
      expect(callArg).toContain('offset=10')
    })

    it('should handle pagination parameters', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ results: [], total: 0, query: 'test', filters: {}, execution_time: 0 })
      })

      await SearchService.searchUsers('john', 25, 50)
      
      const callArg = (global.fetch as any).mock.calls[0][0]
      expect(callArg).toContain('limit=25')
      expect(callArg).toContain('offset=50')
    })
  })
})
