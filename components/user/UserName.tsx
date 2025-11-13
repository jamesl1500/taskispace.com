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

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { UserService } from '@/lib/services/user-service'

interface UserNameProps {
  userId: string
}

export function UserName({ userId }: UserNameProps) {
  const us = new UserService()
  const { user, loading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) return null
      const { data, error: fetchError } = await us.getUserById(userId)
      if (fetchError) throw new Error(fetchError.message)
      return data
    },
    enabled: !!userId
  })

  if (loading) {
    return <span>Loading...</span>
  }

  if (error || !user) {
    return <span>Unknown User</span>
  }

  return <span>{user.user_metadata?.full_name}</span>
}

export default UserName