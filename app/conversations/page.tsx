'use client'

import { useState } from 'react'
import ConversationsList from '@/components/conversations/ConversationsList'
import CreateConversationDialog from '@/components/conversations/CreateConversationDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle } from 'lucide-react'

export default function ConversationsPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Conversations</h1>
              <p className="text-muted-foreground">
                Collaborate and communicate with your team
              </p>
            </div>
          </div>
        </div>

        <ConversationsList onCreateConversation={() => setShowCreateDialog(true)} />
        
        <CreateConversationDialog>
          <div />
        </CreateConversationDialog>
      </div>
    </div>
  )
}