'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart3, TrendingUp } from 'lucide-react'

interface ProductivityData {
  day: string
  completed: number
  created: number
}

interface ProductivityChartProps {
  data?: ProductivityData[]
  loading?: boolean
}

export function ProductivityChart({ data = [], loading }: ProductivityChartProps) {
  // Generate sample data for the last 7 days if no data provided
  const sampleData: ProductivityData[] = data.length > 0 ? data : [
    { day: 'Mon', completed: 5, created: 8 },
    { day: 'Tue', completed: 7, created: 6 },
    { day: 'Wed', completed: 4, created: 9 },
    { day: 'Thu', completed: 8, created: 7 },
    { day: 'Fri', completed: 6, created: 5 },
    { day: 'Sat', completed: 3, created: 2 },
    { day: 'Sun', completed: 2, created: 3 },
  ]

  const maxValue = Math.max(...sampleData.flatMap(d => [d.completed, d.created]))

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Productivity Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Productivity Overview
            </CardTitle>
            <CardDescription>Task completion trends this week</CardDescription>
          </div>
          <TrendingUp className="h-5 w-5 text-green-500" />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
          </TabsList>
          <TabsContent value="chart" className="space-y-4">
            <div className="flex items-end justify-between gap-2 h-48">
              {sampleData.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex gap-1 items-end justify-center h-40">
                    {/* Completed bar */}
                    <div className="flex-1 relative group">
                      <div 
                        className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600 cursor-pointer"
                        style={{ height: `${(item.completed / maxValue) * 100}%` }}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/75 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Completed: {item.completed}
                        </div>
                      </div>
                    </div>
                    {/* Created bar */}
                    <div className="flex-1 relative group">
                      <div 
                        className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600 cursor-pointer"
                        style={{ height: `${(item.created / maxValue) * 100}%` }}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/75 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Created: {item.created}
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span className="text-muted-foreground">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-muted-foreground">Created</span>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {sampleData.reduce((acc, curr) => acc + curr.completed, 0)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Tasks Completed</div>
              </div>
              <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {sampleData.reduce((acc, curr) => acc + curr.created, 0)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Tasks Created</div>
              </div>
              <div className="p-4 rounded-lg border bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                  {Math.round((sampleData.reduce((acc, curr) => acc + curr.completed, 0) / 
                    sampleData.reduce((acc, curr) => acc + curr.created, 0)) * 100) || 0}%
                </div>
                <div className="text-sm text-muted-foreground mt-1">Completion Rate</div>
              </div>
              <div className="p-4 rounded-lg border bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
                <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                  {Math.round(sampleData.reduce((acc, curr) => acc + curr.completed, 0) / sampleData.length)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Avg. Daily Tasks</div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
