/**
 * React Query hooks for workspace operations
 * Handles workspace CRUD operations with proper caching and optimistic updates
 * 
 * @module hooks/queries/useWorkspaceQueries
 */
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Workspace, CreateWorkspaceData, UpdateWorkspaceData, WorkspaceFilters } from '@/types/workspaces'

// Query keys
export const workspaceKeys = {
  all: ['workspaces'] as const,
  lists: () => [...workspaceKeys.all, 'list'] as const,
  list: (filters?: WorkspaceFilters) => [...workspaceKeys.lists(), filters] as const,
  details: () => [...workspaceKeys.all, 'detail'] as const,
  detail: (id: string) => [...workspaceKeys.details(), id] as const,
  tasks: (id: string) => [...workspaceKeys.detail(id), 'tasks'] as const,
}

// Workspace service functions
const workspaceService = {
  getWorkspaces: async (filters?: WorkspaceFilters): Promise<Workspace[]> => {
    const params = new URLSearchParams()
    if (filters?.sortBy) params.append('sortBy', filters.sortBy)
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder)
    
    const response = await fetch(`/api/workspaces?${params.toString()}`)
    if (!response.ok) throw new Error('Failed to fetch workspaces')
    return response.json()
  },

  getWorkspace: async (id: string): Promise<Workspace> => {
    const response = await fetch(`/api/workspaces/${id}`)
    if (!response.ok) throw new Error('Failed to fetch workspace')
    return response.json()
  },

  createWorkspace: async (data: CreateWorkspaceData): Promise<Workspace> => {
    const response = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create workspace')
    return response.json()
  },

  updateWorkspace: async (id: string, data: UpdateWorkspaceData): Promise<Workspace> => {
    const response = await fetch(`/api/workspaces/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update workspace')
    return response.json()
  },

  deleteWorkspace: async (id: string): Promise<void> => {
    const response = await fetch(`/api/workspaces/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete workspace')
  },

  getWorkspaceTasks: async (id: string) => {
    const response = await fetch(`/api/workspaces/${id}/tasks`)
    if (!response.ok) throw new Error('Failed to fetch workspace tasks')
    return response.json()
  },
}

/**
 * Hook for fetching all workspaces
 */
export function useWorkspaces(filters?: WorkspaceFilters) {
  return useQuery({
    queryKey: workspaceKeys.list(filters),
    queryFn: () => workspaceService.getWorkspaces(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for fetching a single workspace
 */
export function useWorkspace(id: string) {
  return useQuery({
    queryKey: workspaceKeys.detail(id),
    queryFn: () => workspaceService.getWorkspace(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for fetching workspace tasks
 */
export function useTasksInWorkspace(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.tasks(workspaceId),
    queryFn: () => workspaceService.getWorkspaceTasks(workspaceId),
    enabled: !!workspaceId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Mutation hook for creating a workspace
 */
export function useCreateWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: workspaceService.createWorkspace,
    onSuccess: (newWorkspace) => {
      // Add to workspaces list
      queryClient.setQueryData(workspaceKeys.lists(), (old: Workspace[] | undefined) => {
        return old ? [...old, newWorkspace] : [newWorkspace]
      })
      
      // Set individual workspace data if it has an ID
      if (newWorkspace.id) {
        queryClient.setQueryData(workspaceKeys.detail(newWorkspace.id), newWorkspace)
      }
    },
  })
}

/**
 * Mutation hook for updating a workspace
 */
export function useUpdateWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWorkspaceData }) =>
      workspaceService.updateWorkspace(id, data),
    onSuccess: (updatedWorkspace, { id }) => {
      // Update in workspaces list
      queryClient.setQueryData(workspaceKeys.lists(), (old: Workspace[] | undefined) => {
        return old?.map(workspace => 
          workspace.id === id ? updatedWorkspace : workspace
        )
      })
      
      // Update individual workspace data
      queryClient.setQueryData(workspaceKeys.detail(id), updatedWorkspace)
    },
  })
}

/**
 * Mutation hook for deleting a workspace
 */
export function useDeleteWorkspace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: workspaceService.deleteWorkspace,
    onSuccess: (_, deletedId) => {
      // Remove from workspaces list
      queryClient.setQueryData(workspaceKeys.lists(), (old: Workspace[] | undefined) => {
        return old?.filter(workspace => workspace.id !== deletedId)
      })
      
      // Remove individual workspace data
      queryClient.removeQueries({ queryKey: workspaceKeys.detail(deletedId) })
      queryClient.removeQueries({ queryKey: workspaceKeys.tasks(deletedId) })
    },
  })
}