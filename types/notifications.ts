export type NotificationType = 
  | 'task_assigned'
  | 'task_comment' 
  | 'task_due_soon'
  | 'task_overdue'
  | 'workspace_invitation'
  | 'list_shared'
  | 'conversation_message'
  | 'subtask_completed'
  | 'task_completed'
  | 'mention';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  read: boolean;
  created_at: string;
  updated_at: string;
  task_id?: string;
  workspace_id?: string;
  list_id?: string;
  conversation_id?: string;
  triggered_by?: string;
}

export interface NotificationPreferences {
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  task_assignments: boolean;
  task_comments: boolean;
  task_due_reminders: boolean;
  workspace_invitations: boolean;
  list_sharing: boolean;
  conversation_messages: boolean;
  mentions: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationPayload {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  task_id?: string;
  workspace_id?: string;
  list_id?: string;
  conversation_id?: string;
  triggered_by?: string;
}

export interface NotificationFilters {
  type?: NotificationType[];
  read?: boolean;
  workspace_id?: string;
  list_id?: string;
  task_id?: string;
  limit?: number;
  offset?: number;
}

export interface NotificationStats {
  unread_count: number;
  total_count: number;
  by_type: Record<NotificationType, number>;
}