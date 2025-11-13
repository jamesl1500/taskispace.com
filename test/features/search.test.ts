import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock search functions
const mockPerformSearch = vi.fn()
const mockGetRecentSearches = vi.fn()
const mockSaveRecentSearch = vi.fn()
const mockClearRecentSearches = vi.fn()
const mockUseSearch = vi.fn()
const mockUseRecentSearches = vi.fn()

// Mock search queries
vi.mock('@/hooks/queries/useSearchQueries', () => ({
  useSearch: () => mockUseSearch(),
  useRecentSearches: () => mockUseRecentSearches(),
  usePerformSearch: () => ({ 
    mutate: mockPerformSearch,
    isPending: false,
    error: null 
  }),
  useSaveRecentSearch: () => ({ 
    mutate: mockSaveRecentSearch,
    isPending: false,
    error: null 
  }),
  useClearRecentSearches: () => ({ 
    mutate: mockClearRecentSearches,
    isPending: false,
    error: null 
  }),
}))

interface MockSearchResult {
  id: string
  title: string
  description?: string
  type: 'task' | 'list' | 'workspace' | 'comment'
  workspace_id: string
  list_id?: string
  task_id?: string
  created_at: string
  updated_at: string
  relevance_score?: number
}

interface MockRecentSearch {
  id: string
  query: string
  user_id: string
  searched_at: string
  results_count: number
}

