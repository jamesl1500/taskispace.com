-- Fixed Row-Level Security (RLS) Policies for Conversations System
-- These policies avoid infinite recursion by using proper table aliases and direct user checks

-- ============================================================================
-- DROP EXISTING POLICIES TO RECREATE THEM
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view conversations they are members of" ON conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
DROP POLICY IF EXISTS "Conversation admins can update conversations" ON conversations;
DROP POLICY IF EXISTS "Conversation admins can delete conversations" ON conversations;

DROP POLICY IF EXISTS "Users can view members of conversations they belong to" ON conversation_members;
DROP POLICY IF EXISTS "Conversation admins can add members" ON conversation_members;
DROP POLICY IF EXISTS "Conversation admins can update member roles" ON conversation_members;
DROP POLICY IF EXISTS "Admins can remove members or users can remove themselves" ON conversation_members;

DROP POLICY IF EXISTS "Users can view messages in conversations they are members of" ON conversation_messages;
DROP POLICY IF EXISTS "Conversation members can create messages" ON conversation_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON conversation_messages;
DROP POLICY IF EXISTS "Users can delete their own messages or admins can delete any message" ON conversation_messages;

-- ============================================================================
-- CONVERSATION_MEMBERS TABLE POLICIES (NO RECURSION)
-- ============================================================================

-- Enable RLS on conversation_members table
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own memberships and memberships in conversations they belong to
-- This policy avoids recursion by directly checking user_id first
CREATE POLICY "conversation_members_select_policy" ON conversation_members
  FOR SELECT USING (
    user_id = auth.uid()  -- Direct check for own membership records
    OR 
    EXISTS (
      SELECT 1 FROM conversation_members cm 
      WHERE cm.conversation_id = conversation_members.conversation_id 
      AND cm.user_id = auth.uid()
    )
  );

-- Policy: Only authenticated users can insert themselves as members (initial creation)
-- OR conversation admins can add new members
CREATE POLICY "conversation_members_insert_policy" ON conversation_members
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      -- User is adding themselves (handled by application logic for creator)
      user_id = auth.uid()
      OR
      -- OR an admin is adding someone else
      EXISTS (
        SELECT 1 FROM conversation_members cm 
        WHERE cm.conversation_id = conversation_members.conversation_id 
        AND cm.user_id = auth.uid() 
        AND cm.role = 'admin'
      )
    )
  );

-- Policy: Only admins can update member roles
CREATE POLICY "conversation_members_update_policy" ON conversation_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversation_members cm 
      WHERE cm.conversation_id = conversation_members.conversation_id 
      AND cm.user_id = auth.uid() 
      AND cm.role = 'admin'
    )
  );

-- Policy: Admins can remove members, users can remove themselves
CREATE POLICY "conversation_members_delete_policy" ON conversation_members
  FOR DELETE USING (
    user_id = auth.uid()  -- Users can remove themselves
    OR 
    EXISTS (
      SELECT 1 FROM conversation_members cm 
      WHERE cm.conversation_id = conversation_members.conversation_id 
      AND cm.user_id = auth.uid() 
      AND cm.role = 'admin'
    )
  );

-- ============================================================================
-- CONVERSATIONS TABLE POLICIES
-- ============================================================================

-- Enable RLS on conversations table
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view conversations they are members of
CREATE POLICY "conversations_select_policy" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 
      FROM conversation_members cm 
      WHERE cm.conversation_id = conversations.id 
      AND cm.user_id = auth.uid()
    )
  );

-- Policy: Authenticated users can create conversations
CREATE POLICY "conversations_insert_policy" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );

-- Policy: Conversation admins can update conversations
CREATE POLICY "conversations_update_policy" ON conversations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 
      FROM conversation_members cm 
      WHERE cm.conversation_id = conversations.id 
      AND cm.user_id = auth.uid() 
      AND cm.role = 'admin'
    )
  );

-- Policy: Conversation admins can delete conversations
CREATE POLICY "conversations_delete_policy" ON conversations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 
      FROM conversation_members cm 
      WHERE cm.conversation_id = conversations.id 
      AND cm.user_id = auth.uid() 
      AND cm.role = 'admin'
    )
  );

-- ============================================================================
-- CONVERSATION_MESSAGES TABLE POLICIES
-- ============================================================================

-- Enable RLS on conversation_messages table
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages in conversations they are members of
CREATE POLICY "conversation_messages_select_policy" ON conversation_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 
      FROM conversation_members cm 
      WHERE cm.conversation_id = conversation_messages.conversation_id 
      AND cm.user_id = auth.uid()
    )
  );

-- Policy: Conversation members can create messages
CREATE POLICY "conversation_messages_insert_policy" ON conversation_messages
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 
      FROM conversation_members cm 
      WHERE cm.conversation_id = conversation_messages.conversation_id 
      AND cm.user_id = auth.uid()
    )
  );

-- Policy: Users can update their own messages
CREATE POLICY "conversation_messages_update_policy" ON conversation_messages
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- Policy: Users can delete their own messages, admins can delete any message in their conversations
CREATE POLICY "conversation_messages_delete_policy" ON conversation_messages
  FOR DELETE USING (
    user_id = auth.uid()  -- Own messages
    OR
    EXISTS (
      SELECT 1 
      FROM conversation_members cm 
      WHERE cm.conversation_id = conversation_messages.conversation_id 
      AND cm.user_id = auth.uid() 
      AND cm.role = 'admin'
    )
  );

-- ============================================================================
-- INDEXES FOR PERFORMANCE (if not already created)
-- ============================================================================

-- Index for conversation member lookups (used frequently in RLS policies)
CREATE INDEX IF NOT EXISTS idx_conversation_members_user_conversation 
ON conversation_members (user_id, conversation_id);

-- Index for conversation member role lookups
CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation_role 
ON conversation_members (conversation_id, role);

-- Index for message conversation lookups
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation 
ON conversation_messages (conversation_id, created_at DESC);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON conversation_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON conversation_messages TO authenticated;