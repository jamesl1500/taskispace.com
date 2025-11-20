/**
 * UserName component to fetch and display a user's name by their ID.
 * 
 * Props:
 * - userId: string - The ID of the user whose name is to be displayed.
 * 
 * This component fetches the user's data from the API and displays
 * the user's name. If the user is not found, it displays 'Unknown User'.
 * 
 * @module components/user/UserName
 */
'use client'

import { useQuery } from '@tanstack/react-query'

interface UserNameProps {
  userId: string
}

export default function UserName({ userId }: UserNameProps) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) return null
      
      const response = await fetch(`/api/users/${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }
      
      return response.json()
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
    <span>{user.display_name}</span>
  )
}