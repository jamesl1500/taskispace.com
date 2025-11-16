import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Bell, 
  MessageSquare, 
  Calendar, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  AtSign,
  Share
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import UserAvatar from '@/components/user/UserAvatar';
import { 
  useNotifications, 
  useMarkNotificationRead,
  useMarkNotificationUnread,
  useDeleteNotification 
} from '@/hooks/useNotifications';
import type { NotificationFilters, NotificationType, Notification } from '@/types/notifications';

type NotificationWithProfile = Notification & { 
  triggered_by_profile?: { 
    user_name: string; 
    display_name: string | null; 
    avatar_url: string | null 
  } 
};
import { cn } from '@/lib/utils';

interface NotificationListProps {
  filters?: NotificationFilters;
  limit?: number;
  showActions?: boolean;
  className?: string;
}

const notificationIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  task_assigned: Calendar,
  task_comment: MessageSquare,
  task_due_soon: AlertTriangle,
  task_overdue: AlertTriangle,
  workspace_invitation: Users,
  list_shared: Share,
  conversation_message: MessageSquare,
  subtask_completed: CheckCircle2,
  task_completed: CheckCircle2,
  mention: AtSign,
};

const notificationColors: Record<NotificationType, string> = {
  task_assigned: 'text-blue-600',
  task_comment: 'text-green-600',
  task_due_soon: 'text-orange-600',
  task_overdue: 'text-red-600',
  workspace_invitation: 'text-purple-600',
  list_shared: 'text-indigo-600',
  conversation_message: 'text-teal-600',
  subtask_completed: 'text-emerald-600',
  task_completed: 'text-emerald-600',
  mention: 'text-yellow-600',
};

export function NotificationList({ 
  filters, 
  limit = 20, 
  showActions = true,
  className 
}: NotificationListProps) {
  const { data: notifications, isLoading, error } = useNotifications({ ...filters, limit });
  const markAsRead = useMarkNotificationRead();
  const markAsUnread = useMarkNotificationUnread();
  const deleteNotification = useDeleteNotification();

  const handleMarkRead = (notificationId: string, isRead: boolean) => {
    if (isRead) {
      markAsUnread.mutate(notificationId);
    } else {
      markAsRead.mutate(notificationId);
    }
  };

  const handleDelete = (notificationId: string) => {
    deleteNotification.mutate(notificationId);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load notifications</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2" />
            <p>No notifications yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="divide-y">
          {notifications.map((notification) => {
            const IconComponent = notificationIcons[notification.type];
            const iconColor = notificationColors[notification.type];
            
            return (
              <div
                key={notification.id}
                className={cn(
                  "p-4 hover:bg-muted/50 transition-colors",
                  !notification.read && "bg-blue-50/50 border-l-4 border-l-blue-500"
                )}
              >
                <div className="flex items-start space-x-3">
                  <div className={cn("mt-1", iconColor)}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-foreground">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { 
                              addSuffix: true 
                            })}
                          </span>
                          
                          {notification.triggered_by && (
                            <div className="flex items-center gap-1">
                              <UserAvatar 
                                userId={notification.triggered_by}
                                size={20}
                              />
                              <span className="text-xs text-muted-foreground">
                                {(notification as NotificationWithProfile).triggered_by_profile?.display_name || 
                                 (notification as NotificationWithProfile).triggered_by_profile?.user_name || 
                                 'Unknown user'}
                              </span>
                            </div>
                          )}
                          
                          {!notification.read && (
                            <Badge variant="secondary" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {showActions && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkRead(notification.id, notification.read)}
                            className="text-xs"
                          >
                            {notification.read ? 'Mark unread' : 'Mark read'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(notification.id)}
                            className="text-xs text-muted-foreground hover:text-destructive"
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}