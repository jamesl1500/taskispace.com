import { createClient } from '@/lib/supabase/server'
import { 
  Conversation, 
  ConversationWithDetails, 
  CreateConversationData, 
  UpdateConversationData,
  ConversationMember,
  ConversationMessage,
  CreateMessageData,
  ConversationMemberWithUser,
  ConversationMessageWithUser
} from '@/types/conversations'

class ConversationService {
  /**
   * Get all conversations for a user
   * 
   * @param userId The ID of the user
   * @returns A list of conversations with details
   */
  async getConversations(userId: string): Promise<ConversationWithDetails[]> {
    const supabase = await createClient()
    
    // First get conversations the user is a member of
    const { data: memberData, error: memberError } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', userId)

    if (memberError) throw memberError

    if (!memberData || memberData.length === 0) {
      return []
    }

    const conversationIds = memberData.map(m => m.conversation_id)

    // Get conversations with basic info
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .in('id', conversationIds)
      .order('updated_at', { ascending: false })

    if (error) throw error

    // For each conversation, get member count and last message
    const processedConversations: ConversationWithDetails[] = []

    for (const conversation of data || []) {
      // Get member count
      const { count: memberCount } = await supabase
        .from('conversation_members')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversation.id)

      // Get last message
      const { data: lastMessageData } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      processedConversations.push({
        ...conversation,
        member_count: memberCount || 0,
        last_message: lastMessageData || null
      })
    }

