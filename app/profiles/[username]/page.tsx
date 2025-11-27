'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useProfileByUsername } from '@/hooks/queries/useProfileQueries'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { MessageCircle, Calendar, User, FileText, CheckSquare, Briefcase } from 'lucide-react'
import { FriendshipButton } from '@/components/friends'
import { PostCard } from '@/components/posts'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Post } from '@/types'

type Task = {
  id: string
  title: string
  status: string
  priority: string
  due_date: string | null
  created_at: string
}

type Workspace = {
  id: string
  name: string
  description: string | null
  created_at: string
}

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string
  const { user } = useAuth()

  const { data: profile, isLoading, error } = useProfileByUsername(username)
  const [activeTab, setActiveTab] = useState('posts')
  const [posts, setPosts] = useState<Post[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false)

  // Fetch user's posts
  useEffect(() => {
    if (profile?.id && activeTab === 'posts') {
      let isMounted = true
      const fetchPosts = async () => {
        setLoadingPosts(true)
        try {
          const res = await fetch(`/api/posts?user_id=${profile.id}`)
          const data = await res.json()
          if (isMounted) setPosts(data)
        } catch (err) {
          console.error('Error fetching posts:', err)
        } finally {
          if (isMounted) setLoadingPosts(false)
        }
      }
      fetchPosts()
      return () => { isMounted = false }
    }
  }, [profile?.id, activeTab])

  // Fetch user's tasks
  useEffect(() => {
    if (profile?.id && activeTab === 'tasks') {
      let isMounted = true
      const fetchTasks = async () => {
        setLoadingTasks(true)
        try {
          const res = await fetch(`/api/tasks?user_id=${profile.id}`)
          const data = await res.json()
          if (isMounted) setTasks(data)
        } catch (err) {
          console.error('Error fetching tasks:', err)
        } finally {
          if (isMounted) setLoadingTasks(false)
        }
      }
      fetchTasks()
      return () => { isMounted = false }
    }
  }, [profile?.id, activeTab])

  // Fetch user's workspaces
  useEffect(() => {
    if (profile?.id && activeTab === 'workspaces') {
      let isMounted = true
      const fetchWorkspaces = async () => {
        setLoadingWorkspaces(true)
        try {
          const res = await fetch(`/api/workspaces?user_id=${profile.id}`)
          const data = await res.json()
          if (isMounted) setWorkspaces(data)
        } catch (err) {
          console.error('Error fetching workspaces:', err)
        } finally {
          if (isMounted) setLoadingWorkspaces(false)
        }
      }
      fetchWorkspaces()
      return () => { isMounted = false }
    }
  }, [profile?.id, activeTab])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-200 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-40" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-200 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Profile Not Found</h2>
              <p className="text-muted-foreground mb-6">
                The user profile you&apos;re looking for doesn&apos;t exist or has been removed.
              </p>
              <Link href="/profiles">
                <Button variant="outline">
                  Browse Profiles
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const isOwnProfile = user?.id === profile.id
  const joinedDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const getInitials = (name: string | null) => {
    if (!name) return profile.user_name.charAt(0).toUpperCase()
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-950 dark:via-gray-950 dark:to-gray-950">
      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
        {/* Main Profile Card */}
        <Card className="border-purple-100 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || profile.user_name} />
                  <AvatarFallback className="text-lg">
                    {getInitials(profile.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold">
                    {profile.display_name || profile.user_name}
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    @{profile.user_name}
                  </p>
                  <div className="flex items-center mt-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    Joined {joinedDate}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                {!isOwnProfile && user && (
                  <div className="flex space-x-2">
                    <Link href={`/conversations/new?user=${profile.user_name}`}>
                      <Button>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Start Conversation
                      </Button>
                    </Link>
                    <FriendshipButton
                      username={profile.user_name}
                      userId={profile.id}
                      currentUserId={user.id}
                    />
                  </div>
                )}
                {isOwnProfile && (
                  <Link href="/settings/profile">
                    <Button variant="outline">
                      Edit Profile
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {profile.bio && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Bio</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {profile.bio}
                </p>
              </div>
            )}

            <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", profile.bio && "border-t pt-4")}>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">@{profile.user_name}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Joined {joinedDate}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Updated {new Date(profile.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Navigation */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 dark:border-gray-700 p-2 border-gray-200">
          <div className="flex justify-center space-x-2">
            <Button
              variant={activeTab === 'posts' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('posts')}
              className={cn(
                "flex items-center gap-2",
                activeTab === 'posts' && "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              )}
            >
              <FileText className="h-4 w-4" />
              Posts
            </Button>
            <Button
              variant={activeTab === 'tasks' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('tasks')}
              className={cn(
                "flex items-center gap-2",
                activeTab === 'tasks' && "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              )}
            >
              <CheckSquare className="h-4 w-4" />
              Tasks
            </Button>
            <Button
              variant={activeTab === 'workspaces' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('workspaces')}
              className={cn(
                "flex items-center gap-2",
                activeTab === 'workspaces' && "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              )}
            >
              <Briefcase className="h-4 w-4" />
              Workspaces
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        <Card className="border-purple-100 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent>
            {/* Posts */}
            {activeTab === 'posts' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Posts</h2>
                  <p className="text-muted-foreground">Recent posts and updates from {profile.display_name || profile.user_name}</p>
                </div>
                {loadingPosts ? (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-muted-foreground">No posts yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        currentUserId={user?.id}
                        onUpdate={(postId, updatedData) => {
                          setPosts(posts.map(p => p.id === postId ? { ...p, ...updatedData } : p))
                        }}
                        onDelete={(postId) => {
                          setPosts(posts.filter(p => p.id !== postId))
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tasks */}
            {activeTab === 'tasks' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Tasks</h2>
                  <p className="text-muted-foreground">Tasks and projects managed by {profile.display_name || profile.user_name}</p>
                </div>
                {loadingTasks ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-muted-foreground">No tasks yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <Card key={task.id} className="border-pink-100">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium mb-2">{task.title}</h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant={task.status === 'completed' ? 'default' : 'secondary'}>
                                  {task.status}
                                </Badge>
                                <Badge variant={
                                  task.priority === 'high' ? 'destructive' :
                                    task.priority === 'medium' ? 'default' :
                                      'outline'
                                }>
                                  {task.priority}
                                </Badge>
                                {task.due_date && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(task.due_date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Workspaces */}
            {activeTab === 'workspaces' && (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Workspaces</h2>
                  <p className="text-muted-foreground">Collaborative workspaces created by {profile.display_name || profile.user_name}</p>
                </div>
                {loadingWorkspaces ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : workspaces.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-muted-foreground">No workspaces yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workspaces.map((workspace) => (
                      <Link key={workspace.id} href={`/workspaces/${workspace.id}`}>
                        <Card className="border-orange-100 hover:shadow-lg transition-shadow cursor-pointer">
                          <CardContent className="pt-6">
                            <h4 className="font-semibold mb-2">{workspace.name}</h4>
                            {workspace.description && (
                              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                {workspace.description}
                              </p>
                            )}
                            <span className="text-xs text-muted-foreground">
                              Created {new Date(workspace.created_at).toLocaleDateString()}
                            </span>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}