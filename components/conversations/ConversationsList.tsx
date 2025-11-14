'use client'

import { useConversations } from '@/hooks/useConversations'
import { ConversationWithDetails } from '@/types/conversations'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageCircle, Users, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface ConversationsListProps {
  onCreateConversation?: () => void
}

export default function ConversationsList({ onCreateConversation }: ConversationsListProps) {
  const { data: conversations, isLoading, error } = useConversations()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-500">Error loading conversations</p>
          <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Conversations</h2>
        <Button onClick={onCreateConversation} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
      </div>

      {!conversations || conversations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No conversations yet</h3>
            <p className="text-muted-foreground mb-4">
              Start a conversation to collaborate with your team
            </p>
            <Button onClick={onCreateConversation}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Conversation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((conversation) => (
            <ConversationCard key={conversation.id} conversation={conversation} />
          ))}
        </div>
      )}
    </div>
  )
}

interface ConversationCardProps {
  conversation: ConversationWithDetails
}

function ConversationCard({ conversation }: ConversationCardProps) {
  const hasUnread = conversation.unread_count && conversation.unread_count > 0
  
  return (
    <Link href={`/conversations/${conversation.id}`}>
      <Card className={`cursor-pointer transition-all hover:shadow-md ${
        hasUnread ? 'border-primary bg-primary/5' : ''
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            {/* Conversation Avatar */}
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <MessageCircle className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              {hasUnread && (
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-medium">
                    {conversation.unread_count! > 9 ? '9+' : conversation.unread_count}
                  </span>
                </div>
              )}
            </div>

            {/* Conversation Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className={`font-medium truncate ${
                  hasUnread ? 'font-semibold' : ''
                }`}>
                  {conversation.title || 'Untitled Conversation'}
                </h3>
                <div className="flex items-center space-x-2 ml-2">
                  {conversation.member_count && (
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {conversation.member_count}
                    </Badge>
                  )}
                  {conversation.last_message && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
              
              {conversation.description && (
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {conversation.description}
                </p>
              )}
              
              {conversation.last_message && (
                <p className={`text-sm mt-2 truncate ${
                  hasUnread ? 'font-medium' : 'text-muted-foreground'
                }`}>
                  {conversation.last_message.subject && (
                    <span className="font-medium">{conversation.last_message.subject}: </span>
                  )}
                  {conversation.last_message.content}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
