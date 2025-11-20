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

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth()
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Feed - Left/Center Column */}
      <div className="lg:col-span-2 space-y-6">
        {/* Create Post */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <Avatar>
                <UserAvatar userId={user.id} />
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
                      onClick={() => handleLike(post.id, post.is_liked || false)}
                      className={post.is_liked ? 'text-red-500' : ''}
                    >
                      <Heart className={`mr-2 h-4 w-4 ${post.is_liked ? 'fill-current' : ''}`} />
                      {post.likes_count || 0}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleComments(post.id)}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {post.comments_count || 0}
                    </Button>
                  </div>

                  {/* Comments Section */}
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
        <Card>
          <CardHeader>
            <h3 className="font-semibold">Friend Requests</h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">
              No pending requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold">Recent Activity</h3>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent activity
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
