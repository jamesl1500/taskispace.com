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
    const { newPassword, confirmPassword } = body

    if (!newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'Both password fields are required' },
        { status: 400 }
      )
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    // Validate password length
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateError) {
      console.error('Password update error:', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Failed to change password' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Password changed successfully',
      success: true
    })
  } catch (error) {
    console.error('Error in password change API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
