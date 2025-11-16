import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const read = searchParams.get('read');
    const workspace_id = searchParams.get('workspace_id');
    const list_id = searchParams.get('list_id');
    const task_id = searchParams.get('task_id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (type) {
      const types = type.split(',');
      query = query.in('type', types);
    }

    if (read !== null) {
      query = query.eq('read', read === 'true');
    }

    if (workspace_id) {
      query = query.eq('workspace_id', workspace_id);
    }

    if (list_id) {
      query = query.eq('list_id', list_id);
    }

    if (task_id) {
      query = query.eq('task_id', task_id);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      user_id, 
      type, 
      title, 
      message, 
      metadata, 
      task_id, 
      workspace_id, 
      list_id, 
      conversation_id, 
      triggered_by 
    } = body;

    // Validate required fields
    if (!user_id || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, type, title, message' }, 
        { status: 400 }
      );
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert([{
        user_id,
        type,
        title,
        message,
        metadata: metadata || {},
        task_id,
        workspace_id,
        list_id,
        conversation_id,
        triggered_by
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error in notifications POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}