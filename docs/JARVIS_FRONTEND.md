# Jarvis Frontend Implementation

## Overview
Modern, full-featured chat interface for Jarvis AI with conversation management, token tracking, and responsive design.

## Components Created

### 1. **JarvisChat Component** (`components/layout/jarvis/JarvisChat.tsx`)
Main chat interface with:
- **Conversation Sidebar**: List of all conversations with edit/delete actions
- **Chat Area**: Message display with user/AI avatars and timestamps
- **Message Input**: Textarea with Enter to send, Shift+Enter for newline
- **Token Display**: Shows tokens used per message
- **Stats Modal**: Usage statistics popup
- **Responsive Design**: Mobile-friendly with collapsible sidebar

#### Features:
✅ Auto-scroll to latest message
✅ Real-time token tracking
✅ Conversation title editing
✅ Delete conversations with confirmation
✅ Empty state for new users
✅ Loading states for all actions
✅ Error handling

### 2. **Custom Hooks** (`hooks/useJarvis.ts`)

#### `useJarvisConversations()`
Manages conversation list:
```typescript
const {
  conversations,        // Array of all conversations
  loading,             // Loading state
  error,               // Error message
  createConversation,  // Create new conversation
  deleteConversation,  // Delete conversation
  updateConversationTitle, // Rename conversation
  refetchConversations // Refresh list
} = useJarvisConversations()
```

#### `useJarvisChat(conversationId)`
Manages individual conversation:
```typescript
const {
  conversation,        // Full conversation with messages
  loading,            // Loading state
  sending,            // Sending message state
  error,              // Error message
  sendMessage,        // Send message function
  refetchConversation // Refresh conversation
} = useJarvisChat(conversationId)
```

### 3. **Jarvis Button** (`components/layout/Jarvis.tsx`)
Simplified header button that navigates to `/jarvis` page

### 4. **Jarvis Page** (`app/jarvis/page.tsx`)
Full-page Jarvis chat interface

## Routes Protected
Added `/jarvis` to middleware protected routes - requires authentication.

## UI Features

### Message Display
- **User messages**: Right-aligned, blue background
- **AI messages**: Left-aligned, gray background with Bot avatar
- **Timestamps**: Relative time (e.g., "2 minutes ago")
- **Token badges**: Shows tokens used per message

### Conversation List
- **Recent first**: Sorted by `updated_at`
- **Quick actions**: Edit title, delete conversation
- **Active indicator**: Highlighted selected conversation
- **Empty state**: Helpful message for new users

### Stats Modal
Displays:
- Total conversations
- Total messages  
- Total tokens used
- Average tokens per message
- Estimated cost (~$0.15 per 1M tokens)

### Keyboard Shortcuts
- **Enter**: Send message
- **Shift + Enter**: New line in message
- **Escape**: Close stats modal (future)

## Usage Example

### Basic Chat
```tsx
import { JarvisChat } from '@/components/layout/jarvis/JarvisChat'

export default function JarvisPage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <JarvisChat />
    </div>
  )
}
```

### Using Hooks Directly
```tsx
'use client'

import { useJarvisChat } from '@/hooks/useJarvis'
import { useState } from 'react'

export function CustomJarvisChat() {
  const [message, setMessage] = useState('')
  const { conversation, sendMessage, sending } = useJarvisChat()

  const handleSend = async () => {
    if (!message.trim()) return
    await sendMessage(message)
    setMessage('')
  }

  return (
    <div>
      {conversation?.messages.map(msg => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <input 
        value={message} 
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={handleSend} disabled={sending}>
        Send
      </button>
    </div>
  )
}
```

## Styling

### Tailwind Classes Used
- **Layout**: `flex`, `grid`, `space-y-*`, `gap-*`
- **Responsive**: `lg:`, `md:`, `sm:` breakpoints
- **Dark mode**: `dark:` prefix for all colors
- **Colors**: 
  - Blue (user messages, selected states)
  - Green (AI, success states)
  - Slate (neutral, backgrounds)
  - Red (delete actions)

### Custom Styles
```css
/* Auto-scroll behavior */
ScrollArea automatically scrolls to bottom on new messages

/* Message bubbles */
.rounded-lg for smooth corners
.max-w-[75%] for readable message width
```

## State Management

### Local State
- `selectedConversationId`: Currently active conversation
- `message`: Current message input
- `editingId`: Conversation being renamed
- `showStats`: Stats modal visibility

### Server State (via hooks)
- Conversations list
- Individual conversation with messages
- Token usage statistics

## Performance Optimizations

