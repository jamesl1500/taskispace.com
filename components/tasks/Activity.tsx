'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Activity as ActivityIcon, 
  Plus, 
  Edit, 
  CheckCircle, 
  MessageCircle, 
  Tag, 
  Users,
  Calendar
} from 'lucide-react'
import { activityApi } from '@/lib/api/taskManagement'
import { TaskActivity } from '@/types/tasks'

interface ActivityProps {
  taskId: string
}

export default function Activity({ taskId }: ActivityProps) {
  const [activities, setActivities] = useState<TaskActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [filter, setFilter] = useState<string | null>(null)

  const loadActivities = useCallback(async (offset = 0, reset = false) => {
    try {
      if (offset === 0) setLoading(true)
      else setLoadingMore(true)

      const data = await activityApi.getByTaskId(taskId, {
        limit: 20,
        offset,
        type: filter || undefined
      })
      
      if (reset || offset === 0) {
        setActivities(data)
      } else {
        setActivities(prev => [...prev, ...data])
      }
      
      setHasMore(data.length === 20)
    } catch (error) {
      console.error('Failed to load activity:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [taskId, filter])

  useEffect(() => {
    loadActivities(0, true)
  }, [loadActivities])

  const loadMore = () => {
    loadActivities(activities.length)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_created':
        return <Plus className="h-4 w-4 text-green-500" />
      case 'task_updated':
      case 'task_edited':
        return <Edit className="h-4 w-4 text-blue-500" />
      case 'task_completed':
      case 'task_status_changed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'comment_added':
      case 'comment_reply_added':
      case 'comment_edited':
      case 'comment_deleted':
        return <MessageCircle className="h-4 w-4 text-purple-500" />
      case 'subtask_created':
      case 'subtask_completed':
      case 'subtask_updated':
      case 'subtask_deleted':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'collaborator_added':
      case 'collaborator_removed':
      case 'collaborator_role_updated':
        return <Users className="h-4 w-4 text-orange-500" />
      case 'tag_added':
      case 'tag_removed':
        return <Tag className="h-4 w-4 text-pink-500" />
      case 'due_date_changed':
        return <Calendar className="h-4 w-4 text-red-500" />
      default:
        return <ActivityIcon className="h-4 w-4 text-gray-500" />
    }
  }

  const formatActivityMessage = (activity: TaskActivity) => {
    const payload = activity.payload || {}
    
    switch (activity.type) {
      case 'task_created':
        return 'created this task'
      
      case 'task_updated':
      case 'task_edited':
        return 'updated the task details'
      
      case 'task_completed':
        return 'marked this task as completed'
      
      case 'task_status_changed':
        return `changed status ${payload.old_status ? `from ${payload.old_status} ` : ''}to ${payload.new_status}`
      
      case 'comment_added':
        return 'added a comment'
      
      case 'comment_reply_added':
        return 'replied to a comment'
      
      case 'comment_edited':
        return 'edited a comment'
      
      case 'comment_deleted':
        return 'deleted a comment'
      
      case 'subtask_created':
        return `added subtask "${payload.title}"`
      
      case 'subtask_completed':
        return `completed subtask "${payload.title}"`
      
      case 'subtask_updated':
        return `updated subtask "${payload.title}"`
      
      case 'subtask_deleted':
        return `deleted subtask "${payload.title}"`
      
      case 'collaborator_added':
        return `added ${payload.collaborator_id} as ${payload.role}`
      
      case 'collaborator_removed':
        return `removed ${payload.collaborator_id} ${payload.self_removed ? '(left)' : ''}`
      
      case 'collaborator_role_updated':
        return `changed ${payload.collaborator_id}'s role from ${payload.old_role} to ${payload.new_role}`
      
      case 'tag_added':
        return `added tag "${payload.tag_name}"`
      
      case 'tag_removed':
        return `removed tag "${payload.tag_name}"`
      
      case 'due_date_changed':
        return `changed due date ${payload.old_date ? `from ${new Date(payload.old_date as string).toLocaleDateString()} ` : ''}to ${new Date(payload.new_date as string).toLocaleDateString()}`
      
      default:
        return `performed ${activity.type.replace(/_/g, ' ')}`
    }
  }

  const getActivityDetails = (activity: TaskActivity) => {
    const payload = activity.payload || {}
    
    switch (activity.type) {
      case 'comment_added':
      case 'comment_reply_added':
        if (payload.content) {
          return (
            <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
              &ldquo;{String(payload.content)}&rdquo;
            </div>
          )
        }
        break
      
      case 'task_updated':
        if (payload.changes) {
          return (
            <div className="mt-2 text-sm text-gray-600">
              <div className="flex flex-wrap gap-2">
                {Array.isArray(payload.changes) && payload.changes.map((change: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {change}
                  </Badge>
                ))}
              </div>
            </div>
          )
        }
        break
      
      case 'tag_added':
      case 'tag_removed':
        if (payload.tag_color) {
          return (
            <div className="mt-2">
              <Badge
                style={{ 
                  backgroundColor: `${String(payload.tag_color)}20`, 
                  color: String(payload.tag_color),
                  border: `1px solid ${String(payload.tag_color)}40`
                }}
              >
                {String(payload.tag_name)}
              </Badge>
            </div>
          )
        }
        break
    }
    
    return null
  }

  const filterOptions = [
    { label: 'All Activity', value: null },
    { label: 'Task Updates', value: 'task_updated' },
    { label: 'Comments', value: 'comment_added' },
    { label: 'Subtasks', value: 'subtask_created' },
    { label: 'Collaborators', value: 'collaborator_added' },
    { label: 'Tags', value: 'tag_added' }
  ]

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex gap-3">
              <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Activity</h4>
        <div className="flex gap-2">
          {filterOptions.map((option) => (
            <Button
              key={option.label}
              size="sm"
              variant={filter === option.value ? "default" : "outline"}
              onClick={() => {
                setFilter(option.value)
                loadActivities(0, true)
              }}
              className="text-xs"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ActivityIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No activity yet</p>
            <p className="text-sm">Task activity will appear here as changes are made.</p>
          </div>
        ) : (
          <>
            {activities.map((activity) => (
              <Card key={activity.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {activity.actor?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm text-gray-900">
                          {activity.actor || 'Unknown User'}
                        </span>
                        <span className="text-sm text-gray-600">
                          {formatActivityMessage(activity)}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        {new Date(activity.created_at).toLocaleString()}
                      </div>
                      
                      {getActivityDetails(activity)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center pt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load More Activity'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}