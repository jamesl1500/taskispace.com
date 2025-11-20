import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/hooks/useNotifications';
import { toast } from 'sonner';

export function NotificationPreferences() {
  const { data: preferences, isLoading } = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();

  const handlePreferenceChange = async (key: string, value: boolean) => {
    try {
      await updatePreferences.mutateAsync({
        [key]: value
      });
      toast.success('Preferences updated');
    } catch {
      toast.error('Failed to update preferences');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Manage how and when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-11" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>Failed to load notification preferences</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const preferenceItems = [
    {
      key: 'email_notifications',
      title: 'Email Notifications',
      description: 'Receive notifications via email'
    },
    {
      key: 'push_notifications',
      title: 'Browser Notifications',
      description: 'Show desktop notifications in your browser'
    },
    {
      key: 'task_assignments',
      title: 'Task Assignments',
      description: 'When you are assigned to a task'
    },
    {
      key: 'task_comments',
      title: 'Task Comments',
      description: 'When someone comments on your tasks'
    },
    {
      key: 'task_due_reminders',
      title: 'Due Date Reminders',
      description: 'Reminders for upcoming and overdue tasks'
    },
    {
      key: 'workspace_invitations',
      title: 'Workspace Invitations',
      description: 'When you are invited to join a workspace'
    },
    {
      key: 'list_sharing',
      title: 'List Sharing',
      description: 'When a list is shared with you'
    },
    {
      key: 'conversation_messages',
      title: 'Conversation Messages',
      description: 'New messages in conversations you are part of'
    },
    {
      key: 'mentions',
      title: 'Mentions',
      description: 'When you are mentioned in comments or messages'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Manage how and when you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {preferenceItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor={item.key} className="text-base">
                {item.title}
              </Label>
              <div className="text-sm text-muted-foreground">
                {item.description}
              </div>
            </div>
            <Switch
              id={item.key}
              checked={preferences[item.key as keyof typeof preferences] as boolean}
              onCheckedChange={(checked) => handlePreferenceChange(item.key, checked)}
              disabled={updatePreferences.isPending}
            />
          </div>
        ))}
        
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">
                Browser Notification Permission
              </Label>
              <div className="text-sm text-muted-foreground">
                Allow TaskiSpace to show desktop notifications
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if ('Notification' in window) {
                  Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                      toast.success('Notifications enabled');
                    } else {
                      toast.error('Notifications not allowed');
                    }
                  });
                }
              }}
              disabled={
                'Notification' in window && 
                Notification.permission === 'granted'
              }
            >
              {
                'Notification' in window && Notification.permission === 'granted'
                  ? 'Enabled'
                  : 'Enable'
              }
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}