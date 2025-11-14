# Conversations System

A comprehensive conversations system for TaskiSpace that allows users to have private conversations with each other, similar to messaging or chat functionality.

## Features

- **Private Conversations**: Users can create conversations with other users
- **Member Management**: Add/remove members from conversations with proper permissions
- **Real-time Messaging**: Send and receive messages within conversations
- **Role-based Access Control**: Admin and member roles with different permissions
- **Secure by Default**: Comprehensive Row-Level Security (RLS) policies

## Database Schema

The conversations system consists of three main tables:

### `conversations`
- `id` (uuid, primary key)
- `title` (text, nullable)
- `description` (text, nullable) 
- `created_by` (uuid, references auth.users)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### `conversation_members`
- `id` (serial, primary key)
- `conversation_id` (uuid, references conversations)
- `user_id` (uuid, references auth.users)
- `role` (enum: 'admin', 'member')
- `created_at` (timestamp)
- `updated_at` (timestamp)

### `conversation_messages`
- `id` (serial, primary key)
- `conversation_id` (uuid, references conversations)
- `member_id` (integer, references conversation_members)
- `user_id` (uuid, references auth.users)
- `content` (text, required)
- `subject` (text, nullable)
- `attachments` (jsonb, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## API Endpoints

### Conversations

#### GET /api/conversations
Get all conversations for the authenticated user.

**Response:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string", 
      "created_by": "uuid",
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "member_count": 3,
      "last_message": {
        "id": 123,
        "content": "Last message text",
        "created_at": "timestamp"
      }
    }
  ]
}
```

#### POST /api/conversations
Create a new conversation.

**Request Body:**
```json
{
  "title": "Conversation Title",
  "description": "Optional description",
  "member_ids": ["user_id_1", "user_id_2"]
}
```

#### GET /api/conversations/[id]
Get a specific conversation with details.

#### PUT /api/conversations/[id]
Update conversation details (admin only).

#### DELETE /api/conversations/[id]
Delete a conversation (admin only).

### Conversation Members

#### GET /api/conversations/[id]/conversation_members
Get all members of a conversation.

#### POST /api/conversations/[id]/conversation_members
Add a member to a conversation (admin only).

**Request Body:**
```json
{
  "user_id": "uuid"
}
```

#### DELETE /api/conversations/[id]/conversation_members?member_id=123
Remove a member from a conversation (admin only, or user removing themselves).

### Conversation Messages

#### GET /api/conversations/[id]/conversation_messages
Get messages from a conversation with pagination.

**Query Parameters:**
- `limit` (default: 50)
- `offset` (default: 0)

#### POST /api/conversations/[id]/conversation_messages
Send a message to a conversation.

**Request Body:**
```json
{
  "content": "Message text",
  "subject": "Optional subject",
  "attachments": {}
}
```

## Security

### Row-Level Security (RLS) Policies

All tables have comprehensive RLS policies that ensure:

1. **Conversations**: Users can only see conversations they are members of
2. **Members**: Users can only see members of conversations they belong to
3. **Messages**: Users can only see messages in conversations they are members of

### Permission System

- **Admin**: Can manage conversation settings, add/remove members, delete any messages
- **Member**: Can send messages, view conversation details, remove themselves

### Additional Security Features

- **Self-promotion Prevention**: Users cannot promote themselves to admin role
- **Access Control**: All operations require proper membership verification
- **Audit Trail**: All operations are logged with timestamps and user references

## TypeScript Types

The system includes comprehensive TypeScript interfaces:

- `Conversation`: Basic conversation data
- `ConversationWithDetails`: Conversation with member count and last message
- `ConversationMember`: Member relationship data
- `ConversationMemberWithUser`: Member data with user information
- `ConversationMessage`: Message data
- `ConversationMessageWithUser`: Message data with user information

## Service Layer

The `ConversationService` class provides all business logic operations:

- `getConversations()`: List user's conversations
- `createConversation()`: Create new conversation
- `updateConversation()`: Update conversation details
- `deleteConversation()`: Remove conversation
- `getConversationMembers()`: List conversation members
- `addConversationMember()`: Add member to conversation
- `removeConversationMember()`: Remove member from conversation
- `getConversationMessages()`: Retrieve conversation messages
- `createConversationMessage()`: Send new message

## Usage Examples

### Creating a Conversation

```typescript
const conversation = await conversationService.createConversation({
  title: "Project Discussion",
  description: "Discussion about the new project",
  member_ids: ["user1", "user2", "user3"]
}, currentUserId);
```

### Sending a Message

```typescript
const message = await conversationService.createConversationMessage(
  conversationId,
  {
    content: "Hello everyone!",
    subject: "Welcome"
  },
  currentUserId
);
```

### Adding a Member

```typescript
const member = await conversationService.addConversationMember(
  conversationId,
  newUserId,
  currentUserId
);
```

## Installation

1. Run the RLS policies migration:
```sql
-- Execute the contents of supabase/rls_policies_conversations.sql
```

2. The TypeScript types, service layer, and API routes are already integrated into the application.

3. Import and use the conversation service in your components:
```typescript
import { conversationService } from '@/lib/services/conversations-service'
```

## Next Steps

To complete the conversations system, you may want to add:

1. **Real-time subscriptions** using Supabase Realtime
2. **File attachments** support
3. **Message reactions** and threading
4. **Push notifications** for new messages
5. **Frontend components** for the conversation UI
6. **Message search** functionality
7. **Conversation categories** or tags