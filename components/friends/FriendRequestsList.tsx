'use client'

import React from 'react'
import { FriendRequestItem } from './FriendRequestItem'
import { useFriendRequests } from '@/hooks/useFriendships'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { UserPlus } from 'lucide-react'

export function FriendRequestsList() {
  const { data: requests, isLoading, error } = useFriendRequests()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Friend Requests</CardTitle>
          <CardDescription>Pending friend requests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
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
          <CardTitle>Friend Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">
            {error instanceof Error ? error.message : 'Failed to load friend requests'}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!requests || requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Friend Requests</CardTitle>
          <CardDescription>Pending friend requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <UserPlus className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No pending friend requests
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Friend Requests</CardTitle>
        <CardDescription>
          {requests.length} {requests.length === 1 ? 'request' : 'requests'} pending
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((request) => (
          <FriendRequestItem key={request.id} request={request} />
        ))}
      </CardContent>
    </Card>
  )
}
