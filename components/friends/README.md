# Friendship System - Frontend Documentation

This directory contains all the frontend logic for managing friendships and friend requests in the application.

## Overview

The friendship system allows users to:
- Search for other users
- Send friend requests
- Accept or reject incoming friend requests
- View friends list with task statistics
- Remove friends
- Check friendship status on user profiles

## Architecture

### Hooks (`hooks/useFriendships.ts`)

Custom React hooks using TanStack Query for state management:

- **`useFriendships(status?)`** - Get all friendships with optional status filter
- **`useFriends()`** - Get accepted friends only
- **`useFriendsWithStats()`** - Get friends with their task statistics
- **`useFriendRequests()`** - Get pending friend requests
- **`useFriendRequestsCount()`** - Get count of pending requests
- **`useSearchUsers(query, limit)`** - Search for users by username
- **`useSendFriendRequest()`** - Send a friend request (mutation)
- **`useAcceptFriendRequest()`** - Accept a friend request (mutation)
- **`useRejectFriendRequest()`** - Reject a friend request (mutation)
- **`useRemoveFriend()`** - Remove a friend (mutation)
- **`useCancelFriendRequest()`** - Cancel a sent friend request (mutation)
- **`useFriendshipStatus(username)`** - Check friendship status with a user

### API Client (`lib/api/friendship-client.ts`)

Client-side wrapper for friendship API endpoints:

```typescript
import { friendshipClient } from '@/lib/api/friendship-client'

// Get friendships
const friendships = await friendshipClient.getFriendships('accepted')

// Send friend request
const friendship = await friendshipClient.sendFriendRequest('username')

// Accept request
const accepted = await friendshipClient.acceptFriendRequest(friendshipId)
```

### Components (`components/friends/`)

Ready-to-use UI components:

#### `FriendRequestItem`
Displays a single friend request with accept/reject buttons.

```tsx
import { FriendRequestItem } from '@/components/friends'

<FriendRequestItem request={request} />
```

#### `FriendRequestsList`
Complete list of pending friend requests with loading and empty states.

```tsx
import { FriendRequestsList } from '@/components/friends'

<FriendRequestsList />
```

#### `FriendCard`
Displays a friend with their stats and action buttons (message, remove).

```tsx
import { FriendCard } from '@/components/friends'

<FriendCard friend={friend} showStats={true} />
```

#### `FriendsList`
Complete friends list with loading and empty states.

```tsx
import { FriendsList } from '@/components/friends'

<FriendsList showStats={true} />
```

#### `UserSearch`
Search interface for finding users and sending friend requests.

```tsx
import { UserSearch } from '@/components/friends'

<UserSearch />
```

#### `FriendshipButton`
Smart button that shows appropriate action based on friendship status.
Perfect for profile pages.

```tsx
import { FriendshipButton } from '@/components/friends'

<FriendshipButton 
  username={profile.user_name}
  userId={profile.id}
  currentUserId={currentUser.id}
/>
```

## Usage Examples

### Basic Friends Page

```tsx
'use client'

import { FriendRequestsList, FriendsList, UserSearch } from '@/components/friends'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function FriendsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Friends</h1>
      
      <Tabs defaultValue="friends">
        <TabsList>
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="search">Find Friends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="friends">
          <FriendsList showStats={true} />
        </TabsContent>
        
        <TabsContent value="requests">
          <FriendRequestsList />
        </TabsContent>
        
        <TabsContent value="search">
          <UserSearch />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### Profile Page with Friendship Button

```tsx
'use client'

import { FriendshipButton } from '@/components/friends'
import { useAuth } from '@/hooks/useAuth'

export default function ProfilePage({ profile }) {
  const { user } = useAuth()
  
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1>{profile.display_name}</h1>
        {user && (
          <FriendshipButton
            username={profile.user_name}
            userId={profile.id}
            currentUserId={user.id}
          />
        )}
      </div>
    </div>
  )
}
```

### Custom Implementation

```tsx
'use client'

import { useFriendRequests, useAcceptFriendRequest } from '@/hooks/useFriendships'
import { toast } from 'sonner'

export default function CustomFriendRequests() {
  const { data: requests, isLoading } = useFriendRequests()
  const acceptMutation = useAcceptFriendRequest()
  
  const handleAccept = async (requestId: string) => {
    try {
      await acceptMutation.mutateAsync(requestId)
      toast.success('Friend request accepted!')
    } catch (error) {
      toast.error(error.message)
    }
  }
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <div>
      {requests?.map(request => (
        <div key={request.id}>
          <span>{request.from_user_profile.user_name}</span>
          <button onClick={() => handleAccept(request.id)}>
            Accept
          </button>
        </div>
      ))}
    </div>
  )
}
```

## API Endpoints

The hooks and client use these API endpoints:

- `GET /api/friendships` - Get all friendships
- `GET /api/friendships?status=pending|accepted|rejected` - Filter by status
- `GET /api/friendships/with-stats` - Get friends with stats
- `GET /api/friendships/requests` - Get pending requests
- `GET /api/friendships/search?q=username&limit=10` - Search users
- `POST /api/friendships` - Send friend request
- `PATCH /api/friendships/[id]` - Accept/reject request
- `DELETE /api/friendships/[id]` - Remove friend

## Error Handling

All mutations include automatic error handling with toast notifications:

```tsx
const sendRequest = useSendFriendRequest()

// Errors are automatically caught and displayed
await sendRequest.mutateAsync(username)
```

For custom error handling:

```tsx
try {
  await sendRequest.mutateAsync(username)
  // Success handling
} catch (error) {
  // Custom error handling
  console.error(error)
}
```

## Subscription Limits

The system respects subscription limits for friend counts. When accepting a friend request:

- Free tier users have a limit
- Paid tier users have higher limits
- API returns 403 with upgrade information if limit is reached

```typescript
// Error response includes:
{
  error: "You have reached your friend limit",
  upgrade: true,
  current: 10,
  limit: 10
}
```

## State Management

All queries are automatically cached and refetched:

- Friendships: Refetch every 30 seconds
- Friend requests: Refetch every 30 seconds
- Friends with stats: Refetch every 60 seconds

Mutations automatically invalidate related queries:

- Sending a request → Invalidates friendships and search results
- Accepting a request → Invalidates friendships, requests, and stats
- Removing a friend → Invalidates friendships and stats

## TypeScript Types

All types are available from `@/types/friendships`:

```typescript
import type { 
  Friendship, 
  FriendRequest, 
  FriendWithStats 
} from '@/types/friendships'
```

## Best Practices

1. **Use hooks for data fetching** - Don't call the API client directly
2. **Handle loading states** - All hooks provide `isLoading` state
3. **Show error messages** - Display errors to users with toast notifications
4. **Respect permissions** - Check subscription limits and user permissions
5. **Optimize renders** - Components are memoized where appropriate
6. **Accessibility** - All components include proper ARIA labels

## Future Enhancements

Potential improvements:

- Real-time notifications for friend requests
- Friend suggestions based on mutual friends
- Bulk friend management actions
- Friend groups/categories
- Privacy settings for friend list visibility
