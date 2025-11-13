import { useState, useCallback, useRef, useEffect } from 'react'
import { SearchService, SearchResult, SearchFilters, SearchResponse } from '@/lib/services/search-service'

export interface UseSearchOptions {
  debounceMs?: number
  minQueryLength?: number
  autoSearch?: boolean
}

export interface UseSearchReturn {
  results: SearchResult[]
  loading: boolean
  error: string | null
  total: number
  executionTime: number
  search: (query: string, filters?: SearchFilters) => Promise<void>
  clear: () => void
  suggestions: SearchResult[]
  getSuggestions: (query: string) => Promise<void>
  recentSearches: string[]
  loadRecentSearches: () => Promise<void>
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
  const {
    debounceMs = 300,
    minQueryLength = 2,
    autoSearch = true
  } = options

  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [executionTime, setExecutionTime] = useState(0)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const lastQueryRef = useRef<string>('')

  const loadRecentSearches = useCallback(async () => {
    try {
      const recent = await SearchService.getRecentSearches()
      setRecentSearches(recent)
    } catch (err) {
      console.error('Failed to load recent searches:', err)
    }
  }, [])

  const search = useCallback(async (query: string, filters: SearchFilters = {}) => {
    if (query.length < minQueryLength) {
      setResults([])
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    lastQueryRef.current = query

    try {
      const response: SearchResponse = await SearchService.search(query, filters)
      
      // Only update if this is still the latest query
      if (lastQueryRef.current === query) {
        setResults(response.results)
        setTotal(response.total)
        setExecutionTime(response.execution_time)
        
        // Save to recent searches if it's a meaningful search
        if (query.length >= 3) {
          await SearchService.saveRecentSearch(query)
          await loadRecentSearches()
        }
      }
    } catch (err) {
      if (lastQueryRef.current === query) {
        setError(err instanceof Error ? err.message : 'Search failed')
        setResults([])
      }
    } finally {
      if (lastQueryRef.current === query) {
        setLoading(false)
      }
    }
  }, [minQueryLength, loadRecentSearches])

  const debouncedSearch = useCallback(async (query: string, filters: SearchFilters = {}) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    return new Promise<void>((resolve) => {
      debounceRef.current = setTimeout(async () => {
        await search(query, filters)
        resolve()
      }, debounceMs)
    })
  }, [search, debounceMs])

  const getSuggestions = useCallback(async (query: string) => {
    if (query.length < minQueryLength) {
      setSuggestions([])
      return
    }

    try {
      const suggestionsData = await SearchService.getSuggestions(query)
      setSuggestions(suggestionsData)
    } catch (err) {
      console.error('Failed to get suggestions:', err)
      setSuggestions([])
    }
  }, [minQueryLength])

  const clear = useCallback(() => {
    setResults([])
    setSuggestions([])
    setError(null)
    setTotal(0)
    setExecutionTime(0)
    lastQueryRef.current = ''
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
  }, [])

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches()
  }, [loadRecentSearches])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return {
    results,
    loading,
    error,
    total,
    executionTime,
    search: autoSearch ? debouncedSearch : search,
    clear,
    suggestions,
    getSuggestions,
    recentSearches,
    loadRecentSearches
  }
}