/**
 * uploadAvatar.ts
 * 
 * Utility functions for uploading, deleting, and retrieving avatar images
 * using Supabase Storage.
 * 
 * @module utils/uploadAvatar
 */
import { createClient } from '@/lib/supabase/client'

/**
 * Result of an avatar upload operation
 * 
 * @interface UploadAvatarResult
 */
export interface UploadAvatarResult {
  url: string
  path: string
  error?: string
}

/**
 * Upload an avatar image to Supabase Storage
 * @param file - The image file to upload
 * @param userId - The user's ID
 * @returns Object containing the public URL and storage path, or an error
 */
export async function uploadAvatar(
  file: File,
  userId: string
): Promise<UploadAvatarResult> {
  const supabase = createClient()

  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return {
      url: '',
      path: '',
      error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.'
    }
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB in bytes
  if (file.size > maxSize) {
    return {
      url: '',
      path: '',
      error: 'File size too large. Maximum size is 5MB.'
    }
  }

  try {
    // Generate a unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return {
        url: '',
        path: '',
        error: error.message || 'Failed to upload avatar'
      }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(data.path)

    return {
      url: urlData.publicUrl,
      path: data.path
    }
  } catch (error) {
    console.error('Unexpected error during upload:', error)
    return {
      url: '',
      path: '',
      error: 'An unexpected error occurred during upload'
    }
  }
}

/**
 * Delete an avatar from Supabase Storage
 * @param path - The storage path of the avatar to delete
 * @returns True if successful, false otherwise
 */
export async function deleteAvatar(path: string): Promise<boolean> {
  const supabase = createClient()

  try {
    const { error } = await supabase.storage
      .from('avatars')
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Unexpected error during deletion:', error)
    return false
  }
}

/**
 * Get the public URL for an avatar
 * @param path - The storage path of the avatar
 * @returns The public URL
 */
export function getAvatarUrl(path: string): string {
  const supabase = createClient()
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(path)
  
  return data.publicUrl
}
