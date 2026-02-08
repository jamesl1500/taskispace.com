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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Users,
  Eye,
  Settings,
  UserPlus,
  Save
} from 'lucide-react'
import Link from 'next/link'
import { List, ListMember } from '@/types/lists'
import { Task, TaskStatus, TaskPriority, CreateTaskData, UpdateTaskData } from '@/types/tasks'
import TaskSidePanel from '@/components/tasks/TaskSidePanel'
import UserName from '@/components/user/UserName'

export default function ListDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()

  // Core State
  const [list, setList] = useState<List | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<ListMember[]>([])
  
  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Dialog States
  const [isEditListDialogOpen, setIsEditListDialogOpen] = useState(false)
  const [isCreateTaskDialogOpen, setIsCreateTaskDialogOpen] = useState(false)
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false)
  const [isTaskSidePanelOpen, setIsTaskSidePanelOpen] = useState(false)
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)

  const [viewingTask, setViewingTask] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  
  // Form States
  const [editListForm, setEditListForm] = useState({
    name: '',
    color: ''
  })
  
  const [createTaskForm, setCreateTaskForm] = useState<CreateTaskData>({
    title: '',
    description: '',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    due_date: '',
    workspace_id: '',
    list_id: ''
  })
  
  const [editTaskForm, setEditTaskForm] = useState<UpdateTaskData>({})
  
  const [addMemberEmail, setAddMemberEmail] = useState('')

  const loadListData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Load list details
      const listResponse = await fetch(`/api/lists/${params.id}`)
      if (!listResponse.ok) throw new Error('Failed to load list')
      const listData = await listResponse.json()
      setList(listData)
      setEditListForm({
        name: listData.name,
        color: listData.color || ''
      })

      // Load tasks for this list
      const tasksResponse = await fetch(`/api/tasks?list_id=${params.id}`)
      if (!tasksResponse.ok) throw new Error('Failed to load tasks')
      const tasksData = await tasksResponse.json()
      setTasks(tasksData)

      // Load list members
      const membersResponse = await fetch(`/api/lists/${params.id}/members`)
      if (!membersResponse.ok) throw new Error('Failed to load members')
      const membersData = await membersResponse.json()
      setMembers(membersData)
    } catch (error) {
      console.error('Error loading list data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load list')
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    if (user && params.id) {
      loadListData()
    }
  }, [user, params.id, loadListData])

  const handleUpdateList = async () => {
    if (!editListForm.name.trim()) return

    try {
      const response = await fetch(`/api/lists/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editListForm)
      })

      if (!response.ok) throw new Error('Failed to update list')
      
      const updatedList = await response.json()
      setList(updatedList)
      setIsEditListDialogOpen(false)
    } catch (error) {
      console.error('Error updating list:', error)
      setError(error instanceof Error ? error.message : 'Failed to update list')
    }
  }

  const handleCreateTask = async () => {
    if (!createTaskForm.title.trim() || !list) return

    try {
      const taskData = {
        ...createTaskForm,
        list_id: params.id as string,
        workspace_id: list.workspace_id
      }

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })

      if (!response.ok) throw new Error('Failed to create task')
      
      const newTask = await response.json()
      setTasks(prev => [...prev, newTask])
      setIsCreateTaskDialogOpen(false)
      setCreateTaskForm({
        title: '',
        description: '',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        due_date: '',
        workspace_id: list.workspace_id,
        list_id: list.id
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
      setTasks(prev => prev.map(task => 
        task.id === editingTask.id ? updatedTask : task
      ))
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
      
      setTasks(prev => prev.filter(t => t.id !== task.id))
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
      setTasks(prev => prev.map(t => 
        t.id === task.id ? updatedTask : t
      ))
    } catch (error) {
      console.error('Error updating task status:', error)
      setError(error instanceof Error ? error.message : 'Failed to update task status')
    }
  }

  const handleAddMember = async () => {
    if (!addMemberEmail.trim()) return

    try {
      const response = await fetch(`/api/lists/${params.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addMemberEmail })
      })

      if (!response.ok) throw new Error('Failed to add member')
      
      await loadListData() // Reload to get updated members
      setIsAddMemberDialogOpen(false)
      setAddMemberEmail('')
    } catch (error) {
      console.error('Error adding member:', error)
      setError(error instanceof Error ? error.message : 'Failed to add member')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/lists/${params.id}/members/${memberId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to remove member')
      
      setMembers(prev => prev.filter(m => m.id !== memberId))
    } catch (error) {
      console.error('Error removing member:', error)
      setError(error instanceof Error ? error.message : 'Failed to remove member')
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="container mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-purple-200 dark:bg-purple-900 rounded w-1/4"></div>
            <div className="h-32 bg-purple-100 dark:bg-purple-950 rounded"></div>
            <div className="h-32 bg-purple-100 dark:bg-purple-950 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="flex h-screen overflow-hidden">
        {/* Main Content */}
        <div className={`flex-1 ${isTaskSidePanelOpen ? 'mr-96' : ''} transition-all duration-300`}>
          <div className="container mx-auto p-6 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Link href={`/workspaces/${list?.workspace_id}`}>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Workspace
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold flex items-center">
                    {list?.color && (
                      <span 
                        className="w-4 h-4 rounded-full mr-3" 
                        style={{ backgroundColor: list.color }}
                      />
                    )}
                    {list?.name}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {tasks.length} tasks · {members.length} members
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setIsEditListDialogOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit List
                </Button>
                <Button onClick={() => setIsCreateTaskDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="tasks" className="space-y-4">
              <TabsList>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
              </TabsList>

              {/* Tasks Tab */}
              <TabsContent value="tasks" className="space-y-4">
                {tasks.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Tasks Yet</h3>
                      <p className="text-gray-500 mb-4">Create your first task to get started.</p>
                      <Button onClick={() => setIsCreateTaskDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Task
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <Card key={task.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <Checkbox
                                checked={task.status === TaskStatus.COMPLETED}
                                onCheckedChange={(checked) =>
                                  handleTaskStatusChange(
                                    task,
                                    checked ? TaskStatus.COMPLETED : TaskStatus.TODO
                                  )
                                }
                              />
                              <div className="flex-1">
                                <h4 className={`font-medium ${
                                  task.status === TaskStatus.COMPLETED 
                                    ? 'line-through text-gray-500' 
                                    : ''
                                }`}>
                                  {task.title}
                                </h4>
                                {task.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {task.description}
                                  </p>
                                )}
                                <div className="flex items-center space-x-2 mt-2">
                                  <Badge
                                    variant={
                                      task.priority === TaskPriority.HIGH ? 'destructive' :
                                      task.priority === TaskPriority.MEDIUM ? 'default' :
                                      'secondary'
                                    }
                                  >
                                    {task.priority}
                                  </Badge>
                                  {task.due_date && (
                                    <Badge variant="outline">
                                      <Calendar className="h-3 w-3 mr-1" />
                                      {new Date(task.due_date).toLocaleDateString()}
                                    </Badge>
                                  )}
                                  {task.assignee && (
                                    <Badge variant="outline">
                                      <User className="h-3 w-3 mr-1" />
                                      Assigned
                                    </Badge>
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
                                <DropdownMenuItem onClick={() => openViewTaskDialog(task)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditTaskDialog(task)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteTask(task)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Members Tab */}
              <TabsContent value="members" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>List Members</CardTitle>
                      <Button size="sm" onClick={() => setIsAddMemberDialogOpen(true)}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Member
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {members.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No members yet. Add members to collaborate.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {members.map((member) => (
                          <div 
                            key={member.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-gray-600" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  <UserName userId={member.user_id} />
                                </p>
                                <p className="text-sm text-gray-500">
                                  {member.role}
                                </p>
                              </div>
                            </div>
                            {member.user_id !== list?.created_by && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Edit List Dialog */}
            <Dialog open={isEditListDialogOpen} onOpenChange={setIsEditListDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit List</DialogTitle>
                  <DialogDescription>
                    Update the list name and color.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="list-name">Name *</Label>
                    <Input
                      id="list-name"
                      value={editListForm.name}
                      onChange={(e) => setEditListForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="List name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="list-color">Color</Label>
                    <Input
                      id="list-color"
                      type="color"
                      value={editListForm.color}
                      onChange={(e) => setEditListForm(prev => ({ ...prev, color: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditListDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateList} disabled={!editListForm.name.trim()}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
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
                    Add a new task to this list.
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

            {/* Add Member Dialog */}
            <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Member</DialogTitle>
                  <DialogDescription>
                    Add a member to this list by their email address.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="member-email">Email Address *</Label>
                    <Input
                      id="member-email"
                      type="email"
                      value={addMemberEmail}
                      onChange={(e) => setAddMemberEmail(e.target.value)}
                      placeholder="user@example.com"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddMemberDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddMember} disabled={!addMemberEmail.trim()}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Task Side Panel */}
        {viewingTask && list && (
          <TaskSidePanel
            task={viewingTask}
            isOpen={isTaskSidePanelOpen}
            onClose={closeTaskSidePanel}
            onEdit={openEditTaskDialog}
            onDelete={handleDeleteTask}
            onStatusChange={handleTaskStatusChange}
            isOwner={list.created_by === user?.id}
            canEdit={list.created_by === user?.id || viewingTask.created_by === user?.id}
            workspaceId={list.workspace_id}
          />
        )}
      </div>
    </div>
  )
}
