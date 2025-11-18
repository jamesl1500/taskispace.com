export interface JarvisConversation {
  id: string
  user_id: string
  title: string | null
  created_at: string
  updated_at: string
}

export interface JarvisMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tokens_used: number
  created_at: string
}

export interface JarvisConversationWithMessages {
  id: string
  user_id: string
  title: string | null
  created_at: string
  updated_at: string
  messages: JarvisMessage[]
  total_tokens?: number
}

export interface CreateJarvisConversationData {
  title?: string
}

export interface SendJarvisMessageData {
  conversationId?: string
  message: string
  maxHistoryMessages?: number
}
