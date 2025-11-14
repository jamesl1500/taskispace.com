/**
 * Test script for Conversations API
 * 
 * This script tests the conversations API endpoints to ensure they work correctly.
 * Run with: node test-conversations-api.js
 * 
 * Make sure to:
 * 1. Apply the RLS migration first
 * 2. Update the BASE_URL and AUTH_TOKEN below
 * 3. Have at least 2 test users in your system
 */

const BASE_URL = 'http://localhost:3000' // Update with your app URL
const AUTH_TOKEN = 'your-jwt-token-here' // Update with valid JWT token

// Test configuration - replace with real user IDs
const TEST_USER_1 = 'user-uuid-1'
const TEST_USER_2 = 'user-uuid-2'

class ConversationsAPITest {
  constructor() {
    this.baseURL = BASE_URL
    this.authToken = AUTH_TOKEN
    this.createdConversationId = null
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`,
        ...options.headers
      },
      ...options
    }

    console.log(`🔄 ${config.method || 'GET'} ${endpoint}`)
    
    try {
      const response = await fetch(url, config)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`)
      }
      
      console.log(`✅ Success:`, data)
      return data
    } catch (error) {
      console.log(`❌ Error:`, error.message)
      throw error
    }
  }

  async test1_CreateConversation() {
    console.log('\n=== Test 1: Create Conversation ===')
    
    const response = await this.request('/api/conversations', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Conversation',
        description: 'A test conversation created via API',
        member_ids: [TEST_USER_2] // Add second user
      })
    })

    this.createdConversationId = response.conversation.id
    console.log(`📝 Created conversation ID: ${this.createdConversationId}`)
  }

  async test2_GetConversations() {
    console.log('\n=== Test 2: Get Conversations ===')
    
    await this.request('/api/conversations')
  }

  async test3_GetSpecificConversation() {
    console.log('\n=== Test 3: Get Specific Conversation ===')
    
    if (!this.createdConversationId) {
      console.log('⚠️ Skipping - no conversation ID available')
      return
    }

    await this.request(`/api/conversations/${this.createdConversationId}`)
  }

  async test4_GetConversationMembers() {
    console.log('\n=== Test 4: Get Conversation Members ===')
    
    if (!this.createdConversationId) {
      console.log('⚠️ Skipping - no conversation ID available')
      return
    }

    await this.request(`/api/conversations/${this.createdConversationId}/conversation_members`)
  }

  async test5_SendMessage() {
    console.log('\n=== Test 5: Send Message ===')
    
    if (!this.createdConversationId) {
      console.log('⚠️ Skipping - no conversation ID available')
      return
    }

    await this.request(`/api/conversations/${this.createdConversationId}/conversation_messages`, {
      method: 'POST',
      body: JSON.stringify({
        content: 'Hello! This is a test message from the API test.',
        subject: 'Test Message'
      })
    })
  }

  async test6_GetMessages() {
    console.log('\n=== Test 6: Get Messages ===')
    
    if (!this.createdConversationId) {
      console.log('⚠️ Skipping - no conversation ID available')
      return
    }

    await this.request(`/api/conversations/${this.createdConversationId}/conversation_messages?limit=10&offset=0`)
  }

  async test7_UpdateConversation() {
    console.log('\n=== Test 7: Update Conversation ===')
    
    if (!this.createdConversationId) {
      console.log('⚠️ Skipping - no conversation ID available')
      return
    }

    await this.request(`/api/conversations/${this.createdConversationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: 'Updated Test Conversation',
        description: 'This conversation has been updated via API'
      })
    })
  }

  async runAllTests() {
    console.log('🚀 Starting Conversations API Tests...')
    console.log(`📍 Base URL: ${this.baseURL}`)
    console.log(`🔑 Auth Token: ${this.authToken.substring(0, 20)}...`)
    
    if (!this.authToken || this.authToken === 'your-jwt-token-here') {
      console.log('❌ Please update the AUTH_TOKEN in the script')
      return
    }

    try {
      await this.test1_CreateConversation()
      await this.test2_GetConversations()
      await this.test3_GetSpecificConversation()
      await this.test4_GetConversationMembers()
      await this.test5_SendMessage()
      await this.test6_GetMessages()
      await this.test7_UpdateConversation()
      
      console.log('\n🎉 All tests completed!')
      
    } catch (error) {
      console.log('\n💥 Test suite failed:', error.message)
    }
  }
}

// Instructions for running the test
if (require.main === module) {
  console.log(`
📋 Before running this test:

1. Apply the RLS migration:
   - Run the SQL in supabase/migrations/20241114_conversations_rls.sql

2. Update the configuration at the top of this file:
   - BASE_URL: Your app's URL (e.g., http://localhost:3000)
   - AUTH_TOKEN: A valid JWT token from your auth system
   - TEST_USER_1, TEST_USER_2: Real user UUIDs from your auth.users table

3. Make sure your development server is running

4. Run the test: node test-conversations-api.js
`)

  // Uncomment the line below after updating the configuration
  // new ConversationsAPITest().runAllTests()
  
  console.log('\n⚠️ Please update the configuration and uncomment the test runner line.')
}

module.exports = ConversationsAPITest