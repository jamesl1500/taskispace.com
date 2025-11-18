/**
 * Jarvis AI Bot service
 * 
 * This service provides token-efficient AI interactions with conversation history.
 * Token optimization strategies:
 * 1. Sliding window: Only send last N messages to reduce context size
 * 2. Conversation persistence: Save history in database instead of sending all each time
 * 3. Token counting: Track usage per message for cost monitoring
 * 4. Smart summarization: Can compress old messages into summaries
 * 
 * @module lib/services/jarvis-service
 */
import { OpenAI } from 'openai'
import { createClient } from '@/lib/supabase/server'
import type { JarvisConversation, JarvisMessage, JarvisConversationWithMessages } from '@/types/jarvis'

export class JarvisService {
  private openai: OpenAI
  // Configuration for token efficiency
  private readonly MAX_HISTORY_MESSAGES = 10 // Only send last 10 messages for context
  private readonly MODEL = 'gpt-4o-mini' // More cost-effective than gpt-3.5-turbo
  private readonly SYSTEM_PROMPT = 'You are Jarvis, a concise AI assistant that helps users with their tasks and productivity. Keep responses brief and actionable.'

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  /**
   * Estimate token count for a message
   * Rough estimation: ~4 characters per token
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  /**
   * Create a new Jarvis conversation
   */
  async createConversation(title?: string): Promise<JarvisConversation> {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    const { data: conversation, error } = await supabase
      .from('jarvis_conversations')
      .insert({
        user_id: user.id,
        title: title || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      throw new Error(`Failed to create conversation: ${error.message}`)
    }

    return conversation
  }

  /**
   * Get all conversations for current user
   */
  async getConversations(): Promise<JarvisConversation[]> {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    const { data: conversations, error } = await supabase
      .from('jarvis_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      throw new Error(`Failed to fetch conversations: ${error.message}`)
    }

    return conversations || []
  }

  /**
   * Get a specific conversation with all messages
   */
  async getConversation(conversationId: string): Promise<JarvisConversationWithMessages> {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    const { data: conversation, error: convError } = await supabase
      .from('jarvis_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (convError || !conversation) {
      throw new Error('Conversation not found')
    }

    const { data: messages, error: msgError } = await supabase
      .from('jarvis_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (msgError) {
      console.error('Error fetching messages:', msgError)
      throw new Error(`Failed to fetch messages: ${msgError.message}`)
    }

    const totalTokens = messages?.reduce((sum, msg) => sum + (msg.tokens_used || 0), 0) || 0

    return {
      ...conversation,
      messages: messages || [],
      total_tokens: totalTokens
    }
  }

  /**
   * Delete a conversation and all its messages
   */
  async deleteConversation(conversationId: string): Promise<{ success: boolean }> {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    const { error } = await supabase
      .from('jarvis_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting conversation:', error)
      throw new Error(`Failed to delete conversation: ${error.message}`)
    }

    return { success: true }
  }

  /**
   * Update conversation title
   */
  async updateConversationTitle(conversationId: string, title: string): Promise<JarvisConversation> {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    const { data: conversation, error } = await supabase
      .from('jarvis_conversations')
      .update({ title })
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating conversation:', error)
      throw new Error(`Failed to update conversation: ${error.message}`)
    }

    return conversation
  }

  /**
   * Send a message and get AI response with token efficiency
   * 
   * Token-saving strategies applied:
   * 1. Only includes last N messages in context (sliding window)
   * 2. Uses gpt-4o-mini (cheaper and faster than gpt-3.5-turbo)
   * 3. Concise system prompt
   * 4. Tracks token usage per message
   */
  async sendMessage(
    message: string,
    conversationId?: string,
    maxHistoryMessages: number = this.MAX_HISTORY_MESSAGES
  ): Promise<{ reply: string; conversation: JarvisConversationWithMessages }> {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    let currentConversationId = conversationId

    // Create new conversation if none provided
    if (!currentConversationId) {
      const newConversation = await this.createConversation(
        message.substring(0, 50) + (message.length > 50 ? '...' : '')
      )
      currentConversationId = newConversation.id
    }

    // Get recent conversation history (only last N messages for token efficiency)
    const { data: recentMessages } = await supabase
      .from('jarvis_messages')
      .select('*')
      .eq('conversation_id', currentConversationId)
      .order('created_at', { ascending: false })
      .limit(maxHistoryMessages)

    // Build message history in correct order (oldest first)
    const messageHistory: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: this.SYSTEM_PROMPT }
    ]

    if (recentMessages && recentMessages.length > 0) {
      // Reverse to get chronological order
      recentMessages.reverse().forEach(msg => {
        if (msg.role !== 'system') {
          messageHistory.push({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })
        }
      })
    }

    // Add current user message
    messageHistory.push({
      role: 'user',
      content: message
    })

    // Save user message to database
    const userTokens = this.estimateTokens(message)
    await supabase
      .from('jarvis_messages')
      .insert({
        conversation_id: currentConversationId,
        role: 'user',
        content: message,
        tokens_used: userTokens
      })

    // Call OpenAI with optimized context
    const completion = await this.openai.chat.completions.create({
      model: this.MODEL,
      messages: messageHistory,
      temperature: 0.7,
      max_tokens: 500, // Limit response length to save tokens
    })

    const aiReply = completion.choices[0].message?.content || 'I apologize, I could not process your request.'
    const aiTokens = completion.usage?.total_tokens || this.estimateTokens(aiReply)

    // Save assistant response to database
    await supabase
      .from('jarvis_messages')
      .insert({
        conversation_id: currentConversationId,
        role: 'assistant',
        content: aiReply,
        tokens_used: aiTokens
      })

    // Update conversation timestamp
    await supabase
      .from('jarvis_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentConversationId)

    // Return full conversation with updated messages
    const updatedConversation = await this.getConversation(currentConversationId)

    return {
      reply: aiReply,
      conversation: updatedConversation
    }
  }

  /**
   * Get token usage statistics for a user
   */
  async getTokenUsageStats(): Promise<{
    total_conversations: number
    total_messages: number
    total_tokens: number
    avg_tokens_per_message: number
  }> {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // Get all conversations
    const { data: conversations } = await supabase
      .from('jarvis_conversations')
      .select('id')
      .eq('user_id', user.id)

    const conversationIds = conversations?.map(c => c.id) || []

    if (conversationIds.length === 0) {
      return {
        total_conversations: 0,
        total_messages: 0,
        total_tokens: 0,
        avg_tokens_per_message: 0
      }
    }

    // Get all messages and sum tokens
    const { data: messages } = await supabase
      .from('jarvis_messages')
      .select('tokens_used')
      .in('conversation_id', conversationIds)

    const totalTokens = messages?.reduce((sum, msg) => sum + (msg.tokens_used || 0), 0) || 0
    const totalMessages = messages?.length || 0

    return {
      total_conversations: conversations?.length || 0,
      total_messages: totalMessages,
      total_tokens: totalTokens,
      avg_tokens_per_message: totalMessages > 0 ? Math.round(totalTokens / totalMessages) : 0
    }
  }

  /**
   * Legacy method for backward compatibility
   */
  public async openAiClient() {
    return this.openai
  }
}

// Export a singleton instance
export const jarvisService = new JarvisService()