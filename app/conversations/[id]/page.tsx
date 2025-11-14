'use client'

import { use } from 'react'
import { useConversation } from '@/hooks/useConversations'
import ConversationMessages from '@/components/conversations/ConversationMessages'
import ConversationMembers from '@/components/conversations/ConversationMembers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, MessageCircle, Settings } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

interface ConversationPageProps {
  params: Promise<{ id: string }>
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { id } = use(params)
  const { data: conversation, isLoading, error } = useConversation(id)

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center space-x-4 mb-6">
            <Skeleton className="h-10 w-10" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full" />
            </div>
            <div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Conversation not found</h3>
              <p className="text-muted-foreground mb-4">
                {error.message || 'The conversation you are looking for does not exist or you do not have access to it.'}
              </p>
              <Link href="/conversations">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Conversations
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/conversations">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">
                {conversation.title || 'Untitled Conversation'}
              </h1>
              {conversation.description && (
                <p className="text-muted-foreground mt-1">
                  {conversation.description}
                </p>
              )}
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary">
                  {conversation.member_count} member{conversation.member_count !== 1 ? 's' : ''}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Created {new Date(conversation.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Messages - Takes up 2/3 of the width on large screens */}
          <div className="lg:col-span-2">
            <ConversationMessages conversationId={id} />
          </div>
          
          {/* Members Sidebar - Takes up 1/3 of the width on large screens */}
          <div>
            <ConversationMembers conversationId={id} />
          </div>
        </div>
      </div>
    </div>
  )
}