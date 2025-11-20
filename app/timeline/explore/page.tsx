'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/queries/useAuthQueries'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { 
  UserPlus,
  Users,
  TrendingUp,
  MessageCircle,
  CheckCircle2,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import type { Post } from '@/types/posts'

interface NewUser {
  id: string
  user_name: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
  bio?: string | null
}

interface UserActivity {
  user_id: string
  user_name: string
  display_name: string | null
  avatar_url: string | null
  completed_tasks_count: number
  recent_posts_count: number
}

export default function ExplorePage() {
  const { user, loading: authLoading } = useAuth()
  const [newUsers, setNewUsers] = useState<NewUser[]>([])
  const [activeUsers, setActiveUsers] = useState<UserActivity[]>([])
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingActivity, setLoadingActivity] = useState(true)
  const [loadingPosts, setLoadingPosts] = useState(true)

  // Fetch new users
  const fetchNewUsers = async () => {
    try {
      const response = await fetch('/api/users?limit=10&sort=newest')
      if (response.ok) {
        const data = await response.json()
        setNewUsers(data)
      }
    } catch (error) {
      console.error('Error fetching new users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  // Fetch active users (mock for now)
  const fetchActiveUsers = async () => {
    try {
      // In a real implementation, this would be an API endpoint
      // For now, we'll use the new users and add mock activity data
      const response = await fetch('/api/users?limit=5&sort=newest')
      if (response.ok) {
        const data = await response.json()
        const usersWithActivity: UserActivity[] = data.map((u: NewUser) => ({
          user_id: u.id,
          user_name: u.user_name,
          display_name: u.display_name,
          avatar_url: u.avatar_url,
          completed_tasks_count: Math.floor(Math.random() * 10),
          recent_posts_count: Math.floor(Math.random() * 5),
        }))
        setActiveUsers(usersWithActivity)
      }
    } catch (error) {
      console.error('Error fetching active users:', error)
    } finally {
      setLoadingActivity(false)
    }
  }

  // Fetch recent posts from community
  const fetchRecentPosts = async () => {
    try {
      const response = await fetch('/api/posts?limit=5')
      if (response.ok) {
        const data = await response.json()
        setRecentPosts(data)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoadingPosts(false)
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      fetchNewUsers()
      fetchActiveUsers()
      fetchRecentPosts()
    }
  }, [authLoading, user])

  if (authLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <p className="mb-4">Please log in to explore the community</p>
          <Link href="/auth/login">
            <Button>Log In</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-none">
        <CardHeader>
          <CardTitle className="text-2xl">Discover the Community</CardTitle>
          <CardDescription className="text-blue-100">
            Connect with new members and see what everyone is working on
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              New Members
            </CardTitle>
            <CardDescription>Welcome the newest members of the community</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : newUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No new users yet
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {newUsers.map((newUser) => (
                  <Link key={newUser.id} href={`/profiles/${newUser.user_name}`}>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={newUser.avatar_url || undefined} />
                        <AvatarFallback>
                          {newUser.display_name?.charAt(0) || newUser.user_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {newUser.display_name || newUser.user_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{newUser.user_name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Joined {formatDistanceToNow(new Date(newUser.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Most Active Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Most Active
            </CardTitle>
            <CardDescription>Users who are crushing it this week</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingActivity ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activeUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No activity yet
              </p>
            ) : (
              <div className="space-y-3">
                {activeUsers.map((activeUser) => (
                  <Link key={activeUser.user_id} href={`/profiles/${activeUser.user_name}`}>
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={activeUser.avatar_url || undefined} />
                        <AvatarFallback>
                          {activeUser.display_name?.charAt(0) || activeUser.user_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {activeUser.display_name || activeUser.user_name}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-muted-foreground">
                              {activeUser.completed_tasks_count} tasks
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3 text-blue-600" />
                            <span className="text-xs text-muted-foreground">
                              {activeUser.recent_posts_count} posts
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Community Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Community Activity
          </CardTitle>
          <CardDescription>Recent posts from the community</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingPosts ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="flex items-start gap-3 mb-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : recentPosts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No posts yet
            </p>
          ) : (
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post.id} className="border rounded-lg p-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <div className="flex items-start gap-3 mb-3">
                    <Link href={`/profiles/${post.profiles?.user_name}`}>
                      <Avatar className="hover:opacity-80 transition-opacity">
                        <AvatarImage src={post.profiles?.avatar_url || undefined} />
                        <AvatarFallback>
                          {post.profiles?.display_name?.charAt(0) || 
                           post.profiles?.user_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1">
                      <Link href={`/profiles/${post.profiles?.user_name}`}>
                        <p className="font-semibold hover:underline">
                          {post.profiles?.display_name || post.profiles?.user_name}
                        </p>
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm whitespace-pre-wrap line-clamp-3">{post.content}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {post.likes_count || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {post.comments_count || 0}
                    </span>
                    <Link href="/timeline/feed">
                      <Button size="sm" variant="ghost" className="h-6 text-xs">
                        View Post
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Suggested Connections
          </CardTitle>
          <CardDescription>People you might want to connect with</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Coming soon! We&apos;ll suggest connections based on shared interests and workspaces.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

import { Heart } from 'lucide-react'
