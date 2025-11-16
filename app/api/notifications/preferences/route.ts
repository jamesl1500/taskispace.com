import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: preferencesData, error: fetchError } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    let preferences = preferencesData;

    if (fetchError && fetchError.code === 'PGRST116') {
      // No preferences found, create default ones
      const defaultPreferences = {
        user_id: user.id,
        email_notifications: true,
        push_notifications: true,
        task_assignments: true,
        task_comments: true,
        task_due_reminders: true,
        workspace_invitations: true,
        list_sharing: true,
        conversation_messages: true,
        mentions: true
      };

      const { data: newPreferences, error: insertError } = await supabase
        .from('notification_preferences')
        .insert([defaultPreferences])
        .select()
        .single();

      if (insertError) {
        console.error('Error creating default preferences:', insertError);
        return NextResponse.json({ error: 'Failed to create preferences' }, { status: 500 });
      }

      preferences = newPreferences;
    } else if (fetchError) {
      console.error('Error fetching notification preferences:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error in notification preferences GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .upsert([{ user_id: user.id, ...body }])
      .select()
      .single();

    if (error) {
      console.error('Error updating notification preferences:', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error in notification preferences PATCH API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}