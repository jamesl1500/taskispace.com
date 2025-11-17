'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Workspace } from '@/types/workspaces'
import { FolderKanban, Users, ChevronRight, Plus } from 'lucide-react'
import Link from 'next/link'

interface WorkspacesGridProps {
  workspaces: Workspace[]
  loading?: boolean
}

export function WorkspacesGrid({ workspaces, loading }: WorkspacesGridProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workspaces</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-lg border animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Workspaces</CardTitle>
          <CardDescription>Your collaborative spaces</CardDescription>
        </div>
        <Link href="/workspaces/create">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Workspace
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {workspaces.length === 0 ? (
          <div className="text-center py-12">
            <FolderKanban className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-muted-foreground mb-4">No workspaces yet</p>
            <Link href="/workspaces/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Workspace
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workspaces.map((workspace) => (
              <Link key={workspace.id} href={`/workspaces/${workspace.id}`}>
                <div className="group p-4 rounded-lg border transition-all hover:shadow-lg hover:scale-105 hover:border-primary/50 cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: workspace.color }}
                      />
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {workspace.name}
                      </h3>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                  </div>
                  
                  {workspace.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {workspace.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {workspace.member_count !== undefined && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{workspace.member_count} members</span>
                      </div>
                    )}
                    {workspace.tasks && workspace.tasks.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {workspace.tasks.length} tasks
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
