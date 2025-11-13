/**
 * UserName component to fetch and display a user's name by their ID.
 * 
 * Props:
 * - userId: string - The ID of the user whose name is to be displayed.
 * 
 * This component fetches the user's data from the backend service and displays
 * the user's name. If the user is not found, it displays 'Unknown User'.
 * 
 * @module components/user/UserName
 */
'use client'

import { useQuery } from '@tanstack/react-query'
import { UserService } from '@/lib/services/user-service'

interface UserNameProps {
  userId: string
}

export default function UserName({ userId }: UserNameProps) {
  const us = new UserService()
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) return null
      const { user } = await us.getUserById(userId)
      return user
    },
    enabled: !!userId
  })

  if (isLoading) {
    return <span>Loading...</span>
  }

  if (error || !user) {
    return <span>Unknown User</span>
  }

  return (
    <span>{user.user_metadata?.full_name}</span>
  )
}