'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Activity as ActivityIcon, 
  Edit, 
  CheckCircle, 
  MessageCircle, 
  Tag, 
  Users,
  Calendar
} from 'lucide-react'
import { TaskActivity } from '@/types/tasks'
import { useActivity } from '@/hooks/queries/useTaskManagementQueries'

import UserName from '@/components/user/UserName'

interface ActivityProps {
  taskId: string
}

export default function Activity({ taskId }: ActivityProps) {
  const [filter, setFilter] = useState<string | null>(null)
  const [offset, setOffset] = useState(0)

  // React Query hook
  const { data: activities = [], isLoading: loading } = useActivity(taskId, {
    limit: 20,
    offset,
    type: filter || undefined
  })

  const activityTypes = [
    { label: 'All', value: null },
    { label: 'Status', value: 'task_status_changed' },
    { label: 'Comments', value: 'comment_added' },
    { label: 'Tags', value: 'tag_added' },
    { label: 'Collaborators', value: 'collaborator_added' },
    { label: 'Updates', value: 'task_updated' }
  ]

  const getActivityIcon = (type: string) => {
    if (type.includes('status') || type.includes('completed')) {
      return <CheckCircle className="h-4 w-4" />
    } else if (type.includes('comment')) {
      return <MessageCircle className="h-4 w-4" />
    } else if (type.includes('tag')) {
      return <Tag className="h-4 w-4" />
    } else if (type.includes('collaborator')) {
      return <Users className="h-4 w-4" />
    } else if (type.includes('updated') || type.includes('edited')) {
      return <Edit className="h-4 w-4" />
    } else {
      return <ActivityIcon className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    if (type.includes('status') || type.includes('completed')) {
      return 'bg-green-500'
    } else if (type.includes('comment')) {
      return 'bg-blue-500'
    } else if (type.includes('tag')) {
      return 'bg-purple-500'
    } else if (type.includes('collaborator')) {
      return 'bg-orange-500'
    } else if (type.includes('updated') || type.includes('edited')) {
      return 'bg-gray-500'
    } else {
      return 'bg-gray-400'
    }
  }

  const formatActivityMessage = (activity: TaskActivity) => {
    const { type, payload } = activity
    const payloadData = payload as Record<string, unknown>
    
    switch (type) {
      case 'task_status_changed':
        return `changed status from "${payloadData?.from || 'unknown'}" to "${payloadData?.to || 'unknown'}"`
      case 'comment_added':
        return 'added a comment'
      case 'comment_edited':
        return 'updated a comment'
      case 'comment_deleted':
        return 'deleted a comment'
      case 'tag_added':
        return `added tag "${payloadData?.tag_name || 'unknown'}"`
      case 'tag_removed':
        return `removed tag "${payloadData?.tag_name || 'unknown'}"`
      case 'collaborator_added':
        return `added ${payloadData?.user_name || 'someone'} as ${payloadData?.role || 'collaborator'}`
      case 'collaborator_role_updated':
        return `changed ${payloadData?.user_name || 'someone'}'s role to ${payloadData?.new_role || 'unknown'}`
      case 'collaborator_removed':
        return `removed ${payloadData?.user_name || 'someone'} as collaborator`
      case 'task_updated':
      case 'task_edited':
        return `updated task ${payloadData?.field || 'details'}`
      case 'subtask_added':
        return `added subtask "${payloadData?.title || 'untitled'}"`
      case 'subtask_completed':
        return `completed subtask "${payloadData?.title || 'untitled'}"`
      case 'subtask_updated':
        return `updated subtask "${payloadData?.title || 'untitled'}"`
      case 'subtask_deleted':
        return `deleted subtask "${payloadData?.title || 'untitled'}"`
      case 'task_created':
        return 'created the task'
      case 'task_completed':
        return 'completed the task'
      case 'due_date_changed':
        return 'changed the due date'
      case 'priority_changed':
        return `changed priority to ${payloadData?.priority || 'unknown'}`
      default:
        return 'performed an action'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`
    }
  }

  const loadMore = () => {
    setOffset(prev => prev + 20)
  }

  if (loading && offset === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-3 p-4">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header and Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">Activity</h4>
          <p className="text-sm text-gray-500">
            {activities.length} activity{activities.length !== 1 ? ' entries' : ' entry'}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1">
        {activityTypes.map((type) => (
          <Button
            key={type.label}
            size="sm"
            variant={filter === type.value ? "default" : "ghost"}
            onClick={() => {
              setFilter(type.value)
              setOffset(0) // Reset offset when changing filter
            }}
          >
            {type.label}
          </Button>
        ))}
      </div>

      {/* Activity List */}
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ActivityIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No activity yet</p>
            <p className="text-sm">Actions on this task will appear here</p>
          </div>
        ) : (
          activities.map((activity: TaskActivity) => (
            <Card key={activity.id} className="border-l-4 border-l-gray-200">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  {/* Activity Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${getActivityColor(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex items-center gap-1 text-sm">
                              <UserName userId={activity.actor} />
                              <span className="text-gray-600">
                                {formatActivityMessage(activity)}
                              </span>
                            </div>
                        </div>
                        
                        {/* Additional Details */}
                        {activity.payload && typeof activity.payload === 'object' && 'description' in activity.payload && activity.payload.description && (
                          <p className="text-sm text-gray-600 mt-2 ml-8">
                            {String(activity.payload.description)}
                          </p>
                        )}

                        {/* Tags for tag activities */}
                        {(activity.type === 'tag_added' || activity.type === 'tag_removed') && activity.payload && typeof activity.payload === 'object' && (
                          <div className="mt-2 ml-8">
                            <Badge
                              style={{
                                backgroundColor: `${'tag_color' in activity.payload ? String(activity.payload.tag_color) : '#6B7280'}20`,
                                color: 'tag_color' in activity.payload ? String(activity.payload.tag_color) : '#6B7280',
                                border: `1px solid ${'tag_color' in activity.payload ? String(activity.payload.tag_color) : '#6B7280'}40`
                              }}
                            >
                              {'tag_name' in activity.payload ? String(activity.payload.tag_name) : 'Unknown Tag'}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(activity.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load More Button */}
      {activities.length > 0 && activities.length >= 20 && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  )
}