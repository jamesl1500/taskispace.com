'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import TaskSidePanel from '@/components/tasks/TaskSidePanel'
import { 
  ArrowLeft,
  CheckCircle,
  Clock,
  Calendar,
  User,
  FolderOpen,
  Edit
} from 'lucide-react'
import Link from 'next/link'
import { Task, TaskStatus, TaskPriority, TaskActivity } from '@/types/tasks'
import UserName from '@/components/user/UserName'
import React from 'react'

interface TaskWithDetails extends Task {
  activities?: import('@/types/tasks').TaskActivity[]
  comments?: import('@/types/tasks').TaskComment[]
  todos?: import('@/types/todos').Todo[]
  workspace?: {
    id: string
    name: string
    owner_id: string
    description?: string
    color?: string
    created_at: string
    updated_at: string
  }
  list?: {
    id: string
    name: string
    workspace_id: string
  }
  creator?: {
    id: string
    name?: string
    email: string
  }
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [task, setTask] = useState<TaskWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const handleDeleteTask = async (task: Task) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Redirect to tasks page after deletion
        router.push('/tasks')
      } else {
        console.error('Failed to delete task')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const handleTaskStatusChange = async (task: Task, status: TaskStatus) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        const updatedTask = await response.json()
        setTask(prev => prev ? { ...prev, ...updatedTask } : null)
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  useEffect(() => {
    const loadTaskDetails = async () => {
      if (!user || !params.id) return

      setIsLoading(true)
      setError(null)
      
      try {
        console.log('Loading task details for ID:', params.id)
        
        // Get the task
        const taskResponse = await fetch(`/api/tasks/${params.id}`)
        console.log('Task response status:', taskResponse.status)
        
        if (!taskResponse.ok) {
          const errorData = await taskResponse.json()
          console.error('Task API error:', errorData)
          
          if (taskResponse.status === 404) {
            setError('Task not found')
            return
          } else if (taskResponse.status === 403) {
            setError('You do not have permission to view this task')
            return
          }
          throw new Error(errorData.error || 'Failed to load task')
        }
        
        const taskData = await taskResponse.json()
        console.log('Task data loaded:', taskData)
        
        // If the task already includes workspace and list data from the API, use it
        let workspaceInfo = taskData.workspace || null
        let listInfo = taskData.list || null
        
        // If not included, fetch separately (fallback)
        if (!workspaceInfo && taskData.list_id) {
          try {
            const listResponse = await fetch(`/api/lists/${taskData.list_id}`)
            if (listResponse.ok) {
              listInfo = await listResponse.json()
              
              // Get workspace info
              if (listInfo.workspace_id) {
                const workspaceResponse = await fetch(`/api/workspaces/${listInfo.workspace_id}`)
                if (workspaceResponse.ok) {
                  workspaceInfo = await workspaceResponse.json()
                }
              }
            }
          } catch (error) {
            console.error('Failed to load workspace/list info:', error)
          }
        }

        // Get creator info (optional)
        let creator = taskData.created_by_user || null
        if (!creator && taskData.created_by) {
          try {
            const usersResponse = await fetch(`/api/users/${taskData.created_by}`)
            if (usersResponse.ok) {
              creator = await usersResponse.json()
            }
          } catch (error) {
            console.error('Failed to load creator info:', error)
          }
        }

        setTask({
          ...taskData,
          workspace: workspaceInfo,
          list: listInfo,
          creator
        })
      } catch (error) {
        console.error('Failed to load task details:', error)
        setError(error instanceof Error ? error.message : 'Failed to load task details')
      } finally {
        setIsLoading(false)
      }
    }

    if (user && params.id) {
      loadTaskDetails()
    }
  }, [user, params.id])

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case TaskStatus.IN_PROGRESS:
        return <Clock className="h-5 w-5 text-blue-600" />
      default:
        return <Clock className="h-5 w-5 text-slate-400" />
    }
  }

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400'
    }
  }

  const formatActivityMessage = (activity: TaskActivity) => {
    const { type, payload } = activity
    const payloadData = payload as Record<string, unknown>
    
    switch (type) {
      case 'task_status_changed':
        return `changed status from "${payloadData?.from || 'unknown'}" to "${payloadData?.to || 'unknown'}"`
      case 'comment_added':
        return 'added a comment'
      case 'comment_edited':
        return 'updated a comment'
      case 'comment_deleted':
        return 'deleted a comment'
      case 'tag_added':
        return `added tag "${payloadData?.tag_name || 'unknown'}"`
      case 'tag_removed':
        return `removed tag "${payloadData?.tag_name || 'unknown'}"`
      case 'collaborator_added':
        return `added ${payloadData?.user_name || 'someone'} as ${payloadData?.role || 'collaborator'}`
      case 'collaborator_role_updated':
        return `changed ${payloadData?.user_name || 'someone'}'s role to ${payloadData?.new_role || 'unknown'}`
      case 'collaborator_removed':
        return `removed ${payloadData?.user_name || 'someone'} as collaborator`
      case 'task_updated':
      case 'task_edited':
        return `updated task ${payloadData?.field || 'details'}`
      case 'subtask_added':
        return `added subtask "${payloadData?.title || 'untitled'}"`
      case 'subtask_completed':
        return `completed subtask "${payloadData?.title || 'untitled'}"`
      case 'subtask_updated':
        return `updated subtask "${payloadData?.title || 'untitled'}"`
      case 'subtask_deleted':
        return `deleted subtask "${payloadData?.title || 'untitled'}"`
      case 'task_created':
        return 'created the task'
      case 'task_completed':
        return 'completed the task'
      case 'due_date_changed':
        return 'changed the due date'
      case 'priority_changed':
        return `changed priority to ${payloadData?.priority || 'unknown'}`
      default:
        return 'performed an action'
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Skeleton className="h-48" />
              <Skeleton className="h-32" />
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-200 dark:bg-gray-900 flex items-center justify-center">
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

  if (error || !task) {
    return (
      <div className="min-h-screen bg-gray-200 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              {error || 'Task not found'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => router.back()} variant="outline" className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
            <Link href="/tasks">
              <Button className="w-full">
                View All Tasks
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="flex">
        {/* Main Content */}
        <div className={`flex-1`}>
          <div className="p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.back()}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(task.status)}
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {task.title}
                    </h1>
                  </div>
                </div>
                <Button 
                  onClick={() => setIsPanelOpen(!isPanelOpen)}
                  variant={isPanelOpen ? 'default' : 'outline'}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isPanelOpen ? 'Close Panel' : 'Manage Task'}
                </Button>
              </div>

              {/* Task Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Task Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Task Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {task.description && (
                        <div>
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Description
                          </label>
                          <p className="text-slate-900 dark:text-white mt-1">
                            {task.description}
                          </p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Status
                          </label>
                          <div className="mt-1">
                            <Badge className={getStatusColor(task.status)}>
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Priority
                          </label>
                          <div className="mt-1">
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {task.due_date && (
                        <div>
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Due Date
                          </label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            <span className={`text-slate-900 dark:text-white ${
                              new Date(task.due_date) < new Date() && task.status !== TaskStatus.COMPLETED 
                                ? 'text-red-600 dark:text-red-400 font-medium' 
                                : ''
                            }`}>
                              {new Date(task.due_date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                            {new Date(task.due_date) < new Date() && task.status !== TaskStatus.COMPLETED && (
                              <Badge variant="destructive">Overdue</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Workspace & List Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Location</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {task.workspace && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FolderOpen className="h-4 w-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                              Workspace:
                            </span>
                          </div>
                          <Link 
                            href={`/workspaces/${task.workspace.id}`}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline"
                          >
                            {task.workspace.name}
                          </Link>
                        </div>
                      )}
                      {task.list && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            List:
                          </span>
                          <span className="text-slate-900 dark:text-white">
                            {task.list.name}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Meta Information */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Created
                        </label>
                        <div className="flex items-center space-x-2 mt-1">
                          <User className="h-4 w-4 text-slate-500" />
                          <span className="text-sm text-slate-900 dark:text-white">
                            {new Date(task.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {task.creator && (
                          <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            by {task.creator.name || task.creator.email}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Last Updated
                        </label>
                        <div className="text-sm text-slate-900 dark:text-white mt-1">
                          {new Date(task.updated_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>

                      {task.completed_at && (
                        <div>
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Completed
                          </label>
                          <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                            {new Date(task.completed_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Link href="/tasks">
                        <Button variant="outline" className="w-full justify-start">
                          View All Tasks
                        </Button>
                      </Link>
                      {task.workspace && (
                        <Link href={`/workspaces/${task.workspace.id}`}>
                          <Button variant="outline" className="w-full justify-start">
                            <FolderOpen className="h-4 w-4 mr-2" />
                            View Workspace
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>

                  {/* Task Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {task.activities && task.activities.length > 0 ? (
                        <ul className="space-y-4 max-h-60 overflow-y-auto">
                          {task.activities.map(activity => (
                            <li key={activity.id} className="text-sm text-slate-900 dark:text-white">
                              <div className="font-medium">
                                <UserName userId={activity.actor} />                                 
                                {` ` +formatActivityMessage(activity)}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {new Date(activity.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          No activity recorded for this task.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Task Side Panel */}
        {isPanelOpen && task && (
          <TaskSidePanel
            task={task}
            isOpen={isPanelOpen}
            onClose={() => setIsPanelOpen(false)}
            onDelete={handleDeleteTask}
            onStatusChange={handleTaskStatusChange}
            isOwner={task.workspace?.owner_id === user?.id}
            canEdit={task.workspace?.owner_id === user?.id || task.created_by === user?.id}
            workspaceId={task.workspace?.id || ''}
          />
        )}
    </div>
  )
}
