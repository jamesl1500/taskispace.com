# Interactive Dashboard

An interactive, feature-rich dashboard for the TaskiSpace application that displays tasks, workspaces, notifications, and messages in a beautiful, responsive layout.

## 🎨 Features

### 📊 Stats Cards
- **Total Tasks** - Shows total task count with in-progress indicator
- **Completed Tasks** - Displays completion rate and trends
- **Active Workspaces** - Quick overview of workspace count
- **Messages** - Shows conversation count with unread notifications

### ✅ Quick Tasks List
- View up to 5 most recent incomplete tasks
- Interactive checkboxes to mark tasks complete
- Priority badges (High, Medium, Low) with color coding
- Due date indicators with overdue alerts
- Task status icons (To Do, In Progress, In Review, Completed)
- Hover effects and smooth transitions
- Direct links to individual task pages

### 📅 Upcoming Tasks Calendar
- **7-day week view** with navigation
- Visual task distribution by day
- Priority color coding
- "Today" and "Tomorrow" labels
- Overdue task indicators
- Task count overflow (+N more)
- Interactive navigation (Previous/Next week)
- "Today" quick jump button

### 📈 Productivity Chart
- **Dual tab view**: Chart & Stats
- Weekly task completion vs creation visualization
- Interactive bar chart with hover tooltips
- Statistics panel showing:
  - Total completed tasks
  - Total created tasks
  - Completion rate percentage
  - Average daily tasks
- Green bars for completed tasks
- Blue bars for created tasks

### 🎯 Goals & Targets Widget
- Track multiple goals simultaneously
- Visual progress bars
- Percentage completion
- Remaining count indicators
- Achievement checkmarks
- Color-coded progress (Blue, Green, Purple themes)

### 🔔 Activity Feed
- Real-time notifications display
- 10 most recent activities
- Color-coded notification types:
  - ✅ Task assignments & completions (Green)
  - 💬 Comments & messages (Blue)
  - 📅 Due dates (Yellow/Red)
  - 👥 Workspace invitations (Purple)
- Unread badges
- Relative timestamps ("2 hours ago")
- Scrollable feed (max height 500px)

### 💬 Conversations Widget
- Active conversation threads
- Unread message counts
- Last message preview
- Member count display
- Avatar placeholders
- Quick "New Conversation" button
- Relative timestamps

### 🗂️ Workspaces Grid
- Responsive grid layout (1-3 columns)
- Color-coded workspace indicators
- Member count display
- Task count badges
- Description previews (line-clamp-2)
- Hover effects with scale transform
- "Create Workspace" quick action

### ➕ Quick Add Task (Floating Button)
- Fixed position floating action button
- Bottom-right corner placement
- Modal dialog with form:
  - Task title (required)
  - Description
  - Priority selector (Low/Medium/High)
  - Due date picker
- Smooth animations
- Mobile-responsive

### 🚨 Overdue Tasks Alert
- Conditional display when tasks are overdue
- Prominent red-themed alert card
- Task count display
- Direct "View Tasks" action button

## 🎨 Visual Design

### Color Scheme
- **Gradient Background**: Slate → Blue → Indigo
- **Primary Colors**: Indigo/Purple gradient accents
- **Status Colors**:
  - Success: Green
  - Warning: Yellow
  - Error: Red
  - Info: Blue
  - Neutral: Gray

### Animations & Effects
- Smooth hover transitions (scale, shadow, border)
- Pulse animations on key elements
- Loading skeletons for all widgets
- Gradient text effects
- Card elevation on hover

### Responsive Layout
- **Mobile**: Single column stack
- **Tablet**: 2-column grid
- **Desktop**: 3-column layout with 2:1 split
- Adaptive font sizes
- Touch-friendly tap targets

## 📱 Component Breakdown

### StatsCard.tsx
Reusable statistics card with icon, value, description, and optional trend indicator.

### QuickTasksList.tsx
Displays recent tasks with interactive checkboxes and rich metadata display.

### WorkspacesGrid.tsx
Grid layout for workspace cards with hover effects and quick navigation.

### ActivityFeed.tsx
Notification timeline with type-based icons and color coding.

### ConversationsWidget.tsx
Message thread list with unread indicators and previews.

### ProductivityChart.tsx
Dual-view chart showing task creation vs completion with statistics panel.

### GoalsWidget.tsx
Progress tracker for multiple goals with visual progress bars.

### UpcomingTasksCalendar.tsx
7-day calendar view with task distribution and navigation controls.

### QuickAddTask.tsx
Floating action button with modal form for rapid task creation.

## 🔧 Technical Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI
- **State Management**: TanStack React Query
- **Date Handling**: date-fns
- **Icons**: Lucide React
- **Type Safety**: TypeScript

## 🚀 Usage

The dashboard automatically loads on the `/dashboard` route and displays:
1. User greeting with name from auth metadata
2. Real-time statistics from API queries
3. Interactive widgets with live data
4. Loading states for all async operations
5. Error handling with fallbacks

## 📊 Data Sources

- **Tasks**: `useTasks()` from `@/hooks/queries/useTaskQueries`
- **Workspaces**: `useWorkspaces()` from `@/hooks/queries/useWorkspaceQueries`
- **Notifications**: `useNotifications()` from `@/hooks/useNotifications`
- **Conversations**: `useConversations()` from `@/hooks/queries/useConversationQueries`
- **Auth**: `useAuth()` from `@/hooks/queries/useAuthQueries`

## 🎯 Key Features

✨ **Fully Interactive** - All widgets are clickable and navigable
🎨 **Beautiful Design** - Modern gradients and smooth animations
📱 **Responsive** - Works perfectly on all device sizes
⚡ **Fast Loading** - Optimized with React Query caching
🔄 **Real-time Updates** - Auto-refresh for notifications
♿ **Accessible** - ARIA labels and keyboard navigation
🌙 **Dark Mode** - Full dark theme support

## 📦 Files Created

```
components/dashboard/
├── ActivityFeed.tsx
├── ConversationsWidget.tsx
├── GoalsWidget.tsx
├── ProductivityChart.tsx
├── QuickAddTask.tsx
├── QuickTasksList.tsx
├── StatsCard.tsx
├── UpcomingTasksCalendar.tsx
├── WorkspacesGrid.tsx
└── index.ts

components/ui/
└── progress.tsx

app/dashboard/
└── page.tsx (updated)
```

## 🎉 Result

A stunning, production-ready dashboard that provides users with:
- Complete visibility into their tasks and productivity
- Quick access to all key features
- Beautiful, engaging user interface
- Smooth, performant interactions
- Comprehensive data visualization

Perfect for power users who want to stay on top of their work! 🚀
