'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserPlus, UserMinus, UserCheck, Loader2, X } from 'lucide-react'
import { 
  useFriendshipStatus, 
  useSendFriendRequest, 
  useRemoveFriend,
  useCancelFriendRequest,
  useAcceptFriendRequest,
  useRejectFriendRequest
} from '@/hooks/useFriendships'
import { toast } from 'sonner'

interface FriendshipButtonProps {
  username: string
  userId: string
  currentUserId: string
}

export function FriendshipButton({ username, userId, currentUserId }: FriendshipButtonProps) {
  const { data: friendship, isLoading } = useFriendshipStatus(username)
  const sendRequestMutation = useSendFriendRequest()
  const removeFriendMutation = useRemoveFriend()
  const cancelRequestMutation = useCancelFriendRequest()
  const acceptRequestMutation = useAcceptFriendRequest()
  const rejectRequestMutation = useRejectFriendRequest()

  // Track optimistic state
  const isAnyMutationPending = 
    sendRequestMutation.isPending || 
    removeFriendMutation.isPending || 
    cancelRequestMutation.isPending || 
    acceptRequestMutation.isPending || 
    rejectRequestMutation.isPending

  // Don't show button for own profile
  if (userId === currentUserId) {
    return null
  }

  const handleSendRequest = async () => {
    try {
      await sendRequestMutation.mutateAsync(username)
      toast.success(`Friend request sent to ${username}!`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send friend request'
      toast.error(message)
    }
  }

  const handleRemoveFriend = async () => {
    if (!friendship) return
    
    if (!confirm(`Are you sure you want to remove ${username} from your friends?`)) {
      return
    }

    try {
      await removeFriendMutation.mutateAsync(friendship.id)
      toast.success(`${username} has been removed from your friends`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove friend'
      toast.error(message)
    }
  }

  const handleCancelRequest = async () => {
    if (!friendship) return

    try {
      await cancelRequestMutation.mutateAsync(friendship.id)
      toast.success('Friend request cancelled')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel friend request'
      toast.error(message)
    }
  }

  const handleAcceptRequest = async () => {
    if (!friendship) return

    try {
      await acceptRequestMutation.mutateAsync(friendship.id)
      toast.success(`You are now friends with ${username}!`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to accept friend request'
      toast.error(message)
    }
  }

  const handleRejectRequest = async () => {
    if (!friendship) return

    try {
      await rejectRequestMutation.mutateAsync(friendship.id)
      toast.success('Friend request rejected')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject friend request'
      toast.error(message)
    }
  }

  if (isLoading || isAnyMutationPending) {
    return (
      <Button disabled variant="outline">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading...
      </Button>
    )
  }

  // No friendship exists - show add friend button
  if (!friendship) {
    return (
      <Button
        onClick={handleSendRequest}
        disabled={isAnyMutationPending}
        className="cursor-pointer"
      >
        <UserPlus className="h-4 w-4 mr-2" />
        Add Friend
      </Button>
    )
  }

  // Friendship is pending - determine who sent the request
  if (friendship.status === 'pending') {
    const isSentByCurrentUser = friendship.user_id === currentUserId

    if (isSentByCurrentUser) {
      // Current user sent the request - show cancel button
      return (
        <Button
          variant="outline"
          onClick={handleCancelRequest}
          disabled={isAnyMutationPending}
          className="cursor-pointer"
        >
          {cancelRequestMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <X className="h-4 w-4 mr-2" />
          )}
          Cancel Request
        </Button>
      )
    } else {
      // Other user sent the request - show accept/reject buttons
      return (
        <div className="flex gap-2">
          <Button
            onClick={handleAcceptRequest}
            disabled={isAnyMutationPending}
            className="cursor-pointer"
          >
            {acceptRequestMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserCheck className="h-4 w-4 mr-2" />
            )}
            Accept
          </Button>
          <Button
            variant="outline"
            onClick={handleRejectRequest}
            disabled={isAnyMutationPending}
            className="cursor-pointer"
          >
            {rejectRequestMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <X className="h-4 w-4 mr-2" />
            )}
            Reject
          </Button>
        </div>
      )
    }
  }

  // Friendship is accepted - show remove friend button
  if (friendship.status === 'accepted') {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <UserCheck className="h-3 w-3 mr-1" />
          Friends
        </Badge>
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={handleRemoveFriend}
          disabled={isAnyMutationPending}
        >
          {removeFriendMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <UserMinus className="h-4 w-4 mr-2" />
          )}
          Remove Friend
        </Button>
      </div>
    )
  }

  // Friendship was rejected
  if (friendship.status === 'rejected') {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
        Request Rejected
      </Badge>
    )
  }

  return null
}
