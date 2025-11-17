'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/queries/useAuthQueries'
import { useTasks } from '@/hooks/queries/useTaskQueries'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Heart, 
  MessageCircle, 
  Send,
  Loader2,
  Trash2,
  Edit,
  MoreVertical,
  X,
  Check,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  TrendingUp,
  Calendar,
  ListTodo,
  Zap,
  UserPlus,
  Target,
} from 'lucide-react'
import { formatDistanceToNow, format, isToday, isPast, isFuture } from 'date-fns'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Post {
  id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  profiles?: {
    user_name: string
    display_name: string | null
    avatar_url: string | null
  }
  likes_count: number
  comments_count: number
  is_liked: boolean
}

interface PostComment {
  id: string
  content: string
  created_at: string
  profiles?: {
    user_name: string
    display_name: string | null
    avatar_url: string | null
  }
}

interface NewUser {
  id: string
  user_name: string
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export default function TimelinePage() {
  const { user, loading: authLoading } = useAuth()
  const { data: allTasks } = useTasks()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [newPostContent, setNewPostContent] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [showComments, setShowComments] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, PostComment[]>>({})
  const [commentContent, setCommentContent] = useState<Record<string, string>>({})
  const [newUsers, setNewUsers] = useState<NewUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)

  // Calculate task stats
  const recentTasks = allTasks?.slice(0, 5) || []
  const overdueTasks = allTasks?.filter(t => 
    t.due_date && isPast(new Date(t.due_date)) && t.status !== 'completed'
  ) || []
  const upcomingTasks = allTasks?.filter(t => 
    t.due_date && isFuture(new Date(t.due_date)) && t.status !== 'completed'
  ).slice(0, 3) || []
  const completedToday = allTasks?.filter(t => 
    t.status === 'completed' && isToday(new Date(t.updated_at || t.created_at))
  ).length || 0
  const totalTasks = allTasks?.length || 0
  const completedTasks = allTasks?.filter(t => t.status === 'completed').length || 0
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Fetch posts
  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch new users
  const fetchNewUsers = async () => {
    try {
      const response = await fetch('/api/users?limit=5&sort=newest')
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

  // Create post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPostContent.trim()) return

    setPosting(true)
    setError('')

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPostContent })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create post')
      }

      const newPost = await response.json()
      setPosts([newPost, ...posts])
      setNewPostContent('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post')
    } finally {
      setPosting(false)
    }
  }

  // Toggle like
  const handleLike = async (postId: string, isLiked: boolean) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: isLiked ? 'DELETE' : 'POST'
      })

      if (response.ok) {
        setPosts(posts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                is_liked: !isLiked,
                likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1
              }
            : post
        ))
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  // Delete post
  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setPosts(posts.filter(post => post.id !== postId))
      }
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  // Update post
  const handleUpdate = async (postId: string) => {
    if (!editContent.trim()) return

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent })
      })

      if (response.ok) {
        const updatedPost = await response.json()
        setPosts(posts.map(post => post.id === postId ? { ...post, ...updatedPost } : post))
        setEditingPostId(null)
        setEditContent('')
      }
    } catch (error) {
      console.error('Error updating post:', error)
    }
  }

  // Fetch comments
  const fetchComments = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments({ ...comments, [postId]: data })
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  // Add comment
  const handleAddComment = async (postId: string) => {
    const content = commentContent[postId]
    if (!content?.trim()) return

    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      if (response.ok) {
        const newComment = await response.json()
        setComments({
          ...comments,
          [postId]: [...(comments[postId] || []), newComment]
        })
        setCommentContent({ ...commentContent, [postId]: '' })
        setPosts(posts.map(post =>
          post.id === postId ? { ...post, comments_count: post.comments_count + 1 } : post
        ))
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  // Toggle comments
  const toggleComments = (postId: string) => {
    if (showComments === postId) {
      setShowComments(null)
    } else {
      setShowComments(postId)
      if (!comments[postId]) {
        fetchComments(postId)
      }
    }
  }

  // Initial fetch
  useEffect(() => {
    if (!authLoading && user) {
      fetchPosts()
      fetchNewUsers()
    }
  }, [authLoading, user])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 p-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="mb-4">Please log in to view your timeline</p>
            <Link href="/auth/login">
              <Button>Log In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Timeline Feed - Left/Center Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Timeline
              </h1>
              <p className="text-muted-foreground">See what's happening in your community</p>
            </div>

            {/* Create Post */}
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src={user.user_metadata?.avatar_url} />
                    <AvatarFallback>
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <form onSubmit={handleCreatePost} className="flex-1 space-y-4">
                    <Textarea
                      placeholder="What's on your mind? Share your thoughts, progress, or achievements..."
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      rows={4}
                      maxLength={5000}
                      className="resize-none"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {newPostContent.length}/5000
                      </span>
                      <Button 
                        type="submit" 
                        disabled={posting || !newPostContent.trim()}
                      >
                        {posting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Posting...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Post
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </CardHeader>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Posts Feed */}
            <div className="space-y-6">
              {posts.length === 0 ? (
                <Card>
                  <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 text-slate-300 dark:text-slate-700" />
                    <p className="text-lg font-semibold mb-2">No posts yet</p>
                    <p>Be the first to share something with the community!</p>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post) => (
                  <Card key={post.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Link href={`/profiles/${post.profiles?.user_name}`}>
                            <Avatar className="hover:opacity-80 transition-opacity">
                              <AvatarImage src={post.profiles?.avatar_url || undefined} />
                              <AvatarFallback>
                                {post.profiles?.display_name?.charAt(0) || 
                                 post.profiles?.user_name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                          <div>
                            <Link href={`/profiles/${post.profiles?.user_name}`}>
                              <p className="font-semibold hover:underline">
                                {post.profiles?.display_name || post.profiles?.user_name}
                              </p>
                            </Link>
                            <p className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                              {post.updated_at !== post.created_at && ' (edited)'}
                            </p>
                          </div>
                        </div>
                        {post.user_id === user.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setEditingPostId(post.id)
                                setEditContent(post.content)
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(post.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {editingPostId === post.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={4}
                            maxLength={5000}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleUpdate(post.id)}>
                              <Check className="mr-2 h-4 w-4" />
                              Save
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => {
                                setEditingPostId(null)
                                setEditContent('')
                              }}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap text-base leading-relaxed">{post.content}</p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-6 pt-2 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(post.id, post.is_liked)}
                          className={post.is_liked ? 'text-red-500' : ''}
                        >
                          <Heart className={`mr-2 h-4 w-4 ${post.is_liked ? 'fill-current' : ''}`} />
                          {post.likes_count}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleComments(post.id)}
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          {post.comments_count}
                        </Button>
                      </div>                    {/* Comments Section */}
                    {showComments === post.id && (
                      <div className="space-y-4 pt-4 border-t">
                        {/* Add Comment */}
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Write a comment..."
                            value={commentContent[post.id] || ''}
                            onChange={(e) => setCommentContent({
                              ...commentContent,
                              [post.id]: e.target.value
                            })}
                            rows={2}
                            maxLength={1000}
                            className="resize-none"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddComment(post.id)}
                            disabled={!commentContent[post.id]?.trim()}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-3">
                          {comments[post.id]?.map((comment) => (
                            <div key={comment.id} className="flex gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                                <AvatarFallback>
                                  {comment.profiles?.display_name?.charAt(0) ||
                                   comment.profiles?.user_name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 bg-muted rounded-lg p-3">
                                <Link href={`/profiles/${comment.profiles?.user_name}`}>
                                  <p className="font-semibold text-sm hover:underline">
                                    {comment.profiles?.display_name || comment.profiles?.user_name}
                                  </p>
                                </Link>
                                <p className="text-sm mt-1">{comment.content}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
            </div>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Productivity Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5" />
                  Productivity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium">Completion Rate</span>
                    <span className="font-bold">{completionRate}%</span>
                  </div>
                  <Progress value={completionRate} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
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
              </CardContent>
            </Card>

            {/* Overdue Tasks Alert */}
            {overdueTasks.length > 0 && (
              <Card className="border-red-200 dark:border-red-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-red-700 dark:text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    Overdue Tasks
                  </CardTitle>
                  <CardDescription>
                    {overdueTasks.length} task{overdueTasks.length > 1 ? 's' : ''} need{overdueTasks.length === 1 ? 's' : ''} attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-2">
                      {overdueTasks.slice(0, 5).map((task) => (
                        <Link key={task.id} href={`/tasks/${task.id}`}>
                          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
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
                  <Link href="/tasks">
                    <Button variant="destructive" className="w-full mt-4" size="sm">
                      View All Overdue
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Recent Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ListTodo className="h-5 w-5" />
                  Recent Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {recentTasks.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No tasks yet
                      </p>
                    ) : (
                      recentTasks.map((task) => (
                        <Link key={task.id} href={`/tasks/${task.id}`}>
                          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
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

            {/* Upcoming Tasks */}
            {upcomingTasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5" />
                    Coming Up
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {upcomingTasks.map((task) => (
                      <Link key={task.id} href={`/tasks/${task.id}`}>
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
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
            )}

            {/* New Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  New Members
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : newUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No new users yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {newUsers.map((newUser) => (
                      <Link key={newUser.id} href={`/profiles/${newUser.user_name}`}>
                        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                          <Avatar className="h-10 w-10">
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
                              Joined {formatDistanceToNow(new Date(newUser.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <UserPlus className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
