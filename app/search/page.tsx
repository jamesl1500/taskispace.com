'use client'

import { useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, User, Briefcase, CheckSquare, Clock } from 'lucide-react'
import Link from 'next/link'
import { useSearch } from '@/hooks/queries/useSearchQueries'

function SearchPageContent() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams?.get('q') || '')
  const [typeFilter, setTypeFilter] = useState(searchParams?.get('type') || 'all')
  const [limit] = useState(10)

  // Use React Query for search
  const { 
    data: searchResponse,
    isLoading: loading,
    error
  } = useSearch(query, {
    type: typeFilter === 'all' ? undefined : (typeFilter as 'user' | 'workspace' | 'task'),
    limit,
  }, {
    enabled: query.length >= 2
  })

  const results = searchResponse?.results || []
  const total = searchResponse?.total || 0
  const executionTime = searchResponse?.execution_time || 0

  const handleSearch = useCallback(() => {
    // Search is automatically triggered by React Query when query changes
  }, [])

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User className="h-4 w-4" />
      case 'workspace':
        return <Briefcase className="h-4 w-4" />
      case 'task':
        return <CheckSquare className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getResultBadgeColor = (type: string) => {
    switch (type) {
      case 'user':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'workspace':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'task':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Search
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Search across your workspaces, tasks, and more
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Search Query</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Enter your search query..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="workspace">Workspaces</SelectItem>
                  <SelectItem value="task">Tasks</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleSearch} disabled={loading || query.length < 2}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {error && (
          <Card className="mb-6">
            <CardContent className="py-6">
              <div className="text-center text-red-600 dark:text-red-400">
                Error performing search: {error.message}
              </div>
            </CardContent>
          </Card>
        )}

        {query.length < 2 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Start Searching
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Enter at least 2 characters to begin searching.
              </p>
            </CardContent>
          </Card>
        )}

        {query.length >= 2 && !loading && results.length === 0 && !error && (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No Results Found
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                No results found for &quot;{query}&quot;. Try adjusting your search terms.
              </p>
            </CardContent>
          </Card>
        )}

        {loading && (
          <Card>
            <CardContent className="py-12">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {results.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Found {total} results in {executionTime}ms
              </p>
            </div>

            <div className="space-y-4">
              {results.map((result) => (
                <Card key={`${result.type}-${result.id}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getResultIcon(result.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <Link 
                            href={result.url}
                            className="font-semibold text-slate-900 dark:text-white hover:text-primary transition-colors"
                          >
                            {result.title}
                          </Link>
                          <Badge className={getResultBadgeColor(result.type)}>
                            {result.type}
                          </Badge>
                        </div>
                        
                        {result.subtitle && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                            {result.subtitle}
                          </p>
                        )}
                        
                        {result.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                            {result.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-2 mt-2 text-xs text-slate-500 dark:text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>Score: {result.score}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  )
}