'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Trophy } from 'lucide-react'

interface Goal {
  id: string
  title: string
  current: number
  target: number
  unit: string
  color: string
}

interface GoalsWidgetProps {
  loading?: boolean
}

export function GoalsWidget({ loading }: GoalsWidgetProps) {
  // Sample goals data
  const goals: Goal[] = [
    { id: '1', title: 'Complete Tasks', current: 45, target: 50, unit: 'tasks', color: 'blue' },
    { id: '2', title: 'Weekly Sprint', current: 12, target: 15, unit: 'tasks', color: 'green' },
    { id: '3', title: 'Review PRs', current: 8, target: 10, unit: 'reviews', color: 'purple' },
  ]

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Goals & Targets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Goals & Targets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {goals.map((goal) => {
          const percentage = Math.min((goal.current / goal.target) * 100, 100)
          const isComplete = goal.current >= goal.target

          return (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="font-medium">{goal.title}</span>
                </div>
                <Badge variant={isComplete ? 'default' : 'secondary'} className="ml-2">
                  {goal.current} / {goal.target} {goal.unit}
                </Badge>
              </div>
              <Progress 
                value={percentage} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{Math.round(percentage)}% complete</span>
                {!isComplete && (
                  <span>{goal.target - goal.current} {goal.unit} remaining</span>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
