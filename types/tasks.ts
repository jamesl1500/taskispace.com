/**
 * Task-related types and enums
 * 
 * @module types/tasks
 */

/**
 * Task Interface
 */
export interface Task {
  id: string
  list_id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  workspace_id: string
  assignee_id?: string
  created_by: string
  due_date?: string
  created_at: string
  updated_at: string
  completed_at?: string
  tags?: string[]
}

/**
 * Task Tag Interface
 */
export interface TaskTag {
  task_id: string
  tag_id: string
  created_at: string
  updated_at: string
}

/**
 * Tag Interface
 */
export interface Tag {
  id: string
  workspace_id: string
  name: string
  color?: string
  created_at: string
  updated_at: string
}

/**
 * Task Filters Interface
 */
export interface TaskFilters {
  search?: string
  status?: TaskStatus
  priority?: TaskPriority
  assignee_id?: string
  sortBy?: 'title' | 'priority' | 'due_date' | 'created_at' | 'updated_at'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Create Task Data Interface
 */
export interface CreateTaskData {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  workspace_id: string
  assignee_id?: string
  due_date?: string
  tags?: string[]
}

/**
 * Update Task Data Interface
 */
export interface UpdateTaskData {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assignee_id?: string
  due_date?: string
  tags?: string[]
  completed_at?: string
}

/**
 * Task Status Enum
 */
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress', 
  IN_REVIEW = 'in_review',
  COMPLETED = 'completed'
}

/**
 * Task Priority Enum
 */
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}