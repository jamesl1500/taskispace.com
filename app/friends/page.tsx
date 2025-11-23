'use client'

import React from 'react'
import { FriendRequestsList, FriendsList, UserSearch } from '@/components/friends'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, UserPlus, Search } from 'lucide-react'
import { useFriendRequestsCount, useFriends } from '@/hooks/useFriendships'

/**
 * Friends Page
 * Main page for managing friendships
 */
export default function FriendsPage() {
  const { data: requestCount } = useFriendRequestsCount()
  const { data: friends } = useFriends()

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Friends</h1>
        <p className="text-muted-foreground">
          Connect with friends, manage friend requests, and track productivity together
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Friends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{friends?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total friends
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-green-600" />
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requestCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4 text-purple-600" />
              Find Friends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Search for users to connect with
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="friends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Friends</span>
            {friends && friends.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {friends.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span>Requests</span>
            {requestCount && requestCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {requestCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span>Find Friends</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          <FriendsList showStats={true} />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <FriendRequestsList />
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Find Friends</CardTitle>
              <CardDescription>
                Search for users by username to send friend requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserSearch />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
