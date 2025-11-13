/**
 * React Query hooks for search functionality
 * Handles search operations with proper caching and debouncing
 * 
 * @module hooks/queries/useSearchQueries
 */
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'
import { SearchService, SearchResult, SearchFilters, SearchResponse } from '@/lib/services/search-service'

// Query keys
export const searchKeys = {
  all: ['search'] as const,
  results: () => [...searchKeys.all, 'results'] as const,
  result: (query: string, filters?: SearchFilters) => [...searchKeys.results(), query, filters] as const,
  suggestions: () => [...searchKeys.all, 'suggestions'] as const,
  suggestion: (query: string) => [...searchKeys.suggestions(), query] as const,
  recent: () => [...searchKeys.all, 'recent'] as const,
}

/**
 * Hook for performing search with React Query
 */
export function useSearch(query: string, filters?: SearchFilters, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: searchKeys.result(query, filters),
    queryFn: () => SearchService.search(query, filters),
    enabled: (options?.enabled ?? true) && query.length >= 2, // Only search if query is at least 2 characters
    staleTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep previous results while loading new ones
  })
}

/**
 * Hook for getting search suggestions
 */
export function useSearchSuggestions(query: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: searchKeys.suggestion(query),
    queryFn: () => SearchService.getSuggestions(query),
    enabled: (options?.enabled ?? true) && query.length >= 1,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for getting recent searches
 */
export function useRecentSearches() {
  return useQuery({
    queryKey: searchKeys.recent(),
    queryFn: SearchService.getRecentSearches,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Hook for saving recent searches
 */
export function useSaveRecentSearch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (query: string) => SearchService.saveRecentSearch(query),
    onSuccess: () => {
      // Invalidate recent searches to refetch updated list
      queryClient.invalidateQueries({ queryKey: searchKeys.recent() })
    },
  })
}

/**
 * Advanced search hook with debouncing and state management
 * This replaces the existing useSearch hook from hooks/useSearch.ts
 */
export function useAdvancedSearch(options: {
  debounceMs?: number
  minQueryLength?: number
  autoSearch?: boolean
} = {}) {
  const { debounceMs = 300, minQueryLength = 2, autoSearch = true } = options
  
  const queryClient = useQueryClient()
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const { mutate: saveRecentSearch } = useSaveRecentSearch()

  // Manual search function with debouncing
  const search = useCallback(async (query: string, filters?: SearchFilters): Promise<SearchResponse | null> => {
    if (query.length < minQueryLength) return null

    // Save to recent searches
    if (query.trim()) {
      saveRecentSearch(query.trim())
    }

    try {
      const result = await SearchService.search(query, filters)
      
      // Cache the result
      queryClient.setQueryData(searchKeys.result(query, filters), result)
      
      return result
    } catch (error) {
      console.error('Search failed:', error)
      throw error
    }
  }, [minQueryLength, queryClient, saveRecentSearch])

  // Debounced search function
  const debouncedSearch = useCallback((query: string, filters?: SearchFilters) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      search(query, filters)
    }, debounceMs)
  }, [debounceMs, search])

  // Get suggestions function
  const getSuggestions = useCallback(async (query: string): Promise<SearchResult[]> => {
    if (query.length < 1) return []

    try {
      const suggestions = await SearchService.getSuggestions(query)
      
      // Cache suggestions
      queryClient.setQueryData(searchKeys.suggestion(query), suggestions)
      
      return suggestions
    } catch (error) {
      console.error('Failed to get suggestions:', error)
      return []
    }
  }, [queryClient])

  // Clear search results
  const clear = useCallback(() => {
    queryClient.removeQueries({ queryKey: searchKeys.results() })
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
  }, [queryClient])

  return {
    search: autoSearch ? debouncedSearch : search,
    getSuggestions,
    clear,
  }
}

/**
 * Hook for getting cached search results
 */
export function useSearchResults(query: string, filters?: SearchFilters) {
  const queryClient = useQueryClient()
  
  return queryClient.getQueryData<SearchResponse>(searchKeys.result(query, filters))
}

/**
 * Hook for getting cached suggestions
 */
export function useCachedSuggestions(query: string) {
  const queryClient = useQueryClient()
  
  return queryClient.getQueryData<SearchResult[]>(searchKeys.suggestion(query))
}