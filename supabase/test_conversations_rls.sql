-- Test script for conversations system
-- Run this after applying the RLS migration to verify everything works

-- Test 1: Create a test user and conversation (replace with actual user IDs)
-- Note: You'll need to replace the UUIDs below with actual user IDs from your auth.users table

-- Example test queries (commented out - replace UUIDs with real ones):

/*
-- 1. Insert a test conversation
INSERT INTO conversations (title, description, created_by) 
VALUES ('Test Conversation', 'A test conversation for RLS', 'your-user-uuid-here')
RETURNING *;

-- 2. Add the creator as admin member
INSERT INTO conversation_members (conversation_id, user_id, role)
VALUES ('conversation-uuid-from-step-1', 'your-user-uuid-here', 'admin')
RETURNING *;

-- 3. Add another user as regular member
INSERT INTO conversation_members (conversation_id, user_id, role)
VALUES ('conversation-uuid-from-step-1', 'another-user-uuid', 'member')
RETURNING *;

-- 4. Test message creation
INSERT INTO conversation_messages (conversation_id, conversation_member_id, user_id, content, subject)
VALUES (
  'conversation-uuid-from-step-1', 
  'member-id-from-step-2', 
  'your-user-uuid-here', 
  'Hello, this is a test message!', 
  'Test Subject'
)
RETURNING *;

-- 5. Test RLS by querying as different users
-- (These queries should be run in the context of different authenticated users)

-- Query conversations (should only show conversations user is member of)
SELECT * FROM conversations;

-- Query conversation members (should only show members of conversations user belongs to)  
SELECT * FROM conversation_members;

-- Query messages (should only show messages from conversations user is member of)
SELECT * FROM conversation_messages;
*/

-- Verification queries to check RLS policies exist:
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'conversation_members', 'conversation_messages')
ORDER BY tablename, policyname;

-- Check if RLS is enabled:
SELECT schemaname, tablename, rowsecurity, forcerowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'conversation_members', 'conversation_messages');

-- Check indexes:
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('conversations', 'conversation_members', 'conversation_messages')
AND indexname LIKE 'idx_conversation%'
ORDER BY tablename, indexname;