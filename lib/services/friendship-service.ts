/**
 * Friendship Service
 * Handles friendship-related operations including friend requests,
 * managing friendships, and task nudges between friends
 * 
 * @module services/friendship-service
 */
import { createClient } from '@/lib/supabase/server'
import type { Friendship, Nudge, FriendRequest, FriendWithStats } from '@/types/friendships'

export class FriendshipService {
  /**
   * Get all friendships for the current user
   * Includes both friends where user is user_id or friend_id
   * 
   * @param status - Optional filter by friendship status
   * @returns Array of friendships with profile data
   */
  async getFriendships(status?: 'pending' | 'accepted' | 'rejected') {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    let query = supabase
      .from('friendships')
      .select(`
        *,
        user_profile:user_id (
          user_name,
          display_name,
          avatar_url
        ),
        friend_profile:friend_id (
          user_name,
          display_name,
          avatar_url
        )
      `)
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: friendships, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching friendships:', error)
      throw new Error(`Failed to fetch friendships: ${error.message}`)
    }

    return friendships || []
  }

  /**
   * Get list of accepted friends with their task statistics
   * 
   * @returns Array of friends with their productivity stats
   */
  async getFriendsWithStats(): Promise<FriendWithStats[]> {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // Get accepted friendships
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select(`
        *,
        friend_profile:friend_id (
          user_name,
          display_name,
          avatar_url
        )
      `)
      .eq('status', 'accepted')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

    if (error) {
      console.error('Error fetching friends:', error)
      throw new Error(`Failed to fetch friends: ${error.message}`)
    }

    if (!friendships || friendships.length === 0) {
      return []
    }

    // Get task stats for each friend
    const friendsWithStats = await Promise.all(
      friendships.map(async (friendship) => {
        const friendId = friendship.user_id === user.id ? friendship.friend_id : friendship.user_id
        
        // Get task statistics for this friend
        const { data: tasks } = await supabase
          .from('tasks')
          .select('id, status, due_date')
          .eq('user_id', friendId)

        const now = new Date()
        const stats = {
          total_tasks: tasks?.length || 0,
          completed_tasks: tasks?.filter(t => t.status === 'completed').length || 0,
          pending_tasks: tasks?.filter(t => t.status === 'pending' || t.status === 'in_progress').length || 0,
          overdue_tasks: tasks?.filter(t => 
            t.due_date && 
            new Date(t.due_date) < now && 
            t.status !== 'completed'
          ).length || 0
        }

        return {
          ...friendship,
          friend_id: friendId,
          stats
        }
      })
    )

    return friendsWithStats
  }

  /**
   * Get pending friend requests (received by current user)
   * 
   * @returns Array of pending friend requests
   */
  async getPendingRequests(): Promise<FriendRequest[]> {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    const { data: requests, error } = await supabase
      .from('friendships')
      .select(`
        id,
        user_id,
        friend_id,
        status,
        created_at,
        from_user_profile:user_id (
          user_name,
          display_name,
          avatar_url
        )
      `)
      .eq('friend_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching friend requests:', error)
      throw new Error(`Failed to fetch friend requests: ${error.message}`)
    }

    return requests?.map(r => ({
      id: r.id,
      from_user_id: r.user_id,
      to_user_id: r.friend_id,
      status: r.status as 'pending',
      created_at: r.created_at,
      from_user_profile: r.from_user_profile as any
    })) || []
  }

  /**
   * Send a friend request to another user
   * 
   * @param friendUsername - Username of the user to send request to
   * @returns The created friendship
   */
  async sendFriendRequest(friendUsername: string) {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // Get the friend's user ID by username
    const { data: friendProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_name', friendUsername)
      .single()

    if (profileError || !friendProfile) {
      throw new Error('User not found')
    }

    if (friendProfile.id === user.id) {
      throw new Error('Cannot send friend request to yourself')
    }

    // Check if friendship already exists
    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('id, status')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendProfile.id}),and(user_id.eq.${friendProfile.id},friend_id.eq.${user.id})`)
      .single()

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        throw new Error('You are already friends with this user')
      } else if (existingFriendship.status === 'pending') {
        throw new Error('Friend request already sent')
      } else if (existingFriendship.status === 'rejected') {
        throw new Error('Friend request was previously rejected')
      }
    }

    const { data: friendship, error } = await supabase
      .from('friendships')
      .insert({
        user_id: user.id,
        friend_id: friendProfile.id,
        status: 'pending'
      })
      .select(`
        *,
        friend_profile:friend_id (
          user_name,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error sending friend request:', error)
      throw new Error(`Failed to send friend request: ${error.message}`)
    }

    return friendship
  }

  /**
   * Accept a friend request
   * 
   * @param friendshipId - ID of the friendship to accept
   * @returns The updated friendship
   */
  async acceptFriendRequest(friendshipId: string) {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // Verify the friend request is for the current user
    const { data: friendship, error: fetchError } = await supabase
      .from('friendships')
      .select('*')
      .eq('id', friendshipId)
      .eq('friend_id', user.id)
      .eq('status', 'pending')
      .single()

    if (fetchError || !friendship) {
      throw new Error('Friend request not found')
    }

    const { data: updatedFriendship, error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)
      .select(`
        *,
        user_profile:user_id (
          user_name,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error accepting friend request:', error)
      throw new Error(`Failed to accept friend request: ${error.message}`)
    }

    return updatedFriendship
  }

  /**
   * Reject a friend request
   * 
   * @param friendshipId - ID of the friendship to reject
   * @returns Success status
   */
  async rejectFriendRequest(friendshipId: string) {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // Verify the friend request is for the current user
    const { data: friendship, error: fetchError } = await supabase
      .from('friendships')
      .select('*')
      .eq('id', friendshipId)
      .eq('friend_id', user.id)
      .eq('status', 'pending')
      .single()

    if (fetchError || !friendship) {
      throw new Error('Friend request not found')
    }

    const { error } = await supabase
      .from('friendships')
      .update({ status: 'rejected' })
      .eq('id', friendshipId)

    if (error) {
      console.error('Error rejecting friend request:', error)
      throw new Error(`Failed to reject friend request: ${error.message}`)
    }

    return { success: true }
  }

  /**
   * Remove a friend (delete friendship)
   * 
   * @param friendshipId - ID of the friendship to remove
   * @returns Success status
   */
  async removeFriend(friendshipId: string) {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId)
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

    if (error) {
      console.error('Error removing friend:', error)
      throw new Error(`Failed to remove friend: ${error.message}`)
    }

    return { success: true }
  }

  /**
   * Search for users by username to add as friends
   * 
   * @param searchTerm - Username search term
   * @param limit - Maximum number of results
   * @returns Array of matching users (excluding current user and existing friends)
   */
  async searchUsers(searchTerm: string, limit: number = 10) {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new Error('Search term must be at least 2 characters')
    }

    // Get existing friendships to exclude
    const { data: existingFriendships } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

    const friendIds = new Set<string>()
    existingFriendships?.forEach(f => {
      if (f.user_id === user.id) friendIds.add(f.friend_id)
      if (f.friend_id === user.id) friendIds.add(f.user_id)
    })

    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, user_name, display_name, avatar_url')
      .ilike('user_name', `%${searchTerm}%`)
      .neq('id', user.id)
      .limit(limit)

    if (error) {
      console.error('Error searching users:', error)
      throw new Error(`Failed to search users: ${error.message}`)
    }

    // Filter out existing friends
    return users?.filter(u => !friendIds.has(u.id)) || []
  }

  /**
   * Send a nudge to a friend about a task
   * 
   * @param friendId - User ID of the friend to nudge
   * @param taskId - Optional task ID to nudge about
   * @param message - Optional custom message
   * @returns The created nudge
   */
  async sendNudge(friendId: string, taskId?: string, message?: string) {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // Verify friendship exists and is accepted
    const { data: friendship } = await supabase
      .from('friendships')
      .select('id')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
      .eq('status', 'accepted')
      .single()

    if (!friendship) {
      throw new Error('You must be friends to send a nudge')
    }

    // Validate message length if provided
    if (message && message.length > 500) {
      throw new Error('Message too long (max 500 characters)')
    }

    // If taskId provided, verify the task belongs to the friend
    if (taskId) {
      const { data: task } = await supabase
        .from('tasks')
        .select('id, user_id')
        .eq('id', taskId)
        .eq('user_id', friendId)
        .single()

      if (!task) {
        throw new Error('Task not found or does not belong to this friend')
      }
    }

    const { data: nudge, error } = await supabase
      .from('nudges')
      .insert({
        from_user_id: user.id,
        to_user_id: friendId,
        task_id: taskId || null,
        message: message || null
      })
      .select(`
        *,
        from_user_profile:from_user_id (
          user_name,
          display_name,
          avatar_url
        ),
        task:task_id (
          id,
          title,
          status
        )
      `)
      .single()

    if (error) {
      console.error('Error sending nudge:', error)
      throw new Error(`Failed to send nudge: ${error.message}`)
    }

    return nudge
  }

  /**
   * Get nudges received by the current user
   * 
   * @param limit - Maximum number of nudges to return
   * @returns Array of received nudges
   */
  async getReceivedNudges(limit: number = 20): Promise<Nudge[]> {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    const { data: nudges, error } = await supabase
      .from('nudges')
      .select(`
        *,
        from_user_profile:from_user_id (
          user_name,
          display_name,
          avatar_url
        ),
        task:task_id (
          id,
          title,
          status
        )
      `)
      .eq('to_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching nudges:', error)
      throw new Error(`Failed to fetch nudges: ${error.message}`)
    }

    return nudges || []
  }

  /**
   * Get nudges sent by the current user
   * 
   * @param limit - Maximum number of nudges to return
   * @returns Array of sent nudges
   */
  async getSentNudges(limit: number = 20) {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    const { data: nudges, error } = await supabase
      .from('nudges')
      .select(`
        *,
        task:task_id (
          id,
          title,
          status
        )
      `)
      .eq('from_user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching sent nudges:', error)
      throw new Error(`Failed to fetch sent nudges: ${error.message}`)
    }

    return nudges || []
  }

  /**
   * Delete a nudge (only the sender can delete)
   * 
   * @param nudgeId - ID of the nudge to delete
   * @returns Success status
   */
  async deleteNudge(nudgeId: string) {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    const { error } = await supabase
      .from('nudges')
      .delete()
      .eq('id', nudgeId)
      .eq('from_user_id', user.id)

    if (error) {
      console.error('Error deleting nudge:', error)
      throw new Error(`Failed to delete nudge: ${error.message}`)
    }

    return { success: true }
  }

  /**
   * Get a friend's tasks (only if they are friends)
   * 
   * @param friendId - User ID of the friend
   * @returns Array of the friend's tasks
   */
  async getFriendTasks(friendId: string) {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // Verify friendship exists and is accepted
    const { data: friendship } = await supabase
      .from('friendships')
      .select('id')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
      .eq('status', 'accepted')
      .single()

    if (!friendship) {
      throw new Error('You must be friends to view their tasks')
    }

    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('id, title, description, status, priority, due_date, created_at')
      .eq('user_id', friendId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching friend tasks:', error)
      throw new Error(`Failed to fetch friend tasks: ${error.message}`)
    }

    return tasks || []
  }
}

// Export a singleton instance
export const friendshipService = new FriendshipService()
