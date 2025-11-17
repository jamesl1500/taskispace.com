'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Notification } from '@/types/notifications'
import { 
  CheckCircle2, 
  MessageSquare, 
  Calendar, 
  AlertCircle, 
  Users,
  FileText,
  Bell
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface ActivityFeedProps {
  notifications: Notification[]
  loading?: boolean
}

export function ActivityFeed({ notifications, loading }: ActivityFeedProps) {
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task_assigned':
      case 'task_completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'task_comment':
      case 'conversation_message':
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case 'task_due_soon':
        return <Calendar className="h-4 w-4 text-yellow-500" />
      case 'task_overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'workspace_invitation':
      case 'list_shared':
        return <Users className="h-4 w-4 text-purple-500" />
      case 'subtask_completed':
        return <FileText className="h-4 w-4 text-green-500" />
      case 'mention':
        return <Bell className="h-4 w-4 text-blue-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'task_assigned':
      case 'task_completed':
      case 'subtask_completed':
        return 'border-l-green-500'
      case 'task_comment':
      case 'conversation_message':
      case 'mention':
        return 'border-l-blue-500'
      case 'task_due_soon':
        return 'border-l-yellow-500'
      case 'task_overdue':
        return 'border-l-red-500'
      case 'workspace_invitation':
      case 'list_shared':
        return 'border-l-purple-500'
      default:
        return 'border-l-gray-500'
    }
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg border animate-pulse">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'flex gap-3 p-3 rounded-lg border-l-4 bg-card hover:bg-accent/50 transition-colors',
                  getNotificationColor(notification.type),
                  !notification.read && 'bg-blue-50/50 dark:bg-blue-950/20'
                )}
              >
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    {!notification.read && (
                      <Badge variant="default" className="text-xs shrink-0">New</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
