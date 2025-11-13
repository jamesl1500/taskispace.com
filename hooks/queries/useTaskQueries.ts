/**
 * React Query hooks for task operations
 * Handles task CRUD operations with proper caching and optimistic updates
 * 
 * @module hooks/queries/useTaskQueries
 */
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Task, CreateTaskData, UpdateTaskData, TaskFilters, TaskStatus } from '@/types/tasks'

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters?: TaskFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  workspace: (workspaceId: string) => [...taskKeys.all, 'workspace', workspaceId] as const,
  userTasks: () => [...taskKeys.all, 'user-tasks'] as const,
}

// Task service functions
const taskService = {
  getTasks: async (filters?: TaskFilters): Promise<Task[]> => {
    const params = new URLSearchParams()
    if (filters?.search) params.append('search', filters.search)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.priority) params.append('priority', filters.priority)
    if (filters?.sortBy) params.append('sortBy', filters.sortBy)
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)
    if (filters?.assignee_id) params.append('assignee_id', filters.assignee_id)
    
    const response = await fetch(`/api/tasks?${params.toString()}`)
    if (!response.ok) throw new Error('Failed to fetch tasks')
    return response.json()
  },

  getTask: async (id: string): Promise<Task> => {
    const response = await fetch(`/api/tasks/${id}`)
    if (!response.ok) throw new Error('Failed to fetch task')
    return response.json()
  },

  createTask: async (data: CreateTaskData): Promise<Task> => {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create task')
    return response.json()
  },

  updateTask: async (id: string, data: UpdateTaskData): Promise<Task> => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update task')
    return response.json()
  },

  deleteTask: async (id: string): Promise<void> => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete task')
  },

  getWorkspaceTasks: async (workspaceId: string): Promise<Task[]> => {
    const response = await fetch(`/api/workspaces/${workspaceId}/tasks`)
    if (!response.ok) throw new Error('Failed to fetch workspace tasks')
    return response.json()
  },

  getAllUserTasks: async (): Promise<Task[]> => {
    // This will load tasks from all user's workspaces
    const workspacesResponse = await fetch('/api/workspaces')
    if (!workspacesResponse.ok) throw new Error('Failed to load workspaces')
    const workspaces = await workspacesResponse.json()

    const allTasks: Task[] = []

    // Load tasks from each workspace
    for (const workspace of workspaces) {
      try {
        const listsResponse = await fetch(`/api/lists?workspace_id=${workspace.id}`)
        if (!listsResponse.ok) continue
        
        const lists = await listsResponse.json()

        for (const list of lists) {
          try {
            const tasksResponse = await fetch(`/api/tasks?list_id=${list.id}`)
            if (!tasksResponse.ok) continue
            
            const tasks = await tasksResponse.json()
            const tasksWithWorkspace = tasks.map((task: Task) => ({
              ...task,
              workspace: workspace
            }))
            
            allTasks.push(...tasksWithWorkspace)
          } catch (error) {
            console.error(`Failed to load tasks for list ${list.id}:`, error)
          }
        }
      } catch (error) {
        console.error(`Failed to load lists for workspace ${workspace.id}:`, error)
      }
    }

    return allTasks
  },
}

/**
 * Hook for fetching tasks with filters
 */
export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => taskService.getTasks(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for fetching all user tasks across workspaces
 */
export function useAllUserTasks() {
  return useQuery({
    queryKey: taskKeys.userTasks(),
    queryFn: taskService.getAllUserTasks,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for fetching a single task
 */
export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => taskService.getTask(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * Hook for fetching workspace tasks
 */
export function useWorkspaceTasks(workspaceId: string) {
  return useQuery({
    queryKey: taskKeys.workspace(workspaceId),
    queryFn: () => taskService.getWorkspaceTasks(workspaceId),
    enabled: !!workspaceId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Mutation hook for creating a task
 */
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: taskService.createTask,
    onSuccess: (newTask) => {
      // Invalidate and refetch task lists
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      queryClient.invalidateQueries({ queryKey: taskKeys.userTasks() })
      
      // Set individual task data if it has an ID
      if (newTask.id) {
        queryClient.setQueryData(taskKeys.detail(newTask.id), newTask)
      }
    },
  })
}

/**
 * Mutation hook for updating a task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskData }) =>
      taskService.updateTask(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) })

      // Snapshot the previous value
      const previousTask = queryClient.getQueryData(taskKeys.detail(id))

      // Optimistically update to the new value
      queryClient.setQueryData(taskKeys.detail(id), (old: Task | undefined) => {
        return old ? { ...old, ...data } : undefined
      })

      return { previousTask }
    },
    onError: (err, { id }, context) => {
      // Rollback to previous value on error
      queryClient.setQueryData(taskKeys.detail(id), context?.previousTask)
    },
    onSuccess: (updatedTask, { id }) => {
      // Update individual task data
      queryClient.setQueryData(taskKeys.detail(id), updatedTask)
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      queryClient.invalidateQueries({ queryKey: taskKeys.userTasks() })
    },
  })
}

/**
 * Mutation hook for deleting a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: taskService.deleteTask,
    onSuccess: (_, deletedId) => {
      // Remove individual task data
      queryClient.removeQueries({ queryKey: taskKeys.detail(deletedId) })
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() })
      queryClient.invalidateQueries({ queryKey: taskKeys.userTasks() })
      queryClient.invalidateQueries({ queryKey: taskKeys.all })
    },
  })
}

/**
 * Mutation hook for toggling task status
 */
export function useToggleTaskStatus() {
  const { mutate: updateTask, ...rest } = useUpdateTask()

  const toggleStatus = (id: string, currentStatus: TaskStatus) => {
    const newStatus = currentStatus === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED
    const updateData: UpdateTaskData = {
      status: newStatus,
      completed_at: newStatus === TaskStatus.COMPLETED ? new Date().toISOString() : undefined
    }
    
    updateTask({ id, data: updateData })
  }

  return {
    toggleStatus,
    ...rest,
  }
}