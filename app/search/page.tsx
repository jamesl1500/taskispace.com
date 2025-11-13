'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { Search, Filter, Calendar, User, Briefcase, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchService, SearchResult } from '@/lib/services/search-service'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams?.get('q') || '')
  const [typeFilter, setTypeFilter] = useState(searchParams?.get('type') || 'all')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [executionTime, setExecutionTime] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(10)

  const performSearch = useCallback(async (searchQuery: string, page = 1) => {
    if (!searchQuery.trim()) {
      setResults([])
      setTotal(0)
      return
    }

    setLoading(true)
    try {
      const response = await SearchService.search(searchQuery, {
        type: typeFilter === 'all' ? undefined : (typeFilter as 'user' | 'workspace' | 'task'),
        limit,
        offset: (page - 1) * limit
      })

      setResults(response.results)
      setTotal(response.total)
      setExecutionTime(response.execution_time)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }, [typeFilter, limit])

  useEffect(() => {
    const initialQuery = searchParams?.get('q')
    if (initialQuery) {
      setQuery(initialQuery)
      performSearch(initialQuery)
    }
  }, [searchParams, performSearch])

  const handleSearch = () => {
    setCurrentPage(1)
    performSearch(query, 1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    performSearch(query, page)
  }

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'workspace':
        return <Briefcase className="h-4 w-4" />
      case 'task':
        return <CheckSquare className="h-4 w-4" />
      case 'user':
        return <User className="h-4 w-4" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString()
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="space-y-6">
        {/* Search Header */}
        <div className="flex flex-col space-y-4">
          <h1 className="text-2xl font-bold">Search</h1>
          
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search workspaces, tasks..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="workspace">Workspaces</SelectItem>
                <SelectItem value="task">Tasks</SelectItem>
                <SelectItem value="user">Users</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>

        {/* Search Results */}
        {query && (
          <>
            {/* Results Summary */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {total > 0 
                  ? `Found ${total} result${total !== 1 ? 's' : ''} for "${query}"`
                  : `No results found for "${query}"`
                }
                {executionTime > 0 && ` (${executionTime}ms)`}
              </p>
              
              {totalPages > 1 && (
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
              )}
            </div>

            {/* Results List */}
            <div className="space-y-4">
              {results.map((result) => (
                <Card key={result.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          {getResultIcon(result.type)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-medium truncate">
                            <a 
                              href={result.url}
                              className="hover:text-primary transition-colors"
                            >
                              {result.title}
                            </a>
                          </h3>
                          <Badge variant="secondary">
                            {result.type}
                          </Badge>
                        </div>
                        
                        {result.subtitle && (
                          <p className="text-sm text-muted-foreground mb-1">
                            {result.subtitle}
                          </p>
                        )}
                        
                        {result.description && (
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {result.description}
                          </p>
                        )}
                        
                        {/* Metadata */}
                        {result.metadata && (
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {result.metadata.created_at && typeof result.metadata.created_at === 'string' && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(result.metadata.created_at as string)}
                              </div>
                            )}
                            
                            {result.metadata.status && typeof result.metadata.status === 'string' && (
                              <Badge variant="outline" className="text-xs">
                                {result.metadata.status}
                              </Badge>
                            )}
                            
                            {result.metadata.priority && typeof result.metadata.priority === 'string' && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  result.metadata.priority === 'high' ? 'border-red-200 text-red-700' :
                                  result.metadata.priority === 'medium' ? 'border-yellow-200 text-yellow-700' :
                                  'border-green-200 text-green-700'
                                }`}
                              >
                                {result.metadata.priority}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  Previous
                </Button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i
                  if (page > totalPages) return null
                  
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  )
                })}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next
                </Button>
              </div>
            )}

            {/* No Results */}
            {!loading && query && results.length === 0 && (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <Search className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-lg font-medium">No results found</h3>
                      <p className="text-muted-foreground mt-1">
                        Try adjusting your search terms or filters
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Getting Started */}
        {!query && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Search TaskiSpace
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Search across your workspaces, tasks, and team members. Use the search bar above to get started.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Briefcase className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium">Workspaces</h4>
                  <p className="text-sm text-muted-foreground">Find your projects and teams</p>
                </div>
                
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <CheckSquare className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium">Tasks</h4>
                  <p className="text-sm text-muted-foreground">Locate specific tasks and todos</p>
                </div>
                
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <User className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium">Team Members</h4>
                  <p className="text-sm text-muted-foreground">Connect with colleagues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}