export interface Friendship {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  // Joined data
  user_profile?: {
    user_name: string
    display_name: string | null
    avatar_url: string | null
  }
  friend_profile?: {
    user_name: string
    display_name: string | null
    avatar_url: string | null
  }
}

export interface Nudge {
  id: string
  from_user_id: string
  to_user_id: string
  task_id?: string
  message?: string
  created_at: string
  // Joined data
  from_user_profile?: {
    user_name: string
    display_name: string | null
    avatar_url: string | null
  }
  task?: {
    id: string
    title: string
    status: string
  }
}

export interface FriendRequest {
  id: string
  from_user_id: string
  to_user_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  from_user_profile: {
    user_name: string
    display_name: string | null
    avatar_url: string | null
  }
}

export interface FriendWithStats {
  id: string
  user_id: string
  friend_id: string
  status: string
  created_at: string
  friend_profile: {
    user_name: string
    display_name: string | null
    avatar_url: string | null
  }
  stats?: {
    total_tasks: number
    completed_tasks: number
    pending_tasks: number
    overdue_tasks: number
  }
}
