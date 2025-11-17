-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT content_length CHECK (char_length(content) > 0 AND char_length(content) <= 5000)
);

-- Create post likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create post comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT comment_length CHECK (char_length(content) > 0 AND char_length(content) <= 1000)
);

-- Create friendships table
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CONSTRAINT no_self_friendship CHECK (user_id != friend_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON post_comments(user_id);
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Posts RLS Policies
-- Anyone can view posts from users they are friends with or their own posts
CREATE POLICY "Users can view posts from friends and own posts"
ON posts FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM friendships
    WHERE (
      (friendships.user_id = auth.uid() AND friendships.friend_id = posts.user_id) OR
      (friendships.friend_id = auth.uid() AND friendships.user_id = posts.user_id)
    ) AND friendships.status = 'accepted'
  )
);

-- Users can create their own posts
CREATE POLICY "Users can create their own posts"
ON posts FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update their own posts"
ON posts FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete their own posts"
ON posts FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Post Likes RLS Policies
-- Users can view likes on posts they can see
CREATE POLICY "Users can view likes on visible posts"
ON post_likes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_likes.post_id AND (
      posts.user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM friendships
        WHERE (
          (friendships.user_id = auth.uid() AND friendships.friend_id = posts.user_id) OR
          (friendships.friend_id = auth.uid() AND friendships.user_id = posts.user_id)
        ) AND friendships.status = 'accepted'
      )
    )
  )
);

-- Users can like posts they can see
CREATE POLICY "Users can like visible posts"
ON post_likes FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_likes.post_id AND (
      posts.user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM friendships
        WHERE (
          (friendships.user_id = auth.uid() AND friendships.friend_id = posts.user_id) OR
          (friendships.friend_id = auth.uid() AND friendships.user_id = posts.user_id)
        ) AND friendships.status = 'accepted'
      )
    )
  )
);

-- Users can unlike their own likes
CREATE POLICY "Users can delete their own likes"
ON post_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Post Comments RLS Policies
-- Users can view comments on posts they can see
CREATE POLICY "Users can view comments on visible posts"
ON post_comments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_comments.post_id AND (
      posts.user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM friendships
        WHERE (
          (friendships.user_id = auth.uid() AND friendships.friend_id = posts.user_id) OR
          (friendships.friend_id = auth.uid() AND friendships.user_id = posts.user_id)
        ) AND friendships.status = 'accepted'
      )
    )
  )
);

-- Users can comment on posts they can see
CREATE POLICY "Users can comment on visible posts"
ON post_comments FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_comments.post_id AND (
      posts.user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM friendships
        WHERE (
          (friendships.user_id = auth.uid() AND friendships.friend_id = posts.user_id) OR
          (friendships.friend_id = auth.uid() AND friendships.user_id = posts.user_id)
        ) AND friendships.status = 'accepted'
      )
    )
  )
);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON post_comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON post_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Friendships RLS Policies
-- Users can view their own friendships
CREATE POLICY "Users can view their own friendships"
ON friendships FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can create friend requests
CREATE POLICY "Users can create friend requests"
ON friendships FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Users can update friendships they're involved in
CREATE POLICY "Users can update their friendships"
ON friendships FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can delete their own friendships
CREATE POLICY "Users can delete their friendships"
ON friendships FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Create updated_at trigger for posts
CREATE OR REPLACE FUNCTION update_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION update_posts_updated_at();

-- Create updated_at trigger for post_comments
CREATE TRIGGER post_comments_updated_at
BEFORE UPDATE ON post_comments
FOR EACH ROW
EXECUTE FUNCTION update_posts_updated_at();

-- Create updated_at trigger for friendships
CREATE TRIGGER friendships_updated_at
BEFORE UPDATE ON friendships
FOR EACH ROW
EXECUTE FUNCTION update_posts_updated_at();
