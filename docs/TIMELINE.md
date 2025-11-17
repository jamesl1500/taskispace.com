# Timeline - Social Feed Feature

## Overview

The Timeline feature transforms TaskiSpace into a social platform where users can share posts, interact with friends, and see updates in real-time.

## Features

### 📝 Posts
- Create text posts (up to 5,000 characters)
- Edit your own posts
- Delete your own posts
- See post timestamps with "edited" indicator
- Character counter while typing

### ❤️ Likes
- Like/unlike posts with a single click
- See total like counts
- Visual indicator for liked posts (filled heart icon)
- Real-time like count updates

### 💬 Comments
- Add comments to posts (up to 1,000 characters)
- See all comments on a post
- Comment timestamps
- Author avatars and names
- Comments sorted chronologically

### 👥 Privacy
- Posts are visible only to friends (RLS enforced)
- Friend-based privacy at the database level
- Secure API endpoints with authentication

## Database Schema

### Posts Table
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 5000),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Post Likes Table
```sql
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);
```

### Post Comments Table
```sql
CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 1000),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Friendships Table
```sql
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, friend_id)
);
```

## API Endpoints

### GET /api/posts
Fetch all posts visible to the current user (their own posts + friends' posts).

**Query Parameters:**
- `userId` (optional): Filter posts by a specific user

**Response:**
```typescript
Post[] // Array of posts with likes_count, comments_count, is_liked
```

### POST /api/posts
Create a new post.

**Request Body:**
```typescript
{
  content: string // Max 5000 characters
}
```

**Response:**
```typescript
Post // The created post
```

### PATCH /api/posts/[id]
Update a post (must be the post author).

**Request Body:**
```typescript
{
  content: string // Max 5000 characters
}
```

**Response:**
```typescript
Post // The updated post
```

### DELETE /api/posts/[id]
Delete a post (must be the post author).

**Response:**
```typescript
{ success: true }
```

### POST /api/posts/[id]/like
Like a post.

**Response:**
```typescript
PostLike // The created like
```

### DELETE /api/posts/[id]/like
Unlike a post.

**Response:**
```typescript
{ success: true }
```

### GET /api/posts/[id]/comments
Get all comments for a post.

**Response:**
```typescript
PostComment[] // Array of comments with author info
```

### POST /api/posts/[id]/comments
Add a comment to a post.

**Request Body:**
```typescript
{
  content: string // Max 1000 characters
}
```

**Response:**
```typescript
PostComment // The created comment
```

## UI Components

### Timeline Page (`/timeline`)
- Main feed showing all posts
- Post creation form at the top
- Scrollable post feed
- Each post card includes:
  - Author avatar and name (links to profile)
  - Post content
  - Timestamp with "edited" indicator
  - Like button with count
  - Comment button with count
  - Edit/delete menu (for own posts)

### Post Card Features
- **Edit Mode**: Click edit to inline edit the post
- **Comments Section**: Click comment count to expand comments
- **Add Comment**: Text area with send button
- **Like Animation**: Heart fills when liked

## Setup Instructions

### 1. Apply Database Migration
```bash
# Navigate to your project
cd supabase

# Apply the migration
supabase db push
```

Or manually run the SQL file:
```bash
supabase db execute < migrations/20250117000001_create_posts_tables.sql
```

### 2. Verify Tables
Check that the following tables exist:
- `posts`
- `post_likes`
- `post_comments`
- `friendships`

### 3. Test RLS Policies
The following RLS policies are in place:
- Users can view their own posts
- Users can view friends' posts (where friendship status = 'accepted')
- Users can create/update/delete their own posts
- Users can like any post they can view
- Users can comment on any post they can view

### 4. Update Navigation
The navigation has been updated to use "Timeline" instead of "Dashboard":
- Header component
- Mobile menu
- Homepage links
- Auth redirects
- Middleware protected routes

## Usage

### Creating a Post
1. Navigate to `/timeline`
2. Type your message in the "What's on your mind?" text area
3. Click "Post" button
4. Your post appears at the top of the feed

### Liking a Post
1. Click the heart icon on any post
2. The heart fills and count increments
3. Click again to unlike

### Commenting on a Post
1. Click the comment count or comment icon
2. Comments section expands
3. Type your comment in the text area
4. Click the send button
5. Your comment appears in the list

### Editing Your Post
1. Click the three-dot menu on your post
2. Select "Edit"
3. Update the text inline
4. Click "Save" or "Cancel"

### Deleting Your Post
1. Click the three-dot menu on your post
2. Select "Delete"
3. Confirm the deletion
4. Post is removed from feed

## Type Definitions

See `types/posts.ts` for complete TypeScript interfaces:
- `Post`
- `PostLike`
- `PostComment`
- `Friendship`
- `CreatePostData`
- `UpdatePostData`
- `CreateCommentData`

## Future Enhancements

### Phase 2
- [ ] Image/video attachments
- [ ] Post reactions (beyond just likes)
- [ ] Share posts
- [ ] Tag users in posts
- [ ] Hashtags

### Phase 3
- [ ] Friend request system UI
- [ ] Friend suggestions
- [ ] Mutual friends display
- [ ] Block/unblock users
- [ ] Report posts

### Phase 4
- [ ] Real-time updates (Supabase Realtime)
- [ ] Notifications for likes/comments
- [ ] @mentions with notifications
- [ ] Post analytics

### Phase 5
- [ ] Stories (24-hour posts)
- [ ] Live streaming
- [ ] Groups/communities
- [ ] Events

## Security Considerations

✅ **Row Level Security (RLS)** enforced on all tables
✅ **API route authentication** checks user session
✅ **Input validation** on all forms (character limits)
✅ **XSS protection** through React's built-in escaping
✅ **SQL injection prevention** via Supabase parameterized queries
✅ **Friend-based privacy** at database level

## Performance

- **Indexes** on frequently queried columns (user_id, post_id, created_at)
- **Aggregated counts** computed in single query (likes_count, comments_count)
- **Efficient joins** with profiles table for author info
- **Pagination ready** (can add limit/offset to API)

## Troubleshooting

### Posts Not Showing
- Check if RLS policies are active
- Verify user has accepted friendships
- Check browser console for API errors

### Can't Create Posts
- Verify user is authenticated
- Check character limit (5000 max)
- Ensure API route is accessible

### Likes Not Working
- Check if user can view the post
- Verify RLS policies on post_likes table
- Check for duplicate like constraints

### Comments Not Loading
- Verify post_comments table exists
- Check RLS policies
- Ensure API endpoint is correct

## Migration Notes

From Dashboard to Timeline:
- Directory renamed: `app/dashboard` → `app/timeline`
- Route changed: `/dashboard` → `/timeline`
- All navigation links updated
- Middleware updated
- Auth redirects updated
- Page content completely rebuilt for social features

Old dashboard components preserved in `components/dashboard/` for potential future use.
