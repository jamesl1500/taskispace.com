import { NextRequest, NextResponse } from 'next/server'
import { postsService } from '@/lib/services/posts-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || undefined
    
    const posts = await postsService.getPosts(userId)
    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error in posts API:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message === 'Not authenticated' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content } = body

    const post = await postsService.createPost(content)
    return NextResponse.json(post)
  } catch (error) {
    console.error('Error in create post API:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    let status = 500
    
    if (message === 'Not authenticated') status = 401
    else if (message.includes('required') || message.includes('too long')) status = 400
    
    return NextResponse.json({ error: message }, { status })
  }
}
