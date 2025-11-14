'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ConversationWithDetails, 
  ConversationMessageWithUser,
  CreateConversationData,
  CreateMessageData,
  ConversationMemberWithUser
} from '@/types/conversations'

// Fetch all conversations for the user
export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async (): Promise<ConversationWithDetails[]> => {
      const response = await fetch('/api/conversations')
      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }
      const data = await response.json()
      return data.conversations
    }
  })
}

// Fetch a single conversation with messages
export function useConversation(conversationId: string | null) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: async (): Promise<ConversationWithDetails> => {
      const response = await fetch(`/api/conversations/${conversationId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch conversation')
      }
      const data = await response.json()
      return data.conversation
    },
    enabled: !!conversationId
  })
}

// Fetch conversation messages
export function useConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: async (): Promise<ConversationMessageWithUser[]> => {
      const response = await fetch(`/api/conversations/${conversationId}/messages`)
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }
      const data = await response.json()
      return data.messages
    },
    enabled: !!conversationId,
    refetchInterval: 5000 // Refetch every 5 seconds for real-time feel
  })
}

// Fetch conversation members
export function useConversationMembers(conversationId: string | null) {
  return useQuery({
    queryKey: ['conversation-members', conversationId],
    queryFn: async (): Promise<ConversationMemberWithUser[]> => {
      const response = await fetch(`/api/conversations/${conversationId}/members`)
      if (!response.ok) {
        throw new Error('Failed to fetch members')
      }
      const data = await response.json()
      return data.members
    },
    enabled: !!conversationId
  })
}

// Create a new conversation
export function useCreateConversation() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateConversationData) => {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error('Failed to create conversation')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    }
  })
}

// Send a message
export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: CreateMessageData) => {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error('Failed to send message')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    }
  })
}

// Add member to conversation
export function useAddMember(conversationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { user_id: string, role?: 'admin' | 'member' }) => {
      const response = await fetch(`/api/conversations/${conversationId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        throw new Error('Failed to add member')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-members', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] })
    }
  })
}

// Remove member from conversation
export function useRemoveMember(conversationId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (memberId: number) => {
      const response = await fetch(`/api/conversations/${conversationId}/members/${memberId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to remove member')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation-members', conversationId] })
      queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] })
    }
  })
}
