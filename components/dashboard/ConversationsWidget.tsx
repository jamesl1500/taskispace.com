'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ConversationWithDetails } from '@/types/conversations'
import { MessageSquare, ChevronRight, Plus } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface ConversationsWidgetProps {
  conversations: ConversationWithDetails[]
  loading?: boolean
}

export function ConversationsWidget({ conversations, loading }: ConversationsWidgetProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 p-3 rounded-lg border animate-pulse">
                <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Messages
        </CardTitle>
        <div className="flex gap-2">
          <Link href="/conversations/new">
            <Button size="sm" variant="ghost">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/conversations">
            <Button variant="ghost" size="sm">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {conversations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="mb-4">No conversations yet</p>
            <Link href="/conversations/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Start a Conversation
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {conversations.map((conversation) => (
              <Link key={conversation.id} href={`/conversations/${conversation.id}`}>
                <div className="group flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 hover:border-primary/50 transition-all cursor-pointer">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarFallback>
                      {conversation.title?.[0]?.toUpperCase() || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {conversation.title || 'Untitled Conversation'}
                      </h4>
                      {conversation.unread_count && conversation.unread_count > 0 && (
                        <Badge variant="default" className="text-xs shrink-0">
                          {conversation.unread_count}
                        </Badge>
                      )}
                    </div>
                    {conversation.last_message && (
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message.content}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      {conversation.member_count && (
                        <span className="text-xs text-muted-foreground">
                          {conversation.member_count} members
                        </span>
                      )}
                      {conversation.last_message && (
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1 flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
