'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Heart,
  MessageCircle,
  Send,
  Trash2,
  Edit,
  MoreVertical,
  X,
  Check,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import type { Post, PostComment } from '@/types/posts'

type PostCardProps = {
  post: Post
  currentUserId?: string
  onUpdate?: (postId: string, updatedData: Partial<Post>) => void
  onDelete?: (postId: string) => void
}

export function PostCard({ post, currentUserId, onUpdate, onDelete }: PostCardProps) {
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<PostComment[]>([])
  const [commentContent, setCommentContent] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)

  // Toggle like
  const handleLike = async (isLiked: boolean) => {
    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: isLiked ? 'DELETE' : 'POST'
      })

      if (response.ok && onUpdate) {
        onUpdate(post.id, {
          is_liked: !isLiked,
          likes_count: (post.likes_count || 0) + (isLiked ? -1 : 1)
        })
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  // Delete post
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'DELETE'
      })

      if (response.ok && onDelete) {
        onDelete(post.id)
      }
    } catch (error) {
      console.error('Error deleting post:', error)
    }
  }

  // Update post
  const handleUpdate = async () => {
    if (!editContent.trim()) return

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent })
      })

      if (response.ok) {
        const updatedPost = await response.json()
        if (onUpdate) {
          onUpdate(post.id, updatedPost)
        }
        setEditingPostId(null)
        setEditContent('')
      }
    } catch (error) {
      console.error('Error updating post:', error)
    }
  }

  // Fetch comments
  const fetchComments = async () => {
    setLoadingComments(true)
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoadingComments(false)
    }
  }

  // Add comment
  const handleAddComment = async () => {
    if (!commentContent.trim()) return

    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentContent })
      })

      if (response.ok) {
        const newComment = await response.json()
        setComments([...comments, newComment])
        setCommentContent('')
        if (onUpdate) {
          onUpdate(post.id, {
            comments_count: (post.comments_count || 0) + 1
          })
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  // Toggle comments
  const toggleComments = () => {
    if (!showComments && comments.length === 0) {
      fetchComments()
    }
    setShowComments(!showComments)
  }

  return (
    <Card className="hover:shadow-md transition-shadow border-purple-100">
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
          {currentUserId && post.user_id === currentUserId && (
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
                  onClick={handleDelete}
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
              <Button size="sm" onClick={handleUpdate}>
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
            onClick={() => handleLike(post.is_liked || false)}
            className={post.is_liked ? 'text-red-500' : ''}
          >
            <Heart className={`mr-2 h-4 w-4 ${post.is_liked ? 'fill-current' : ''}`} />
            {post.likes_count || 0}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleComments}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {post.comments_count || 0}
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="space-y-4 pt-4 border-t">
            {/* Add Comment */}
            {currentUserId && (
              <div className="flex gap-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  rows={2}
                  maxLength={1000}
                  className="resize-none"
                />
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!commentContent.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3">
              {loadingComments ? (
                <p className="text-sm text-muted-foreground text-center">Loading comments...</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">No comments yet</p>
              ) : (
                comments.map((comment) => (
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
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
