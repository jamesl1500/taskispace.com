# Friendship System - Quick Reference

## Installation

Already integrated! Just import and use.

## Quick Start

### 1. Display Friends List

```tsx
import { FriendsList } from '@/components/friends'

<FriendsList showStats={true} />
```

### 2. Display Friend Requests

```tsx
import { FriendRequestsList } from '@/components/friends'

<FriendRequestsList />
```

### 3. Search for Users

```tsx
import { UserSearch } from '@/components/friends'

<UserSearch />
```

### 4. Add to Profile Page

```tsx
import { FriendshipButton } from '@/components/friends'

<FriendshipButton 
  username={profile.user_name}
  userId={profile.id}
  currentUserId={currentUser.id}
/>
```

### 5. Add to Header/Navigation

```tsx
import { FriendRequestBadge } from '@/components/friends'

<FriendRequestBadge />
```

## Hooks Cheat Sheet

```tsx
import { 
  useFriends,              // Get accepted friends
  useFriendRequests,       // Get pending requests
  useSendFriendRequest,    // Send request
  useAcceptFriendRequest,  // Accept request
  useRemoveFriend          // Remove friend
} from '@/hooks/useFriendships'

// Query example
const { data, isLoading, error } = useFriends()

// Mutation example
const sendRequest = useSendFriendRequest()
await sendRequest.mutateAsync('username')
```

## Complete Page Example

```tsx
'use client'

import { 
  FriendsList, 
  FriendRequestsList, 
  UserSearch 
} from '@/components/friends'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function FriendsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Friends</h1>
      
      <Tabs defaultValue="friends">
        <TabsList>
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="search">Find Friends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="friends">
          <FriendsList />
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

## Available Components

| Component | Purpose | Props |
|-----------|---------|-------|
| `FriendsList` | Display friends with stats | `showStats?: boolean` |
| `FriendRequestsList` | Display pending requests | None |
| `FriendCard` | Single friend card | `friend: FriendWithStats, showStats?: boolean` |
| `FriendRequestItem` | Single request card | `request: FriendRequest` |
| `UserSearch` | Search and add friends | None |
| `FriendshipButton` | Smart action button | `username, userId, currentUserId` |
| `FriendRequestBadge` | Notification badge | None |

## Available Hooks

### Queries (Read)
- `useFriendships(status?)` - All friendships
- `useFriends()` - Accepted friends only
- `useFriendsWithStats()` - Friends with task stats
- `useFriendRequests()` - Pending requests
- `useFriendRequestsCount()` - Request count
- `useSearchUsers(query, limit)` - Search users
- `useFriendshipStatus(username)` - Check status

### Mutations (Write)
- `useSendFriendRequest()` - Send request
- `useAcceptFriendRequest()` - Accept request
- `useRejectFriendRequest()` - Reject request
- `useRemoveFriend()` - Remove friend
- `useCancelFriendRequest()` - Cancel sent request

## Common Patterns

### Loading State

```tsx
const { data, isLoading } = useFriends()

if (isLoading) return <Skeleton />
```

### Error Handling

```tsx
const sendRequest = useSendFriendRequest()

try {
  await sendRequest.mutateAsync(username)
  toast.success('Request sent!')
} catch (error) {
  toast.error(error.message)
}
```

### Conditional Rendering

```tsx
const { data: friendship } = useFriendshipStatus(username)

if (!friendship) return <AddFriendButton />
if (friendship.status === 'pending') return <PendingBadge />
if (friendship.status === 'accepted') return <FriendsBadge />
```

## TypeScript Types

```tsx
import type { 
  Friendship,
  FriendRequest,
  FriendWithStats
} from '@/types/friendships'
```

## File Locations

```
hooks/useFriendships.ts              - React hooks
lib/api/friendship-client.ts         - API client
components/friends/                  - UI components
  ├── FriendsList.tsx
  ├── FriendRequestsList.tsx
  ├── FriendCard.tsx
  ├── FriendRequestItem.tsx
  ├── UserSearch.tsx
  ├── FriendshipButton.tsx
  ├── FriendRequestBadge.tsx
  └── index.ts
app/friends/page.tsx                 - Example page
docs/FRIENDSHIP_FRONTEND.md          - Full documentation
```

## Support

- 📖 Full docs: `docs/FRIENDSHIP_FRONTEND.md`
- 📚 Component docs: `components/friends/README.md`
- 💻 Example page: `app/friends/page.tsx`
- 🎯 Types: `types/friendships.ts`
