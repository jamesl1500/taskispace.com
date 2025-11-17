import React, { useEffect } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { NotificationList } from './NotificationList';
import { useNotificationStats, useMarkAllNotificationsRead } from '@/hooks/useNotifications';
import { NotificationService } from '@/lib/services/notification-service';
import { useAuth } from '@/hooks/useAuth';
import type { Notification } from '@/types/notifications';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const { user } = useAuth();
  const { data: stats } = useNotificationStats();
  const markAllRead = useMarkAllNotificationsRead();

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = NotificationService.subscribeToNotifications(
      user.id,
      (notification) => {
        // Show browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id
          });
        }
      }
    );

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const unreadCount = stats?.unread_count || 0;
  const hasUnread = unreadCount > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`relative ${className}`}>
          {hasUnread ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <DropdownMenuLabel className="text-sm font-semibold">
            Notifications
          </DropdownMenuLabel>
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="text-xs"
            >
              Mark all read
            </Button>
          )}
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          <NotificationList 
            limit={10} 
            showActions={false}
            className="border-0 shadow-none"
          />
        </div>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/notifications" className="w-full text-center text-sm font-medium">
            View all notifications
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}