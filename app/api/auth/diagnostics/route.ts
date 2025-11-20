import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, user_name } = body

    if (!email && !user_name) {
      return NextResponse.json({ error: 'Email or username required' }, { status: 400 })
    }

    const supabase = await createClient()

    const diagnostics: {
      timestamp: string;
      checks: Record<string, unknown>;
    } = {
      timestamp: new Date().toISOString(),
      checks: {}
    }

    // Check if email already exists in auth.users
    if (email) {
      const { data: existingUsers, error: userError } = await supabase
        .from('profiles')
        .select('id, user_name')
        .eq('id', `(SELECT id FROM auth.users WHERE email = '${email}' LIMIT 1)`)

      diagnostics.checks.emailExists = {
        exists: existingUsers && existingUsers.length > 0,
        error: userError?.message,
        profiles: existingUsers
      }
    }

    // Check if username exists
    if (user_name) {
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_name')
        .eq('user_name', user_name)
        .single()

      diagnostics.checks.usernameExists = {
        exists: !!existingProfile,
        error: profileError?.code === 'PGRST116' ? null : profileError?.message,
        profile: existingProfile
      }

      // Check username format
      const isValidFormat = /^[a-zA-Z0-9_-]{3,30}$/.test(user_name)
      diagnostics.checks.usernameFormat = {
        valid: isValidFormat,
        pattern: '^[a-zA-Z0-9_-]{3,30}$',
        length: user_name.length
      }
    }

    // Check profile creation function
    try {
      const { data: functionExists } = await supabase
        .rpc('pg_get_functiondef', { 
          funcoid: `(SELECT oid FROM pg_proc WHERE proname = 'handle_new_user' LIMIT 1)` 
        })
      
      diagnostics.checks.triggerFunction = {
        exists: !!functionExists,
        accessible: true
      }
    } catch (funcError) {
      diagnostics.checks.triggerFunction = {
        exists: false,
        error: funcError
      }
    }

    // Check trigger existence
    try {
      const { data: triggers } = await supabase
        .from('information_schema.triggers')
        .select('trigger_name, event_manipulation')
        .eq('trigger_name', 'on_auth_user_created')

      diagnostics.checks.trigger = {
        exists: triggers && triggers.length > 0,
        triggers
      }
    } catch (triggerError) {
      diagnostics.checks.trigger = {
        exists: false,
        error: triggerError
      }
    }

    return NextResponse.json({ diagnostics })
  } catch (error) {
    console.error('Diagnostics error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}