    return processedConversations
  }

  /**
   * Get a specific conversation with details
   * 
   * @param conversationId The ID of the conversation
   * @param userId The ID of the user requesting the conversation
   * @returns The conversation with details or null if not found
   */
  async getConversation(conversationId: string, userId: string): Promise<ConversationWithDetails | null> {
    const supabase = await createClient()
    
    // First check if user is a member of this conversation
    const { data: memberCheck } = await supabase
      .from('conversation_members')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .maybeSingle()

    if (!memberCheck) {
      throw new Error('Access denied: Not a member of this conversation')
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    if (error) throw error

    if (!data) return null

    // Get member count
    const { count: memberCount } = await supabase
      .from('conversation_members')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)

    // Get last message
    const { data: lastMessageData } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return {
      ...data,
      member_count: memberCount || 0,
      last_message: lastMessageData || null
    }
  }

  /**
   * Create a new conversation
   * 
   * @param data The conversation data
   * @param createdBy The ID of the user creating the conversation
   * @returns The created conversation
   */
  async createConversation(data: CreateConversationData, createdBy: string): Promise<Conversation> {
    const supabase = await createClient()
    
    // Validate that we have at least one other member besides the creator
    const otherMembers = data.member_ids?.filter(id => id !== createdBy) || []
    if (otherMembers.length === 0) {
      throw new Error('Conversations must include at least one other person besides yourself')
    }
    
    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        title: data.title,
        description: data.description,
        created_by: createdBy
      })
      .select()
      .single()

    if (error) throw error

    // Add creator as admin member
    const { error: memberError } = await supabase
      .from('conversation_members')
      .insert({
        conversation_id: conversation.id,
        user_id: createdBy,
        role: 'admin'
      })

    if (memberError) throw memberError

    // Add additional members if provided
    if (data.member_ids && data.member_ids.length > 0) {
      const memberInserts = data.member_ids
        .filter(userId => userId !== createdBy) // Don't add creator twice
        .map(userId => ({
          conversation_id: conversation.id,
          user_id: userId,
          role: 'member' as const
        }))

      if (memberInserts.length > 0) {
        const { error: additionalMemberError } = await supabase
          .from('conversation_members')
          .insert(memberInserts)

        if (additionalMemberError) throw additionalMemberError
      }
    }

    return conversation
  }

  /**
   * Update a conversation
   * 
   * @param conversationId The ID of the conversation to update
   * @param data The updated conversation data
   * @param userId The ID of the user updating the conversation
   * @returns The updated conversation
   */
  async updateConversation(conversationId: string, data: UpdateConversationData, userId: string): Promise<Conversation> {
    const supabase = await createClient()
    
    // Check if user is admin of this conversation
    const { data: memberCheck } = await supabase
      .from('conversation_members')
      .select('role')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single()

    if (!memberCheck || memberCheck.role !== 'admin') {
      throw new Error('Access denied: Only admins can update conversations')
    }

    const { data: conversation, error } = await supabase
      .from('conversations')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .select()
      .single()

    if (error) throw error

    return conversation
  }

  /**
   * Delete a conversation
   * 
   * @param conversationId The ID of the conversation to delete
   * @param userId The ID of the user deleting the conversation
   */
  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    const supabase = await createClient()
    
    // Check if user is admin or creator of this conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('created_by')
      .eq('id', conversationId)
      .single()

    const { data: memberCheck } = await supabase
      .from('conversation_members')
      .select('role')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .single()

    if (!conversation || (conversation.created_by !== userId && (!memberCheck || memberCheck.role !== 'admin'))) {
      throw new Error('Access denied: Only creator or admins can delete conversations')
    }

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId)

    if (error) throw error
  }

  /**
   * Get all members of a conversation
   * 
   * @param conversationId The ID of the conversation
   * @param userId The ID of the user requesting the members
   * @returns A list of conversation members with user details
   */
  async getConversationMembers(conversationId: string, userId: string): Promise<ConversationMemberWithUser[]> {
    const supabase = await createClient()
    
    // Check if user is a member
    const { data: memberCheck } = await supabase
      .from('conversation_members')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .maybeSingle()

    if (!memberCheck) {
      throw new Error('Access denied: Not a member of this conversation')
    }

    // Get conversation members (without user details for now)
    const { data, error } = await supabase
      .from('conversation_members')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) throw error

    // Transform data to match expected interface (without user details)
    const membersWithUser: ConversationMemberWithUser[] = (data || []).map(member => ({
      ...member,
      user: {
        id: member.user_id,
        email: '',
        user_metadata: {}
      }
    }))

    return membersWithUser
  }

  /**
   * Add a member to a conversation
   * 
   * @param conversationId The ID of the conversation
   * @param userIdToAdd The ID of the user to add
   * @param addedBy The ID of the user adding the member
   * @returns The created conversation member
   */
  async addConversationMember(conversationId: string, userIdToAdd: string, addedBy: string): Promise<ConversationMember> {
    const supabase = await createClient()
    
    // Check if user adding is admin
    const { data: memberCheck } = await supabase
      .from('conversation_members')
      .select('role')
      .eq('conversation_id', conversationId)
      .eq('user_id', addedBy)
      .maybeSingle()

    if (!memberCheck || memberCheck.role !== 'admin') {
      throw new Error('Access denied: Only admins can add members')
    }

    const { data, error } = await supabase
      .from('conversation_members')
      .insert({
        conversation_id: conversationId,
        user_id: userIdToAdd,
        role: 'member'
      })
      .select()
      .single()

    if (error) throw error

    return data
  }

  /**
   * Update a conversation member's role
   * 
   * @param memberId The ID of the member to update
   * @param role The new role for the member
   * @param updatedBy The ID of the user updating the member
   * @returns The updated conversation member
   */
  async updateConversationMember(memberId: number, role: 'admin' | 'member', updatedBy: string): Promise<ConversationMember> {
    const supabase = await createClient()
    
    // Get the member to update and check permissions
    const { data: member } = await supabase
      .from('conversation_members')
      .select('conversation_id, user_id')
      .eq('id', memberId)
      .single()

    if (!member) {
      throw new Error('Member not found')
    }

    // Check if user updating is admin
    const { data: updaterCheck } = await supabase
      .from('conversation_members')
      .select('role')
      .eq('conversation_id', member.conversation_id)
      .eq('user_id', updatedBy)
      .single()

    if (!updaterCheck || updaterCheck.role !== 'admin') {
      throw new Error('Access denied: Only admins can update member roles')
    }

    const { data, error } = await supabase
      .from('conversation_members')
      .update({ 
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', memberId)
      .select()
      .single()

    if (error) throw error

    return data
  }

  /**
   * Remove a member from a conversation
   * 
   * @param memberId The ID of the member to remove
   * @param removedBy The ID of the user removing the member
   */
  async removeConversationMember(memberId: number, removedBy: string): Promise<void> {
    const supabase = await createClient()
    
    // Get the member to remove and check permissions
    const { data: member } = await supabase
      .from('conversation_members')
      .select('conversation_id, user_id')
      .eq('id', memberId)
      .single()

    if (!member) {
      throw new Error('Member not found')
    }

    // Check if user removing is admin or removing themselves
    const { data: removerCheck } = await supabase
      .from('conversation_members')
      .select('role')
      .eq('conversation_id', member.conversation_id)
      .eq('user_id', removedBy)
      .single()

    if (!removerCheck || (removerCheck.role !== 'admin' && member.user_id !== removedBy)) {
      throw new Error('Access denied: Only admins can remove members, or users can remove themselves')
    }

    const { error } = await supabase
      .from('conversation_members')
      .delete()
      .eq('id', memberId)

    if (error) throw error
  }

  /**
   * Get messages for a conversation
   * 
   * @param conversationId The ID of the conversation
   * @param userId The ID of the user requesting the messages
   * @param limit The maximum number of messages to return
   * @param offset The offset for pagination
   * @returns A list of conversation messages with user details
   */
  async getConversationMessages(conversationId: string, userId: string, limit = 50, offset = 0): Promise<ConversationMessageWithUser[]> {
    const supabase = await createClient()
    
    // Check if user is a member
    const { data: memberCheck } = await supabase
      .from('conversation_members')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .maybeSingle()

    if (!memberCheck) {
      throw new Error('Access denied: Not a member of this conversation')
    }

    const { data, error } = await supabase
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error

    // Transform data to match expected interface (without user details for now)
    const messagesWithUser: ConversationMessageWithUser[] = (data || []).map(message => ({
      ...message,
      user: {
        id: message.user_id || '',
        email: '',
        user_metadata: {}
      }
    }))

    return messagesWithUser
  }

  /**
   * Create a message in a conversation
   * 
   * @param conversationId The ID of the conversation
   * @param data The message data to create
   * @param userId The ID of the user creating the message
   * @returns The created conversation message
   */
  async createConversationMessage(conversationId: string, data: CreateMessageData, userId: string): Promise<ConversationMessage> {
    const supabase = await createClient()
    
    // Check if user is a member and get member ID
    const { data: memberCheck } = await supabase
      .from('conversation_members')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .maybeSingle()

    if (!memberCheck) {
      throw new Error('Access denied: Not a member of this conversation')
    }

    const { data: message, error } = await supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        conversation_member_id: memberCheck.id,
        user_id: userId,
        content: data.content,
        subject: data.subject,
        attachments: data.attachments ? JSON.stringify(data.attachments) : null
      })
      .select()
      .single()

    if (error) throw error

    // Update conversation's updated_at timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    return message
  }

  /**
   * Update a conversation message
   * 
   * @param messageId The ID of the message to update
   * @param content The new content for the message
   * @param userId The ID of the user updating the message
   * @returns The updated conversation message
   */
  async updateConversationMessage(messageId: number, content: string, userId: string): Promise<ConversationMessage> {
    const supabase = await createClient()
    
    // Check if user owns this message
    const { data: messageCheck } = await supabase
      .from('conversation_messages')
      .select('user_id')
      .eq('id', messageId)
      .single()

    if (!messageCheck || messageCheck.user_id !== userId) {
      throw new Error('Access denied: You can only edit your own messages')
    }

    const { data, error } = await supabase
      .from('conversation_messages')
      .update({ content })
      .eq('id', messageId)
      .select()
      .single()

    if (error) throw error

    return data
  }

  /**
   * Delete a conversation message
   * 
   * @param messageId The ID of the message to delete
   * @param userId The ID of the user deleting the message
   */
  async deleteConversationMessage(messageId: number, userId: string): Promise<void> {
    const supabase = await createClient()
    
    // Check if user owns this message or is admin of the conversation
    const { data: message } = await supabase
      .from('conversation_messages')
      .select('user_id, conversation_id')
      .eq('id', messageId)
      .single()

    if (!message) {
      throw new Error('Message not found')
    }

    if (message.user_id !== userId) {
      // Check if user is admin of the conversation
      const { data: memberCheck } = await supabase
        .from('conversation_members')
        .select('role')
        .eq('conversation_id', message.conversation_id)
        .eq('user_id', userId)
        .single()

      if (!memberCheck || memberCheck.role !== 'admin') {
        throw new Error('Access denied: You can only delete your own messages or be an admin')
      }
    }

    const { error } = await supabase
      .from('conversation_messages')
      .delete()
      .eq('id', messageId)

    if (error) throw error
  }
}

export const conversationService = new ConversationService()
