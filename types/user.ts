import { User as SupabaseUser } from '@supabase/supabase-js'

// Database profile record
export interface Profile {
  id: string
  user_name: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

// Extended user with profile information
export interface UserWithProfile {
  user: SupabaseUser
  profile: Profile
}

// Profile update payload
export interface ProfileUpdatePayload {
  display_name?: string
  bio?: string
  avatar_url?: string
  user_name?: string
}

// Profile creation payload
export interface ProfileCreatePayload {
  user_name: string
  display_name?: string
  bio?: string
  avatar_url?: string
}

// Username availability check
export interface UsernameAvailability {
  available: boolean
  suggestions?: string[]
}

// Profile search result
export interface ProfileSearchResult {
  id: string
  user_name: string
  display_name: string | null
  avatar_url: string | null
}

// Public profile (limited info for conversations, etc.)
export interface PublicProfile {
  id: string
  user_name: string
  display_name: string | null
  avatar_url: string | null
}