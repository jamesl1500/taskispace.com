/**
 * Friendship Client API
 * Client-side wrapper for friendship-related API calls
 * 
 * @module api/friendship-client
 */

import type { Friendship, FriendRequest, FriendWithStats } from '@/types/friendships'
import type { ProfileSearchResult } from '@/types/user'

export const friendshipClient = {
  /**
   * Get all friendships for the current user
   * @param status - Optional filter by status
   */
  async getFriendships(status?: 'pending' | 'accepted' | 'rejected'): Promise<Friendship[]> {
    const url = status 
      ? `/api/friendships?status=${status}` 
      : '/api/friendships'
    
    const response = await fetch(url)
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch friendships' }))
      throw new Error(error.error || 'Failed to fetch friendships')
    }
    
    return response.json()
  },

  /**
   * Get friends with their task statistics
   */
  async getFriendsWithStats(): Promise<FriendWithStats[]> {
    const response = await fetch('/api/friendships/with-stats')
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch friends with stats' }))
      throw new Error(error.error || 'Failed to fetch friends with stats')
    }
    
    return response.json()
  },

  /**
   * Get pending friend requests received by current user
   */
  async getFriendRequests(): Promise<FriendRequest[]> {
    const response = await fetch('/api/friendships/requests')
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch friend requests' }))
      throw new Error(error.error || 'Failed to fetch friend requests')
    }
    
    return response.json()
  },

  /**
   * Search for users by username
   * @param query - Search query string
   * @param limit - Maximum number of results (default: 10)
   */
  async searchUsers(query: string, limit: number = 10): Promise<ProfileSearchResult[]> {
    const response = await fetch(`/api/friendships/search?q=${encodeURIComponent(query)}&limit=${limit}`)
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to search users' }))
      throw new Error(error.error || 'Failed to search users')
    }
    
    return response.json()
  },

  /**
   * Send a friend request
   * @param friendUsername - Username of the user to send request to
   */
  async sendFriendRequest(friendUsername: string): Promise<Friendship> {
    const response = await fetch('/api/friendships', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ friendUsername }),
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to send friend request' }))
      throw new Error(error.error || 'Failed to send friend request')
    }
    
    return response.json()
  },

  /**
   * Accept a friend request
   * @param friendshipId - ID of the friendship to accept
   */
  async acceptFriendRequest(friendshipId: string): Promise<Friendship> {
    const response = await fetch(`/api/friendships/${friendshipId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'accept' }),
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to accept friend request' }))
      
      // Handle subscription limit errors
      if (response.status === 403 && error.upgrade) {
        throw new Error(`${error.error} (${error.current}/${error.limit})`)
      }
      
      throw new Error(error.error || 'Failed to accept friend request')
    }
    
    return response.json()
  },

  /**
   * Reject a friend request
   * @param friendshipId - ID of the friendship to reject
   */
  async rejectFriendRequest(friendshipId: string): Promise<{ success: boolean }> {
    const response = await fetch(`/api/friendships/${friendshipId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'reject' }),
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to reject friend request' }))
      throw new Error(error.error || 'Failed to reject friend request')
    }
    
    return response.json()
  },

  /**
   * Remove a friend or cancel a pending friend request
   * @param friendshipId - ID of the friendship to remove
   */
  async removeFriend(friendshipId: string): Promise<{ success: boolean }> {
    const response = await fetch(`/api/friendships/${friendshipId}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to remove friend' }))
      throw new Error(error.error || 'Failed to remove friend')
    }
    
    return response.json()
  },
}
