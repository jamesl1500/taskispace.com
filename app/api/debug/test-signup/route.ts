import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    // Check environment variables first
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing Supabase environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey
        }
      })
    }
    
    const supabase = await createClient()
    
    if (!supabase) {
      return NextResponse.json({ 
        success: false,
        error: 'Failed to create Supabase client'
      })
    }
    
    // Test with a unique username
    const testUsername = `testuser_${Date.now()}`
    const testEmail = `${testUsername}@test.com`
    
    console.log('Testing signup with:', { testEmail, testUsername })
    
    // Try the signup
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testpassword123',
      options: {
        data: {
          full_name: 'Test User',
          user_name: testUsername,
        }
      }
    })
    
    if (error) {
      console.error('Signup error:', error)
      return NextResponse.json({ 
        success: false,
        error: error.message,
        details: error
      })
    }
    
    // Check if profile was created
    if (data.user) {
      // Wait a moment for the trigger to execute
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      console.log('Profile check:', { profile, profileError })
      
      return NextResponse.json({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email
        },
        profile,
        profileError: profileError?.message
      })
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'User created but no user object returned',
      data
    })
    
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}