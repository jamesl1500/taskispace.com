import { NextRequest, NextResponse } from 'next/server'
import { postsService } from '@/lib/services/posts-service'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { content } = body

    const post = await postsService.updatePost(id, content)
    return NextResponse.json(post)
  } catch (error) {
    console.error('Error in update post API:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    let status = 500
    
    if (message === 'Not authenticated') status = 401
    else if (message.includes('required') || message.includes('too long')) status = 400
    else if (message.includes('not found') || message.includes('unauthorized')) status = 404
    
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await postsService.deletePost(id)
    return NextResponse.json({ message: 'Post deleted successfully' })
  } catch (error) {
    console.error('Error in delete post API:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message === 'Not authenticated' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
