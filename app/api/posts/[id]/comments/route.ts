import { NextRequest, NextResponse } from 'next/server'
import { postsService } from '@/lib/services/posts-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: postId } = await params
    const comments = await postsService.getComments(postId)
    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error in get comments API:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message === 'Not authenticated' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: postId } = await params
    const body = await request.json()
    const { content } = body

    const comment = await postsService.createComment(postId, content)
    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error in create comment API:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    let status = 500
    
    if (message === 'Not authenticated') status = 401
    else if (message.includes('required') || message.includes('too long')) status = 400
    
    return NextResponse.json({ error: message }, { status })
  }
}
