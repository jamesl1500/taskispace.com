import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, user_name } = await request.json()
    
    console.log('Debug signup attempt:', { email, user_name, full_name })
    
    const supabase = await createClient()
    
    // First check if username already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('user_name')
      .eq('user_name', user_name)
      .single()
    
    if (existingProfile) {
      return NextResponse.json({ 
        error: 'Username already exists',
        details: existingProfile 
      }, { status: 400 })
    }
    
    console.log('Username check result:', { existingProfile, checkError })
    
    // Try the signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          user_name,
        }
      }
    })
    
    const user = data.user
    
    console.log('Signup result:', { 
      user: user ? { id: user.id, email: user.email } : null,
      error: error ? { message: error.message, status: error.status } : null 
    })
    
    if (error) {
      // Check if the user was created but profile creation failed
      if (user) {
        console.log('User created but error occurred, checking profile...')
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        console.log('Profile check after error:', { profile, profileError })
      }
      
      return NextResponse.json({ 
        error: error.message,
        details: {
          status: error.status,
          user_created: !!user,
          user_id: user?.id
        }
      }, { status: 400 })
    }
    
    // Check if profile was created
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      console.log('Profile after successful signup:', { profile, profileError })
      
      return NextResponse.json({ 
        success: true,
        user,
        profile 
      })
    }
    
    return NextResponse.json({ success: true, user })
    
  } catch (error) {
    console.error('Unexpected error in debug signup:', error)
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}