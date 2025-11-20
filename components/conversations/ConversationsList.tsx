"use client"

import Link from "next/link"
import { Conversation } from "@/types/conversations"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar } from "lucide-react"

type Props = {
	conversations: Conversation[]
}

export function ConversationsList({ conversations }: Props) {
  if (!conversations?.length) {
    return null
  }

  const hasLastMessage = (conv: Conversation): conv is Conversation & { last_message: { content: string } } => {
    return 'last_message' in conv && conv.last_message !== null && typeof conv.last_message === 'object' && 'content' in conv.last_message
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
    }
  }

  return (
    <div className="space-y-3">
      {conversations.map((conversation) => {
        const lastUpdate = conversation.updated_at || conversation.created_at
        
        return (
          <Link key={conversation.id} href={`/conversations/${conversation.id}`} className="block">
            <Card className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 hover:shadow-md border-slate-200 dark:border-slate-700">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {conversation.title || "Untitled Conversation"}
                    </h3>
                    {'member_count' in conversation && conversation.member_count !== undefined && (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Users className="h-3 w-3" />
                        {String(conversation.member_count)}
                      </Badge>
                    )}
                  </div>
                  
                  {conversation.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                      {conversation.description}
                    </p>
                  )}
                  
                  {hasLastMessage(conversation) && (
                    <div className="text-sm text-slate-500 dark:text-slate-500 line-clamp-1">
                      <span className="font-medium">Last:</span> {conversation.last_message.content}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-end text-xs text-slate-500 dark:text-slate-400 ml-4">
                  <div className="flex items-center gap-1 mb-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(lastUpdate)}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}export default ConversationsList
