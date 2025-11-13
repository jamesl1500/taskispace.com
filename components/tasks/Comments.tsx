'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MessageCircle, MoreVertical, Edit, Trash2, Reply } from 'lucide-react'
import { commentsApi } from '@/lib/api/taskManagement'
import { TaskComment } from '@/types/tasks'

interface CommentsProps {
  taskId: string
  canComment: boolean
}

interface CommentWithReplies extends TaskComment {
  replies?: TaskComment[]
}

export default function Comments({ taskId, canComment }: CommentsProps) {
  const [comments, setComments] = useState<CommentWithReplies[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [replyToId, setReplyToId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadComments = useCallback(async () => {
    try {
      setLoading(true)
      const data = await commentsApi.getByTaskId(taskId)
      
      // Organize comments with their replies
      const commentsMap = new Map<string, CommentWithReplies>()
      const topLevelComments: CommentWithReplies[] = []

      // First, create all comments
      data.forEach((comment: TaskComment) => {
        commentsMap.set(comment.id, { ...comment, replies: [] })
      })

      // Then organize into hierarchy
      data.forEach((comment: TaskComment) => {
        if (comment.parent_id) {
          const parent = commentsMap.get(comment.parent_id)
          if (parent) {
            parent.replies!.push(commentsMap.get(comment.id)!)
          }
        } else {
          topLevelComments.push(commentsMap.get(comment.id)!)
        }
      })

      setComments(topLevelComments)
    } catch (error) {
      console.error('Failed to load comments:', error)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handleCreateComment = async () => {
    if (!newComment.trim() || submitting) return

    try {
      setSubmitting(true)
      await commentsApi.create({
        task_id: taskId,
        content: newComment
      })
      
      setNewComment('')
      await loadComments() // Reload to get the new comment
    } catch (error) {
      console.error('Failed to create comment:', error)
      alert('Failed to create comment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (parentId: string) => {
    if (!replyText.trim() || submitting) return

    try {
      setSubmitting(true)
      await commentsApi.create({
        task_id: taskId,
        content: replyText,
        parent_id: parentId
      })
      
      setReplyToId(null)
      setReplyText('')
      await loadComments()
    } catch (error) {
      console.error('Failed to create reply:', error)
      alert('Failed to create reply. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editText.trim() || submitting) return

    try {
      setSubmitting(true)
      await commentsApi.update(commentId, editText)
      
      setEditingId(null)
      setEditText('')
      await loadComments()
    } catch (error) {
      console.error('Failed to update comment:', error)
      alert('Failed to update comment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    try {
      await commentsApi.delete(commentId)
      await loadComments()
    } catch (error) {
      console.error('Failed to delete comment:', error)
      alert('Failed to delete comment. Please try again.')
    }
  }

  const startEdit = (comment: TaskComment) => {
    setEditingId(comment.id)
    setEditText(comment.content)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const startReply = (commentId: string) => {
    setReplyToId(commentId)
    setReplyText('')
  }

  const cancelReply = () => {
    setReplyToId(null)
    setReplyText('')
  }

  const renderComment = (comment: CommentWithReplies, isReply = false) => {
    const isEditing = editingId === comment.id
    const isReplying = replyToId === comment.id

    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 border-l-2 border-gray-200 pl-4' : ''}`}>
        <Card className="mb-3">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {comment.author.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm text-gray-900">
                    {comment.author}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.created_at).toLocaleString()}
                  </span>
                  {comment.edited_at && (
                    <span className="text-xs text-gray-400">(edited)</span>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="min-h-[80px]"
                      placeholder="Edit your comment..."
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleEditComment(comment.id)}
                        disabled={!editText.trim() || submitting}
                      >
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={cancelEdit}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {comment.is_deleted ? (
                        <em className="text-gray-500">[This comment has been deleted]</em>
                      ) : (
                        comment.content
                      )}
                    </p>

                    {canComment && !comment.is_deleted && (
                      <div className="flex items-center gap-3 mt-3">
                        {!isReply && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => startReply(comment.id)}
                            className="text-xs"
                          >
                            <Reply className="h-3 w-3 mr-1" />
                            Reply
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {canComment && !comment.is_deleted && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => startEdit(comment)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Reply Form */}
            {isReplying && (
              <div className="mt-4 ml-11 space-y-3">
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="min-h-[80px]"
                  placeholder="Write your reply..."
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleReply(comment.id)}
                    disabled={!replyText.trim() || submitting}
                  >
                    Reply
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={cancelReply}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Render Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-2">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-20 bg-gray-200 rounded animate-pulse" />
        <div className="h-16 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">Comments</h4>
        <span className="text-sm text-gray-500">
          {comments.reduce((total, comment) => 
            total + 1 + (comment.replies?.length || 0), 0
          )} comment{comments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* New Comment Form */}
      {canComment && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="min-h-[100px] resize-none"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleCreateComment}
                  disabled={!newComment.trim() || submitting}
                >
                  {submitting ? 'Adding...' : 'Add Comment'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-2">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No comments yet</p>
            {canComment && (
              <p className="text-sm mt-1">Be the first to add a comment!</p>
            )}
          </div>
        ) : (
          comments.map(comment => renderComment(comment))
        )}
      </div>
    </div>
  )
}