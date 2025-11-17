import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Start a transaction-like deletion process
    // Note: Supabase doesn't support transactions, but we can use RLS and cascading deletes

    try {
      // Delete user profile (this should cascade to related data if FK constraints are set)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (profileError) {
        console.error('Profile deletion error:', profileError)
        // Continue with auth deletion even if profile deletion fails
      }

      // Delete tasks created by user
      const { error: tasksError } = await supabase
        .from('tasks')
        .delete()
        .eq('created_by', user.id)

      if (tasksError) {
        console.error('Tasks deletion error:', tasksError)
      }

      // Delete workspaces owned by user
      const { error: workspacesError } = await supabase
        .from('workspaces')
        .delete()
        .eq('owner_id', user.id)

      if (workspacesError) {
        console.error('Workspaces deletion error:', workspacesError)
      }

      // Delete conversations where user is a participant
      const { error: conversationsError } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('user_id', user.id)

      if (conversationsError) {
        console.error('Conversations deletion error:', conversationsError)
      }

      // Delete notifications
      const { error: notificationsError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)

      if (notificationsError) {
        console.error('Notifications deletion error:', notificationsError)
      }

      // Finally, delete the auth user account
      // Note: This requires admin privileges, so we'll need to use the service role
      const supabaseAdmin = await createClient()
      
      const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

      if (deleteUserError) {
        console.error('User deletion error:', deleteUserError)
        return NextResponse.json(
          { error: 'Failed to delete user account. Please contact support.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Account deleted successfully',
        success: true
      })
    } catch (deleteError) {
      console.error('Error during account deletion:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete account. Please try again or contact support.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in delete account API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
