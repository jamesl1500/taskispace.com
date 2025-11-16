import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Profile, ProfileUpdatePayload, ProfileSearchResult, UsernameAvailability } from '@/types/user'
import { useAuth } from '@/hooks/useAuth'

// Get current user's profile
export function useProfile() {
  const { user } = useAuth()
  
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<Profile> => {
      const response = await fetch('/api/profiles')
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      return response.json()
    },
    enabled: !!user,
  })
}

// Get profile by username
export function useProfileByUsername(username: string | null) {
  return useQuery({
    queryKey: ['profile', 'username', username],
    queryFn: async (): Promise<Profile> => {
      if (!username) throw new Error('Username is required')
      
      const response = await fetch(`/api/profiles?username=${encodeURIComponent(username)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      return response.json()
    },
    enabled: !!username,
  })
}

// Get profile by user ID
export function useProfileByUserId(userId: string | null) {
  return useQuery({
    queryKey: ['profile', 'userId', userId],
    queryFn: async (): Promise<Profile> => {
      if (!userId) throw new Error('User ID is required')
      
      const response = await fetch(`/api/profiles?userId=${encodeURIComponent(userId)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      return response.json()
    },
    enabled: !!userId,
  })
}

// Update profile
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (data: ProfileUpdatePayload): Promise<Profile> => {
      const response = await fetch('/api/profiles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update profile')
      }

      return response.json()
    },
    onSuccess: (data) => {
      // Invalidate and update profile queries
      queryClient.setQueryData(['profile', user?.id], data)
      queryClient.setQueryData(['profile', 'username', data.user_name], data)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

// Check username availability
export function useCheckUsername(username: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['username-check', username],
    queryFn: async (): Promise<UsernameAvailability> => {
      if (!username || username.length < 3) {
        return { available: false }
      }

      const response = await fetch(`/api/profiles/check-username?username=${encodeURIComponent(username)}`)
      if (!response.ok) {
        throw new Error('Failed to check username')
      }
      return response.json()
    },
    enabled: enabled && !!username && username.length >= 3,
    staleTime: 30000, // 30 seconds
  })
}

// Search profiles
export function useSearchProfiles(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['profiles', 'search', query],
    queryFn: async (): Promise<ProfileSearchResult[]> => {
      if (!query || query.length < 2) {
        return []
      }

      const response = await fetch(`/api/profiles/search?q=${encodeURIComponent(query)}&limit=20`)
      if (!response.ok) {
        throw new Error('Failed to search profiles')
      }
      const data = await response.json()
      return data.profiles || []
    },
    enabled: enabled && !!query && query.length >= 2,
    staleTime: 60000, // 1 minute
  })
}