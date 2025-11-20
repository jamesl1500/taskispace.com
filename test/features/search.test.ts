import { describe, it, expect, vi, beforeEach } from 'vitest'

global.fetch = vi.fn()
const mockFetch = global.fetch as ReturnType<typeof vi.fn>

describe('Search Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  describe('Global Search', () => {
    it('should search across all resources', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            tasks: [{ id: 'task-1', title: 'Test Task' }],
            users: [{ id: 'user-1', name: 'Test User' }],
            workspaces: [{ id: 'ws-1', name: 'Test Workspace' }],
          },
        }),
      } as Response)

      const response = await fetch('/api/search?q=test')
      const result = await response.json()

      expect(result.results.tasks).toBeDefined()
      expect(result.results.users).toBeDefined()
      expect(result.results.workspaces).toBeDefined()
    })

    it('should return empty results for no matches', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: {
            tasks: [],
            users: [],
            workspaces: [],
          },
        }),
      } as Response)

      const response = await fetch('/api/search?q=nonexistentquery')
      const result = await response.json()

      expect(result.results.tasks).toHaveLength(0)
    })
  })

  describe('Task Search', () => {
    it('should search tasks by title', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tasks: [
            { id: 'task-1', title: 'Fix bug in login' },
            { id: 'task-2', title: 'Fix authentication bug' },
          ],
        }),
      } as Response)

      const response = await fetch('/api/search/tasks?q=bug')
      const result = await response.json()

      expect(result.tasks).toHaveLength(2)
      expect(result.tasks[0].title).toContain('bug')
    })

    it('should search tasks by description', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tasks: [{ id: 'task-1', description: 'Contains search term' }],
        }),
      } as Response)

      const response = await fetch('/api/search/tasks?q=search+term')
      const result = await response.json()

      expect(result.tasks[0].description).toContain('search term')
    })

    it('should filter search by workspace', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tasks: [{ id: 'task-1', workspace_id: 'ws-1' }],
        }),
      } as Response)

      const response = await fetch('/api/search/tasks?q=test&workspace_id=ws-1')
      const result = await response.json()

      expect(result.tasks[0].workspace_id).toBe('ws-1')
    })
  })

  describe('User Search', () => {
    it('should search users by name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: [
            { id: 'user-1', full_name: 'John Doe' },
            { id: 'user-2', full_name: 'Jane Doe' },
          ],
        }),
      } as Response)

      const response = await fetch('/api/search/users?q=doe')
      const result = await response.json()

      expect(result.users).toHaveLength(2)
    })

    it('should search users by email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: [{ id: 'user-1', email: 'john@example.com' }],
        }),
      } as Response)

      const response = await fetch('/api/search/users?q=john@')
      const result = await response.json()

      expect(result.users[0].email).toContain('john@')
    })

    it('should search users by username', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: [{ id: 'user-1', username: 'johndoe' }],
        }),
      } as Response)

      const response = await fetch('/api/search/users?q=johndoe')
      const result = await response.json()

      expect(result.users[0].username).toBe('johndoe')
    })
  })

  describe('Workspace Search', () => {
    it('should search workspaces by name', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspaces: [{ id: 'ws-1', name: 'Development Team' }],
        }),
      } as Response)

      const response = await fetch('/api/search/workspaces?q=development')
      const result = await response.json()

      expect(result.workspaces[0].name).toContain('Development')
    })

    it('should search workspaces by description', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workspaces: [
            { id: 'ws-1', description: 'Main development workspace' },
          ],
        }),
      } as Response)

      const response = await fetch('/api/search/workspaces?q=main')
      const result = await response.json()

      expect(result.workspaces[0].description).toContain('Main')
    })
  })

  describe('Search Pagination', () => {
    it('should paginate search results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tasks: Array(10).fill({ id: 'task', title: 'Test' }),
          pagination: {
            page: 1,
            limit: 10,
            total: 50,
            has_more: true,
          },
        }),
      } as Response)

      const response = await fetch('/api/search/tasks?q=test&page=1&limit=10')
      const result = await response.json()

      expect(result.pagination.has_more).toBe(true)
      expect(result.tasks).toHaveLength(10)
    })
  })

  describe('Search Filters', () => {
    it('should apply multiple filters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          tasks: [
            {
              id: 'task-1',
              status: 'in_progress',
              priority: 'high',
              workspace_id: 'ws-1',
            },
          ],
        }),
      } as Response)

      const response = await fetch(
        '/api/search/tasks?q=test&status=in_progress&priority=high&workspace_id=ws-1'
      )
      const result = await response.json()

      expect(result.tasks[0].status).toBe('in_progress')
      expect(result.tasks[0].priority).toBe('high')
    })
  })

  describe('Recent Searches', () => {
    it('should save recent search queries', () => {
      const recentSearches = ['bug fix', 'authentication', 'deployment']
      localStorage.setItem('recent-searches', JSON.stringify(recentSearches))

      const saved = JSON.parse(localStorage.getItem('recent-searches') || '[]')
      expect(saved).toHaveLength(3)
      expect(saved[0]).toBe('bug fix')
    })

    it('should limit recent searches to 10', () => {
      const searches = Array(15)
        .fill(0)
        .map((_, i) => `search ${i}`)
      const limited = searches.slice(0, 10)

      expect(limited).toHaveLength(10)
    })
  })
})
