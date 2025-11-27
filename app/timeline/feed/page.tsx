'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/queries/useAuthQueries'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import UserAvatar from '@/components/user/UserAvatar'
import type { Post, PostComment } from '@/types/posts'
import { useAuthWithProfile } from '@/hooks/useAuth'
import { PostCard } from '@/components/posts'

export default function FeedPage() {
  const { user, profile, loading: authLoading } = useAuthWithProfile()
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

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
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
              likes_count: (post.likes_count || 0) + (isLiked ? -1 : 1)
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
          post.id === postId ? { ...post, comments_count: (post.comments_count || 0) + 1 } : post
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

  useEffect(() => {
    if (!authLoading && user) {
      fetchPosts()
    }
  }, [authLoading, user])

  if (authLoading || loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <p className="mb-4">Please log in to view your timeline</p>
          <Link href="/auth/login">
            <Button>Log In</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <div className=" mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-700 via-pink-700 to-orange-700 bg-clip-text text-transparent mb-2">
            Your Feed
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Stay connected with your community</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed - Left/Center Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post */}
            <Card className="shadow-md border-purple-100 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <h2 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">Create a Post</h2>
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage
                      src={profile?.avatar_url || user?.user_metadata?.avatar_url}
                      alt={profile?.display_name || user?.user_metadata?.full_name}
                    />
                    <AvatarFallback className="bg-primary text-white text-xs">
                      {getInitials(
                        profile?.display_name ||
                        user?.user_metadata?.full_name ||
                        user?.email
                      )}
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
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
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
                ))
              )}
            </div>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card className="border-purple-100 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <h3 className="font-semibold text-purple-700 dark:text-purple-400">Recent Activity</h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              </CardContent>
            </Card>
            <Card className="border-orange-100 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <h3 className="font-semibold text-orange-700 dark:text-orange-400">Friend Requests</h3>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground text-center py-4">
                  No pending requests
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
