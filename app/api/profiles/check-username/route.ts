import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')

  if (!username) {
    return NextResponse.json({ error: 'Username parameter is required' }, { status: 400 })
  }

  try {
    const supabase = await createClient()

    // Check if username is available
    const { data } = await supabase
      .rpc('is_username_available', { username })

    return NextResponse.json({ 
      available: data === true,
      username: username.toLowerCase()
    })
  } catch (error) {
    console.error('Error checking username availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}