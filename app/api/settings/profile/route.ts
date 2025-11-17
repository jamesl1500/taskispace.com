import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { display_name, user_name, bio } = body

    // Validate username format if provided
    if (user_name && !/^[a-zA-Z0-9_-]{3,30}$/.test(user_name)) {
      return NextResponse.json(
        { error: 'Username must be 3-30 characters and can only contain letters, numbers, hyphens, and underscores' },
        { status: 400 }
      )
    }

    // Get current profile
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('user_name')
      .eq('id', user.id)
      .single()

    // If username is changing, check if it's available
    if (user_name && currentProfile && user_name !== currentProfile.user_name) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_name', user_name)
        .single()

      if (existingProfile) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 409 }
        )
      }
    }

    // Build update object with only provided fields
    const updates: Record<string, string | null> = {}
    if (display_name !== undefined) updates.display_name = display_name || null
    if (user_name !== undefined) updates.user_name = user_name
    if (bio !== undefined) updates.bio = bio || null

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedProfile)
  } catch (error) {
    console.error('Error in profile update API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
