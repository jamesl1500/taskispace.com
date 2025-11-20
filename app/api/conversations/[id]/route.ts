import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { conversationService } from '@/lib/services/conversation-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate conversation ID parameter
    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json(
        { error: 'Invalid conversation ID' },
        { status: 400 }
      )
    }

    // Validate user ID
    if (!user.id || user.id === 'undefined' || user.id === 'null') {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    console.log('Fetching conversation:', id, 'for user:', user.id)

    const conversation = await conversationService.getConversation(id, user.id)
    
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Error fetching conversation:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate conversation ID parameter
    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json(
        { error: 'Invalid conversation ID' },
        { status: 400 }
      )
    }

    // Validate user ID
    if (!user.id || user.id === 'undefined' || user.id === 'null') {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { title, description } = body

    const conversation = await conversationService.updateConversation(
      id,
      { title, description },
      user.id
    )

    return NextResponse.json({ conversation })
  } catch (error) {
    console.error('Error updating conversation:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate conversation ID parameter
    if (!id || id === 'undefined' || id === 'null') {
      return NextResponse.json(
        { error: 'Invalid conversation ID' },
        { status: 400 }
      )
    }

    // Validate user ID
    if (!user.id || user.id === 'undefined' || user.id === 'null') {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      )
    }

    await conversationService.deleteConversation(id, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting conversation:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
