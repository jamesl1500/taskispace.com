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
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check if email is the same as current
    if (email === user.email) {
      return NextResponse.json(
        { error: 'This is already your current email' },
        { status: 400 }
      )
    }

    // Update user email (this will send a confirmation email)
    const { error: updateError } = await supabase.auth.updateUser({ email })

    if (updateError) {
      console.error('Email update error:', updateError)
      return NextResponse.json(
        { error: updateError.message || 'Failed to update email' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Verification email sent to your new address. Please check your inbox.',
      success: true
    })
  } catch (error) {
    console.error('Error in email update API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
