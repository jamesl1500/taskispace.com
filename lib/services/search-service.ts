/**
 * Search service for handling global search across the application
 */

export interface SearchResult {
  id: string
  type: 'user' | 'workspace' | 'task'
  title: string
  subtitle?: string
  description?: string
  url: string
  metadata?: Record<string, unknown>
  score?: number
}

export interface SearchFilters {
  type?: 'user' | 'workspace' | 'task' | 'all'
  workspace_id?: string
  status?: string
  priority?: string
  assignee_id?: string
  limit?: number
  offset?: number
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  filters: SearchFilters
  execution_time: number
}

export class SearchService {
  private static baseUrl = '/api/search'

  /**
   * Perform global search across all entities
   */
  static async search(
    query: string, 
    filters: SearchFilters = {}
  ): Promise<SearchResponse> {
    try {
      const searchParams = new URLSearchParams()
      searchParams.append('q', query)
      
      if (filters.type && filters.type !== 'all') {
        searchParams.append('type', filters.type)
      }
      if (filters.workspace_id) {
        searchParams.append('workspace_id', filters.workspace_id)
      }
      if (filters.status) {
        searchParams.append('status', filters.status)
      }
      if (filters.priority) {
        searchParams.append('priority', filters.priority)
      }
      if (filters.assignee_id) {
        searchParams.append('assignee_id', filters.assignee_id)
      }
      if (filters.limit) {
        searchParams.append('limit', filters.limit.toString())
      }
      if (filters.offset) {
        searchParams.append('offset', filters.offset.toString())
      }

      const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Search error:', error)
      throw error
    }
  }

  /**
   * Search users specifically
   */
  static async searchUsers(
    query: string,
    limit = 10,
    offset = 0
  ): Promise<SearchResponse> {
    return this.search(query, { type: 'user', limit, offset })
  }

  /**
   * Search workspaces specifically
   */
  static async searchWorkspaces(
    query: string,
    limit = 10,
    offset = 0
  ): Promise<SearchResponse> {
    return this.search(query, { type: 'workspace', limit, offset })
  }

  /**
   * Search tasks specifically
   */
  static async searchTasks(
    query: string,
    filters: Omit<SearchFilters, 'type'> = {},
    limit = 10,
    offset = 0
  ): Promise<SearchResponse> {
    return this.search(query, { ...filters, type: 'task', limit, offset })
  }

  /**
   * Get search suggestions/autocomplete
   */
  static async getSuggestions(
    query: string,
    limit = 5
  ): Promise<SearchResult[]> {
    if (query.length < 2) return []
    
    try {
      const response = await this.search(query, { limit })
      return response.results
    } catch (error) {
      console.error('Suggestions error:', error)
      return []
    }
  }

  /**
   * Get recent searches for the current user
   */
  static async getRecentSearches(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/recent`)
      if (!response.ok) return []
      
      const data = await response.json()
      return data.recent_searches || []
    } catch (error) {
      console.error('Recent searches error:', error)
      return []
    }
  }

  /**
   * Save search query to recent searches
   */
  static async saveRecentSearch(query: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/recent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
    } catch (error) {
      console.error('Save recent search error:', error)
    }
  }
}

/**
 * Utility functions for search results
 */
export const SearchUtils = {
  /**
   * Highlight search terms in text
   */
  highlightText(text: string, query: string): string {
    if (!query || !text) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
  },

  /**
   * Format search result for display
   */
  formatResult(result: SearchResult): string {
    switch (result.type) {
      case 'user':
        return `${result.title} - User`
      case 'workspace':
        return `${result.title} - Workspace`
      case 'task':
        return `${result.title} - Task${result.subtitle ? ` in ${result.subtitle}` : ''}`
      default:
        return result.title
    }
  },

  /**
   * Get icon for search result type
   */
  getResultIcon(type: SearchResult['type']): string {
    switch (type) {
      case 'user':
        return 'user'
      case 'workspace':
        return 'briefcase'
      case 'task':
        return 'check-square'
      default:
        return 'search'
    }
  }
}
