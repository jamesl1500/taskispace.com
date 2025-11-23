'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { UserPlus } from 'lucide-react'
import { useFriendRequestsCount } from '@/hooks/useFriendships'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * Friend Request Badge
 * Shows count of pending friend requests
 * Can be used in navigation/header
 */
export function FriendRequestBadge() {
  const { data: count, isLoading } = useFriendRequestsCount()

  if (isLoading) {
    return null
  }

  if (!count || count === 0) {
    return (
      <Link href="/friends?tab=requests">
        <Button variant="ghost" size="sm">
          <UserPlus className="h-4 w-4" />
        </Button>
      </Link>
    )
  }

  return (
    <Link href="/friends?tab=requests">
      <Button variant="ghost" size="sm" className="relative">
        <UserPlus className="h-4 w-4" />
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
        >
          {count > 9 ? '9+' : count}
        </Badge>
      </Button>
    </Link>
  )
}
