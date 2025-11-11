'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowLeft,
  Calendar,
  User,
  Tag,
  List as ListIcon,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { Workspace } from '@/types/workspaces'
import { List, ListMember, CreateListData, UpdateListData, ListMemberRole } from '@/types/lists'
import { Task, TaskStatus, TaskPriority, CreateTaskData, UpdateTaskData } from '@/types/tasks'

export default function WorkspaceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [lists, setLists] = useState<string[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false)
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    status: undefined,
    priority: undefined,
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

  // Form states
  const [createTaskForm, setCreateTaskForm] = useState<CreateTaskData>({
    title: '',
    description: '',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    workspace_id: params.id as string,
    due_date: '',
    tags: []
  })
  const [editTaskForm, setEditTaskForm] = useState<UpdateTaskData>({})
  const [newTag, setNewTag] = useState('')

  useEffect(() => {
    if (user && params.id) {
      loadWorkspaceAndTasks()
    }
  }, [user, params.id, filters])

  const loadWorkspaceAndTasks = async () => {
    setIsLoading(true)
    try {
      // TODO: Replace with actual API calls
      const workspaceResponse = await fetch(`/api/workspaces/${params.id}`)
      const workspaceData = await workspaceResponse.json()
      setWorkspace(workspaceData)

      // See if we have any lists
      console.log('Workspace lists:', workspaceData.lists)

    } catch (error) {
      console.error('Failed to load workspace:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateTask = async () => {
    try {
      // TODO: Replace with actual API call
      const newTask: Task = {
        id: Date.now().toString(),
        ...createTaskForm,
        status: createTaskForm.status || TaskStatus.TODO,
        priority: createTaskForm.priority || TaskPriority.MEDIUM,
        created_by: user!.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setTasks(prev => [...prev, newTask])
      setCreateTaskForm({
        title: '',
        description: '',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        workspace_id: params.id as string,
        due_date: '',
        tags: []
      })
      setIsCreateTaskModalOpen(false)
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const handleEditTask = async () => {
    if (!editingTask) return
    try {
      // TODO: Replace with actual API call
      const updatedTask = {
        ...editingTask,
        ...editTaskForm,
        updated_at: new Date().toISOString()
      }
      setTasks(prev => prev.map(t => t.id === editingTask.id ? updatedTask : t))
      setEditingTask(null)
      setEditTaskForm({})
      setIsEditTaskModalOpen(false)
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const handleDeleteTask = async (task: Task) => {
    if (!confirm(`Are you sure you want to delete "${task.title}"?`)) return
    try {
      // TODO: Replace with actual API call
      setTasks(prev => prev.filter(t => t.id !== task.id))
    } catch (error) {
      console.error('Failed to delete task:', error)
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

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task)
    setEditTaskForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      tags: task.tags
    })
    setIsEditTaskModalOpen(true)
  }

  const addTag = (tags: string[] | undefined, isCreate = true) => {
    if (!newTag.trim()) return
    const updatedTags = [...(tags || []), newTag.trim()]
    if (isCreate) {
      setCreateTaskForm(prev => ({ ...prev, tags: updatedTags }))
    } else {
      setEditTaskForm(prev => ({ ...prev, tags: updatedTags }))
    }
    setNewTag('')
  }

  const removeTag = (tagToRemove: string, tags: string[] | undefined, isCreate = true) => {
    const updatedTags = (tags || []).filter(tag => tag !== tagToRemove)
    if (isCreate) {
      setCreateTaskForm(prev => ({ ...prev, tags: updatedTags }))
    } else {
      setEditTaskForm(prev => ({ ...prev, tags: updatedTags }))
    }
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

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 gap-6">
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
    router.push('/auth/login')
    return null
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Workspace Not Found</CardTitle>
            <CardDescription>
              The workspace you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/workspaces">
              <Button className="w-full">Back to Workspaces</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/workspaces">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div 
                className="w-6 h-6 rounded-full" 
                style={{ backgroundColor: workspace.color }}
              />
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  {workspace.name}
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  {workspace.description || 'No description'}
                </p>
              </div>
            </div>
          </div>
          <Dialog open={isCreateTaskModalOpen} onOpenChange={setIsCreateTaskModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Add a new task to {workspace.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    value={createTaskForm.title}
                    onChange={(e) => setCreateTaskForm(prev => ({...prev, title: e.target.value}))}
                    placeholder="Enter task title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={createTaskForm.description}
                    onChange={(e) => setCreateTaskForm(prev => ({...prev, description: e.target.value}))}
                    placeholder="Describe the task"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={createTaskForm.status}
                      onValueChange={(value) => setCreateTaskForm(prev => ({...prev, status: value as TaskStatus}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                        <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                        <SelectItem value={TaskStatus.IN_REVIEW}>In Review</SelectItem>
                        <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select 
                      value={createTaskForm.priority}
                      onValueChange={(value) => setCreateTaskForm(prev => ({...prev, priority: value as TaskPriority}))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                        <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                        <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                        <SelectItem value={TaskPriority.URGENT}>Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="datetime-local"
                    value={createTaskForm.due_date ? new Date(createTaskForm.due_date).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setCreateTaskForm(prev => ({...prev, due_date: e.target.value ? new Date(e.target.value).toISOString() : ''}))}
                  />
                </div>
                <div>
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {createTaskForm.tags?.map((tag) => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag, createTaskForm.tags, true)}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(createTaskForm.tags, true))}
                    />
                    <Button type="button" variant="outline" onClick={() => addTag(createTaskForm.tags, true)}>
                      <Tag className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateTaskModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTask} disabled={!createTaskForm.title.trim()}>
                  Create Task
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                  : 'Create your first task to get started.'
                }
              </p>
              {!filters.search && !filters.status && !filters.priority && (
                <Button onClick={() => setIsCreateTaskModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Task
                </Button>
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
                          {task.due_date && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Due {new Date(task.due_date).toLocaleDateString()}</span>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditTaskModal(task)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTask(task)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Task Modal */}
        <Dialog open={isEditTaskModalOpen} onOpenChange={setIsEditTaskModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Update task details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Task Title</Label>
                <Input
                  id="edit-title"
                  value={editTaskForm.title || ''}
                  onChange={(e) => setEditTaskForm(prev => ({...prev, title: e.target.value}))}
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editTaskForm.description || ''}
                  onChange={(e) => setEditTaskForm(prev => ({...prev, description: e.target.value}))}
                  placeholder="Describe the task"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select 
                    value={editTaskForm.status}
                    onValueChange={(value) => setEditTaskForm(prev => ({...prev, status: value as TaskStatus}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                      <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                      <SelectItem value={TaskStatus.IN_REVIEW}>In Review</SelectItem>
                      <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select 
                    value={editTaskForm.priority}
                    onValueChange={(value) => setEditTaskForm(prev => ({...prev, priority: value as TaskPriority}))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                      <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                      <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                      <SelectItem value={TaskPriority.URGENT}>Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-due_date">Due Date</Label>
                <Input
                  id="edit-due_date"
                  type="datetime-local"
                  value={editTaskForm.due_date ? new Date(editTaskForm.due_date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditTaskForm(prev => ({...prev, due_date: e.target.value ? new Date(e.target.value).toISOString() : ''}))}
                />
              </div>
              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editTaskForm.tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag, editTaskForm.tags, false)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(editTaskForm.tags, false))}
                  />
                  <Button type="button" variant="outline" onClick={() => addTag(editTaskForm.tags, false)}>
                    <Tag className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditTaskModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditTask}>
                Update Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}