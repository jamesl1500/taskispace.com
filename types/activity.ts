/**
 * Activity Types
 * 
 * Defines types and interfaces related to user activities.
 * 
 * @module types/activity
 */

export interface Activity {
  id: string
  actor: string
  type: 'login' | 'logout' | 'task_created' | 'task_completed' | 'workspace_joined' | 'workspace_left' | 'post_added' | 'liked_post' | 'comment_added' | 'file_uploaded'
  timestamp: string
  payload?: Record<string, number>
}

export interface ActivityLog {
  activities: Activity[]
  totalCount: number
}

export interface ActivityFilter {
  actor?: string
  type?: Activity['type']
  startDate?: string
  endDate?: string
}

export interface CreateActivityInput {
  actor: string
  type: Activity['type']
  payload?: Record<string, number>
}