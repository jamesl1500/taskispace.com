-- Migration: Enable RLS and create policies for conversations system
-- This script safely applies RLS policies for the conversations system
-- Run this after creating the conversations tables

BEGIN;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all conversation tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- DROP EXISTING POLICIES (IF ANY)
-- ============================================================================

-- Drop existing policies to avoid conflicts
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
-- CONVERSATIONS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view conversations they are members of
CREATE POLICY "Users can view conversations they are members of" ON conversations
  FOR SELECT USING (
    id IN (
      SELECT conversation_id 
      FROM conversation_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can create conversations
CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND created_by = auth.uid()
  );

-- Policy: Conversation admins can update conversations
CREATE POLICY "Conversation admins can update conversations" ON conversations
  FOR UPDATE USING (
    id IN (
      SELECT conversation_id 
      FROM conversation_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy: Conversation admins can delete conversations
CREATE POLICY "Conversation admins can delete conversations" ON conversations
  FOR DELETE USING (
    id IN (
      SELECT conversation_id 
      FROM conversation_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================================================
-- CONVERSATION_MEMBERS TABLE POLICIES
-- ============================================================================

-- Policy: Users can view members of conversations they belong to
CREATE POLICY "Users can view members of conversations they belong to" ON conversation_members
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_members AS cm2 
      WHERE cm2.user_id = auth.uid()
    )
  );

-- Policy: Conversation admins can add members
CREATE POLICY "Conversation admins can add members" ON conversation_members
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy: Conversation admins can update member roles
CREATE POLICY "Conversation admins can update member roles" ON conversation_members
  FOR UPDATE USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy: Admins can remove members, users can remove themselves
CREATE POLICY "Admins can remove members or users can remove themselves" ON conversation_members
  FOR DELETE USING (
    -- User is admin of the conversation
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
    OR 
    -- User is removing themselves
    user_id = auth.uid()
  );

-- ============================================================================
-- CONVERSATION_MESSAGES TABLE POLICIES
-- ============================================================================

-- Policy: Users can view messages in conversations they are members of
CREATE POLICY "Users can view messages in conversations they are members of" ON conversation_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_members 
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Conversation members can create messages
CREATE POLICY "Conversation members can create messages" ON conversation_messages
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND conversation_id IN (
      SELECT conversation_id 
      FROM conversation_members 
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Policy: Users can update their own messages (for editing)
CREATE POLICY "Users can update their own messages" ON conversation_messages
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- Policy: Users can delete their own messages, admins can delete any message in their conversations
CREATE POLICY "Users can delete their own messages or admins can delete any message" ON conversation_messages
  FOR DELETE USING (
    -- User owns the message
    user_id = auth.uid()
    OR
    -- User is admin of the conversation
    conversation_id IN (
      SELECT conversation_id 
      FROM conversation_members 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS FOR COMMON QUERIES
-- ============================================================================

-- Function to check if user is conversation member
CREATE OR REPLACE FUNCTION is_conversation_member(conv_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM conversation_members 
    WHERE conversation_id = conv_id 
    AND user_id = check_user_id
  );
$$;

-- Function to check if user is conversation admin
CREATE OR REPLACE FUNCTION is_conversation_admin(conv_id uuid, check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM conversation_members 
    WHERE conversation_id = conv_id 
    AND user_id = check_user_id
    AND role = 'admin'
  );
$$;

-- Function to get user's member record in a conversation
CREATE OR REPLACE FUNCTION get_conversation_member_id(conv_id uuid, check_user_id uuid)
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id 
  FROM conversation_members 
  WHERE conversation_id = conv_id 
  AND user_id = check_user_id
  LIMIT 1;
$$;

-- ============================================================================
-- ADDITIONAL SECURITY TRIGGERS
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS prevent_self_admin_escalation_trigger ON conversation_members;
DROP FUNCTION IF EXISTS prevent_self_admin_escalation();

-- Prevent users from escalating their own role to admin
CREATE OR REPLACE FUNCTION prevent_self_admin_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If this is an UPDATE and the user is trying to change their own role to admin
  IF TG_OP = 'UPDATE' AND NEW.role = 'admin' AND OLD.role != 'admin' THEN
    -- Check if the current user is the one being updated
    IF NEW.user_id = auth.uid() THEN
      RAISE EXCEPTION 'Users cannot promote themselves to admin';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply the trigger to conversation_members table
CREATE TRIGGER prevent_self_admin_escalation_trigger
  BEFORE UPDATE ON conversation_members
  FOR EACH ROW
  EXECUTE FUNCTION prevent_self_admin_escalation();

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Create indexes for better performance (IF NOT EXISTS to avoid errors)
CREATE INDEX IF NOT EXISTS idx_conversation_members_user_conversation 
ON conversation_members (user_id, conversation_id);

CREATE INDEX IF NOT EXISTS idx_conversation_members_conversation_role 
ON conversation_members (conversation_id, role);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation 
ON conversation_messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_member 
ON conversation_messages (conversation_member_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_messages_user 
ON conversation_messages (user_id, created_at DESC);

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON conversation_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON conversation_messages TO authenticated;

COMMIT;