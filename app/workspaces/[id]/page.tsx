'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  ArrowLeft,
  Calendar,
  User,
  List as ListIcon,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { Workspace } from '@/types/workspaces'
import { List, ListMember, CreateListData } from '@/types/lists'
import { Task, TaskStatus, TaskPriority, CreateTaskData, UpdateTaskData } from '@/types/tasks'
import TaskSidePanel from '@/components/tasks/TaskSidePanel'

export default function WorkspaceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()

  // Core State
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [lists, setLists] = useState<List[]>([])
  const [tasks, setTasks] = useState<{ [listId: string]: Task[] }>({})
  const [listMembers, setListMembers] = useState<{ [listId: string]: ListMember[] }>({})
  
  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Dialog States
  const [isCreateListDialogOpen, setIsCreateListDialogOpen] = useState(false)
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false)
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false)
  const [isTaskSidePanelOpen, setIsTaskSidePanelOpen] = useState(false)

  const [viewingTask, setViewingTask] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  
  // Form States
  const [createListForm, setCreateListForm] = useState<CreateListData>({
    name: '',
    workspace_id: params.id as string,
    color: '',
    created_by: user?.id || ''
  })
  
  const [createTaskForm, setCreateTaskForm] = useState<CreateTaskData & { list_id: string }>({
    title: '',
    description: '',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    list_id: '',
    due_date: '',
    workspace_id: params.id as string
  })
  
  const [editTaskForm, setEditTaskForm] = useState<UpdateTaskData>({})

  const loadWorkspaceData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Load workspace details
      const workspaceResponse = await fetch(`/api/workspaces/${params.id}`)
      if (!workspaceResponse.ok) throw new Error('Failed to load workspace')
      const workspaceData = await workspaceResponse.json()
      setWorkspace(workspaceData)

      // Load lists for this workspace
      const listsResponse = await fetch(`/api/lists?workspace_id=${params.id}`)
      if (!listsResponse.ok) throw new Error('Failed to load lists')
      const listsData = await listsResponse.json()
      setLists(listsData)

      // If no lists exist, user must create one
      if (listsData.length === 0) {
        setIsCreateListDialogOpen(true)
      } else {
        // Load tasks and members for each list
        await Promise.all(listsData.map(async (list: List) => {
          await loadListTasks(list.id)
          await loadListMembers(list.id)
        }))
      }
    } catch (error) {
      console.error('Error loading workspace data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load workspace')
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  // Load workspace data and lists
  useEffect(() => {
    if (user && params.id) {
      loadWorkspaceData()
    }
  }, [user, params.id, loadWorkspaceData])

  const loadListTasks = async (listId: string) => {
    try {
      const response = await fetch(`/api/tasks?list_id=${listId}`)
      if (!response.ok) throw new Error('Failed to load tasks')
      const tasksData = await response.json()
      setTasks(prev => ({ ...prev, [listId]: tasksData }))
    } catch (error) {
      console.error(`Error loading tasks for list ${listId}:`, error)
    }
  }

  const loadListMembers = async (listId: string) => {
    try {
      const response = await fetch(`/api/lists/${listId}/members`)
      if (!response.ok) throw new Error('Failed to load list members')
      const membersData = await response.json()
    console.log('Members data:', membersData)
      setListMembers(prev => ({ ...prev, [listId]: membersData }))
    } catch (error) {
      console.error(`Error loading members for list ${listId}:`, error)
    }
  }

  const handleCreateList = async () => {
    if (!createListForm.name.trim()) return

    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createListForm)
      })

      if (!response.ok) throw new Error('Failed to create list')
      
      const newList = await response.json()
      setLists(prev => [...prev, newList])
      setIsCreateListDialogOpen(false)
      setCreateListForm({ 
        name: '', 
        workspace_id: params.id as string,
        color: '',
        created_by: user?.id || ''
      })
      
      // Initialize empty tasks and members for new list
      setTasks(prev => ({ ...prev, [newList.id]: [] }))
      setListMembers(prev => ({ ...prev, [newList.id]: [] }))
    } catch (error) {
      console.error('Error creating list:', error)
      setError(error instanceof Error ? error.message : 'Failed to create list')
    }
  }

  const handleCreateTask = async () => {
    if (!createTaskForm.title.trim() || !createTaskForm.list_id) return

    try {
      // Ensure workspace_id and list_id are included in the request
      const taskData = {
        ...createTaskForm,
        workspace_id: params.id as string,
        list_id: createTaskForm.list_id
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })

      if (!response.ok) throw new Error('Failed to create task')
      
      const newTask = await response.json()
      setTasks(prev => ({
        ...prev,
        [createTaskForm.list_id]: [...(prev[createTaskForm.list_id] || []), newTask]
      }))
      setIsCreateTaskDialogOpen(false)
      setCreateTaskForm({
        title: '',
        description: '',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        list_id: '',
        due_date: '',
        workspace_id: params.id as string
      })
    } catch (error) {
      console.error('Error creating task:', error)
      setError(error instanceof Error ? error.message : 'Failed to create task')
    }
  }

  const handleUpdateTask = async () => {
    if (!editingTask) return

    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editTaskForm)
      })

      if (!response.ok) throw new Error('Failed to update task')
      
      const updatedTask = await response.json()
      setTasks(prev => ({
        ...prev,
        [editingTask.list_id]: prev[editingTask.list_id].map(task => 
          task.id === editingTask.id ? updatedTask : task
        )
      }))
      setIsEditTaskDialogOpen(false)
      setEditingTask(null)
      setEditTaskForm({})
    } catch (error) {
      console.error('Error updating task:', error)
      setError(error instanceof Error ? error.message : 'Failed to update task')
    }
  }

  const handleDeleteTask = async (task: Task) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete task')
      
      setTasks(prev => ({
        ...prev,
        [task.list_id]: prev[task.list_id].filter(t => t.id !== task.id)
      }))
    } catch (error) {
      console.error('Error deleting task:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete task')
    }
  }

  const handleTaskStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) throw new Error('Failed to update task status')
      
      const updatedTask = await response.json()
      setTasks(prev => ({
        ...prev,
        [task.list_id]: prev[task.list_id].map(t => 
          t.id === task.id ? updatedTask : t
        )
      }))
    } catch (error) {
      console.error('Error updating task status:', error)
      setError(error instanceof Error ? error.message : 'Failed to update task status')
    }
  }

  const openEditTaskDialog = (task: Task) => {
    setEditingTask(task)
    setEditTaskForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      assignee: task.assignee,
      due_date: task.due_date
    })
    setIsEditTaskDialogOpen(true)
  }

  const openCreateTaskDialog = (listId: string) => {
    setCreateTaskForm(prev => ({ ...prev, list_id: listId }))
    setIsCreateTaskDialogOpen(true)
  }

  const openViewTaskDialog = (task: Task) => {
    setViewingTask(task)
    setIsTaskSidePanelOpen(true)
  }

  const closeTaskSidePanel = () => {
    setIsTaskSidePanelOpen(false)
    setViewingTask(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200 dark:bg-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push('/login')
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-200 dark:bg-gray-900">
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-200 dark:bg-gray-900">
        <div className="container mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="border-b bg-white dark:bg-gray-800 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/workspaces">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{workspace?.name}</h1>
                {workspace?.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{workspace.description}</p>
                )}
              </div>
            </div>
            <Button onClick={() => setIsCreateListDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New List
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-y-hidden">
          <div className={`flex-1 ${isTaskSidePanelOpen ? 'mr-96' : ''} transition-all duration-300`}>
            {/* Kanban Board */}
            {lists.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-6">
                <Card className="w-full max-w-md">
                  <CardContent className="text-center py-12">
                    <ListIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Lists Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first list to start organizing tasks.</p>
                    <Button onClick={() => setIsCreateListDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First List
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex-1 overflow-x-auto p-6">
                <div className="flex gap-4 pb-4 h-full">
                {lists.map((list) => (
                  <div
                    key={list.id}
                    className="flex flex-col w-80 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0 shadow-md border border-gray-300 dark:border-gray-700 h-[calc(100vh-180px)]"
                  >
                      {/* List Header */}
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                            <ListIcon className="h-4 w-4 mr-2" />
                            {list.name}
                          </h3>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/lists/${list.id}`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Manage List
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <Badge variant="secondary" className="text-xs">
                            {tasks[list.id]?.length || 0} tasks
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {listMembers[list.id]?.length || 0}
                          </Badge>
                        </div>
                      </div>

                      {/* Tasks List */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {tasks[list.id]?.length === 0 ? (
                          <div className="text-center py-8">
                            <CheckCircle className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">No tasks yet</p>
                          </div>
                        ) : (
                          tasks[list.id]?.map((task) => (
                            <Card
                              key={task.id}
                              className="p-3 cursor-pointer hover:shadow-md transition-shadow bg-white dark:bg-gray-900"
                              onClick={() => openViewTaskDialog(task)}
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className={`font-medium text-sm flex-1 ${
                                    task.status === TaskStatus.COMPLETED 
                                      ? 'line-through text-gray-500' 
                                      : 'text-gray-900 dark:text-white'
                                  }`}>
                                    {task.title}
                                  </h4>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <MoreVertical className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation()
                                        openEditTaskDialog(task)
                                      }}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleDeleteTask(task)
                                        }}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                {task.description && (
                                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}

                                <div className="flex flex-wrap gap-1.5">
                                  <Badge
                                    variant={
                                      task.priority === TaskPriority.HIGH ? 'destructive' :
                                      task.priority === TaskPriority.MEDIUM ? 'default' :
                                      'secondary'
                                    }
                                    className="text-xs"
                                  >
                                    {task.priority}
                                  </Badge>
                                  {task.due_date && (
                                    <Badge variant="outline" className="text-xs">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </Badge>
                                  )}
                                  {task.assignee && (
                                    <Badge variant="outline" className="text-xs">
                                      <User className="h-3 w-3 mr-1" />
                                      Assigned
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))
                        )}
                      </div>

                      {/* Add Task Button */}
                      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-gray-600 dark:text-gray-400"
                          onClick={() => openCreateTaskDialog(list.id)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Task
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Task Side Panel */}
          {viewingTask && (
            <TaskSidePanel
              task={viewingTask}
              isOpen={isTaskSidePanelOpen}
              onClose={closeTaskSidePanel}
              onDelete={handleDeleteTask}
              onStatusChange={handleTaskStatusChange}
              isOwner={workspace?.owner_id === user?.id}
              canEdit={workspace?.owner_id === user?.id || viewingTask.created_by === user?.id}
              workspaceId={params.id as string}
            />
          )}
        </div>

        {/* Create List Dialog */}
        <Dialog open={isCreateListDialogOpen} onOpenChange={setIsCreateListDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
            <DialogDescription>
              Add a new list to organize your tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="list-name">Name *</Label>
              <Input
                id="list-name"
                value={createListForm.name}
                onChange={(e) => setCreateListForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., To Do, In Progress, Done"
              />
            </div>
            <div>
              <Label htmlFor="list-color">Color</Label>
              <Input
                id="list-color"
                value={createListForm.color}
                type="color"
                onChange={(e) => setCreateListForm(prev => ({ ...prev, color: e.target.value }))}
                placeholder="Optional color for the list"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateListDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateList} disabled={!createListForm.name.trim()}>
              Create List
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={isCreateTaskDialogOpen} onOpenChange={setIsCreateTaskDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to your list.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-title">Title *</Label>
              <Input
                id="task-title"
                value={createTaskForm.title}
                onChange={(e) => setCreateTaskForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Task title"
              />
            </div>
            <div>
              <Label htmlFor="task-description">Description</Label>
              <Textarea
                id="task-description"
                value={createTaskForm.description}
                onChange={(e) => setCreateTaskForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Task description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="task-priority">Priority</Label>
              <Select
                value={createTaskForm.priority}
                onValueChange={(value) => setCreateTaskForm(prev => ({ ...prev, priority: value as TaskPriority }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                  <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="task-due-date">Due Date</Label>
              <Input
                id="task-due-date"
                type="date"
                value={createTaskForm.due_date}
                onChange={(e) => setCreateTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} disabled={!createTaskForm.title.trim()}>
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={isEditTaskDialogOpen} onOpenChange={setIsEditTaskDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update task details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-task-title">Title *</Label>
              <Input
                id="edit-task-title"
                value={editTaskForm.title || ''}
                onChange={(e) => setEditTaskForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Task title"
              />
            </div>
            <div>
              <Label htmlFor="edit-task-description">Description</Label>
              <Textarea
                id="edit-task-description"
                value={editTaskForm.description || ''}
                onChange={(e) => setEditTaskForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Task description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-task-priority">Priority</Label>
              <Select
                value={editTaskForm.priority}
                onValueChange={(value) => setEditTaskForm(prev => ({ ...prev, priority: value as TaskPriority }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                  <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-task-due-date">Due Date</Label>
              <Input
                id="edit-task-due-date"
                type="date"
                value={editTaskForm.due_date || ''}
                onChange={(e) => setEditTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTask} disabled={!editTaskForm.title?.trim()}>
              Update Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}