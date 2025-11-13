'use client'

import { useState } from 'react'
import { useComments, useCreateComment, useUpdateComment, useDeleteComment } from '@/hooks/queries/useTaskManagementQueries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import UserName from '@/components/user/UserName'
import { MessageCircle, Reply, Edit, Trash2, Send } from 'lucide-react'
import { useAuth } from '@/hooks/queries/useAuthQueries'
import UserAvatar from '../user/UserAvatar'

interface CommentsProps {
  taskId: string
  canComment: boolean
}

interface CommentWithReplies {
  id: string
  task_id: string
  author: string
  parent_id?: string
  content: string
  is_deleted?: boolean
  deleted_at?: string
  edited_at?: string
  created_at: string
  replies?: CommentWithReplies[]
}

export default function Comments({ taskId, canComment }: CommentsProps) {
  const [newComment, setNewComment] = useState('')
  const [replyToId, setReplyToId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const { user } = useAuth()

  // React Query hooks
  const { 
    data: commentsData = [], 
    isLoading: loading, 
    error 
  } = useComments(taskId)

  const createCommentMutation = useCreateComment()
  const updateCommentMutation = useUpdateComment()
  const deleteCommentMutation = useDeleteComment()

  // Organize comments with their replies
  const organizedComments: CommentWithReplies[] = []
  const commentsMap = new Map<string, CommentWithReplies>()

  // First, create all comments
  commentsData.forEach((comment: CommentWithReplies) => {
    commentsMap.set(comment.id, { ...comment, replies: [] })
  })

  // Then organize into hierarchy
  commentsData.forEach((comment: CommentWithReplies) => {
    if (comment.parent_id) {
      const parent = commentsMap.get(comment.parent_id)
      if (parent) {
        parent.replies!.push(commentsMap.get(comment.id)!)
      }
    } else {
      organizedComments.push(commentsMap.get(comment.id)!)
    }
  })

  const handleCreateComment = () => {
    if (!newComment.trim()) return

    createCommentMutation.mutate({
      task_id: taskId,
      content: newComment
    }, {
      onSuccess: () => {
        setNewComment('')
      }
    })
  }

  const handleReply = (parentId: string) => {
    if (!replyText.trim()) return

    createCommentMutation.mutate({
      task_id: taskId,
      content: replyText,
      parent_id: parentId
    }, {
      onSuccess: () => {
        setReplyText('')
        setReplyToId(null)
      }
    })
  }

  const handleEdit = (commentId: string) => {
    if (!editText.trim()) return

    updateCommentMutation.mutate({
      id: commentId,
      content: editText
    }, {
      onSuccess: () => {
        setEditText('')
        setEditingId(null)
      }
    })
  }

  const handleDelete = (commentId: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(commentId)
    }
  }

  const startEdit = (comment: CommentWithReplies) => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const renderComment = (comment: CommentWithReplies, level = 0) => {
    const isDeleted = comment.is_deleted || comment.deleted_at
    const isEditing = editingId === comment.id
    const isReplying = replyToId === comment.id

    const canEdit = comment.author === user?.id

    return (
      <div key={comment.id} className={`${level > 0 ? 'ml-8 border-l border-slate-200 dark:border-slate-700 pl-4' : ''}`}>
        <div className="flex space-x-3 mb-4">
          <Avatar className="h-8 w-8">
            <UserAvatar userId={comment.author} size={32} /> 
            <AvatarFallback>
              {comment.author.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <UserName userId={comment.author} />
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {formatDate(comment.created_at)}
              </span>
              {comment.edited_at && (
                <span className="text-xs text-slate-400">
                  (edited)
                </span>
              )}
            </div>
            
            {isDeleted ? (
              <p className="text-slate-500 italic">This comment has been deleted</p>
            ) : isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="min-h-[60px]"
                />
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleEdit(comment.id)}
                    disabled={updateCommentMutation.isPending}
                  >
                    {updateCommentMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEdit}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-slate-800 dark:text-slate-200 mb-2">
                  {comment.content}
                </p>
                
                {canComment && !isDeleted && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startReply(comment.id)}
                      className="h-6 px-2"
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Reply
                    </Button>

                    {canEdit && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(comment)}
                        className="h-6 px-2"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(comment.id)}
                      className="h-6 px-2 text-red-600 hover:text-red-700"
                      disabled={deleteCommentMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
                
                {isReplying && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a reply..."
                      className="min-h-[60px]"
                    />
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleReply(comment.id)}
                        disabled={createCommentMutation.isPending}
                      >
                        {createCommentMutation.isPending ? 'Posting...' : 'Reply'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelReply}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Render replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="space-y-4">
            {comment.replies.map(reply => renderComment(reply, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-red-600 dark:text-red-400">
            Failed to load comments. Please try again.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5" />
          <span>Comments ({organizedComments.length})</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* New Comment Form */}
        {canComment && (
          <div className="mb-6 space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="min-h-[80px]"
            />
            <Button 
              onClick={handleCreateComment}
              disabled={!newComment.trim() || createCommentMutation.isPending}
              className="flex items-center space-x-2"
            >
              <Send className="h-4 w-4" />
              <span>{createCommentMutation.isPending ? 'Posting...' : 'Post Comment'}</span>
            </Button>
          </div>
        )}
        
        {/* Comments List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex space-x-3">
                <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : organizedComments.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {organizedComments.map(comment => renderComment(comment))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}