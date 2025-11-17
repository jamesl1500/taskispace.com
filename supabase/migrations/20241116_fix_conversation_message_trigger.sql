-- Fix conversation message notification trigger to use correct field names
-- The trigger was referencing 'sender_id' but the table uses 'user_id'

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_notify_conversation_message ON conversation_messages;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS notify_conversation_message();

-- Create the corrected notification function
CREATE OR REPLACE FUNCTION notify_conversation_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify all conversation members except the sender
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    conversation_id,
    triggered_by,
    metadata
  )
  SELECT 
    cm.user_id,
    'conversation_message'::notification_type,
    'New Message',
    COALESCE(sender_profile.display_name, sender_profile.user_name, 'Someone') || ' sent a message in: ' || COALESCE(conversation.title, 'Conversation'),
    NEW.conversation_id,
    NEW.user_id, -- Fixed: use user_id instead of sender_id
    jsonb_build_object(
      'conversation_title', COALESCE(conversation.title, 'Conversation'),
      'sender_name', COALESCE(sender_profile.display_name, sender_profile.user_name, 'Someone'),
      'message_preview', LEFT(NEW.content, 100)
    )
  FROM conversation_members cm
  JOIN conversations conversation ON conversation.id = NEW.conversation_id
  LEFT JOIN profiles sender_profile ON sender_profile.id = NEW.user_id -- Fixed: use user_id instead of sender_id
  WHERE cm.conversation_id = NEW.conversation_id
    AND cm.user_id != NEW.user_id; -- Fixed: use user_id instead of sender_id
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trigger_notify_conversation_message
  AFTER INSERT ON conversation_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_conversation_message();