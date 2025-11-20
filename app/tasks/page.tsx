'use client'

import { useState, useCallback, useMemo } from 'react'
import { useAuth, useAllUserTasks, useToggleTaskStatus } from '@/hooks/queries'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { 
  Search,
  CheckCircle, 
  Clock,
  Calendar
} from 'lucide-react'
import Link from 'next/link'
import { Task, TaskStatus, TaskPriority } from '@/types/tasks'

interface TaskFilters {
  search: string
  status?: TaskStatus
  priority?: TaskPriority
  sortBy: 'title' | 'priority' | 'due_date' | 'created_at' | 'updated_at'
  sortOrder: 'asc' | 'desc'
  showCollaborating: boolean
}

export default function TasksPage() {
  const { user, loading } = useAuth()
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: undefined,
    priority: undefined,
    sortBy: 'created_at',
    sortOrder: 'desc',
    showCollaborating: false
  })

  // Use React Query for tasks
  const { 
    data: tasks = [], 
    isLoading, 
    error 
  } = useAllUserTasks()

  // Use React Query mutation for task status updates
  const { toggleStatus } = useToggleTaskStatus()

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    const filtered = tasks.filter(task => {
      if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }
      if (filters.status && task.status !== filters.status) {
        return false
      }
      if (filters.priority && task.priority !== filters.priority) {
        return false
      }
      return true
    })

    // Sort tasks
    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy] || ''
      const bValue = b[filters.sortBy] || ''
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [tasks, filters])

  const handleToggleTaskStatus = useCallback((task: Task) => {
    if (task.id) {
      toggleStatus(task.id, task.status)
    }
  }, [toggleStatus])

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case TaskPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case TaskPriority.LOW:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-200 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need to be logged in to view your tasks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/login">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-200 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error Loading Tasks</CardTitle>
            <CardDescription>
              There was an error loading your tasks. Please try again.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            All Tasks
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            View and manage all your tasks across workspaces
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter & Search</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search tasks..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={filters.status || "all"} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, status: value === "all" ? undefined : value as TaskStatus }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                  <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                </SelectContent>
              </Select>

              {/* Priority Filter */}
              <Select value={filters.priority || "all"} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, priority: value === "all" ? undefined : value as TaskPriority }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                  <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select 
                value={`${filters.sortBy}-${filters.sortOrder}`} 
                onValueChange={(value) => {
                  const [sortBy, sortOrder] = value.split('-')
                  setFilters(prev => ({
                    ...prev, 
                    sortBy: sortBy as 'title' | 'priority' | 'due_date' | 'created_at' | 'updated_at', 
                    sortOrder: sortOrder as 'asc' | 'desc'
                  }))
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at-desc">Newest First</SelectItem>
                  <SelectItem value="created_at-asc">Oldest First</SelectItem>
                  <SelectItem value="title-asc">Title A-Z</SelectItem>
                  <SelectItem value="title-desc">Title Z-A</SelectItem>
                  <SelectItem value="priority-desc">Priority High-Low</SelectItem>
                  <SelectItem value="priority-asc">Priority Low-High</SelectItem>
                  <SelectItem value="due_date-asc">Due Date</SelectItem>
                </SelectContent>
              </Select>

              {/* Show Collaborating */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="collaborating"
                  checked={filters.showCollaborating}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, showCollaborating: checked }))}
                />
                <Label htmlFor="collaborating" className="text-sm">
                  Collaborating
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredAndSortedTasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  No tasks found
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {filters.search || filters.status || filters.priority 
                    ? "No tasks match your current filters." 
                    : "You don't have any tasks yet."}
                </p>
                <Link href="/workspaces">
                  <Button>View Workspaces</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedTasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      {/* Checkbox */}
                      <Checkbox
                        checked={task.status === TaskStatus.COMPLETED}
                        onCheckedChange={() => handleToggleTaskStatus(task)}
                        className="mt-1"
                      />
                      
                      {/* Task Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <Link 
                            href={`/tasks/${task.id}`} 
                            className="font-semibold text-slate-900 dark:text-white hover:text-primary transition-colors"
                          >
                            {task.title}
                          </Link>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </Badge>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        {task.description && (
                          <p className="text-slate-600 dark:text-slate-400 text-sm mb-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                          {/* Due Date */}
                          {task.due_date && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          
                          {/* Created Date */}
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>
                              {new Date(task.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Stats */}
        {filteredAndSortedTasks.length > 0 && (
          <Card className="mt-8">
            <CardContent className="py-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">
                    {filteredAndSortedTasks.length}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 text-sm">
                    Total Tasks
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {filteredAndSortedTasks.filter(t => t.status === TaskStatus.COMPLETED).length}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 text-sm">
                    Completed
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {filteredAndSortedTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 text-sm">
                    In Progress
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}