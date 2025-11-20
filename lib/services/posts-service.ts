/**
 * Posts Service
 * Handles post-related operations including CRUD operations,
 * likes, and comments
 * 
 * @module services/posts-service
 */
import { createClient } from '@/lib/supabase/server'

export class PostsService {
  /**
   * Get all posts visible to the current user
   * Includes posts from the user and their friends
   * 
   * @param userId - Optional filter to get posts from a specific user
   * @returns Array of posts with profile data and engagement counts
   */
  async getPosts(userId?: string) {
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          user_name,
          display_name,
          avatar_url
        ),
        post_likes (count),
        post_comments (count)
      `)
      .order('created_at', { ascending: false })

    // If userId is provided, get posts from that user
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error('Error fetching posts:', error)
      throw new Error(`Failed to fetch posts: ${error.message}`)
    }

    // Get user's likes to mark which posts they've liked
    const { data: userLikes } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id)

    const likedPostIds = new Set(userLikes?.map(like => like.post_id) || [])

    // Format posts with counts and like status
    return posts?.map(post => ({
      ...post,
      likes_count: post.post_likes?.[0]?.count || 0,
      comments_count: post.post_comments?.[0]?.count || 0,
      is_liked: likedPostIds.has(post.id),
      post_likes: undefined,
      post_comments: undefined
    })) || []
  }

  /**
   * Create a new post
   * 
   * @param content - The text content of the post (max 5000 characters)
   * @returns The created post with profile data
   */
  async createPost(content: string) {
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      throw new Error('Content is required')
    }

    if (content.length > 5000) {
      throw new Error('Content too long (max 5000 characters)')
    }

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content: content.trim()
      })
      .select(`
        *,
        profiles:user_id (
          user_name,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating post:', error)
      throw new Error(`Failed to create post: ${error.message}`)
    }

    return {
      ...post,
      likes_count: 0,
      comments_count: 0,
      is_liked: false
    }
  }

  /**
   * Update an existing post
   * Only the post owner can update their post
   * 
   * @param postId - The ID of the post to update
   * @param content - The new content for the post
   * @returns The updated post with profile data
   */
  async updatePost(postId: string, content: string) {
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      throw new Error('Content is required')
    }

    if (content.length > 5000) {
      throw new Error('Content too long (max 5000 characters)')
    }

    const { data: post, error } = await supabase
      .from('posts')
      .update({ content: content.trim() })
      .eq('id', postId)
      .eq('user_id', user.id) // Ensure user owns the post
      .select(`
        *,
        profiles:user_id (
          user_name,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error updating post:', error)
      throw new Error(`Failed to update post: ${error.message}`)
    }

    if (!post) {
      throw new Error('Post not found or unauthorized')
    }

    return post
  }

  /**
   * Delete a post
   * Only the post owner can delete their post
   * 
   * @param postId - The ID of the post to delete
   * @returns Success status
   */
  async deletePost(postId: string) {
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id) // Ensure user owns the post

    if (error) {
      console.error('Error deleting post:', error)
      throw new Error(`Failed to delete post: ${error.message}`)
    }

    return { success: true }
  }

  /**
   * Toggle like on a post
   * 
   * @param postId - The ID of the post to like/unlike
   * @returns The new like status
   */
  async toggleLike(postId: string) {
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // Check if user already liked the post
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single()

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error unliking post:', error)
        throw new Error(`Failed to unlike post: ${error.message}`)
      }

      return { liked: false }
    } else {
      // Like
      const { error } = await supabase
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.id
        })

      if (error) {
        console.error('Error liking post:', error)
        throw new Error(`Failed to like post: ${error.message}`)
      }

      return { liked: true }
    }
  }

  /**
   * Get comments for a post
   * 
   * @param postId - The ID of the post
   * @returns Array of comments with profile data
   */
  async getComments(postId: string) {
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    const { data: comments, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        profiles:user_id (
          user_name,
          display_name,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      throw new Error(`Failed to fetch comments: ${error.message}`)
    }

    return comments || []
  }

  /**
   * Create a comment on a post
   * 
   * @param postId - The ID of the post to comment on
   * @param content - The comment content (max 1000 characters)
   * @returns The created comment with profile data
   */
  async createComment(postId: string, content: string) {
    const supabase = await createClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      throw new Error('Comment content is required')
    }

    if (content.length > 1000) {
      throw new Error('Comment too long (max 1000 characters)')
    }

    const { data: comment, error } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content: content.trim()
      })
      .select(`
        *,
        profiles:user_id (
          user_name,
          display_name,
          avatar_url
        )
      `)
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      throw new Error(`Failed to create comment: ${error.message}`)
    }

    return comment
  }
}

// Export a singleton instance
export const postsService = new PostsService()