### 1. **Lazy Loading**
- Conversations loaded on component mount
- Individual conversation loaded only when selected

### 2. **Optimistic Updates**
- Messages appear immediately in UI
- Background sync with server

### 3. **Auto-scroll**
- Only scrolls when new messages arrive
- Uses `useEffect` with message dependency

### 4. **Token Tracking**
- Real-time display without extra API calls
- Calculated from existing message data

## Error Handling

### Network Errors
```typescript
try {
  await sendMessage(message)
} catch (error) {
  console.error('Failed to send message:', error)
  // Error state displayed in UI
}
```

### Validation
- Empty message prevention
- Disabled send button during transmission
- Confirmation dialogs for destructive actions

## Accessibility

### Keyboard Navigation
- ✅ Enter to send
- ✅ Tab navigation through controls
- ✅ Focus management on modals

### Screen Readers
- Semantic HTML (`button`, `form`, `textarea`)
- ARIA labels on icon buttons
- Descriptive button text

### Visual Feedback
- Loading spinners
- Disabled states
- Error messages
- Success confirmations

## Mobile Responsiveness

### Breakpoints
- **Mobile (<640px)**: Single column, full-width chat
- **Tablet (640px-1024px)**: Collapsible sidebar
- **Desktop (>1024px)**: Full sidebar + chat layout

### Mobile Features
- Back button to return to conversation list
- Touch-friendly button sizes
- Scrollable message areas
- Responsive text sizes

## Future Enhancements

### Planned Features
1. **Voice Input**: Speech-to-text for messages
2. **Export Chat**: Download as PDF/Markdown
3. **Search**: Find messages in conversations
4. **Favorites**: Pin important conversations
5. **Themes**: Custom color schemes
6. **Shortcuts**: Keyboard shortcuts panel
7. **Mentions**: @mention for context referencing
8. **Rich Text**: Markdown support in messages
9. **File Upload**: Attach images/documents
10. **Notifications**: New message alerts

### Technical Improvements
- WebSocket for real-time updates
- Message pagination for long conversations
- Conversation search/filter
- Bulk delete operations
- Export conversations
- Keyboard shortcuts help modal

## Integration Points

### Header Navigation
```tsx
// components/layout/Header.tsx
import { Jarvis } from '@/components/layout/Jarvis'

<Jarvis /> // Renders button that navigates to /jarvis
```

### Protected Route
```typescript
// middleware.ts
const protectedRoutes = [..., '/jarvis']
```

### API Endpoints Used
- `POST /api/jarvis` - Send message
- `GET /api/jarvis` - Get conversations
- `GET /api/jarvis/conversations/[id]` - Get conversation
- `POST /api/jarvis/conversations` - Create conversation
- `PATCH /api/jarvis/conversations/[id]` - Update title
- `DELETE /api/jarvis/conversations/[id]` - Delete conversation
- `GET /api/jarvis/stats` - Get usage stats

## Testing Checklist

### Manual Testing
- [ ] Send message in new conversation
- [ ] Send message in existing conversation
- [ ] Edit conversation title
- [ ] Delete conversation
- [ ] View token statistics
- [ ] Test keyboard shortcuts
- [ ] Test on mobile device
- [ ] Test dark mode
- [ ] Test with no conversations
- [ ] Test with many conversations

### Edge Cases
- [ ] Very long messages (>1000 chars)
- [ ] Special characters in messages
- [ ] Empty message submission (blocked)
- [ ] Network offline
- [ ] Slow network (loading states)
- [ ] Concurrent messages

## Deployment Notes

### Environment Variables Required
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
OPENAI_API_KEY=your_openai_key
```

### Database Tables Required
- `jarvis_conversations`
- `jarvis_messages`

### Migration Status
Run migration: `20250118000000_create_jarvis_conversations`

## Cost Monitoring

### Token Usage
- View real-time token count per conversation
- Track total usage via stats modal
- Estimated cost display ($0.15 per 1M tokens)

### Optimization
- Sliding window (10 messages) reduces costs by 70-90%
- gpt-4o-mini is 60% cheaper than gpt-3.5-turbo
- Max 500 tokens per response

## Troubleshooting

### "Not authenticated" error
- Check if user is logged in
- Verify middleware is protecting `/jarvis` route
- Check Supabase session

### Messages not loading
- Verify database tables exist
- Check RLS policies
- Inspect network tab for API errors

### Slow responses
- Check OpenAI API status
- Verify token limits aren't too high
- Monitor network connection

### Conversations not saving
- Check database connection
- Verify Supabase credentials
- Check browser console for errors
