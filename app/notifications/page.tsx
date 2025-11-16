'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Filter, MoreHorizontal, Trash2, CheckCheck } from 'lucide-react';
import { NotificationList } from '@/components/notifications/NotificationList';
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences';
import { 
  useNotificationStats,
  useMarkAllNotificationsRead,
  useDeleteAllReadNotifications
} from '@/hooks/useNotifications';
import type { NotificationFilters, NotificationType } from '@/types/notifications';

const notificationTypeLabels: Record<NotificationType, string> = {
  task_assigned: 'Task Assignments',
  task_comment: 'Task Comments', 
  task_due_soon: 'Due Soon',
  task_overdue: 'Overdue',
  workspace_invitation: 'Workspace Invitations',
  list_shared: 'List Sharing',
  conversation_message: 'Messages',
  subtask_completed: 'Subtask Completed',
  task_completed: 'Task Completed',
  mention: 'Mentions',
};

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [typeFilter, setTypeFilter] = useState<NotificationType | null>(null);
  
  const { data: stats } = useNotificationStats();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteAllRead = useDeleteAllReadNotifications();

  const getFilters = (): NotificationFilters => {
    const filters: NotificationFilters = {};
    
    if (activeTab === 'unread') {
      filters.read = false;
    } else if (activeTab === 'read') {
      filters.read = true;
    }
    
    if (typeFilter) {
      filters.type = [typeFilter];
    }
    
    return filters;
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with your tasks and collaborations
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {typeFilter ? notificationTypeLabels[typeFilter] : 'All Types'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTypeFilter(null)}>
                All Types
              </DropdownMenuItem>
              {Object.entries(notificationTypeLabels).map(([type, label]) => (
                <DropdownMenuItem 
                  key={type} 
                  onClick={() => setTypeFilter(type as NotificationType)}
                >
                  {label}
                  {stats?.by_type[type as NotificationType] && (
                    <Badge variant="secondary" className="ml-auto">
                      {stats.by_type[type as NotificationType]}
                    </Badge>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Mark All Read
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => deleteAllRead.mutate()}
                disabled={deleteAllRead.isPending}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All Read
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_count}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.unread_count}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Read</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.total_count - stats.unread_count}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {stats?.unread_count && stats.unread_count > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stats.unread_count}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <NotificationList filters={getFilters()} />
        </TabsContent>
        
        <TabsContent value="unread" className="space-y-4">
          <NotificationList filters={getFilters()} />
        </TabsContent>
        
        <TabsContent value="read" className="space-y-4">
          <NotificationList filters={getFilters()} />
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <NotificationPreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
}