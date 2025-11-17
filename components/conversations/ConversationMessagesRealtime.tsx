/**
 * Example ConversationMessages component showing how to use realtime messages
 * This component automatically updates when new messages are received in real-time
 */
import { useState } from 'react'
import { useConversationMessages, useSendMessage } from '@/hooks/queries/useConversationQueries'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

interface ConversationMessagesProps {
  conversationId: string
}

export function ConversationMessages({ conversationId }: ConversationMessagesProps) {
  const [newMessage, setNewMessage] = useState('')
  
  // This hook now automatically includes realtime updates!
  const { data: messages, isLoading, error } = useConversationMessages(conversationId)
  const sendMessage = useSendMessage(conversationId)

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return
    
    try {
      await sendMessage.mutateAsync({
        content: newMessage.trim()
      })
      setNewMessage('') // Clear input after sending
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  if (isLoading) {
    return <div>Loading messages...</div>
  }

  if (error) {
    return <div>Error loading messages: {error.message}</div>
  }

  return (
    <div className=\"flex flex-col h-full\">
      {/* Messages list - automatically updates with realtime */}
      <div className=\"flex-1 overflow-y-auto p-4 space-y-2\">
        {messages?.map((message) => (
          <Card key={message.id} className=\"p-3\">
            <div className=\"text-sm text-gray-500\">
              {message.user.email || 'Unknown user'} • {new Date(message.created_at).toLocaleTimeString()}
            </div>
            <div className=\"mt-1\">{message.content}</div>
          </Card>
        ))}
        
        {messages?.length === 0 && (
          <div className=\"text-center text-gray-500 py-8\">
            No messages yet. Send the first message!
          </div>
        )}
      </div>

      {/* Message input */}
      <div className=\"border-t p-4\">
        <div className=\"flex gap-2\">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder=\"Type a message...\"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            disabled={sendMessage.isPending}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={sendMessage.isPending || !newMessage.trim()}
          >
            {sendMessage.isPending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  )
}