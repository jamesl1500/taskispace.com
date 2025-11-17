export interface Post {
  id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  // Joined data
  profiles?: {
    user_name: string
    display_name: string | null
    avatar_url: string | null
  }
  likes_count?: number
  comments_count?: number
  is_liked?: boolean
}

export interface PostLike {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface PostComment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
  // Joined data
  profiles?: {
    user_name: string
    display_name: string | null
    avatar_url: string | null
  }
}

export interface Friendship {
  id: string
  user_id: string
  friend_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  // Joined data
  friend_profile?: {
    user_name: string
    display_name: string | null
    avatar_url: string | null
  }
}

export interface CreatePostData {
  content: string
}

export interface UpdatePostData {
  content: string
}

export interface CreateCommentData {
  post_id: string
  content: string
}
