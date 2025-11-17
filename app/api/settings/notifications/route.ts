import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get notification preferences from user metadata
    const preferences = user.user_metadata?.notification_preferences || {
      emailNotifications: true,
      taskReminders: true,
      collaborationUpdates: true,
      weeklyDigest: false
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error in notification preferences GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { emailNotifications, taskReminders, collaborationUpdates, weeklyDigest } = body

    // Validate boolean values
    const preferences = {
      emailNotifications: Boolean(emailNotifications),
      taskReminders: Boolean(taskReminders),
      collaborationUpdates: Boolean(collaborationUpdates),
      weeklyDigest: Boolean(weeklyDigest)
    }

    // Update user metadata with notification preferences
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        notification_preferences: preferences
      }
    })

    if (updateError) {
      console.error('Notification preferences update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update notification preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Notification preferences updated successfully',
      preferences,
      success: true
    })
  } catch (error) {
    console.error('Error in notification preferences update API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
