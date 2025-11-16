import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { conversationService } from '@/lib/services/conversation-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const awaitedParams = await params;

    const members = await conversationService.getConversationMembers(
      awaitedParams.id,
      user.id
    )

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Error fetching conversation members:', error)
    
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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const awaitedParams = await params;

    const body = await request.json()
    const { user_id } = body

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const member = await conversationService.addConversationMember(
      awaitedParams.id,
      user_id,
      user.id
    )

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    console.error('Error adding conversation member:', error)
    
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
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const awaitedParams = await params;

    const url = new URL(request.url)
    const memberIdParam = url.searchParams.get('member_id')

    if (!memberIdParam) {
      return NextResponse.json(
        { error: 'Member ID parameter is required' },
        { status: 400 }
      )
    }

    const memberId = parseInt(memberIdParam)
    if (isNaN(memberId)) {
      return NextResponse.json(
        { error: 'Invalid member ID' },
        { status: 400 }
      )
    }

    await conversationService.removeConversationMember(
      memberId,
      user.id
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing conversation member:', error)
    
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
