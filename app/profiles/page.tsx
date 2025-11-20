'use client'

import { useState } from 'react'
import { useSearchProfiles } from '@/hooks/queries/useProfileQueries'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, MessageCircle, Users } from 'lucide-react'
import Link from 'next/link'
import { useDebounce } from '@/hooks/useDebounce'

export default function ProfilesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 300)
  const { user } = useAuth()
  
  const { data: allProfiles = [], isLoading } = useSearchProfiles(
    debouncedQuery,
    debouncedQuery.length >= 2
  )
  
  // Filter out current user from profiles
  const profiles = allProfiles.filter(profile => profile.id !== user?.id)

  const getInitials = (name: string | null, username: string) => {
    if (!name) return username.charAt(0).toUpperCase()
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Browse Profiles</h1>
        <p className="text-muted-foreground">
          Discover and connect with other users
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by username or display name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {debouncedQuery.length < 2 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Search for Users</h3>
            <p className="text-muted-foreground">
              Enter at least 2 characters to search for users by their username or display name.
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground">
              No users match your search criteria. Try a different search term.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <Card key={profile.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || profile.user_name} />
                    <AvatarFallback>
                      {getInitials(profile.display_name, profile.user_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold truncate">
                      {profile.display_name || profile.user_name}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      @{profile.user_name}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Link href={`/profiles/${profile.user_name}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      View Profile
                    </Button>
                  </Link>
                  {profile.id !== user?.id && (
                    <Link href={`/conversations/new?user=${profile.user_name}`}>
                      <Button size="sm" className="px-3">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {profiles.length > 0 && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Showing {profiles.length} result{profiles.length !== 1 ? 's' : ''} for &quot;{debouncedQuery}&quot;
        </div>
      )}
    </div>
    </div>
  )
}