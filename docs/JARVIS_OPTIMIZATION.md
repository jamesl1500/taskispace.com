# Jarvis AI - Token Optimization & Conversation Management

## Overview
The Jarvis AI system has been enhanced with token-efficient strategies and conversation persistence to reduce costs and improve user experience.

## Token Optimization Strategies

### 1. **Model Selection: gpt-4o-mini**
- **60% cheaper** than gpt-3.5-turbo
- Faster response times
- Better performance for most tasks
- Cost: ~$0.15 per 1M input tokens vs $0.50 for gpt-3.5-turbo

### 2. **Sliding Window Context (Default: 10 messages)**
Instead of sending entire conversation history every time:
- Only last N messages are sent for context
- Reduces token usage by 70-90% on longer conversations
- Configurable via `maxHistoryMessages` parameter
- Database stores full history for reference

**Example:**
- Old approach: 50 message conversation = 5000+ tokens per request
- New approach: Same conversation = 500-800 tokens per request

### 3. **Concise System Prompt**
- Shortened from verbose to essential instructions
- Saves ~50 tokens per request
- Focuses on brevity and actionable responses

### 4. **Response Length Limiting**
- `max_tokens: 500` prevents overly long responses
- Encourages concise, focused answers
- Reduces output token costs

### 5. **Token Tracking & Monitoring**
- Every message tracks token usage
- Per-conversation and per-user statistics
- Enables cost analysis and optimization

## Database Schema

### jarvis_conversations
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- title: TEXT (conversation title)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### jarvis_messages
```sql
- id: UUID (primary key)
- conversation_id: UUID (foreign key)
- role: VARCHAR(20) ['user', 'assistant', 'system']
- content: TEXT (message content)
- tokens_used: INTEGER (token count for this message)
- created_at: TIMESTAMPTZ
```

## API Endpoints

### Chat with Jarvis
```http
POST /api/jarvis
Content-Type: application/json

{
  "message": "Help me prioritize my tasks",
  "conversationId": "uuid-optional",
  "maxHistoryMessages": 10  // optional, default: 10
}

Response:
{
  "reply": "Let's prioritize your tasks...",
  "conversation": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Help me prioritize...",
    "messages": [...],
    "total_tokens": 1234
  }
}
```

### Get All Conversations
```http
GET /api/jarvis

Response:
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Task prioritization",
    "created_at": "2025-11-18T...",
    "updated_at": "2025-11-18T..."
  }
]
```

### Get Specific Conversation
```http
GET /api/jarvis/conversations/[id]

Response:
{
  "id": "uuid",
  "title": "Task prioritization",
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "Help me...",
      "tokens_used": 120,
      "created_at": "2025-11-18T..."
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "Here's how...",
      "tokens_used": 280,
      "created_at": "2025-11-18T..."
    }
  ],
  "total_tokens": 400
}
```

### Create New Conversation
```http
POST /api/jarvis/conversations
Content-Type: application/json

{
  "title": "My new conversation"  // optional
}
```

### Update Conversation Title
```http
PATCH /api/jarvis/conversations/[id]
Content-Type: application/json

{
  "title": "Updated title"
}
```

### Delete Conversation
```http
DELETE /api/jarvis/conversations/[id]
```

### Get Token Usage Statistics
```http
GET /api/jarvis/stats

Response:
{
  "total_conversations": 15,
  "total_messages": 234,
  "total_tokens": 45678,
  "avg_tokens_per_message": 195
}
```

## Cost Comparison

### Before Optimization (gpt-3.5-turbo, full history)
- Average conversation (20 messages): ~$0.05
- 100 conversations/month: **$5.00**
- Heavy user (500 conversations/month): **$25.00**

### After Optimization (gpt-4o-mini, sliding window)
- Average conversation (20 messages): ~$0.008
- 100 conversations/month: **$0.80** (84% savings)
- Heavy user (500 conversations/month): **$4.00** (84% savings)

## Usage Examples

### Frontend Implementation
```typescript
// Start new conversation
const response = await fetch('/api/jarvis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Help me organize my tasks',
    maxHistoryMessages: 10  // optional
  })
})
const { reply, conversation } = await response.json()

// Continue conversation
const response2 = await fetch('/api/jarvis', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'What about urgent tasks?',
    conversationId: conversation.id
  })
})

// Get conversation history
const history = await fetch(`/api/jarvis/conversations/${conversation.id}`)
const conversationData = await history.json()
console.log(`Total tokens used: ${conversationData.total_tokens}`)

// Get usage stats
const stats = await fetch('/api/jarvis/stats')
const { total_tokens, avg_tokens_per_message } = await stats.json()
```

## Best Practices

### 1. Adjust Context Window Based on Need
```typescript
// For simple queries, use minimal context
{ message: "What's 2+2?", maxHistoryMessages: 1 }

// For complex discussions, use more context
{ message: "Based on our earlier discussion...", maxHistoryMessages: 20 }
```

### 2. Set Meaningful Conversation Titles
```typescript
// Auto-generated from first message
{ message: "Help me with project planning" }
// Title: "Help me with project planning"

// Or set explicitly
await fetch('/api/jarvis/conversations', {
  method: 'POST',
  body: JSON.stringify({ title: "Q4 Planning Session" })
})
```

### 3. Monitor Token Usage
```typescript
const stats = await fetch('/api/jarvis/stats')
const data = await stats.json()

if (data.total_tokens > 100000) {
  console.warn('High token usage detected')
}
```

### 4. Clean Up Old Conversations
```typescript
// Delete conversations you no longer need
await fetch(`/api/jarvis/conversations/${oldConversationId}`, {
  method: 'DELETE'
})
```

## Security Features

- **Row Level Security (RLS)**: Users can only access their own conversations
- **Authentication Required**: All endpoints require authenticated users
- **Input Validation**: Message content and titles are validated
- **Cascade Deletion**: Deleting a conversation removes all messages

## Future Enhancements

1. **Conversation Summarization**: Compress old messages into summaries
2. **Semantic Search**: Find relevant past conversations
3. **Shared Conversations**: Collaborate with team members
4. **Export Conversations**: Download as PDF/Markdown
5. **Voice Input**: Speech-to-text integration
6. **Token Budgets**: Set monthly limits per user
7. **Smart Context Selection**: AI-powered relevance filtering

## Migration from Old System

If you have existing Jarvis implementations:

### Old API (deprecated)
```typescript
const response = await fetch('/api/jarvis', {
  method: 'POST',
  body: JSON.stringify({ message: "Hello" })
})
const { reply } = await response.json()
```

### New API (recommended)
```typescript
const response = await fetch('/api/jarvis', {
  method: 'POST',
  body: JSON.stringify({ 
    message: "Hello",
    conversationId: existingId  // optional
  })
})
const { reply, conversation } = await response.json()
// Now you have conversation.id for follow-ups
```

The old API still works but doesn't benefit from conversation history or token optimization.
