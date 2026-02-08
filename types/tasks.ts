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
  assignee?: string
  created_by: string
  due_date?: string
  created_at: string
  updated_at: string
  completed_at?: string
}

/**
 * Subtask Interface
 */
export interface Subtask {
  id: string
  task_id: string
  title: string
  description?: string
  completed: boolean
  completed_at?: string
  created_at: string
  updated_at: string
}

/**
 * Task Comment Interface
 */
export interface TaskComment {
  id: string
  task_id: string
  author: string
  parent_id?: string
  content: string
  is_deleted?: boolean
  deleted_at?: string
  edited_at?: string
  created_at: string
}

/**
 * Task Collaborator Interface
 */
export interface TaskCollaborator {
  id: string
  task_id: string
  user_id: string
  role: TaskCollaboratorRole
  added_by: string
  created_at: string
}

export interface TaskCollaboratorWithTask extends TaskCollaborator {
  tasks: {
    list_id: string
    created_by?: string
  }
}

/**
 * Task Activity Interface
 */
export interface TaskActivity {
  id: number
  task_id: string
  actor: string
  type: TaskActivityType
  payload: Record<string, unknown>
  created_at: string
}

/**
 * Task Tag Interface
 */
export interface TaskTag {
  task_id: string
  tag_id: string
  task_tag_id: string
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
  workspace_id?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  list_id: string
  assignee_id?: string
  tags?: string[]
  due_date?: string
}

/**
 * Update Task Data Interface
 */
export interface UpdateTaskData {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  assignee?: string
  due_date?: string
  completed_at?: string
}

/**
 * Create Subtask Data Interface
 */
export interface CreateSubtaskData {
  title: string
  task_id: string
  description?: string
}

export interface TaskTagWithTag {
  task_tag_id: string
  task_id: string
  tag_id: string
  created_at: string
  tags: {
    id: string
    name: string
    color: string
    workspace_id: string
    created_at: string
  }
}

export interface TaskTagWithTaskAndTag {
  id: string
  task_id: string
  tag_id: string
  created_at: string
  tasks: {
    list_id: string
  }
  tags: {
    name: string
    color: string
  }
}

/**
 * Update Subtask Data Interface
 */
export interface UpdateSubtaskData {
  title?: string
  done?: boolean
  description?: string
}

/**
 * Create Task Comment Data Interface
 */
export interface CreateTaskCommentData {
  task_id: string
  content: string
  parent_id?: string
}

/**
 * Update Task Comment Data Interface
 */
export interface UpdateTaskCommentData {
  content: string
}

/**
 * Create Task Collaborator Data Interface
 */
export interface CreateTaskCollaboratorData {
  task_id: string
  user_id: string
  role: TaskCollaboratorRole
}

/**
 * Create Task Tag Data Interface
 */
export interface CreateTaskTagData {
  task_id: string
  tag_id: string
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
  HIGH = 'high'
}

/**
 * Task Collaborator Role Enum
 */
export enum TaskCollaboratorRole {
  OWNER = 'owner',
  ASSIGNEE = 'assignee',
  REVIEWER = 'reviewer',
  OBSERVER = 'observer'
}

/**
 * Task Activity Types
 */
export type TaskActivityType = 
  | 'task_created'
  | 'task_updated' 
  | 'task_edited'
  | 'task_completed'
  | 'task_status_changed'
  | 'comment_added'
  | 'comment_reply_added'
  | 'comment_edited'
  | 'comment_deleted'
  | 'subtask_added'
  | 'subtask_completed'
  | 'subtask_updated'
  | 'subtask_deleted'
  | 'collaborator_added'
  | 'collaborator_removed'
  | 'collaborator_role_updated'
  | 'tag_added'
  | 'tag_removed'
  | 'due_date_changed'
  | 'priority_changed'