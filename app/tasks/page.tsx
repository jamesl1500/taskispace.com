'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Search,
  CheckCircle, 
  Clock, 
  AlertCircle,
  Calendar,
  User,
  Tag,
  FolderOpen
} from 'lucide-react'
import Link from 'next/link'
import { Task, TaskStatus, TaskPriority, TaskFilters } from '@/types'

export default function TasksPage() {
  const { user, loading } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: undefined,
    priority: undefined,
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

  useEffect(() => {
    if (user) {
      loadAllTasks()
    }
  }, [user, filters])

  const loadAllTasks = async () => {
    setIsLoading(true)
    try {
      // TODO: Replace with actual API call to get all tasks across workspaces
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Complete project proposal',
          description: 'Write and review the Q1 project proposal document',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.HIGH,
          workspace_id: 'work-projects',
          created_by: user!.id,
          due_date: '2024-02-15T00:00:00Z',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-18T14:30:00Z',
          tags: ['proposal', 'urgent']
        },
        {
          id: '2',
          title: 'Review team performance',
          description: 'Conduct quarterly review meetings with team members',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          workspace_id: 'work-projects',
          created_by: user!.id,
          due_date: '2024-02-20T00:00:00Z',
          created_at: '2024-01-16T09:00:00Z',
          updated_at: '2024-01-16T09:00:00Z',
          tags: ['hr', 'meeting']
        },
        {
          id: '3',
          title: 'Update personal blog',
          description: 'Write new blog post about productivity tips',
          status: TaskStatus.TODO,
          priority: TaskPriority.LOW,
          workspace_id: 'personal',
          created_by: user!.id,
          created_at: '2024-01-14T11:00:00Z',
          updated_at: '2024-01-14T11:00:00Z',
          tags: ['writing', 'blog']
        },
        {
          id: '4',
          title: 'Plan weekend trip',
          description: 'Research and book accommodation for weekend getaway',
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.MEDIUM,
          workspace_id: 'personal',
          created_by: user!.id,
          completed_at: '2024-01-17T16:00:00Z',
          created_at: '2024-01-12T10:00:00Z',
          updated_at: '2024-01-17T16:00:00Z',
          tags: ['travel', 'personal']
        },
        {
          id: '5',
          title: 'Fix kitchen sink',
          description: 'Replace the leaky faucet in the kitchen',
          status: TaskStatus.IN_REVIEW,
          priority: TaskPriority.HIGH,
          workspace_id: 'home-improvement',
          created_by: user!.id,
          due_date: '2024-02-10T00:00:00Z',
          created_at: '2024-01-13T15:00:00Z',
          updated_at: '2024-01-19T12:00:00Z',
          tags: ['maintenance', 'urgent']
        }
      ]

      // Apply filters
      let filteredTasks = mockTasks
      if (filters.search) {
        filteredTasks = filteredTasks.filter(task => 
          task.title.toLowerCase().includes(filters.search!.toLowerCase()) ||
          task.description?.toLowerCase().includes(filters.search!.toLowerCase()) ||
          task.tags?.some(tag => tag.toLowerCase().includes(filters.search!.toLowerCase()))
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
        let aVal: any, bVal: any
        if (filters.sortBy === 'priority') {
          const priorityOrder = { [TaskPriority.URGENT]: 4, [TaskPriority.HIGH]: 3, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 1 }
          aVal = priorityOrder[a.priority]
          bVal = priorityOrder[b.priority]
        } else {
          aVal = a[filters.sortBy!]
          bVal = b[filters.sortBy!]
        }
        const order = filters.sortOrder === 'desc' ? -1 : 1
        return aVal < bVal ? order : aVal > bVal ? -order : 0
      })

      setTasks(filteredTasks)
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleTaskStatus = async (task: Task) => {
    const newStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED
    const updatedTask = {
      ...task,
      status: newStatus,
      completed_at: newStatus === TaskStatus.COMPLETED ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString()
    }
    setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t))
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case TaskStatus.IN_PROGRESS:
        return <Clock className="h-4 w-4 text-blue-600" />
      case TaskStatus.IN_REVIEW:
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      default:
        return <Clock className="h-4 w-4 text-slate-400" />
    }
  }

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT:
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case TaskPriority.HIGH:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case TaskPriority.MEDIUM:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case TaskPriority.LOW:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  const getWorkspaceDisplayName = (workspaceId: string) => {
    const workspaceNames: Record<string, string> = {
      'work-projects': 'Work Projects',
      'personal': 'Personal',
      'home-improvement': 'Home Improvement'
    }
    return workspaceNames[workspaceId] || workspaceId
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
    completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
    inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
    todo: tasks.filter(t => t.status === TaskStatus.TODO).length,
    overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== TaskStatus.COMPLETED).length
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
                  <SelectItem value={TaskStatus.IN_REVIEW}>In Review</SelectItem>
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
                  <SelectItem value={TaskPriority.URGENT}>Urgent</SelectItem>
                  <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                  <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onValueChange={(value) => {
                  const [sortBy, sortOrder] = value.split('-')
                  setFilters(prev => ({...prev, sortBy: sortBy as any, sortOrder: sortOrder as any}))
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
                          <h3 className={`font-medium ${task.status === TaskStatus.COMPLETED ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                            {task.title}
                          </h3>
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
                              href={`/workspaces/${task.workspace_id}`}
                              className="hover:text-blue-600 dark:hover:text-blue-400 underline"
                            >
                              {getWorkspaceDisplayName(task.workspace_id)}
                            </Link>
                          </div>
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