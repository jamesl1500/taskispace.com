/**
 * React Query hooks for task management features
 * Handles subtasks, comments, collaborators, tags, and activity
 * 
 * @module hooks/queries/useTaskManagementQueries
 */
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Subtask, 
  TaskCollaborator, 
  UpdateSubtaskData
} from '@/types/tasks'
import { subtasksApi, commentsApi, collaboratorsApi, activityApi, tagsApi } from '@/lib/api/taskManagement'

// Query keys for task management features
export const taskManagementKeys = {
  // Subtasks
  subtasks: {
    all: ['subtasks'] as const,
    byTask: (taskId: string) => [...taskManagementKeys.subtasks.all, 'task', taskId] as const,
  },
  // Comments
  comments: {
    all: ['comments'] as const,
    byTask: (taskId: string) => [...taskManagementKeys.comments.all, 'task', taskId] as const,
    byParent: (taskId: string, parentId: string) => [...taskManagementKeys.comments.byTask(taskId), 'parent', parentId] as const,
  },
  // Collaborators
  collaborators: {
    all: ['collaborators'] as const,
    byTask: (taskId: string) => [...taskManagementKeys.collaborators.all, 'task', taskId] as const,
  },
  // Activity
  activity: {
    all: ['activity'] as const,
    byTask: (taskId: string) => [...taskManagementKeys.activity.all, 'task', taskId] as const,
  },
  // Tags
  tags: {
    all: ['tags'] as const,
    byTask: (taskId: string) => [...taskManagementKeys.tags.all, 'task', taskId] as const,
    byWorkspace: (workspaceId: string) => [...taskManagementKeys.tags.all, 'workspace', workspaceId] as const,
  },
}

// ============================================================================
// SUBTASKS HOOKS
// ============================================================================

/**
 * Hook for fetching subtasks by task ID
 */
export function useSubtasks(taskId: string) {
  return useQuery({
    queryKey: taskManagementKeys.subtasks.byTask(taskId),
    queryFn: () => subtasksApi.getByTaskId(taskId),
    enabled: !!taskId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Mutation hook for creating a subtask
 */
export function useCreateSubtask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: subtasksApi.create,
    onSuccess: (newSubtask, variables) => {
      // Add to subtasks list
      queryClient.setQueryData(
        taskManagementKeys.subtasks.byTask(variables.task_id),
        (old: Subtask[] | undefined) => old ? [...old, newSubtask] : [newSubtask]
      )
    },
  })
}

/**
 * Mutation hook for updating a subtask
 */
export function useUpdateSubtask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSubtaskData }) =>
      subtasksApi.update(id, data),
    onSuccess: (updatedSubtask) => {
      // Update subtask in the list
      queryClient.setQueryData(
        taskManagementKeys.subtasks.byTask(updatedSubtask.task_id),
        (old: Subtask[] | undefined) =>
          old?.map(subtask => subtask.id === updatedSubtask.id ? updatedSubtask : subtask)
      )
    },
  })
}

/**
 * Mutation hook for deleting a subtask
 */
export function useDeleteSubtask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: subtasksApi.delete,
    onSuccess: (_, subtaskId) => {
      // Remove subtask from all relevant lists
      queryClient.setQueriesData(
        { queryKey: taskManagementKeys.subtasks.all },
        (old: Subtask[] | undefined) => old?.filter(subtask => subtask.id !== subtaskId)
      )
    },
  })
}

// ============================================================================
// COMMENTS HOOKS
// ============================================================================

/**
 * Hook for fetching comments by task ID
 */
export function useComments(taskId: string, parentId?: string) {
  return useQuery({
    queryKey: parentId
      ? taskManagementKeys.comments.byParent(taskId, parentId)
      : taskManagementKeys.comments.byTask(taskId),
    queryFn: () => commentsApi.getByTaskId(taskId, parentId),
    enabled: !!taskId,
    staleTime: 1 * 60 * 1000, // 1 minute
  })
}

/**
 * Mutation hook for creating a comment
 */
export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: commentsApi.create,
    onSuccess: (newComment, variables) => {
      // Invalidate and refetch comments
      queryClient.invalidateQueries({
        queryKey: taskManagementKeys.comments.byTask(variables.task_id)
      })
    },
  })
}

/**
 * Mutation hook for updating a comment
 */
