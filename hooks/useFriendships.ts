import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { friendshipClient } from '@/lib/api/friendship-client'
import type { Friendship } from '@/types/friendships'

/**
 * Get all friendships for the current user
 * @param status - Optional filter by status (pending, accepted, rejected)
 */
export function useFriendships(status?: 'pending' | 'accepted' | 'rejected') {
  return useQuery({
    queryKey: ['friendships', status],
    queryFn: () => friendshipClient.getFriendships(status),
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

/**
 * Get accepted friends only
 */
export function useFriends() {
  return useQuery({
    queryKey: ['friendships', 'accepted'],
    queryFn: () => friendshipClient.getFriendships('accepted'),
    refetchInterval: 30000,
  })
}

/**
 * Get friends with their task statistics
 */
export function useFriendsWithStats() {
  return useQuery({
    queryKey: ['friends-with-stats'],
    queryFn: () => friendshipClient.getFriendsWithStats(),
    refetchInterval: 60000, // Refetch every minute
  })
}

/**
 * Get pending friend requests received by current user
 */
export function useFriendRequests() {
  return useQuery({
    queryKey: ['friend-requests'],
    queryFn: () => friendshipClient.getFriendRequests(),
    refetchInterval: 30000,
  })
}

/**
 * Get count of pending friend requests
 */
export function useFriendRequestsCount() {
  return useQuery({
    queryKey: ['friend-requests-count'],
    queryFn: async () => {
      const requests = await friendshipClient.getFriendRequests()
      return requests.length
    },
    refetchInterval: 30000,
  })
}

/**
 * Search for users by username
 * @param query - Search query string
 * @param limit - Maximum number of results
 */
export function useSearchUsers(query: string, limit: number = 10) {
  return useQuery({
    queryKey: ['search-users', query, limit],
    queryFn: () => friendshipClient.searchUsers(query, limit),
    enabled: query.length >= 2, // Only search if query is at least 2 characters
  })
}

/**
 * Send a friend request
 */
export function useSendFriendRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (friendUsername: string) => 
      friendshipClient.sendFriendRequest(friendUsername),
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['friendships'] })
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] })
      queryClient.invalidateQueries({ queryKey: ['search-users'] })
      queryClient.invalidateQueries({ queryKey: ['friendship-status'] })
    },
  })
}

/**
 * Accept a friend request
 */
export function useAcceptFriendRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (friendshipId: string) => 
      friendshipClient.acceptFriendRequest(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships'] })
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] })
      queryClient.invalidateQueries({ queryKey: ['friend-requests-count'] })
      queryClient.invalidateQueries({ queryKey: ['friends-with-stats'] })
      queryClient.invalidateQueries({ queryKey: ['friendship-status'] })
    },
  })
}

/**
 * Reject a friend request
 */
export function useRejectFriendRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (friendshipId: string) => 
      friendshipClient.rejectFriendRequest(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships'] })
      queryClient.invalidateQueries({ queryKey: ['friend-requests'] })
      queryClient.invalidateQueries({ queryKey: ['friend-requests-count'] })
      queryClient.invalidateQueries({ queryKey: ['friendship-status'] })
    },
  })
}

/**
 * Remove a friend (unfriend)
 */
export function useRemoveFriend() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (friendshipId: string) => 
      friendshipClient.removeFriend(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships'] })
      queryClient.invalidateQueries({ queryKey: ['friends-with-stats'] })
      queryClient.invalidateQueries({ queryKey: ['friendship-status'] })
    },
  })
}

/**
 * Cancel a sent friend request
 */
export function useCancelFriendRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (friendshipId: string) => 
      friendshipClient.removeFriend(friendshipId), // Same API endpoint
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendships'] })
      queryClient.invalidateQueries({ queryKey: ['search-users'] })
      queryClient.invalidateQueries({ queryKey: ['friendship-status'] })
    },
  })
}

/**
 * Check friendship status with a specific user
 * @param username - Username to check friendship status with
 */
export function useFriendshipStatus(username: string | null) {
  return useQuery({
    queryKey: ['friendship-status', username],
    queryFn: async () => {
      if (!username) return null
      
      const friendships = await friendshipClient.getFriendships()
      
      // Find friendship with this user
      const friendship = friendships.find((f: Friendship) => 
        f.user_profile?.user_name === username || 
        f.friend_profile?.user_name === username
      )
      
      return friendship || null
    },
    enabled: !!username,
  })
}
