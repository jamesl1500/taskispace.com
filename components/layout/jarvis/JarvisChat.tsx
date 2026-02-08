'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  Bot, 
  Send, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  MessageSquarePlus,
  ChevronLeft,
  Loader2,
  BarChart3
} from 'lucide-react'
import { useJarvisConversations, useJarvisChat } from '@/hooks/useJarvis'
import { formatDistanceToNow } from 'date-fns'
import { JarvisMessage } from '@/types/jarvis'

export function JarvisChat() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>()
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [showStats, setShowStats] = useState(false)
  const [stats, setStats] = useState<{
    total_conversations: number
    total_messages: number
    total_tokens: number
    avg_tokens_per_message: number
  } | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const {
    conversations,
    loading: conversationsLoading,
    deleteConversation,
    updateConversationTitle,
    refetchConversations
  } = useJarvisConversations()

  const {
    conversation,
    loading: conversationLoading,
    sending,
    sendMessage
  } = useJarvisChat(selectedConversationId)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [conversation?.messages])

  const handleSendMessage = async () => {
    if (!message.trim() || sending) return

    try {
      const result = await sendMessage(message, selectedConversationId)
      setMessage('')
      
      // If this was a new conversation, set it as selected
      if (!selectedConversationId && result.conversation) {
        setSelectedConversationId(result.conversation.id)
        refetchConversations()
      }

      // Show task creation success notification
      if (result.taskCreated) {
        // Task was created successfully - the AI response will confirm this
        console.log('Task created:', result.taskCreated)
      }
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleNewConversation = async () => {
    setSelectedConversationId(undefined)
    setMessage('')
  }

  const handleDeleteConversation = async (id: string) => {
    if (!confirm('Delete this conversation?')) return
    
    try {
      await deleteConversation(id)
      if (selectedConversationId === id) {
        setSelectedConversationId(undefined)
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  const handleEditTitle = (id: string, currentTitle: string) => {
    setEditingId(id)
    setEditTitle(currentTitle || 'Untitled')
  }

  const handleSaveTitle = async (id: string) => {
    try {
      await updateConversationTitle(id, editTitle)
      setEditingId(null)
    } catch (error) {
      console.error('Failed to update title:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/jarvis/stats')
      const data = await response.json()
      setStats(data)
      setShowStats(true)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const renderMessage = (msg: JarvisMessage) => {
    const isUser = msg.role === 'user'
    
    return (
      <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <Avatar className="h-8 w-8 mt-1">
          <AvatarFallback className={isUser ? 'bg-blue-500' : 'bg-green-600'}>
            {isUser ? 'U' : <Bot className="h-4 w-4" />}
          </AvatarFallback>
        </Avatar>
        
        <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-2 rounded-lg ${
            isUser 
              ? 'bg-blue-600 text-white' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
          }`}>
            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</span>
            {msg.tokens_used > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {msg.tokens_used} tokens
              </Badge>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full gap-4">
      {/* Conversations Sidebar */}
      <div className="w-80 flex flex-col border-r border-slate-200 dark:border-slate-700">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-green-600" />
              <h2 className="font-semibold text-lg">Jarvis AI</h2>
            </div>
            <Button size="sm" variant="outline" onClick={fetchStats}>
              <BarChart3 className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            onClick={handleNewConversation} 
            className="w-full"
            variant={!selectedConversationId ? 'default' : 'outline'}
          >
            <MessageSquarePlus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4">
          {conversationsLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center p-8 text-sm text-slate-500">
              No conversations yet. Start a new chat!
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <Card
                  key={conv.id}
                  className={`cursor-pointer transition-colors ${
                    selectedConversationId === conv.id
                      ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                  onClick={() => setSelectedConversationId(conv.id)}
                >
                  <CardContent>
                    {editingId === conv.id ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border rounded"
                          autoFocus
                        />
                        <Button size="sm" variant="ghost" onClick={() => handleSaveTitle(conv.id)}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-sm line-clamp-2 flex-1">
                            {conv.title || 'Untitled Conversation'}
                          </h3>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handleEditTitle(conv.id, conv.title || '')}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteConversation(conv.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                        </p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversationId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="lg:hidden"
                    onClick={() => setSelectedConversationId(undefined)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h3 className="font-semibold">
                      {conversation?.title || 'Loading...'}
                    </h3>
                    {conversation && (
                      <p className="text-xs text-slate-500">
                        {conversation.total_tokens} tokens used
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              {conversationLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
              ) : conversation?.messages && conversation.messages.length > 0 ? (
                <div className="space-y-4 max-w-4xl mx-auto">
                  {conversation.messages.map(renderMessage)}
                  
                  {sending && (
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarFallback className="bg-green-600">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-slate-500">Thinking...</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  No messages yet
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <Bot className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Welcome to Jarvis AI</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Your intelligent assistant for task management and productivity. Start a new conversation or select an existing one.
              </p>
              <div className="space-y-2 text-sm text-left bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <p className="font-medium">💡 What I can do:</p>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400 ml-4">
                  <li>• <strong>Create tasks:</strong> &quot;Create a task to review the budget&quot;</li>
                  <li>• <strong>Get help:</strong> Ask about your tasks and deadlines</li>
                  <li>• <strong>Prioritize:</strong> Get advice on what to work on</li>
                  <li>• <strong>Save automatically:</strong> All conversations are saved</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="max-w-4xl mx-auto flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={selectedConversationId ? "Type your message..." : "Start a new conversation..."}
              className="resize-none min-h-[60px]"
              disabled={sending}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!message.trim() || sending}
              className="self-end"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-slate-500 text-center mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Stats Modal */}
      {showStats && stats && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40" 
            onClick={() => setShowStats(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Token Usage Statistics</h3>
                  <Button size="sm" variant="ghost" onClick={() => setShowStats(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Conversations</p>
                    <p className="text-2xl font-bold">{stats.total_conversations}</p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Messages</p>
                    <p className="text-2xl font-bold">{stats.total_messages}</p>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Total Tokens</p>
                    <p className="text-2xl font-bold">{stats.total_tokens.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400">Avg/Message</p>
                    <p className="text-2xl font-bold">{stats.avg_tokens_per_message}</p>
                  </div>
                </div>
                <div className="text-xs text-slate-500 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <p className="font-medium mb-1">💰 Estimated Cost (gpt-4o-mini):</p>
                  <p>~${((stats.total_tokens / 1000000) * 0.15).toFixed(4)} USD</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