export function useUpdateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      commentsApi.update(id, content),
    onSuccess: (updatedComment) => {
      // Invalidate and refetch comments
      queryClient.invalidateQueries({
        queryKey: taskManagementKeys.comments.byTask(updatedComment.task_id)
      })
    },
  })
}

/**
 * Mutation hook for deleting a comment
 */
export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: commentsApi.delete,
    onSuccess: () => {
      // Invalidate all comment queries since we don't know the task_id
      queryClient.invalidateQueries({
        queryKey: taskManagementKeys.comments.all
      })
    },
  })
}

// ============================================================================
// COLLABORATORS HOOKS
// ============================================================================

/**
 * Hook for fetching collaborators by task ID
 */
export function useCollaborators(taskId: string) {
  return useQuery({
    queryKey: taskManagementKeys.collaborators.byTask(taskId),
    queryFn: () => collaboratorsApi.getByTaskId(taskId),
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Mutation hook for adding a collaborator
 */
export function useAddCollaborator() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: collaboratorsApi.add,
    onSuccess: (newCollaborator, variables) => {
      // Add to collaborators list
      queryClient.setQueryData(
        taskManagementKeys.collaborators.byTask(variables.task_id),
        (old: TaskCollaborator[] | undefined) => old ? [...old, newCollaborator] : [newCollaborator]
      )
    },
  })
}

/**
 * Mutation hook for updating collaborator role
 */
export function useUpdateCollaboratorRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ collaboratorId, role }: { collaboratorId: string; role: string }) =>
      collaboratorsApi.updateRole(collaboratorId, role as 'assignee' | 'reviewer' | 'observer'),
    onSuccess: (updatedCollaborator) => {
      // Update collaborator in the list
      queryClient.setQueryData(
        taskManagementKeys.collaborators.byTask(updatedCollaborator.task_id),
        (old: TaskCollaborator[] | undefined) =>
          old?.map(collab => collab.id === updatedCollaborator.id ? updatedCollaborator : collab)
      )
    },
  })
}

/**
 * Mutation hook for removing a collaborator
 */
export function useRemoveCollaborator() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: collaboratorsApi.remove,
    onSuccess: (_, collaboratorId) => {
      // Remove collaborator from all relevant lists
      queryClient.setQueriesData(
        { queryKey: taskManagementKeys.collaborators.all },
        (old: TaskCollaborator[] | undefined) =>
          old?.filter(collab => collab.id !== collaboratorId)
      )
    },
  })
}

// ============================================================================
// ACTIVITY HOOKS
// ============================================================================

/**
 * Hook for fetching activity by task ID
 */
export function useActivity(taskId: string, options?: { limit?: number; offset?: number; type?: string }) {
  return useQuery({
    queryKey: [...taskManagementKeys.activity.byTask(taskId), options],
    queryFn: () => activityApi.getByTaskId(taskId, options),
    enabled: !!taskId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

// ============================================================================
// TAGS HOOKS
// ============================================================================

/**
 * Hook for fetching task tags
 */
export function useTaskTags(taskId: string) {
  return useQuery({
    queryKey: taskManagementKeys.tags.byTask(taskId),
    queryFn: () => tagsApi.getByTaskId(taskId),
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook for fetching workspace tags
 */
export function useWorkspaceTags(workspaceId: string) {
  return useQuery({
    queryKey: taskManagementKeys.tags.byWorkspace(workspaceId),
    queryFn: () => tagsApi.getByWorkspaceId(workspaceId),
    enabled: !!workspaceId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Mutation hook for adding a tag to a task
 */
export function useAddTaskTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, tagId, tagName, tagColor }: { 
      taskId: string; 
      tagId?: string; 
      tagName?: string; 
      tagColor?: string;
    }) => tagsApi.addToTask({ 
      task_id: taskId, 
      tag_id: tagId, 
      tag_name: tagName, 
      tag_color: tagColor 
    }),
    onSuccess: (newTaskTag, variables) => {
      // Add to task tags
      queryClient.invalidateQueries({
        queryKey: taskManagementKeys.tags.byTask(variables.taskId)
      })
    },
  })
}

/**
 * Mutation hook for removing a tag from a task
 */
export function useRemoveTaskTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (taskTagId: string) => tagsApi.removeFromTask(taskTagId),
    onSuccess: () => {
      // Invalidate all tag queries since we don't know the task_id
      queryClient.invalidateQueries({
        queryKey: taskManagementKeys.tags.all
      })
    },
  })
}