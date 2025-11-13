import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{
    id: string // user id
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const resolvedParams = await params

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Since we don't have a profiles table, let's use auth.users
    // For now, return basic user info from Supabase Auth
    if (resolvedParams.id === user.id) {
      // If requesting current user, return their info
      return NextResponse.json({
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'User'
      })
    } else {
      // For other users, return minimal info for privacy
      return NextResponse.json({
        id: resolvedParams.id,
        email: 'user@example.com', // Placeholder
        name: 'User' // Placeholder
      })
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}