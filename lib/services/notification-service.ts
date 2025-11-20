import { createClient } from '@/lib/supabase/client';
import type { 
  Notification, 
  NotificationPreferences,
  CreateNotificationPayload, 
  NotificationFilters,
  NotificationStats,
  NotificationType 
} from '@/types/notifications';

const supabase = createClient();

export class NotificationService {
  // Get notifications for the current user
  static async getNotifications(filters?: NotificationFilters) {
    let query = supabase
      .from('notifications')
      .select(`
        *
      `)
      .order('created_at', { ascending: false });

    if (filters?.type) {
      query = query.in('type', filters.type);
    }

    if (filters?.read !== undefined) {
      query = query.eq('read', filters.read);
    }

    if (filters?.workspace_id) {
      query = query.eq('workspace_id', filters.workspace_id);
    }

    if (filters?.list_id) {
      query = query.eq('list_id', filters.list_id);
    }

    if (filters?.task_id) {
      query = query.eq('task_id', filters.task_id);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1);
    }

    const { data: notifications, error } = await query;

    if (error) throw error;

    // Fetch profile data for users who triggered notifications
    const notificationsWithProfiles = await Promise.all(
      notifications.map(async (notification) => {
        let triggered_by_profile = null;
        
        if (notification.triggered_by) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_name, display_name, avatar_url')
            .eq('id', notification.triggered_by)
            .single();
          
          triggered_by_profile = profile;
        }
        
        return {
          ...notification,
          triggered_by_profile
        };
      })
    );

    return notificationsWithProfiles as (Notification & { triggered_by_profile?: { user_name: string; display_name: string | null; avatar_url: string | null } })[];
  }

  // Get notification statistics
  static async getNotificationStats(): Promise<NotificationStats> {
    const { data, error } = await supabase
      .from('notifications')
      .select('type, read');

    if (error) throw error;

    const stats: NotificationStats = {
      unread_count: 0,
      total_count: data.length,
      by_type: {} as Record<NotificationType, number>
    };

    data.forEach(notification => {
      if (!notification.read) {
        stats.unread_count++;
      }
      
      const type = notification.type as NotificationType;
      stats.by_type[type] = (stats.by_type[type] || 0) + 1;
    });

    return stats;
  }

  // Mark notification as read
  static async markAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  }

  // Mark notification as unread
  static async markAsUnread(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: false })
      .eq('id', notificationId);

    if (error) throw error;
  }

  // Mark all notifications as read
  static async markAllAsRead() {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false);

    if (error) throw error;
  }

  // Delete notification
  static async deleteNotification(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
  }

  // Delete all read notifications
  static async deleteAllRead() {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('read', true);

    if (error) throw error;
  }

  // Create a new notification
  static async createNotification(payload: CreateNotificationPayload) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data as Notification;
  }

  // Get notification preferences
  static async getNotificationPreferences() {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .single();

    if (error) {
      // If no preferences exist, create default ones
      if (error.code === 'PGRST116') {
        return await this.createDefaultPreferences();
      }
      throw error;
    }

    return data as NotificationPreferences;
  }

  // Get notification preference
  static async getNotificationPreference<K extends keyof NotificationPreferences>(key: K): Promise<NotificationPreferences[K] | null> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select(key as string)
      .single();

    if (error) throw error;
    return data ? (data as unknown as Record<string, unknown>)[key] as NotificationPreferences[K] : null;
  }

  // Update notification preferences
  static async updateNotificationPreferences(preferences: Partial<NotificationPreferences>) {
    const { data, error } = await supabase
      .from('notification_preferences')
      .upsert([preferences])
      .select()
      .single();

    if (error) throw error;
    return data as NotificationPreferences;
  }

  // Create default notification preferences
  private static async createDefaultPreferences() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const defaultPreferences = {
      user_id: user.id,
      email_notifications: true,
      push_notifications: true,
      task_assignments: true,
      task_comments: true,
      task_due_reminders: true,
      workspace_invitations: true,
      list_sharing: true,
      conversation_messages: true,
      mentions: true
    };

    const { data, error } = await supabase
      .from('notification_preferences')
      .insert([defaultPreferences])
      .select()
      .single();

    if (error) throw error;
    return data as NotificationPreferences;
  }

  // Subscribe to real-time notifications
  static subscribeToNotifications(userId: string, onNotification: (notification: Notification) => void) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          onNotification(payload.new as Notification);
        }
      )
      .subscribe();
  }

  // Helper methods for creating specific notification types
  static async notifyTaskAssignment(userId: string, taskId: string, taskTitle: string, assignedBy: string) {
    return this.createNotification({
      user_id: userId,
      type: 'task_assigned',
      title: 'New Task Assignment',
      message: `You have been assigned to task: ${taskTitle}`,
      task_id: taskId,
      triggered_by: assignedBy,
      metadata: { task_title: taskTitle }
    });
  }

  static async notifyTaskComment(userId: string, taskId: string, taskTitle: string, commenterName: string, commenterId: string) {
    return this.createNotification({
      user_id: userId,
      type: 'task_comment',
      title: 'New Comment',
      message: `${commenterName} commented on: ${taskTitle}`,
      task_id: taskId,
      triggered_by: commenterId,
      metadata: { task_title: taskTitle, commenter_name: commenterName }
    });
  }

  static async notifyTaskDueSoon(userId: string, taskId: string, taskTitle: string, dueDate: string) {
    return this.createNotification({
      user_id: userId,
      type: 'task_due_soon',
      title: 'Task Due Soon',
      message: `Task "${taskTitle}" is due soon`,
      task_id: taskId,
      metadata: { task_title: taskTitle, due_date: dueDate }
    });
  }

  static async notifyWorkspaceInvitation(userId: string, workspaceId: string, workspaceName: string, invitedBy: string) {
    return this.createNotification({
      user_id: userId,
      type: 'workspace_invitation',
      title: 'Workspace Invitation',
      message: `You have been invited to workspace: ${workspaceName}`,
      workspace_id: workspaceId,
      triggered_by: invitedBy,
      metadata: { workspace_name: workspaceName }
    });
  }

  static async notifyConversationMessage(userId: string, conversationId: string, conversationTitle: string, senderName: string, senderId: string) {
    return this.createNotification({
      user_id: userId,
      type: 'conversation_message',
      title: 'New Message',
      message: `${senderName} sent a message in: ${conversationTitle}`,
      conversation_id: conversationId,
      triggered_by: senderId,
      metadata: { conversation_title: conversationTitle, sender_name: senderName }
    });
  }
}