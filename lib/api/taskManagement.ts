// API client utilities for task management features

// Subtasks API
export const subtasksApi = {
  // Get subtasks for a task
  getByTaskId: async (taskId: string) => {
    const response = await fetch(`/api/subtasks?task_id=${taskId}`)
    if (!response.ok) throw new Error('Failed to fetch subtasks')
    return response.json()
  },

  // Create a new subtask
  create: async (data: { title: string; task_id: string; description?: string }) => {
    const response = await fetch('/api/subtasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to create subtask')
    return response.json()
  },

  // Update subtask
  update: async (id: string, data: { title?: string; description?: string; completed?: boolean }) => {
    const response = await fetch(`/api/subtasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to update subtask')
    return response.json()
  },

  // Delete subtask
  delete: async (id: string) => {
    const response = await fetch(`/api/subtasks/${id}`, { method: 'DELETE' })
    if (!response.ok) throw new Error('Failed to delete subtask')
    return response.json()
  }
}

// Task Collaborators API
export const collaboratorsApi = {
  // Get collaborators for a task
  getByTaskId: async (taskId: string) => {
    const response = await fetch(`/api/task-collaborators?task_id=${taskId}`)
    if (!response.ok) throw new Error('Failed to fetch collaborators')
    return response.json()
  },

  // Add collaborator to task
  add: async (data: { task_id: string; user_id: string; role: 'assignee' | 'reviewer' | 'observer' }) => {
    const response = await fetch('/api/task-collaborators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to add collaborator')
    return response.json()
  },

  // Update collaborator role
  updateRole: async (collaboratorId: string, role: 'assignee' | 'reviewer' | 'observer') => {
    const response = await fetch(`/api/task-collaborators/${collaboratorId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    })
    if (!response.ok) throw new Error('Failed to update collaborator role')
    return response.json()
  },

  // Remove collaborator
  remove: async (collaboratorId: string) => {
    const response = await fetch(`/api/task-collaborators/${collaboratorId}`, { method: 'DELETE' })
    if (!response.ok) throw new Error('Failed to remove collaborator')
    return response.json()
  }
}

// Task Comments API
export const commentsApi = {
  // Get comments for a task
  getByTaskId: async (taskId: string, parentId?: string) => {
    const url = parentId 
      ? `/api/task-comments?task_id=${taskId}&parent_id=${parentId}`
      : `/api/task-comments?task_id=${taskId}`
    const response = await fetch(url)
    if (!response.ok) throw new Error('Failed to fetch comments')
    return response.json()
  },

  // Create comment
  create: async (data: { task_id: string; content: string; parent_id?: string }) => {
    const response = await fetch('/api/task-comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to create comment')
    return response.json()
  },

  // Update comment
  update: async (commentId: string, content: string) => {
    const response = await fetch(`/api/task-comments/${commentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    })
    if (!response.ok) throw new Error('Failed to update comment')
    return response.json()
  },

  // Delete comment
  delete: async (commentId: string) => {
    const response = await fetch(`/api/task-comments/${commentId}`, { method: 'DELETE' })
    if (!response.ok) throw new Error('Failed to delete comment')
    return response.json()
  }
}

// Task Tags API
export const tagsApi = {
  // Get tags for a task
  getByTaskId: async (taskId: string) => {
    const response = await fetch(`/api/task-tags?task_id=${taskId}`)
    if (!response.ok) throw new Error('Failed to fetch task tags')
    return response.json()
  },

  // Get all tags for workspace
  getByWorkspaceId: async (workspaceId: string) => {
    const response = await fetch(`/api/task-tags?workspace_id=${workspaceId}`)
    if (!response.ok) throw new Error('Failed to fetch workspace tags')
    return response.json()
  },

  // Add tag to task
  addToTask: async (data: { task_id: string; tag_id?: string; tag_name?: string; tag_color?: string }) => {
    const response = await fetch('/api/task-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to add tag to task')
    return response.json()
  },

  // Remove tag from task
  removeFromTask: async (taskTagId: string) => {
    const response = await fetch(`/api/task-tags/${taskTagId}`, { method: 'DELETE' })
    if (!response.ok) throw new Error('Failed to remove tag from task')
    return response.json()
  }
}

// Task Activity API
export const activityApi = {
  // Get activity for a task
  getByTaskId: async (taskId: string, options?: { limit?: number; offset?: number; type?: string }) => {
    const params = new URLSearchParams({ task_id: taskId })
    if (options?.limit) params.append('limit', options.limit.toString())
    if (options?.offset) params.append('offset', options.offset.toString())
    if (options?.type) params.append('type', options.type)
    
    const response = await fetch(`/api/task-activity?${params.toString()}`)
    if (!response.ok) throw new Error('Failed to fetch task activity')
    return response.json()
  },

  // Create activity entry
  create: async (data: { task_id: string; type: string; payload?: Record<string, unknown> }) => {
    const response = await fetch('/api/task-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    if (!response.ok) throw new Error('Failed to create activity entry')
    return response.json()
  }
}