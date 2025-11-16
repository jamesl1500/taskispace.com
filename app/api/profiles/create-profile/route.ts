import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (existingProfile) {
      return NextResponse.json({ message: 'Profile already exists' })
    }

    // Create profile
    const baseUsername = user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`
    let username = baseUsername
    let counter = 0

    // Ensure username is unique
    while (true) {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_name', username)
        .single()

      if (!existingUser) break
      
      counter++
      username = `${baseUsername}_${counter}`
      
      if (counter > 100) {
        username = `user_${user.id.slice(0, 8)}`
        break
      }
    }

    const { data: profile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        user_name: username,
        display_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating profile:', createError)
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error in create-profile API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}