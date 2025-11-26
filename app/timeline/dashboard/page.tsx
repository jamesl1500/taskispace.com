'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/queries/useAuthQueries'
import { useTasks } from '@/hooks/queries/useTaskQueries'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Calendar,
  ListTodo,
  Zap,
  Target,
  Briefcase,
  GripVertical,
  RotateCcw,
} from 'lucide-react'
import { formatDistanceToNow, format, isToday, isPast, isFuture } from 'date-fns'
import Link from 'next/link'

interface Workspace {
  id: string
  name: string
  icon: string
  color: string
  created_at: string
}

type CardType = 'recentTasks' | 'overdueTasks' | 'upcomingTasks' | 'workspaces' | 'productivity'

const DEFAULT_CARD_ORDER: CardType[] = ['recentTasks', 'overdueTasks', 'upcomingTasks', 'workspaces', 'productivity']

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const { data: allTasks } = useTasks()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true)
  const [cardOrder, setCardOrder] = useState<CardType[]>(DEFAULT_CARD_ORDER)
  const [draggedCard, setDraggedCard] = useState<CardType | null>(null)

  // Calculate task stats
  const recentTasks = allTasks?.slice(0, 5) || []
  const overdueTasks = allTasks?.filter(t => 
    t.due_date && isPast(new Date(t.due_date)) && t.status !== 'completed'
  ) || []
  const upcomingTasks = allTasks?.filter(t => 
    t.due_date && isFuture(new Date(t.due_date)) && t.status !== 'completed'
  ).slice(0, 3) || []
  const completedToday = allTasks?.filter(t => 
    t.status === 'completed' && t.completed_at && isToday(new Date(t.completed_at))
  ).length || 0
  const totalTasks = allTasks?.length || 0
  const completedTasks = allTasks?.filter(t => t.status === 'completed').length || 0
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Fetch workspaces
  const fetchWorkspaces = async () => {
    try {
      const response = await fetch('/api/workspaces')
      if (response.ok) {
        const data = await response.json()
        setWorkspaces(data.slice(0, 5)) // Show only 5 recent workspaces
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error)
    } finally {
      setLoadingWorkspaces(false)
    }
  }

  // Load card order from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dashboard-card-order')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setCardOrder(parsed)
        } catch (e) {
          console.error('Failed to parse saved card order:', e)
        }
      }
    }
  }, [])

  // Save card order to localStorage
  const saveCardOrder = useCallback((order: CardType[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-card-order', JSON.stringify(order))
    }
  }, [])

  // Reset to default order
  const resetCardOrder = () => {
    setCardOrder(DEFAULT_CARD_ORDER)
    saveCardOrder(DEFAULT_CARD_ORDER)
  }

  // Drag handlers
  const handleDragStart = (cardType: CardType) => {
    setDraggedCard(cardType)
  }

  const handleDragOver = (e: React.DragEvent, targetCard: CardType) => {
    e.preventDefault()
    
    if (!draggedCard || draggedCard === targetCard) return

    const newOrder = [...cardOrder]
    const draggedIndex = newOrder.indexOf(draggedCard)
    const targetIndex = newOrder.indexOf(targetCard)

    // Remove dragged card and insert at target position
    newOrder.splice(draggedIndex, 1)
    newOrder.splice(targetIndex, 0, draggedCard)

    setCardOrder(newOrder)
  }

  const handleDragEnd = () => {
    if (draggedCard) {
      saveCardOrder(cardOrder)
    }
    setDraggedCard(null)
  }

  useEffect(() => {
    if (!authLoading && user) {
      fetchWorkspaces()
    }
  }, [authLoading, user])

  if (authLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <p className="mb-4">Please log in to view your dashboard</p>
            <Link href="/auth/login">
              <Button>Log In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Card components as functions
  const renderCard = (cardType: CardType) => {
    const commonProps = {
      draggable: true,
      onDragStart: () => handleDragStart(cardType),
      onDragOver: (e: React.DragEvent) => handleDragOver(e, cardType),
      onDragEnd: handleDragEnd,
      className: `transition-all ${draggedCard === cardType ? 'opacity-50 scale-95' : 'opacity-100 scale-100'} cursor-move`,
    }

    switch (cardType) {
      case 'recentTasks':
        return (
          <Card key={cardType} {...commonProps}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5" />
                  Recent Tasks
                </CardTitle>
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>Your latest task activity</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                <div className="space-y-2">
                  {recentTasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No tasks yet
                    </p>
                  ) : (
                    recentTasks.map((task) => (
                      <Link key={task.id} href={`/tasks/${task.id}`}>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800 mb-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm flex-1 truncate">{task.title}</p>
                            <Badge 
                              variant={
                                task.status === 'completed' ? 'default' : 
                                task.status === 'in_progress' ? 'secondary' : 
                                'outline'
                              }
                              className="text-xs"
                            >
                              {task.status}
                            </Badge>
                          </div>
                          {task.due_date && (
                            <div className="flex items-center gap-2 mt-2">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(task.due_date), 'MMM d, yyyy')}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </ScrollArea>
              <Separator className="my-4" />
              <Link href="/tasks">
                <Button variant="outline" className="w-full" size="sm">
                  <ListTodo className="mr-2 h-4 w-4" />
                  View All Tasks
                </Button>
              </Link>
            </CardContent>
          </Card>
        )

      case 'overdueTasks':
        if (overdueTasks.length === 0) return null
        return (
          <Card key={cardType} {...commonProps} className={`${commonProps.className} border-red-200 dark:border-red-900`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  Overdue Tasks
                </CardTitle>
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>
                {overdueTasks.length} task{overdueTasks.length > 1 ? 's' : ''} need{overdueTasks.length === 1 ? 's' : ''} attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                <div className="space-y-2">
                  {overdueTasks.slice(0, 5).map((task) => (
                    <Link key={task.id} href={`/tasks/${task.id}`}>
                      <div className="bg-red-50 dark:bg-red-950/20 rounded-lg p-3 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer border border-red-200 dark:border-red-900 mb-2">
                        <p className="font-medium text-sm truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className="h-3 w-3 text-red-500" />
                          <span className="text-xs text-muted-foreground">
                            Due {formatDistanceToNow(new Date(task.due_date!), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </ScrollArea>
              <Separator className="my-4" />
              <Link href="/tasks">
                <Button variant="destructive" className="w-full" size="sm">
                  View All Overdue
                </Button>
              </Link>
            </CardContent>
          </Card>
        )

      case 'upcomingTasks':
        if (upcomingTasks.length === 0) return null
        return (
          <Card key={cardType} {...commonProps}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Coming Up
                </CardTitle>
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>Tasks due soon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcomingTasks.map((task) => (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800 mb-2">
                      <p className="font-medium text-sm truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs text-muted-foreground">
                          Due {formatDistanceToNow(new Date(task.due_date!), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )

      case 'workspaces':
        return (
          <Card key={cardType} {...commonProps}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Recent Workspaces
                </CardTitle>
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>Your active workspaces</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingWorkspaces ? (
                <div className="space-y-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              ) : workspaces.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No workspaces yet
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    {workspaces.map((workspace) => (
                      <Link key={workspace.id} href={`/workspaces/${workspace.id}`}>
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-800 mb-2">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                            style={{ backgroundColor: workspace.color }}
                          >
                            {workspace.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{workspace.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Created {formatDistanceToNow(new Date(workspace.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Separator className="my-4" />
                  <Link href="/workspaces">
                    <Button variant="outline" className="w-full" size="sm">
                      <Briefcase className="mr-2 h-4 w-4" />
                      View All Workspaces
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        )

      case 'productivity':
        return (
          <Card key={cardType} {...commonProps}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Productivity Insights
                </CardTitle>
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardDescription>Your performance at a glance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Overall Completion</span>
                  <span className="font-bold">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-muted-foreground">Today</span>
                  </div>
                  <p className="text-2xl font-bold">{completedToday}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4" />
                    <span className="text-xs text-muted-foreground">Total</span>
                  </div>
                  <p className="text-2xl font-bold">{totalTasks}</p>
                </div>
              </div>

              {completionRate >= 75 && (
                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-3">
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                    🎉 Great job!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You&apos;re maintaining an excellent completion rate
                  </p>
                </div>
              )}

              {overdueTasks.length > 3 && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-3">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                    ⚠️ Overdue tasks building up
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Consider reviewing and prioritizing your overdue tasks
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className="mx-auto space-y-6">
        {/* Header with Reset Button */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-700 via-pink-700 to-orange-700 bg-clip-text text-transparent mb-2">Your Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-400">Drag and drop cards to customize your layout</p>
          </div>
          <Button variant="outline" size="sm" onClick={resetCardOrder} className="border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Layout
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-purple-100 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedTasks} completed
            </p>
          </CardContent>
        </Card>

          <Card className="border-pink-100 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedToday}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Great progress!
              </p>
            </CardContent>
          </Card>

          <Card className={`${overdueTasks.length > 0 ? "border-red-200 dark:border-red-900" : "border-orange-100"} bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${overdueTasks.length > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overdueTasks.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overdueTasks.length > 0 ? 'Needs attention' : 'All on track'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-100 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionRate}%</div>
              <Progress value={completionRate} className="h-2 mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Draggable Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {cardOrder.map((cardType) => renderCard(cardType))}
        </div>
      </div>
    </div>
  )
}
