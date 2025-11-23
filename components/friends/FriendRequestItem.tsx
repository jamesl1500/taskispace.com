'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Check, X, Loader2 } from 'lucide-react'
import { useAcceptFriendRequest, useRejectFriendRequest } from '@/hooks/useFriendships'
import type { FriendRequest } from '@/types/friendships'
import { toast } from 'sonner'

interface FriendRequestItemProps {
  request: FriendRequest
}

export function FriendRequestItem({ request }: FriendRequestItemProps) {
  const acceptMutation = useAcceptFriendRequest()
  const rejectMutation = useRejectFriendRequest()

  const handleAccept = async () => {
    try {
      await acceptMutation.mutateAsync(request.id)
      toast.success(`You are now friends with ${request.from_user_profile.user_name}!`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to accept friend request'
      toast.error(message)
    }
  }

  const handleReject = async () => {
    try {
      await rejectMutation.mutateAsync(request.id)
      toast.success('Friend request rejected')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject friend request'
      toast.error(message)
    }
  }

  const isLoading = acceptMutation.isPending || rejectMutation.isPending

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={request.from_user_profile.avatar_url || undefined} />
            <AvatarFallback>
              {request.from_user_profile.user_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">
              {request.from_user_profile.display_name || request.from_user_profile.user_name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              @{request.from_user_profile.user_name}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(request.created_at).toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={handleAccept}
              disabled={isLoading}
              className="h-8"
            >
              {acceptMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReject}
              disabled={isLoading}
              className="h-8"
            >
              {rejectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
