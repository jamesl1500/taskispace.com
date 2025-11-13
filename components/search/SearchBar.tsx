import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, Clock, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useSearch } from '@/hooks/useSearch'

interface SearchBarProps {
  placeholder?: string
  className?: string
}

export function SearchBar({ placeholder = "Search workspaces, tasks...", className = "" }: SearchBarProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const {
    results,
    loading,
    search,
    clear,
    suggestions,
    getSuggestions,
    recentSearches
  } = useSearch({ debounceMs: 200, minQueryLength: 1 })

  // Handle input change
  const handleInputChange = (value: string) => {
    setQuery(value)
    if (value.length >= 1) {
      getSuggestions(value)
      setOpen(true)
    } else {
      setOpen(false)
      clear()
    }
  }

  // Handle search submission
  const handleSearch = async () => {
    if (query.trim().length >= 2) {
      await search(query.trim())
      setOpen(true)
    }
  }

  // Handle result selection
  const handleSelectResult = (url: string) => {
    router.push(url)
    setQuery('')
    setOpen(false)
    clear()
    inputRef.current?.blur()
  }

  // Handle recent search selection
  const handleSelectRecentSearch = (recentQuery: string) => {
    setQuery(recentQuery)
    search(recentQuery)
    setOpen(true)
  }

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      
      // Escape to close
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close on outside click
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Small delay to allow result clicks to process
      setTimeout(() => {
        if (!open) {
          setQuery('')
          clear()
        }
      }, 100)
    }
  }

  const hasResults = results.length > 0
  const hasSuggestions = suggestions.length > 0
  const hasRecentSearches = recentSearches.length > 0 && query.length === 0

  return (
    <div className={`relative ${className}`}>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSearch()
                }
              }}
              className="pl-10 pr-10 w-full min-w-[300px] md:min-w-[400px]"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 h-6 w-6 p-0 -translate-y-1/2"
                onClick={() => {
                  setQuery('')
                  setOpen(false)
                  clear()
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              ⌘K
            </div>
          </div>
        </PopoverTrigger>
        
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
              </div>
            )}

            {/* Recent searches */}
            {hasRecentSearches && !loading && (
              <div className="p-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Recent searches</h4>
                {recentSearches.slice(0, 3).map((recentQuery, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectRecentSearch(recentQuery)}
                    className="flex items-center gap-2 w-full p-2 text-left hover:bg-accent rounded-md"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{recentQuery}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Search results */}
            {hasResults && !loading && (
              <div className="p-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Results ({results.length})
                </h4>
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectResult(result.url)}
                    className="flex items-center justify-between w-full p-3 text-left hover:bg-accent rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {result.type === 'workspace' && (
                          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium">W</span>
                          </div>
                        )}
                        {result.type === 'task' && (
                          <div className="w-8 h-8 rounded-md bg-blue-500/10 flex items-center justify-center">
                            <span className="text-xs font-medium">T</span>
                          </div>
                        )}
                        {result.type === 'user' && (
                          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                            <span className="text-xs font-medium">U</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{result.title}</p>
                          <Badge variant="secondary" className="text-xs">
                            {result.type}
                          </Badge>
                        </div>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            {result.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {hasSuggestions && !hasResults && !loading && query.length > 0 && (
              <div className="p-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Suggestions</h4>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSelectResult(suggestion.url)}
                    className="flex items-center gap-2 w-full p-2 text-left hover:bg-accent rounded-md"
                  >
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{suggestion.title}</span>
                    <Badge variant="outline" className="text-xs ml-auto">
                      {suggestion.type}
                    </Badge>
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {!hasResults && !hasSuggestions && !hasRecentSearches && !loading && query.length > 0 && (
              <div className="py-6 text-center px-4">
                <Search className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No results found for &ldquo;{query}&rdquo;
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try searching for workspaces, tasks, or use different keywords
                </p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}