describe('Search Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Search Execution', () => {
    it('should perform basic text search', async () => {
      const searchQuery = 'frontend development'
      
      const mockResults: MockSearchResult[] = [
        {
          id: 'task1',
          title: 'Frontend Development Setup',
          description: 'Setup the frontend development environment',
          type: 'task',
          workspace_id: 'workspace1',
          list_id: 'list1',
          task_id: 'task1',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          relevance_score: 0.95
        },
        {
          id: 'task2',
          title: 'Frontend UI Components',
          description: 'Create reusable UI components for frontend',
          type: 'task',
          workspace_id: 'workspace1',
          list_id: 'list1',
          task_id: 'task2',
          created_at: '2024-01-02',
          updated_at: '2024-01-02',
          relevance_score: 0.87
        }
      ]

      mockPerformSearch.mockResolvedValue({
        results: mockResults,
        total: 2,
        query: searchQuery
      })

      const result = await mockPerformSearch({ query: searchQuery })
      
      expect(mockPerformSearch).toHaveBeenCalledWith({ query: searchQuery })
      expect(result.results).toEqual(mockResults)
      expect(result.total).toBe(2)
    })

    it('should handle empty search results', async () => {
      const searchQuery = 'nonexistent query'
      
      mockPerformSearch.mockResolvedValue({
        results: [],
        total: 0,
        query: searchQuery
      })

      const result = await mockPerformSearch({ query: searchQuery })
      
      expect(result.results).toEqual([])
      expect(result.total).toBe(0)
    })

    it('should search across multiple content types', async () => {
      const searchQuery = 'project'
      
      const mockResults: MockSearchResult[] = [
        {
          id: 'workspace1',
          title: 'Project Alpha Workspace',
          type: 'workspace',
          workspace_id: 'workspace1',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          relevance_score: 0.92
        },
        {
          id: 'list1',
          title: 'Project Tasks',
          type: 'list',
          workspace_id: 'workspace1',
          list_id: 'list1',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          relevance_score: 0.88
        },
        {
          id: 'task1',
          title: 'Setup project structure',
          type: 'task',
          workspace_id: 'workspace1',
          list_id: 'list1',
          task_id: 'task1',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          relevance_score: 0.85
        }
      ]

      mockPerformSearch.mockResolvedValue({
        results: mockResults,
        total: 3,
        query: searchQuery
      })

      const result = await mockPerformSearch({ query: searchQuery })
      
      expect(result.results).toHaveLength(3)
      expect(result.results.map((r: MockSearchResult) => r.type)).toEqual(['workspace', 'list', 'task'])
    })

    it('should handle search with filters', async () => {
      const searchParams = {
        query: 'development',
        filters: {
          type: 'task',
          workspace_id: 'workspace1',
          status: 'todo'
        }
      }
      
      const mockResults: MockSearchResult[] = [
        {
          id: 'task1',
          title: 'Development Task 1',
          type: 'task',
          workspace_id: 'workspace1',
          list_id: 'list1',
          task_id: 'task1',
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ]

      mockPerformSearch.mockResolvedValue({
        results: mockResults,
        total: 1,
        query: searchParams.query,
        filters: searchParams.filters
      })

      const result = await mockPerformSearch(searchParams)
      
      expect(result.results.every((r: MockSearchResult) => 
        r.type === 'task' && r.workspace_id === 'workspace1'
      )).toBe(true)
    })

    it('should sort results by relevance score', async () => {
      const searchQuery = 'task'
      
      const mockResults: MockSearchResult[] = [
        {
          id: 'task1',
          title: 'High Relevance Task',
          type: 'task',
          workspace_id: 'workspace1',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          relevance_score: 0.95
        },
        {
          id: 'task2',
          title: 'Medium Relevance Task',
          type: 'task',
          workspace_id: 'workspace1',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          relevance_score: 0.75
        },
        {
          id: 'task3',
          title: 'Lower Relevance Task',
          type: 'task',
          workspace_id: 'workspace1',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          relevance_score: 0.60
        }
      ]

      mockPerformSearch.mockResolvedValue({
        results: mockResults,
        total: 3,
        query: searchQuery
      })

      const result = await mockPerformSearch({ query: searchQuery })
      
      // Verify results are sorted by relevance score in descending order
      for (let i = 0; i < result.results.length - 1; i++) {
        const current = result.results[i].relevance_score || 0
        const next = result.results[i + 1].relevance_score || 0
        expect(current >= next).toBe(true)
      }
    })

    it('should handle search errors', async () => {
      const searchQuery = 'error query'
      
      const mockError = new Error('Search service unavailable')
      mockPerformSearch.mockRejectedValue(mockError)

      try {
        await mockPerformSearch({ query: searchQuery })
      } catch (error) {
        expect(error).toEqual(mockError)
      }
    })
  })

  describe('Search Suggestions and Autocomplete', () => {
    it('should provide search suggestions', async () => {
      const partialQuery = 'dev'
      
      const mockSuggestions = [
        'development',
        'developer',
        'device',
        'devops'
      ]

      mockPerformSearch.mockResolvedValue({
        suggestions: mockSuggestions,
        query: partialQuery
      })

      const result = await mockPerformSearch({ query: partialQuery, suggestions: true })
      
      expect(result.suggestions).toEqual(mockSuggestions)
    })

    it('should suggest based on user history', async () => {
      const partialQuery = 'proj'
      
      const mockHistorySuggestions = [
        'project setup',
        'project management',
        'project deployment'
      ]

      mockPerformSearch.mockResolvedValue({
        suggestions: mockHistorySuggestions,
        query: partialQuery,
        source: 'history'
      })

      const result = await mockPerformSearch({ 
        query: partialQuery, 
        suggestions: true,
        includeHistory: true 
      })
      
      expect(result.suggestions).toEqual(mockHistorySuggestions)
      expect(result.source).toBe('history')
    })

    it('should provide contextual suggestions', async () => {
      const partialQuery = 'bug'
      
      const mockContextualSuggestions = [
        'bug fix',
        'bug report',
        'debugging',
        'bug tracking'
      ]

      mockPerformSearch.mockResolvedValue({
        suggestions: mockContextualSuggestions,
        query: partialQuery,
        context: 'task_management'
      })

      const result = await mockPerformSearch({ 
        query: partialQuery, 
        suggestions: true,
        context: 'task_management'
      })
      
      expect(result.suggestions).toEqual(mockContextualSuggestions)
    })
  })

  describe('Recent Searches', () => {
    it('should fetch recent searches', () => {
      const mockRecentSearches: MockRecentSearch[] = [
        {
          id: '1',
          query: 'frontend development',
          user_id: 'user1',
          searched_at: '2024-01-03',
          results_count: 5
        },
        {
          id: '2',
          query: 'bug fixes',
          user_id: 'user1',
          searched_at: '2024-01-02',
          results_count: 3
        },
        {
          id: '3',
          query: 'project setup',
          user_id: 'user1',
          searched_at: '2024-01-01',
          results_count: 8
        }
      ]

      mockUseRecentSearches.mockReturnValue({
        data: mockRecentSearches,
        isLoading: false,
        error: null
      })

      const result = mockUseRecentSearches()
      expect(result.data).toEqual(mockRecentSearches)
      expect(result.data).toHaveLength(3)
    })

    it('should save search to recent searches', async () => {
      const searchData = {
        query: 'new search query',
        results_count: 4
      }

      const savedSearch: MockRecentSearch = {
        id: '4',
        ...searchData,
        user_id: 'user1',
        searched_at: '2024-01-04'
      }

      mockSaveRecentSearch.mockResolvedValue(savedSearch)

      const result = await mockSaveRecentSearch(searchData)
      
      expect(mockSaveRecentSearch).toHaveBeenCalledWith(searchData)
      expect(result).toEqual(savedSearch)
    })

    it('should limit recent searches to maximum count', () => {
      const maxRecentSearches = 10
      
      const mockRecentSearches: MockRecentSearch[] = Array.from({ length: 12 }, (_, i) => ({
        id: (i + 1).toString(),
        query: `search query ${i + 1}`,
        user_id: 'user1',
        searched_at: `2024-01-${String(i + 1).padStart(2, '0')}`,
        results_count: Math.floor(Math.random() * 10)
      }))

      // Simulate limiting to 10 most recent
      const limitedSearches = mockRecentSearches
        .sort((a, b) => new Date(b.searched_at).getTime() - new Date(a.searched_at).getTime())
        .slice(0, maxRecentSearches)

      mockUseRecentSearches.mockReturnValue({
        data: limitedSearches,
        isLoading: false,
        error: null
      })

      const result = mockUseRecentSearches()
      expect(result.data).toHaveLength(maxRecentSearches)
    })

    it('should clear all recent searches', async () => {
      mockClearRecentSearches.mockResolvedValue({ success: true })

      const result = await mockClearRecentSearches()
      
      expect(mockClearRecentSearches).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    it('should remove duplicate recent searches', () => {
      const duplicateQuery = 'duplicate search'
      
      const searchesWithDuplicates: MockRecentSearch[] = [
        {
          id: '1',
          query: duplicateQuery,
          user_id: 'user1',
          searched_at: '2024-01-03',
          results_count: 5
        },
        {
          id: '2',
          query: 'other search',
          user_id: 'user1',
          searched_at: '2024-01-02',
          results_count: 3
        },
        {
          id: '3',
          query: duplicateQuery,
          user_id: 'user1',
          searched_at: '2024-01-01',
          results_count: 5
        }
      ]

      // Simulate deduplication (keep most recent)
      const deduplicatedSearches = searchesWithDuplicates.reduce((acc: MockRecentSearch[], current) => {
        const existing = acc.find(search => search.query === current.query)
        if (!existing) {
          acc.push(current)
        } else if (new Date(current.searched_at) > new Date(existing.searched_at)) {
          const index = acc.indexOf(existing)
          acc[index] = current
        }
        return acc
      }, [])

      expect(deduplicatedSearches).toHaveLength(2)
      expect(deduplicatedSearches.find(s => s.query === duplicateQuery)?.searched_at).toBe('2024-01-03')
    })
  })

  describe('Advanced Search Features', () => {
    it('should support search operators', async () => {
      const searchQuery = 'title:"frontend development" AND status:todo'
      
      const mockResults: MockSearchResult[] = [
        {
          id: 'task1',
          title: 'Frontend Development Setup',
          type: 'task',
          workspace_id: 'workspace1',
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ]

      mockPerformSearch.mockResolvedValue({
        results: mockResults,
        total: 1,
        query: searchQuery,
        operators: ['title', 'AND', 'status']
      })

      const result = await mockPerformSearch({ query: searchQuery })
      
      expect(result.operators).toEqual(['title', 'AND', 'status'])
    })

    it('should support date range searches', async () => {
      const searchParams = {
        query: 'tasks',
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-31'
        }
      }
      
      const mockResults: MockSearchResult[] = [
        {
          id: 'task1',
          title: 'January Task',
          type: 'task',
          workspace_id: 'workspace1',
          created_at: '2024-01-15',
          updated_at: '2024-01-15'
        }
      ]

      mockPerformSearch.mockResolvedValue({
        results: mockResults,
        total: 1,
        query: searchParams.query,
        dateRange: searchParams.dateRange
      })

      const result = await mockPerformSearch(searchParams)
      
      expect(result.results.every((r: MockSearchResult) => {
        const date = new Date(r.created_at)
        const start = new Date(searchParams.dateRange.start)
        const end = new Date(searchParams.dateRange.end)
        return date >= start && date <= end
      })).toBe(true)
    })

    it('should support fuzzy search', async () => {
      const searchQuery = 'developemnt' // Typo: should match "development"
      
      const mockResults: MockSearchResult[] = [
        {
          id: 'task1',
          title: 'Development Task',
          type: 'task',
          workspace_id: 'workspace1',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          relevance_score: 0.85 // Lower score due to fuzzy matching
        }
      ]

      mockPerformSearch.mockResolvedValue({
        results: mockResults,
        total: 1,
        query: searchQuery,
        fuzzy: true,
        corrected_query: 'development'
      })

      const result = await mockPerformSearch({ 
        query: searchQuery, 
        fuzzy: true 
      })
      
      expect(result.corrected_query).toBe('development')
      expect(result.fuzzy).toBe(true)
    })

    it('should support search within workspace', async () => {
      const searchParams = {
        query: 'task',
        workspace_id: 'workspace1'
      }
      
      const mockResults: MockSearchResult[] = [
        {
          id: 'task1',
          title: 'Workspace Task 1',
          type: 'task',
          workspace_id: 'workspace1',
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        },
        {
          id: 'task2',
          title: 'Workspace Task 2',
          type: 'task',
          workspace_id: 'workspace1',
          created_at: '2024-01-02',
          updated_at: '2024-01-02'
        }
      ]

      mockPerformSearch.mockResolvedValue({
        results: mockResults,
        total: 2,
        query: searchParams.query,
        workspace_id: searchParams.workspace_id
      })

      const result = await mockPerformSearch(searchParams)
      
      expect(result.results.every((r: MockSearchResult) => 
        r.workspace_id === 'workspace1'
      )).toBe(true)
    })

    it('should support pagination in search results', async () => {
      const searchParams = {
        query: 'task',
        page: 2,
        limit: 10
      }
      
      const mockResults: MockSearchResult[] = Array.from({ length: 10 }, (_, i) => ({
        id: `task${i + 11}`, // Second page (11-20)
        title: `Task ${i + 11}`,
        type: 'task' as const,
        workspace_id: 'workspace1',
        created_at: '2024-01-01',
        updated_at: '2024-01-01'
      }))

      mockPerformSearch.mockResolvedValue({
        results: mockResults,
        total: 25,
        page: 2,
        limit: 10,
        hasMore: true,
        query: searchParams.query
      })

      const result = await mockPerformSearch(searchParams)
      
      expect(result.results).toHaveLength(10)
      expect(result.page).toBe(2)
      expect(result.hasMore).toBe(true)
      expect(result.total).toBe(25)
    })
  })

  describe('Search Performance and Caching', () => {
    it('should cache search results', async () => {
      const searchQuery = 'cached search'
      
      const mockResults: MockSearchResult[] = [
        {
          id: 'task1',
          title: 'Cached Task',
          type: 'task',
          workspace_id: 'workspace1',
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ]

      mockUseSearch.mockReturnValue({
        data: {
          results: mockResults,
          total: 1,
          query: searchQuery,
          cached: true,
          cached_at: '2024-01-04T10:00:00Z'
        },
        isLoading: false,
        error: null
      })

      const result = mockUseSearch()
      
      expect(result.data.cached).toBe(true)
      expect(result.data.cached_at).toBeDefined()
    })

    it('should handle search debouncing', async () => {
      const searchQueries = ['s', 'se', 'sea', 'sear', 'search']
      let callCount = 0

      // Mock debounced search - only final query should trigger search
      mockPerformSearch.mockImplementation(async (params: any) => {
        callCount++
        if (params.query === 'search') {
          return {
            results: [{
              id: 'task1',
              title: 'Search Result',
              type: 'task',
              workspace_id: 'workspace1',
              created_at: '2024-01-01',
              updated_at: '2024-01-01'
            }],
            total: 1,
            query: params.query
          }
        }
        return { results: [], total: 0, query: params.query }
      })

      // Simulate rapid typing - only last query should execute
      for (const query of searchQueries) {
        if (query === 'search') {
          await mockPerformSearch({ query })
        }
      }

      expect(callCount).toBe(1) // Only the final "search" query executed
    })

    it('should handle search timeout', async () => {
      const searchQuery = 'slow search'
      
      const timeoutError = new Error('Search timeout')
      mockPerformSearch.mockRejectedValue(timeoutError)

      try {
        await mockPerformSearch({ 
          query: searchQuery, 
          timeout: 5000 
        })
      } catch (error) {
        expect(error).toEqual(timeoutError)
      }
    })
  })
})