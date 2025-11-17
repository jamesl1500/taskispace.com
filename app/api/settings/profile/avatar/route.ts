import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('avatar') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Get current profile to delete old avatar if exists
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    // Delete old avatar if it exists and is from our storage
    if (currentProfile?.avatar_url && currentProfile.avatar_url.includes('/avatars/')) {
      try {
        const oldPath = currentProfile.avatar_url.split('/avatars/')[1]
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([oldPath])
        }
      } catch (error) {
        console.error('Failed to delete old avatar:', error)
        // Continue anyway - not critical
      }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    // Convert File to ArrayBuffer then to Buffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: uploadError.message || 'Failed to upload avatar' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(uploadData.path)

    const avatarUrl = urlData.publicUrl

    // Update profile with new avatar URL
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      // Try to clean up uploaded file
      await supabase.storage.from('avatars').remove([uploadData.path])
      return NextResponse.json(
        { error: 'Failed to update profile with new avatar' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      url: avatarUrl,
      path: uploadData.path,
      profile: updatedProfile
    })
  } catch (error) {
    console.error('Error in avatar upload API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get current profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single()

    // Delete avatar from storage if it exists
    if (profile?.avatar_url && profile.avatar_url.includes('/avatars/')) {
      const path = profile.avatar_url.split('/avatars/')[1]
      if (path) {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([path])

        if (deleteError) {
          console.error('Failed to delete avatar:', deleteError)
        }
      }
    }

    // Update profile to remove avatar URL
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: null })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Avatar deleted successfully',
      profile: updatedProfile
    })
  } catch (error) {
    console.error('Error in avatar delete API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
