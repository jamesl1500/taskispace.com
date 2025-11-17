/**
 * Conversations React Query Hooks
 * Centralized hooks for managing conversations using React Query
 *
 * @module hooks/queries/useConversationQueries
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Conversation,
  ConversationMessage,
  ConversationMessageWithUser,
  CreateMessageData,
} from "@/types/conversations";
import { useAuth } from "./useAuthQueries";
import { 
  useConversationMessagesRealtime, 
  useConversationRealtime,
  useConversationMembersRealtime 
} from "../useConversationRealtime";

// Simple API helper to call Next.js route handlers
async function api<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch all conversations for the current user
 * 
 * @param user_id The ID of the current user
 * @returns React Query useQuery hook for conversations
 */
export const useConversations = () => {
  const { user, loading } = useAuth();

  return useQuery<Conversation[], Error>({
    queryKey: ["conversations"],
    queryFn: async () => {
      const data = await api<{ conversations: Conversation[] }>("/api/conversations");
      return data.conversations;
    },
    enabled: !loading && !!user?.id,
  });
};

/**
 * Fetch a single conversation by id
 */
export const useConversation = (id?: string) => {
  const { user, loading } = useAuth();

  // Set up realtime subscription for this conversation
  useConversationRealtime(id || '');

  return useQuery<Conversation, Error>({
    queryKey: ["conversation", id],
    queryFn: async () => {
      const data = await api<{ conversation: Conversation }>(`/api/conversations/${id}`);
      return data.conversation;
    },
    enabled: !!id && !loading && !!user?.id,
  });
};

/**
 * Fetch conversation messages
 */
export const useConversationMessages = (
  conversationId?: string,
  opts?: { limit?: number; offset?: number }
) => {
  const { user, loading } = useAuth();
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  // Set up realtime subscription for this conversation's messages
  useConversationMessagesRealtime(conversationId || '');

  return useQuery<ConversationMessageWithUser[], Error>({
    queryKey: ["conversation-messages", conversationId, limit, offset],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
      const data = await api<{ messages: ConversationMessageWithUser[] }>(
        `/api/conversations/${conversationId}/conversation_messages?${params.toString()}`
      );
      return data.messages;
    },
    enabled: !!conversationId && !loading && !!user?.id,
    refetchOnWindowFocus: true,
  });
};

/**
 * Send a new message to a conversation
 */
export const useSendMessage = (conversationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateMessageData) => {
      const data = await api<{ message: ConversationMessage }>(
        `/api/conversations/${conversationId}/conversation_messages`,
        { method: "POST", body: JSON.stringify(payload) }
      );
      return data.message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversation-messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

/**
 * Create a new conversation
 */
export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { title?: string; description?: string; member_ids?: string[] }) => {
      const data = await api<{ conversation: Conversation }>(
        "/api/conversations",
        { method: "POST", body: JSON.stringify(payload) }
      );
      return data.conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

/**
 * Get conversation members
 */
export const useConversationMembers = (conversationId?: string) => {
  const { user, loading } = useAuth();

  // Set up realtime subscription for this conversation's members
  useConversationMembersRealtime(conversationId || '');

  return useQuery({
    queryKey: ["conversation-members", conversationId],
    queryFn: async () => {
      const data = await api<{ members: ConversationMessageWithUser[] }>(
        `/api/conversations/${conversationId}/conversation_members`
      );
      return data.members;
    },
    enabled: !!conversationId && !loading && !!user?.id,
  });
};