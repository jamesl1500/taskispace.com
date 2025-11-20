import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('type, read')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching notification stats:', error);
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    const stats = {
      unread_count: 0,
      total_count: notifications.length,
      by_type: {} as Record<string, number>
    };

    notifications.forEach(notification => {
      if (!notification.read) {
        stats.unread_count++;
      }
      
      const type = notification.type;
      stats.by_type[type] = (stats.by_type[type] || 0) + 1;
    });

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error in notification stats API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}