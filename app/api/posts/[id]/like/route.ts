import { NextRequest, NextResponse } from 'next/server'
import { postsService } from '@/lib/services/posts-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const result = await postsService.toggleLike(postId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in like post API:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message === 'Not authenticated' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params
    const result = await postsService.toggleLike(postId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in unlike post API:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message === 'Not authenticated' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
