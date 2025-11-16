# Notifications System

A comprehensive notification system for TaskiSpace that provides real-time notifications for task assignments, comments, workspace invitations, and more.

## Features

### ✅ Real-time Notifications
- Browser notifications with permission management
- Real-time updates via Supabase subscriptions
- Notification bell with unread count in header

### ✅ Notification Types
- **Task Assigned**: When you're assigned to a task
- **Task Comment**: When someone comments on your tasks
- **Task Due Soon**: Reminders for upcoming due dates
- **Task Overdue**: Alerts for overdue tasks
- **Workspace Invitation**: When invited to join a workspace
- **List Shared**: When a list is shared with you
- **Conversation Message**: New messages in conversations
- **Subtask Completed**: When subtasks are marked complete
- **Task Completed**: When tasks are completed
- **Mention**: When you're mentioned in comments or messages

### ✅ User Preferences
- Granular control over notification types
- Email notification preferences
- Browser notification settings
- Per-category notification toggles

### ✅ Notification Management
- Mark individual notifications as read/unread
- Mark all notifications as read
- Delete individual notifications
- Bulk delete all read notifications
- Filter notifications by type, read status, workspace, etc.

## Components

### NotificationBell
Location: `components/notifications/NotificationBell.tsx`

The notification bell component that appears in the header. Shows:
- Unread notification count badge
- Dropdown with recent notifications
- Real-time notification updates
- Browser notification requests

```tsx
import { NotificationBell } from '@/components/notifications/NotificationBell';

<NotificationBell />
```

### NotificationList
Location: `components/notifications/NotificationList.tsx`

A comprehensive list of notifications with filtering and actions:
- Displays notifications with icons and metadata
- Shows triggered by user information
- Mark read/unread and delete actions
- Loading and error states

```tsx
import { NotificationList } from '@/components/notifications/NotificationList';

<NotificationList 
  filters={{ read: false }} // Show only unread
  limit={20}
  showActions={true}
/>
```

### NotificationPreferences
Location: `components/notifications/NotificationPreferences.tsx`

User preferences management component:
- Toggle email notifications
- Toggle browser notifications
- Per-type notification settings
- Browser permission management

```tsx
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences';

<NotificationPreferences />
```

## Database Schema

### notifications Table
```sql
CREATE TABLE notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  type text NOT NULL CHECK (type IN (...)),
  title text NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Optional references
  task_id uuid REFERENCES tasks(id),
  workspace_id uuid REFERENCES workspaces(id),
  list_id uuid REFERENCES lists(id),
  conversation_id uuid REFERENCES conversations(id),
  triggered_by uuid REFERENCES auth.users(id)
);
```

### notification_preferences Table
```sql
CREATE TABLE notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT true,
  task_assignments boolean DEFAULT true,
  task_comments boolean DEFAULT true,
  task_due_reminders boolean DEFAULT true,
  workspace_invitations boolean DEFAULT true,
  list_sharing boolean DEFAULT true,
  conversation_messages boolean DEFAULT true,
  mentions boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## API Routes

### GET /api/notifications
Fetch user notifications with filtering options:
- `type`: Filter by notification type(s)
- `read`: Filter by read status (true/false)
- `workspace_id`: Filter by workspace
- `limit`: Number of notifications to return
- `offset`: Pagination offset

### POST /api/notifications
Create a new notification (system use):
```json
{
  "user_id": "uuid",
  "type": "task_assigned",
  "title": "New Task Assignment",
  "message": "You have been assigned to task: Example Task",
  "task_id": "uuid",
  "workspace_id": "uuid",
  "triggered_by": "uuid"
}
```

### PATCH /api/notifications/[id]
Update notification read status:
```json
{
  "read": true
}
```

### DELETE /api/notifications/[id]
Delete a specific notification.

### GET /api/notifications/stats
Get notification statistics:
```json
{
  "unread_count": 5,
  "total_count": 25,
  "by_type": {
    "task_assigned": 3,
    "task_comment": 2
  }
}
```

### POST /api/notifications/actions
Bulk notification actions:
```json
{
  "action": "mark_all_read" // or "delete_all_read"
}
```

### GET/PATCH /api/notifications/preferences
Manage notification preferences.

## React Hooks

### useNotifications
```tsx
import { useNotifications } from '@/hooks/useNotifications';

const { data: notifications, isLoading } = useNotifications({
  read: false,
  type: ['task_assigned', 'task_comment'],
  limit: 10
});
```

### useNotificationStats
```tsx
import { useNotificationStats } from '@/hooks/useNotifications';

const { data: stats } = useNotificationStats();
// { unread_count: 5, total_count: 25, by_type: {...} }
```

### useNotificationPreferences
```tsx
import { useNotificationPreferences } from '@/hooks/useNotifications';

