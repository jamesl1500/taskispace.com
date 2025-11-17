'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Filter, 
  X,
  Calendar,
  Flag,
  CheckCircle2
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface DashboardFiltersProps {
  onFilterChange?: (filters: DashboardFilter) => void
}

export interface DashboardFilter {
  search?: string
  status?: string[]
  priority?: string[]
  dateRange?: 'today' | 'week' | 'month' | 'all'
}

export function DashboardFilters({ onFilterChange }: DashboardFiltersProps) {
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string[]>([])
  const [selectedPriority, setSelectedPriority] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<DashboardFilter['dateRange']>('all')

  const statusOptions = [
    { value: 'todo', label: 'To Do', color: 'bg-gray-500' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-500' },
    { value: 'in_review', label: 'In Review', color: 'bg-yellow-500' },
    { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  ]

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-500' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
    { value: 'high', label: 'High', color: 'bg-red-500' },
  ]

  const dateRangeOptions = [
    { value: 'today' as const, label: 'Today' },
    { value: 'week' as const, label: 'This Week' },
    { value: 'month' as const, label: 'This Month' },
    { value: 'all' as const, label: 'All Time' },
  ]

  const toggleStatus = (status: string) => {
    setSelectedStatus(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  const togglePriority = (priority: string) => {
    setSelectedPriority(prev => 
      prev.includes(priority) 
        ? prev.filter(p => p !== priority)
        : [...prev, priority]
    )
  }

  const clearFilters = () => {
    setSearch('')
    setSelectedStatus([])
    setSelectedPriority([])
    setDateRange('all')
    onFilterChange?.({})
  }

  const applyFilters = () => {
    onFilterChange?.({
      search: search || undefined,
      status: selectedStatus.length > 0 ? selectedStatus : undefined,
      priority: selectedPriority.length > 0 ? selectedPriority : undefined,
      dateRange,
    })
  }

  const hasActiveFilters = search || selectedStatus.length > 0 || selectedPriority.length > 0 || dateRange !== 'all'

  return (
    <Card className="mb-6 p-0">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks, workspaces, conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {(selectedStatus.length + selectedPriority.length + (dateRange !== 'all' ? 1 : 0)) || ''}
                </Badge>
              )}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="space-y-4 pt-4 border-t">
              {/* Status Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Status
                </div>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map(option => (
                    <Badge
                      key={option.value}
                      variant={selectedStatus.includes(option.value) ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer transition-all hover:scale-105',
                        selectedStatus.includes(option.value) && option.color
                      )}
                      onClick={() => toggleStatus(option.value)}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Flag className="h-4 w-4" />
                  Priority
                </div>
                <div className="flex flex-wrap gap-2">
                  {priorityOptions.map(option => (
                    <Badge
                      key={option.value}
                      variant={selectedPriority.includes(option.value) ? 'default' : 'outline'}
                      className={cn(
                        'cursor-pointer transition-all hover:scale-105',
                        selectedPriority.includes(option.value) && option.color
                      )}
                      onClick={() => togglePriority(option.value)}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  Date Range
                </div>
                <div className="flex flex-wrap gap-2">
                  {dateRangeOptions.map(option => (
                    <Badge
                      key={option.value}
                      variant={dateRange === option.value ? 'default' : 'outline'}
                      className="cursor-pointer transition-all hover:scale-105"
                      onClick={() => setDateRange(option.value)}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Apply Button */}
              <div className="flex justify-end pt-2">
                <Button onClick={applyFilters}>
                  Apply Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
