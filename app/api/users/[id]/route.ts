import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UserService } from '@/lib/services/user-service'

interface RouteParams {
  params: Promise<{
    id: string // user id
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
    const resolvedParams = await params

    if (authError || !currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = resolvedParams.id

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const userService = new UserService()
    const profile = await userService.getUserById(userId)

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Return safe user data from profiles table
    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      display_name: profile.display_name || profile.username || profile.email?.split('@')[0] || 'User',
      avatar_url: profile.avatar_url,
      created_at: profile.created_at
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}