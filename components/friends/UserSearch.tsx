'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, UserPlus, Loader2, Check, X } from 'lucide-react'
import { useSearchUsers, useSendFriendRequest, useFriendshipStatus } from '@/hooks/useFriendships'
import { useDebounce } from '@/hooks/useDebounce'
import { toast } from 'sonner'
import Link from 'next/link'
import type { ProfileSearchResult } from '@/types/user'

function UserSearchResultItem({ user }: { user: ProfileSearchResult }) {
  const sendRequestMutation = useSendFriendRequest()
  const { data: friendshipStatus } = useFriendshipStatus(user.user_name)

  const handleSendRequest = async () => {
    try {
      await sendRequestMutation.mutateAsync(user.user_name)
      toast.success(`Friend request sent to ${user.user_name}!`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send friend request'
      toast.error(message)
    }
  }

  const getStatusButton = () => {
    if (!friendshipStatus) {
      return (
        <Button
          size="sm"
          onClick={handleSendRequest}
          disabled={sendRequestMutation.isPending}
          className="h-8"
        >
          {sendRequestMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-1" />
              Add Friend
            </>
          )}
        </Button>
      )
    }

    if (friendshipStatus.status === 'pending') {
      return (
        <Badge variant="outline" className="h-8 px-3">
          <Loader2 className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    }

    if (friendshipStatus.status === 'accepted') {
      return (
        <Badge variant="outline" className="h-8 px-3 bg-green-50 text-green-700 border-green-200">
          <Check className="h-3 w-3 mr-1" />
          Friends
        </Badge>
      )
    }

    if (friendshipStatus.status === 'rejected') {
      return (
        <Badge variant="outline" className="h-8 px-3 bg-red-50 text-red-700 border-red-200">
          <X className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      )
    }

    return null
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Link href={`/profiles/${user.user_name}`}>
            <Avatar className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback>
                {user.user_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          
          <div className="flex-1 min-w-0">
            <Link href={`/profiles/${user.user_name}`}>
              <p className="font-semibold text-sm truncate hover:underline cursor-pointer">
                {user.display_name || user.user_name}
              </p>
            </Link>
            <p className="text-xs text-muted-foreground truncate">
              @{user.user_name}
            </p>
          </div>

          {getStatusButton()}
        </div>
      </CardContent>
    </Card>
  )
}

export function UserSearch() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)
  const { data: users, isLoading } = useSearchUsers(debouncedQuery, 10)

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for users by username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {isLoading && debouncedQuery.length >= 2 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && users && users.length > 0 && (
        <div className="space-y-3">
          {users.map((user) => (
            <UserSearchResultItem key={user.id} user={user} />
          ))}
        </div>
      )}

      {!isLoading && debouncedQuery.length >= 2 && users && users.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            No users found matching &ldquo;{debouncedQuery}&rdquo;
          </p>
        </div>
      )}

      {debouncedQuery.length < 2 && query.length > 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            Type at least 2 characters to search
          </p>
        </div>
      )}
    </div>
  )
}
