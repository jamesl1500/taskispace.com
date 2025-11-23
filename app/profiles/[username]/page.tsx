'use client'

import { useParams } from 'next/navigation'
import { useProfileByUsername } from '@/hooks/queries/useProfileQueries'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MessageCircle, Calendar, User } from 'lucide-react'
import { FriendshipButton } from '@/components/friends'
import Link from 'next/link'

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string
  const { user } = useAuth()
  
  const { data: profile, isLoading, error } = useProfileByUsername(username)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-200 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-10 w-40" />
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-200 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The user profile you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Link href="/profiles">
              <Button variant="outline">
                Browse Profiles
              </Button>
            </Link>
          </CardContent>
        </Card>
        </div>
      </div>
    )
  }

  const isOwnProfile = user?.id === profile.id
  const joinedDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const getInitials = (name: string | null) => {
    if (!name) return profile.user_name.charAt(0).toUpperCase()
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || profile.user_name} />
                <AvatarFallback className="text-lg">
                  {getInitials(profile.display_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">
                  {profile.display_name || profile.user_name}
                </h1>
                <p className="text-muted-foreground text-lg">
                  @{profile.user_name}
                </p>
                <div className="flex items-center mt-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  Joined {joinedDate}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              {!isOwnProfile && user && (
                <div className="flex space-x-2">
                  <Link href={`/conversations/new?user=${profile.user_name}`}>
                    <Button>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Start Conversation
                    </Button>
                  </Link>
                  <FriendshipButton
                    username={profile.user_name}
                    userId={profile.id}
                    currentUserId={user.id}
                  />
                </div>
              )}
              {isOwnProfile && (
                <Link href="/settings/profile">
                  <Button variant="outline">
                    Edit Profile
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {profile.bio && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">About</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {profile.bio}
              </p>
            </div>
          )}
          
          <div className="border-t pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Profile Info</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Username:</span>
                    <Badge variant="secondary">@{profile.user_name}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member since:</span>
                    <span>{joinedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Profile updated:</span>
                    <span>{new Date(profile.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  {!isOwnProfile && (
                    <Link href={`/conversations/new?user=${profile.user_name}`} className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                    </Link>
                  )}
                  <Link href="/profiles" className="block">
                    <Button variant="ghost" className="w-full justify-start">
                      <User className="h-4 w-4 mr-2" />
                      Browse All Profiles
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}