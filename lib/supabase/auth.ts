/**
 * auth.ts
 * 
 * Supabase authentication utilities.
 * 
 * This module provides helper functions for managing
 * user authentication with Supabase.
 * 
 * @module lib/supabase/auth
 */
import { createClient } from '@supabase/supabase-js'

/**
 * supabaseAdminClient
 * Creates a Supabase client with admin privileges
 * 
 * @returns A Supabase client instance with admin access
 */
export function supabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}