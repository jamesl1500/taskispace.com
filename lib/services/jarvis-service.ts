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
import type { JarvisConversation, JarvisConversationWithMessages } from '@/types/jarvis'

export class JarvisService {
  private openai: OpenAI
  // Configuration for token efficiency
  private readonly MAX_HISTORY_MESSAGES = 10 // Only send last 10 messages for context
  private readonly MODEL = 'gpt-4o-mini' // More cost-effective than gpt-3.5-turbo
  private readonly SYSTEM_PROMPT = `You are Jarvis, a concise AI assistant that helps users with their tasks and productivity. Keep responses brief and actionable.

You can help users create tasks. When a user wants to create a task, extract:
- title (required): The task title
- description (optional): Task details
- priority (optional): low, medium, or high (default: medium)
- due_date (optional): Date in YYYY-MM-DD format

If the user's request is unclear, ask for clarification. Always confirm task details before creating.`

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
   * Parse task creation intent from message using AI
   */
  private async parseTaskIntent(message: string): Promise<{
    isTaskCreation: boolean
    taskData?: {
      title: string
      description?: string
      priority?: 'low' | 'medium' | 'high'
      due_date?: string
    }
  }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a task intent parser. Analyze if the user wants to create a task.
If yes, extract: title, description, priority (low/medium/high), due_date (YYYY-MM-DD).
Respond ONLY with valid JSON: {"isTaskCreation": boolean, "taskData": {...}}`
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      })

      const content = response.choices[0].message?.content?.trim()
      if (!content) return { isTaskCreation: false }

      const parsed = JSON.parse(content)
      return parsed
    } catch (error) {
      console.error('Error parsing task intent:', error)
      return { isTaskCreation: false }
    }
  }

  /**
   * Create a task through AI assistant
   */
  async createTaskFromAI(taskData: {
    title: string
    description?: string
    priority?: 'low' | 'medium' | 'high'
    due_date?: string
    workspace_id: string
    list_id: string
  }): Promise<any> {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // Create task via API
    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title: taskData.title,
        description: taskData.description || null,
        priority: taskData.priority || 'medium',
        status: 'todo',
        due_date: taskData.due_date || null,
        list_id: taskData.list_id,
        created_by: user.id,
        assignee: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating task:', error)
      throw new Error(`Failed to create task: ${error.message}`)
    }

    // Add as collaborator
    await supabase
      .from('task_collaborators')
      .insert({
        task_id: task.id,
        user_id: user.id,
        role: 'assignee',
        added_by: user.id
      })

    // Log activity
    await supabase
      .from('task_activity')
      .insert({
        task_id: task.id,
        actor: user.id,
        type: 'task_created',
        payload: {
          title: task.title,
          status: task.status,
          priority: task.priority,
          created_via: 'jarvis_ai'
        }
      })

    return task
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

    console.log(`[JarvisService] getConversation: Fetched ${messages?.length || 0} messages for conversation ${conversationId}`)

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
  ): Promise<{ 
    reply: string; 
    conversation: JarvisConversationWithMessages;
    taskCreated?: any;
    needsWorkspaceSelection?: boolean;
  }> {
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
    const { error: userMsgError } = await supabase
      .from('jarvis_messages')
      .insert({
        conversation_id: currentConversationId,
        role: 'user',
        content: message,
        tokens_used: userTokens
      })

    if (userMsgError) {
      console.error('Error saving user message:', userMsgError)
      throw new Error(`Failed to save user message: ${userMsgError.message}`)
    }

    // Check if this is a task creation request
    const taskIntent = await this.parseTaskIntent(message)
    let taskCreated = null
    let needsWorkspaceSelection = false

    // If task creation detected, try to create the task
    if (taskIntent.isTaskCreation && taskIntent.taskData) {
      // Get user's workspaces to check if we need to ask for selection
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select('id, name')
        .eq('owner_id', user.id)
        .limit(1)

      if (!workspaces || workspaces.length === 0) {
        needsWorkspaceSelection = true
      } else {
        // Get the first list in the first workspace as default
        const { data: lists } = await supabase
          .from('lists')
          .select('id, name')
          .eq('workspace_id', workspaces[0].id)
          .limit(1)

        if (lists && lists.length > 0) {
          // Try to create the task
          try {
            const createdTask = await this.createTaskFromAI({
              ...taskIntent.taskData,
              workspace_id: workspaces[0].id,
              list_id: lists[0].id
            })
            taskCreated = {
              id: createdTask.id,
              title: createdTask.title,
              workspace_name: workspaces[0].name,
              list_name: lists[0].name
            }
          } catch (error) {
            console.error('Failed to create task:', error)
          }
        } else {
          needsWorkspaceSelection = true
        }
      }
    }

    // If task was created, add context to the conversation
    if (taskCreated) {
      messageHistory.push({
        role: 'system',
        content: `SYSTEM: Task "${taskCreated.title}" was successfully created in workspace "${taskCreated.workspace_name}" under list "${taskCreated.list_name}". Confirm this to the user in a friendly way.`
      })
    } else if (needsWorkspaceSelection) {
      messageHistory.push({
        role: 'system',
        content: 'SYSTEM: User needs to create a workspace and list first before creating tasks. Inform them politely.'
      })
    }

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
    const { error: aiMsgError } = await supabase
      .from('jarvis_messages')
      .insert({
        conversation_id: currentConversationId,
        role: 'assistant',
        content: aiReply,
        tokens_used: aiTokens
      })

    if (aiMsgError) {
      console.error('Error saving assistant message:', aiMsgError)
      throw new Error(`Failed to save assistant message: ${aiMsgError.message}`)
    }

    // Update conversation timestamp
    await supabase
      .from('jarvis_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentConversationId)

    // Return full conversation with updated messages
    const updatedConversation = await this.getConversation(currentConversationId)

    return {
      reply: aiReply,
      conversation: updatedConversation,
      taskCreated,
      needsWorkspaceSelection
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