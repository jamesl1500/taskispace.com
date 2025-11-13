/**
 * UserAvatar component to display user's avatar image.
 * 
 * Props:
 * - userId: string - The ID of the user whose avatar is to be displayed.
 * - size?: number - Optional size for the avatar image (default is 40).
 * 
 * This component fetches the user's data from the backend service and displays
 * the user's avatar image. If the user does not have an avatar, a default
 * placeholder image is shown.
 * 
 * @module components/user/UserAvatar
 */
'use client'

import { useQuery } from '@tanstack/react-query'
import { UserService } from '@/lib/services/user-service'
import Image from 'next/image'

interface UserAvatarProps {
  userId: string
  size?: number
}

export default function UserAvatar({ userId, size = 40 }: UserAvatarProps) {
  const us = new UserService()
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      if (!userId) return null
      const { user } = await us.getUserById(userId)
      return user
    }
  })

  if (isLoading) {
    return <div className="bg-slate-200 dark:bg-slate-700 rounded-full w-10 h-10" />
  }

  if (error) {
    console.error('Error fetching user:', error)
    return <div className="bg-slate-200 dark:bg-slate-700 rounded-full w-10 h-10" />
  }

  if (!user) {
    return <div className="bg-slate-200 dark:bg-slate-700 rounded-full w-10 h-10" />
  }

  const avatarUrl = user.user_metadata?.avatar_url || '/default_avatar.jpg'

  return (
    <Image
      src={avatarUrl}
      alt={`${user.user_metadata?.full_name}'s avatar`}
      width={size}
      height={size}
      className="rounded-full"
    />
  )
}