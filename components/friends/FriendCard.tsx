'use client'

import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserMinus, MessageCircle, Loader2 } from 'lucide-react'
import { useRemoveFriend } from '@/hooks/useFriendships'
import type { FriendWithStats } from '@/types/friendships'
import { toast } from 'sonner'
import Link from 'next/link'

interface FriendCardProps {
  friend: FriendWithStats
  showStats?: boolean
}

export function FriendCard({ friend, showStats = true }: FriendCardProps) {
  const removeMutation = useRemoveFriend()
  const profile = friend.friend_profile

  const handleRemove = async () => {
    if (!confirm(`Are you sure you want to remove ${profile.user_name} from your friends?`)) {
      return
    }

    try {
      await removeMutation.mutateAsync(friend.id)
      toast.success(`${profile.user_name} has been removed from your friends`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove friend'
      toast.error(message)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Link href={`/profiles/${profile.user_name}`}>
            <Avatar className="h-12 w-12 cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback>
                {profile.user_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1 min-w-0">
            <Link href={`/profiles/${profile.user_name}`}>
              <p className="font-semibold text-sm truncate hover:underline cursor-pointer">
                {profile.display_name || profile.user_name}
              </p>
            </Link>
            <p className="text-xs text-muted-foreground truncate">
              @{profile.user_name}
            </p>
            
            {showStats && friend.stats && (
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {friend.stats.total_tasks} tasks
                </Badge>
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  {friend.stats.completed_tasks} completed
                </Badge>
                {friend.stats.overdue_tasks > 0 && (
                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                    {friend.stats.overdue_tasks} overdue
                  </Badge>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-2">
              Friends since {new Date(friend.created_at).toLocaleDateString(undefined, { 
                month: 'short', 
                year: 'numeric'
              })}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Link href={`/conversations/new?username=${profile.user_name}`}>
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-full"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Message
              </Button>
            </Link>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRemove}
              disabled={removeMutation.isPending}
              className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {removeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <UserMinus className="h-4 w-4 mr-1" />
                  Remove
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
