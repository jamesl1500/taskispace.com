-- Enable realtime for conversation tables
-- This allows Supabase to broadcast changes to subscribed clients

-- Enable realtime for conversations table
ALTER publication supabase_realtime ADD TABLE conversations;

-- Enable realtime for conversation_messages table  
ALTER publication supabase_realtime ADD TABLE conversation_messages;

-- Enable realtime for conversation_members table
ALTER publication supabase_realtime ADD TABLE conversation_members;