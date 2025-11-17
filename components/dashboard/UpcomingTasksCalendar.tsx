'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Task } from '@/types/tasks'
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { useState } from 'react'
import { format, addDays, startOfWeek, isSameDay, isToday, isTomorrow, isPast } from 'date-fns'
import { cn } from '@/lib/utils'

interface UpcomingTasksCalendarProps {
  tasks?: Task[]
  loading?: boolean
}

export function UpcomingTasksCalendar({ tasks = [], loading }: UpcomingTasksCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))

  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => 
      task.due_date && isSameDay(new Date(task.due_date), date)
    )
  }

  const getDayLabel = (date: Date) => {
    if (isToday(date)) return 'Today'
    if (isTomorrow(date)) return 'Tomorrow'
    return format(date, 'EEE')
  }

  const getPriorityColor = (priority: Task['priority']) => {
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Tasks
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            >
              Today
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const dayTasks = getTasksForDay(day)
            const isCurrentDay = isToday(day)
            const isPastDay = isPast(day) && !isCurrentDay

            return (
              <div
                key={index}
                className={cn(
                  'rounded-lg border p-2 min-h-[120px] transition-all hover:shadow-md',
                  isCurrentDay && 'border-primary bg-primary/5',
                  isPastDay && 'opacity-60'
                )}
              >
                <div className="text-center mb-2">
                  <div className={cn(
                    'text-xs font-medium',
                    isCurrentDay && 'text-primary'
                  )}>
                    {getDayLabel(day)}
                  </div>
                  <div className={cn(
                    'text-lg font-bold',
                    isCurrentDay && 'text-primary'
                  )}>
                    {format(day, 'd')}
                  </div>
                </div>
                
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        'text-xs p-1.5 rounded border truncate cursor-pointer hover:scale-105 transition-transform',
                        getPriorityColor(task.priority)
                      )}
                      title={task.title}
                    >
                      <div className="flex items-center gap-1">
                        {task.status === 'completed' ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <Clock className="h-3 w-3 flex-shrink-0" />
                        )}
                        <span className={cn(
                          'truncate',
                          task.status === 'completed' && 'line-through'
                        )}>
                          {task.title}
                        </span>
                      </div>
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-center text-muted-foreground">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                  {dayTasks.length === 0 && !isPastDay && (
                    <div className="text-xs text-center text-muted-foreground opacity-50 py-2">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500/20 border border-red-200" />
            <span className="text-muted-foreground">High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-500/20 border border-yellow-200" />
            <span className="text-muted-foreground">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500/20 border border-green-200" />
            <span className="text-muted-foreground">Low</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
