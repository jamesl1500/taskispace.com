import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const limit = parseInt(searchParams.get('limit') || '10', 10)

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  if (query.length < 2) {
    return NextResponse.json({ profiles: [] })
  }

  try {
    const supabase = await createClient()

    // Search profiles by username or display name
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, user_name, display_name, avatar_url')
      .or(
        `user_name.ilike.%${query}%,display_name.ilike.%${query}%`
      )
      .limit(limit)
      .order('user_name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profiles: profiles || [] })
  } catch (error) {
    console.error('Error searching profiles:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}