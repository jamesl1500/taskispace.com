import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const sort = searchParams.get('sort') || 'newest'

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query
    let query = supabase
      .from('profiles')
      .select('id, user_name, display_name, avatar_url, created_at')
      .neq('id', user.id) // Exclude current user

    // Apply sorting
    if (sort === 'newest') {
      query = query.order('created_at', { ascending: false })
    } else {
      query = query.order('display_name', { ascending: true })
    }

    // Apply limit
    query = query.limit(limit)

    const { data: users, error } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    return NextResponse.json(users)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