const { data: preferences } = useNotificationPreferences();
const updatePreferences = useUpdateNotificationPreferences();
```

### Notification Actions
```tsx
import { 
  useMarkNotificationRead,
  useDeleteNotification,
  useMarkAllNotificationsRead 
} from '@/hooks/useNotifications';

const markRead = useMarkNotificationRead();
const deleteNotification = useDeleteNotification();
const markAllRead = useMarkAllNotificationsRead();
```

## Service Layer

### NotificationService
Location: `lib/services/notification-service.ts`

Main service for notification operations:
```tsx
import { NotificationService } from '@/lib/services/notification-service';

// Create notification
await NotificationService.createNotification({
  user_id: 'uuid',
  type: 'task_assigned',
  title: 'New Task',
  message: 'You have been assigned a task'
});

// Helper methods
await NotificationService.notifyTaskAssignment(userId, taskId, taskTitle, assignedBy);
await NotificationService.notifyTaskComment(userId, taskId, taskTitle, commenterName, commenterId);
```

## Database Triggers

The system includes automatic notification triggers for:

### Task Assignment
Triggered when `tasks.assigned_to` changes:
```sql
CREATE TRIGGER trigger_notify_task_assignment
  AFTER UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_assignment();
```

### Task Comments
Triggered when new comments are added:
```sql
CREATE TRIGGER trigger_notify_task_comment
  AFTER INSERT ON task_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_task_comment();
```

### Workspace Invitations
Triggered when users are added to workspaces:
```sql
CREATE TRIGGER trigger_notify_workspace_invitation
  AFTER INSERT ON workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION notify_workspace_invitation();
```

### Conversation Messages
Triggered when new messages are sent:
```sql
CREATE TRIGGER trigger_notify_conversation_message
  AFTER INSERT ON conversation_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_conversation_message();
```

## Real-time Features

### Browser Notifications
- Automatic permission request
- Desktop notifications for new notifications
- Click to focus application

### Live Updates
- Real-time notification count updates
- Automatic refresh of notification lists
- Live notification bell updates

### Supabase Subscriptions
```tsx
// Subscribe to real-time notifications
const channel = NotificationService.subscribeToNotifications(
  userId,
  (notification) => {
    // Handle new notification
    console.log('New notification:', notification);
  }
);

// Cleanup
channel.unsubscribe();
```

## Usage Examples

### Basic Implementation
```tsx
// In your layout or header component
import { NotificationBell } from '@/components/notifications/NotificationBell';

<Header>
  <NotificationBell />
</Header>
```

### Custom Notification Page
```tsx
// Full notifications page
import { NotificationList } from '@/components/notifications/NotificationList';
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences';

export default function NotificationsPage() {
  return (
    <div>
      <Tabs>
        <TabsContent value="notifications">
          <NotificationList />
        </TabsContent>
        <TabsContent value="preferences">
          <NotificationPreferences />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Creating Custom Notifications
```tsx
// In your task service or component
import { NotificationService } from '@/lib/services/notification-service';

// When assigning a task
await NotificationService.notifyTaskAssignment(
  userId,
  taskId,
  'Complete project proposal',
  currentUser.id
);

// When adding a comment
await NotificationService.notifyTaskComment(
  taskOwnerId,
  taskId,
  'Complete project proposal',
  'John Doe',
  currentUser.id
);
```

## Testing

To test notifications:

1. **Create a notification manually:**
```sql
INSERT INTO notifications (user_id, type, title, message)
VALUES (auth.uid(), 'task_assigned', 'Test Notification', 'This is a test notification');
```

2. **Test triggers by:**
- Assigning tasks to users
- Adding comments to tasks
- Inviting users to workspaces
- Sending conversation messages

3. **Test real-time features:**
- Open the app in two browser windows
- Create notifications in one window
- Watch real-time updates in the other

## Security

- **Row Level Security (RLS)**: Users can only see their own notifications
- **Authentication**: All API routes require valid authentication
- **Ownership**: Users can only modify their own notifications and preferences
- **Trigger Security**: All trigger functions use `SECURITY DEFINER` with proper access controls

## Performance Considerations

- **Indexes**: Optimized indexes on user_id, read status, type, and created_at
- **Pagination**: API routes support limit/offset pagination
- **Real-time Optimization**: Subscriptions are filtered by user_id
- **Cleanup**: Consider implementing automatic cleanup of old read notifications

## Future Enhancements

- [ ] Email notification delivery
- [ ] Push notification support (PWA)
- [ ] Notification scheduling/snoozing
- [ ] Notification templates system
- [ ] Advanced filtering and search
- [ ] Notification analytics and insights
- [ ] Batch notification creation APIs
- [ ] Custom notification sounds
- [ ] Notification categories and priorities