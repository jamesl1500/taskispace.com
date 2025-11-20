/**
 * Real-time conversation hooks using Supabase subscriptions
 * Integrates with React Query for seamless cache updates
 */
import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ConversationMessage, ConversationMessageWithUser } from '@/types/conversations'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * Hook to subscribe to real-time conversation message updates
 * Automatically updates React Query cache when messages are added/updated/deleted
 */
export function useConversationMessagesRealtime(conversationId: string) {
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!conversationId) return

    const supabase = createClient()
    
    // Create a channel for this specific conversation
    const channel = supabase
      .channel(`conversation-messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('New message received:', payload)
          
          // Add the new message to the cache
          const newMessage = payload.new as ConversationMessage
          const messageWithUser: ConversationMessageWithUser = {
            ...newMessage,
            user: {
              id: newMessage.user_id || '',
              email: '',
              user_metadata: {}
            }
          }

          // Update the messages query cache
          queryClient.setQueryData(
            ['conversation-messages', conversationId],
            (oldData: ConversationMessageWithUser[] | undefined) => {
              if (!oldData) return [messageWithUser]
              
              // Check if message already exists (prevent duplicates)
              const exists = oldData.some(msg => msg.id === newMessage.id)
              if (exists) return oldData
              
              // Add new message at the beginning (since we order by created_at desc)
              return [messageWithUser, ...oldData]
            }
          )

          // Also invalidate to ensure fresh data
          queryClient.invalidateQueries({
            queryKey: ['conversation-messages', conversationId]
          })

          // Update conversations list to reflect new last message
          queryClient.invalidateQueries({
            queryKey: ['conversations']
          })
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Message updated:', payload)
          
          const updatedMessage = payload.new as ConversationMessage
          const messageWithUser: ConversationMessageWithUser = {
            ...updatedMessage,
            user: {
              id: updatedMessage.user_id || '',
              email: '',
              user_metadata: {}
            }
          }

          // Update the specific message in the cache
          queryClient.setQueryData(
            ['conversation-messages', conversationId],
            (oldData: ConversationMessageWithUser[] | undefined) => {
              if (!oldData) return []
              
              return oldData.map(msg => 
                msg.id === updatedMessage.id ? messageWithUser : msg
              )
            }
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Message deleted:', payload)
          
          const deletedMessage = payload.old as ConversationMessage

          // Remove the message from the cache
          queryClient.setQueryData(
            ['conversation-messages', conversationId],
            (oldData: ConversationMessageWithUser[] | undefined) => {
              if (!oldData) return []
              
              return oldData.filter(msg => msg.id !== deletedMessage.id)
            }
          )

          // Update conversations list
          queryClient.invalidateQueries({
            queryKey: ['conversations']
          })
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
      })

    channelRef.current = channel

    // Cleanup function
    return () => {
      console.log('Unsubscribing from conversation messages realtime')
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [conversationId, queryClient])

  // Hook doesn't need to return anything - it just manages the subscription
}

/**
 * Hook to subscribe to real-time conversation updates (title, description changes)
 */
export function useConversationRealtime(conversationId: string) {
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!conversationId) return

    const supabase = createClient()
    
    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Conversation updated:', payload)
          
          // Invalidate conversation queries to refetch fresh data
          queryClient.invalidateQueries({
            queryKey: ['conversation', conversationId]
          })
          queryClient.invalidateQueries({
            queryKey: ['conversations']
          })
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [conversationId, queryClient])

  // Hook doesn't need to return anything - it just manages the subscription
}

/**
 * Hook to subscribe to conversation membership changes
 */
export function useConversationMembersRealtime(conversationId: string) {
  const queryClient = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!conversationId) return

    const supabase = createClient()
    
    const channel = supabase
      .channel(`conversation-members-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'conversation_members',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          console.log('Conversation members changed:', payload)
          
          // Invalidate members query
          queryClient.invalidateQueries({
            queryKey: ['conversation-members', conversationId]
          })

          // Also invalidate conversations to update member count
          queryClient.invalidateQueries({
            queryKey: ['conversations']
          })
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [conversationId, queryClient])

  // Hook doesn't need to return anything - it just manages the subscription
}