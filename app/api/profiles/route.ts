import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { ProfileUpdatePayload } from '@/types/user'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')
  const userId = searchParams.get('userId')

  try {
    const supabase = await createClient()

    if (username) {
      // Get profile by username
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_name', username)
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      return NextResponse.json(profile)
    } else if (userId) {
      // Get profile by user ID
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }

      return NextResponse.json(profile)
    } else {
      // Get current user's profile
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('Auth error in profile API:', authError)
        return NextResponse.json({ error: 'Authentication error' }, { status: 401 })
      }
      
      if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Profile fetch error:', error)
        // If no profile exists, try to create one
        if (error.code === 'PGRST116') {
          console.log('No profile found, attempting to create one for user:', user.id)
          // The trigger should have created this, but let's handle the case where it didn't
          return NextResponse.json({ 
            error: 'Profile not found. Please try signing out and signing back in to create your profile.' 
          }, { status: 404 })
        }
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(profile)
    }
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ProfileUpdatePayload = await request.json()

    // Validate username if provided
    if (body.user_name) {
      // Check username format
      if (!/^[a-zA-Z0-9_-]{3,30}$/.test(body.user_name)) {
        return NextResponse.json(
          { error: 'Username must be 3-30 characters long and contain only letters, numbers, underscores, and hyphens' },
          { status: 400 }
        )
      }

      // Check if username is available (excluding current user)
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_name', body.user_name)
        .neq('id', user.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        return NextResponse.json({ error: 'Error checking username availability' }, { status: 500 })
      }

      if (existingProfile) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 409 })
      }
    }

    // Update profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(body)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}