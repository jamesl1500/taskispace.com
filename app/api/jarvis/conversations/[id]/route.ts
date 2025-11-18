import { NextRequest, NextResponse } from 'next/server'
import { jarvisService } from '@/lib/services/jarvis-service'

/**
 * GET /api/jarvis/conversations/[id]
 * Get a specific conversation with all messages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const conversation = await jarvisService.getConversation(id)
    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Error fetching conversation:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    let status = 500
    
    if (message === 'Not authenticated') status = 401
    else if (message.includes('not found')) status = 404
    
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * PATCH /api/jarvis/conversations/[id]
 * Update conversation title
 * Body: { title: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const { title } = await request.json()

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const conversation = await jarvisService.updateConversationTitle(id, title)
    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Error updating conversation:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    let status = 500
    
    if (message === 'Not authenticated') status = 401
    else if (message.includes('not found')) status = 404
    else if (message.includes('required')) status = 400
    
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * DELETE /api/jarvis/conversations/[id]
 * Delete a conversation and all its messages
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const result = await jarvisService.deleteConversation(id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error deleting conversation:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message === 'Not authenticated' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
