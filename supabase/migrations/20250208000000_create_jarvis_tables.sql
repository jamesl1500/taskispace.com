-- Create jarvis_conversations table
CREATE TABLE IF NOT EXISTS jarvis_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create jarvis_messages table
CREATE TABLE IF NOT EXISTS jarvis_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES jarvis_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jarvis_conversations_user_id ON jarvis_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_jarvis_conversations_updated_at ON jarvis_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_jarvis_messages_conversation_id ON jarvis_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_jarvis_messages_created_at ON jarvis_messages(created_at);

-- Enable Row Level Security
ALTER TABLE jarvis_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE jarvis_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jarvis_conversations
CREATE POLICY "Users can view their own conversations"
  ON jarvis_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON jarvis_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON jarvis_conversations
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON jarvis_conversations
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for jarvis_messages
CREATE POLICY "Users can view messages from their conversations"
  ON jarvis_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM jarvis_conversations
      WHERE jarvis_conversations.id = jarvis_messages.conversation_id
      AND jarvis_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON jarvis_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jarvis_conversations
      WHERE jarvis_conversations.id = jarvis_messages.conversation_id
      AND jarvis_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their conversations"
  ON jarvis_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM jarvis_conversations
      WHERE jarvis_conversations.id = jarvis_messages.conversation_id
      AND jarvis_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their conversations"
  ON jarvis_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM jarvis_conversations
      WHERE jarvis_conversations.id = jarvis_messages.conversation_id
      AND jarvis_conversations.user_id = auth.uid()
    )
  );

-- Enable realtime for jarvis tables (optional, for future real-time features)
ALTER PUBLICATION supabase_realtime ADD TABLE jarvis_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE jarvis_messages;
