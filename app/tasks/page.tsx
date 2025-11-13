'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
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
  Calendar,
  User,
  Tag,
  FolderOpen,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { Task, TaskStatus, TaskPriority } from '@/types/tasks'

interface TaskFilters {
  search: string
  status?: TaskStatus
  priority?: TaskPriority
  sortBy: keyof Task | 'priority'
  sortOrder: 'asc' | 'desc'
  showCollaborating: boolean
}

interface TaskWithWorkspace extends Task {
  workspace?: {
    id: string
    name: string
  }
  list?: {
    id: string
    name: string
  }
  tags?: string[]
}

export default function TasksPage() {
  const { user, loading } = useAuth()
  const [tasks, setTasks] = useState<TaskWithWorkspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: undefined,
    priority: undefined,
    sortBy: 'created_at',
    sortOrder: 'desc',
    showCollaborating: false
  })

  const loadAllTasks = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      // Get tasks from user's workspaces
      const workspacesResponse = await fetch('/api/workspaces')
      if (!workspacesResponse.ok) throw new Error('Failed to load workspaces')
      const workspaces = await workspacesResponse.json()

      const allTasks: TaskWithWorkspace[] = []

      // Load tasks from each workspace
      for (const workspace of workspaces) {
        try {
          // Get lists for this workspace
          const listsResponse = await fetch(`/api/lists?workspace_id=${workspace.id}`)
          if (!listsResponse.ok) continue
          const lists = await listsResponse.json()

          // Get tasks for each list
          for (const list of lists) {
            try {
              const tasksResponse = await fetch(`/api/tasks?list_id=${list.id}`)
              if (!tasksResponse.ok) continue
              const listTasks = await tasksResponse.json()

              // Add workspace and list info to each task
              listTasks.forEach((task: Task) => {
                allTasks.push({
                  ...task,
                  workspace: {
                    id: workspace.id,
                    name: workspace.name
                  },
                  list: {
                    id: list.id,
                    name: list.name
                  }
                })
              })
            } catch (error) {
              console.error(`Failed to load tasks for list ${list.id}:`, error)
            }
          }
        } catch (error) {
          console.error(`Failed to load lists for workspace ${workspace.id}:`, error)
        }
      }

      // If showing collaborating tasks, also get tasks where user is a collaborator
      if (filters.showCollaborating) {
        try {
          // This would require a new API endpoint to get tasks by collaborator
          // For now, we'll skip this but you could add it later
        } catch (error) {
          console.error('Failed to load collaborating tasks:', error)
        }
      }

      // Apply filters
      let filteredTasks = allTasks
      if (filters.search) {
        filteredTasks = filteredTasks.filter(task => 
          task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          task.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
          task.tags?.some(tag => tag.toLowerCase().includes(filters.search.toLowerCase()))
        )
      }
      if (filters.status) {
        filteredTasks = filteredTasks.filter(task => task.status === filters.status)
      }
      if (filters.priority) {
        filteredTasks = filteredTasks.filter(task => task.priority === filters.priority)
      }

      // Apply sorting
      filteredTasks.sort((a, b) => {
        let aVal: unknown, bVal: unknown
        if (filters.sortBy === 'priority') {
          const priorityOrder = { 
            [TaskPriority.HIGH]: 3, 
            [TaskPriority.MEDIUM]: 2, 
            [TaskPriority.LOW]: 1 
          }
          aVal = priorityOrder[a.priority]
          bVal = priorityOrder[b.priority]
        } else {
          aVal = a[filters.sortBy as keyof Task]
          bVal = b[filters.sortBy as keyof Task]
        }
        
        const order = filters.sortOrder === 'desc' ? -1 : 1
        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1
        return aVal < bVal ? order : aVal > bVal ? -order : 0
      })

      setTasks(filteredTasks)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user, filters])

  useEffect(() => {
    if (user) {
      loadAllTasks()
    }
  }, [user, loadAllTasks])

  const handleToggleTaskStatus = async (task: TaskWithWorkspace) => {
    const newStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED
    
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          completed_at: newStatus === TaskStatus.COMPLETED ? new Date().toISOString() : null
        })
      })

      if (!response.ok) throw new Error('Failed to update task')
      
      const updatedTask = await response.json()
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updatedTask } : t))
    } catch (error) {
      console.error('Failed to update task status:', error)
      alert('Failed to update task status. Please try again.')
    }
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case TaskStatus.IN_PROGRESS:
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <Clock className="h-4 w-4 text-slate-400" />
    }
  }

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case TaskPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case TaskPriority.LOW:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need to be logged in to view this page.
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

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t: TaskWithWorkspace) => t.status === TaskStatus.COMPLETED).length,
    inProgress: tasks.filter((t: TaskWithWorkspace) => t.status === TaskStatus.IN_PROGRESS).length,
    todo: tasks.filter((t: TaskWithWorkspace) => t.status === TaskStatus.TODO).length,
    overdue: tasks.filter((t: TaskWithWorkspace) => t.due_date && new Date(t.due_date) < new Date() && t.status !== TaskStatus.COMPLETED).length
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              All Tasks
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              View and manage tasks across all workspaces
            </p>
          </div>
          <Link href="/workspaces">
            <Button variant="outline">
              <FolderOpen className="h-4 w-4 mr-2" />
              View Workspaces
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{taskStats.total}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">In Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-slate-600">{taskStats.todo}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">To Do</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Overdue</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col gap-4">
            {/* Search and Toggle */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search tasks..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="collaborating"
                  checked={filters.showCollaborating}
                  onCheckedChange={(checked) => setFilters(prev => ({...prev, showCollaborating: checked}))}
                />
                <Label htmlFor="collaborating" className="text-sm">
                  <Users className="h-4 w-4 inline mr-1" />
                  Show collaborating tasks
                </Label>
              </div>
            </div>
            
            {/* Filter Dropdowns */}
            <div className="flex flex-wrap gap-2">
              <Select 
                value={filters.status || 'all'}
                onValueChange={(value) => setFilters(prev => ({...prev, status: value === 'all' ? undefined : value as TaskStatus}))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                  <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={filters.priority || 'all'}
                onValueChange={(value) => setFilters(prev => ({...prev, priority: value === 'all' ? undefined : value as TaskPriority}))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                  <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onValueChange={(value) => {
                  const [sortBy, sortOrder] = value.split('-')
                  setFilters(prev => ({...prev, sortBy: sortBy as keyof Task, sortOrder: sortOrder as 'asc' | 'desc'}))
                }}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                  <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                  <SelectItem value="priority-desc">Priority (High to Low)</SelectItem>
                  <SelectItem value="priority-asc">Priority (Low to High)</SelectItem>
                  <SelectItem value="due_date-asc">Due Date (Earliest)</SelectItem>
                  <SelectItem value="due_date-desc">Due Date (Latest)</SelectItem>
                  <SelectItem value="created_at-desc">Newest</SelectItem>
                  <SelectItem value="created_at-asc">Oldest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Tasks List */}
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <Card className="p-12 text-center">
              <CheckCircle className="h-16 w-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                {filters.search || filters.status || filters.priority ? 'No tasks found' : 'No tasks yet'}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {filters.search || filters.status || filters.priority 
                  ? 'No tasks match your current filters.'
                  : 'Create your first workspace and add tasks to get started.'
                }
              </p>
              {!filters.search && !filters.status && !filters.priority && (
                <Link href="/workspaces">
                  <Button>
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Create Your First Workspace
                  </Button>
                </Link>
              )}
            </Card>
          ) : (
            tasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <Checkbox
                        checked={task.status === TaskStatus.COMPLETED}
                        onCheckedChange={() => handleToggleTaskStatus(task)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Link 
                            href={`/tasks/${task.id}`}
                            className={`font-medium hover:underline ${task.status === TaskStatus.COMPLETED ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white hover:text-blue-600'}`}
                          >
                            {task.title}
                          </Link>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(task.status)}
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                        {task.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center space-x-1">
                            <FolderOpen className="h-3 w-3" />
                            <Link 
                              href={`/workspaces/${task.workspace?.id}`}
                              className="hover:text-blue-600 dark:hover:text-blue-400 underline"
                            >
                              {task.workspace?.name}
                            </Link>
                          </div>
                          {task.list && (
                            <div className="flex items-center space-x-1">
                              <span>in</span>
                              <span className="font-medium">{task.list.name}</span>
                            </div>
                          )}
                          {task.due_date && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span className={new Date(task.due_date) < new Date() && task.status !== TaskStatus.COMPLETED ? 'text-red-600' : ''}>
                                Due {new Date(task.due_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>Created {new Date(task.created_at).toLocaleDateString()}</span>
                          </div>
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <Tag className="h-3 w-3" />
                              <div className="flex gap-1">
                                {task.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}