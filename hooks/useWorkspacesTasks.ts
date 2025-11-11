import { useState } from 'react'
import { Workspace, Task, CreateWorkspaceData, UpdateWorkspaceData, CreateTaskData, UpdateTaskData, WorkspaceFilters, TaskFilters, TaskStatus } from '@/types'

export const useWorkspaces = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const createWorkspace = async (data: CreateWorkspaceData): Promise<Workspace> => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create workspace')
      }

      const newWorkspace: Workspace = await response.json()
      setWorkspaces(prev => [...prev, newWorkspace])
      return newWorkspace
    } catch (error) {
      console.error('Failed to create workspace:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const updateWorkspace = async (id: string, data: UpdateWorkspaceData): Promise<Workspace> => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/workspaces/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update workspace')
      }

      const updatedWorkspace: Workspace = await response.json()
      setWorkspaces(prev => prev.map(w => w.id === id ? updatedWorkspace : w))
      return updatedWorkspace
    } catch (error) {
      console.error('Failed to update workspace:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const deleteWorkspace = async (id: string): Promise<void> => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/workspaces/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete workspace')
      }

      setWorkspaces(prev => prev.filter(w => w.id !== id))
    } catch (error) {
      console.error('Failed to delete workspace:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const getWorkspaces = async (filters?: WorkspaceFilters): Promise<Workspace[]> => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams()
      if (filters?.search) queryParams.append('search', filters.search)
      if (filters?.sortBy) queryParams.append('sortBy', filters.sortBy)
      if (filters?.sortOrder) queryParams.append('sortOrder', filters.sortOrder)

      const response = await fetch(`/api/workspaces?${queryParams}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch workspaces')
      }

      const workspacesData: Workspace[] = await response.json()
      setWorkspaces(workspacesData)
      return workspacesData
    } catch (error) {
      console.error('Failed to fetch workspaces:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const getWorkspace = async (id: string): Promise<Workspace> => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/workspaces/${id}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch workspace')
      }

      const workspace: Workspace = await response.json()
      return workspace
    } catch (error) {
      console.error('Failed to fetch workspace:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    workspaces,
    isLoading,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    getWorkspaces,
    getWorkspace
  }
}

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const createTask = async (data: CreateTaskData): Promise<Task> => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/workspaces/${data.workspace_id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create task')
      }

      const newTask: Task = await response.json()
      setTasks(prev => [...prev, newTask])
      return newTask
    } catch (error) {
      console.error('Failed to create task:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const updateTask = async (id: string, data: UpdateTaskData): Promise<Task> => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update task')
      }

      const updatedTask: Task = await response.json()
      setTasks(prev => prev.map(t => t.id === id ? updatedTask : t))
      return updatedTask
    } catch (error) {
      console.error('Failed to update task:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const deleteTask = async (id: string): Promise<void> => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete task')
      }

      setTasks(prev => prev.filter(t => t.id !== id))
    } catch (error) {
      console.error('Failed to delete task:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const getTasks = async (workspaceId: string, filters?: TaskFilters) => {
    setIsLoading(true)
    try {
      // TODO: Replace with actual API call
      const queryParams = new URLSearchParams()
      if (filters?.search) queryParams.append('search', filters.search)
      if (filters?.status) queryParams.append('status', filters.status)
      if (filters?.priority) queryParams.append('priority', filters.priority)
      if (filters?.assignee_id) queryParams.append('assignee_id', filters.assignee_id)
      if (filters?.sortBy) queryParams.append('sortBy', filters.sortBy)
      if (filters?.sortOrder) queryParams.append('sortOrder', filters.sortOrder)

      const response = await fetch(`/api/workspaces/${workspaceId}/tasks?${queryParams}`)
      const tasksData: Task[] = await response.json()
      setTasks(tasksData)
      return tasksData
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const getTask = async (id: string) => {
    setIsLoading(true)
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/tasks/${id}`)
      const task: Task = await response.json()
      return task
    } catch (error) {
      console.error('Failed to fetch task:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTaskStatus = async (id: string, completed: boolean) => {
    return updateTask(id, {
      status: completed ? TaskStatus.COMPLETED : TaskStatus.TODO,
      completed_at: completed ? new Date().toISOString() : undefined
    })
  }

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    deleteTask,
    getTasks,
    getTask,
    toggleTaskStatus
  }
}