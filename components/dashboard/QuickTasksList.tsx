'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Task, TaskPriority, TaskStatus } from '@/types/tasks'
import { CheckCircle2, Circle, Clock, AlertCircle, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface QuickTasksListProps {
  tasks: Task[]
  onToggleTask?: (taskId: string) => void
  loading?: boolean
}

export function QuickTasksList({ tasks, onToggleTask, loading }: QuickTasksListProps) {
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-200'
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-200'
      case 'low':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-200'
      default:
        return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200'
    }
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'in_review':
        return <AlertCircle className="h-4 w-4 text-orange-500" />
      default:
        return <Circle className="h-4 w-4 text-gray-400" />
    }
  }

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quick Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border animate-pulse">
                <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Quick Tasks</CardTitle>
        <Link href="/tasks">
          <Button variant="ghost" size="sm">
            View All <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Circle className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No tasks found</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  'group flex items-start gap-3 p-3 rounded-lg border transition-all hover:shadow-md hover:border-primary/50',
                  task.status === 'completed' && 'opacity-60'
                )}
              >
                <Checkbox
                  checked={task.status === 'completed'}
                  onCheckedChange={() => onToggleTask?.(task.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(task.status)}
                    <Link href={`/tasks/${task.id}`}>
                      <h4 className={cn(
                        'font-medium text-sm hover:text-primary transition-colors truncate',
                        task.status === 'completed' && 'line-through'
                      )}>
                        {task.title}
                      </h4>
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={cn('text-xs', getPriorityColor(task.priority))}>
                      {task.priority}
                    </Badge>
                    {task.due_date && (
                      <Badge variant="outline" className={cn(
                        'text-xs',
                        isOverdue(task.due_date) && task.status !== 'completed' 
                          ? 'bg-red-500/10 text-red-700 border-red-200' 
                          : 'bg-gray-500/10 text-gray-700 border-gray-200'
                      )}>
                        {isOverdue(task.due_date) && task.status !== 'completed' ? '🔥 ' : '📅 '}
                        {new Date(task.due_date).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
