'use client'

import { useState, useEffect } from 'react'
import { JarvisConversation, JarvisConversationWithMessages } from '@/types/jarvis'

export function useJarvisConversations() {
  const [conversations, setConversations] = useState<JarvisConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/jarvis')
      if (!response.ok) throw new Error('Failed to fetch conversations')
      const data = await response.json()
      setConversations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const createConversation = async (title?: string) => {
    try {
      const response = await fetch('/api/jarvis/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      })
      if (!response.ok) throw new Error('Failed to create conversation')
      const newConversation = await response.json()
      setConversations(prev => [newConversation, ...prev])
      return newConversation
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  const deleteConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/jarvis/conversations/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete conversation')
      setConversations(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  const updateConversationTitle = async (id: string, title: string) => {
    try {
      const response = await fetch(`/api/jarvis/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      })
      if (!response.ok) throw new Error('Failed to update conversation')
      const updated = await response.json()
      setConversations(prev => prev.map(c => c.id === id ? updated : c))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  return {
    conversations,
    loading,
    error,
    createConversation,
    deleteConversation,
    updateConversationTitle,
    refetchConversations: fetchConversations
  }
}

export function useJarvisChat(conversationId?: string) {
  const [conversation, setConversation] = useState<JarvisConversationWithMessages | null>(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConversation = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/jarvis/conversations/${id}`)
      if (!response.ok) throw new Error('Failed to fetch conversation')
      const data = await response.json()
      setConversation(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async (message: string, currentConversationId?: string, maxHistoryMessages?: number) => {
    try {
      setSending(true)
      setError(null)

      const response = await fetch('/api/jarvis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId: currentConversationId,
          maxHistoryMessages
        })
      })

      if (!response.ok) throw new Error('Failed to send message')
      const data = await response.json()
      
      setConversation(data.conversation)
      return data
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred'
      setError(errorMsg)
      throw err
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    if (conversationId) {
      fetchConversation(conversationId)
    }
  }, [conversationId])

  return {
    conversation,
    loading,
    sending,
    error,
    sendMessage,
    refetchConversation: conversationId ? () => fetchConversation(conversationId) : undefined
  }
}
