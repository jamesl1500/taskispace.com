'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  trend?: {
    value: number
    label: string
  }
  className?: string
  iconColor?: string
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  className,
  iconColor = 'text-blue-500'
}: StatsCardProps) {
  return (
    <Card className={cn('hover:shadow-lg transition-all duration-300 hover:scale-105', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className={cn('h-5 w-5', iconColor)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className={cn(
            'text-xs font-medium mt-2 flex items-center gap-1',
            trend.value >= 0 ? 'text-green-600' : 'text-red-600'
          )}>
            <span>{trend.value >= 0 ? '↗' : '↘'}</span>
            <span>{Math.abs(trend.value)}% {trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
