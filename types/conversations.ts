export interface Conversation {
  id: string
  title?: string
  description?: string
  created_by: string
  created_at: string
  updated_at?: string
}

export interface ConversationMember {
  id: number
  user_id: string
  conversation_id: string
  role: 'admin' | 'member'
  created_at: string
  updated_at?: string
}

export interface ConversationMessage {
  id: number
  user_id: string
  conversation_member_id?: number
  conversation_id: string
  subject?: string
  content: string
  created_at: string
  attachments?: {
    id: string
    name: string
    url: string
    size: number
    type: string
  }[]
}

export interface ConversationWithDetails extends Conversation {
  members?: ConversationMember[]
  messages?: ConversationMessage[]
  member_count?: number
  last_message?: ConversationMessage
  unread_count?: number
}

export interface CreateConversationData {
  title?: string
  description?: string
  member_ids?: string[] // Initial members to add
}

export interface UpdateConversationData {
  title?: string
  description?: string
}

export interface CreateMessageData {
  content: string
  subject?: string
  attachments?: {
    name: string
    url: string
    size: number
    type: string
  }[]
}

export interface ConversationMemberWithUser extends ConversationMember {
  user: {
    id: string
    email: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export interface ConversationMessageWithUser extends ConversationMessage {
  user: {
    id: string
    email: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
}
