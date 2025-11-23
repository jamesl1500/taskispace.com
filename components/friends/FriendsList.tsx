'use client'

import React from 'react'
import { FriendCard } from './FriendCard'
import { useFriendsWithStats } from '@/hooks/useFriendships'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users } from 'lucide-react'

interface FriendsListProps {
  showStats?: boolean
}

export function FriendsList({ showStats = true }: FriendsListProps) {
  const { data: friends, isLoading, error } = useFriendsWithStats()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Friends</CardTitle>
          <CardDescription>Your friends list</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Friends</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : 'Failed to load friends'}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!friends || friends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Friends</CardTitle>
          <CardDescription>Your friends list</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-1">
              You don&apos;t have any friends yet
            </p>
            <p className="text-xs text-muted-foreground">
              Search for users and send friend requests to get started!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Friends</CardTitle>
        <CardDescription>
          {friends.length} {friends.length === 1 ? 'friend' : 'friends'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {friends.map((friend) => (
          <FriendCard key={friend.id} friend={friend} showStats={showStats} />
        ))}
      </CardContent>
    </Card>
  )
}
