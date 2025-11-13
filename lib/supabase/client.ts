/**
 * client.ts
 * 
 * Supabase client creation for browser environments.
 * 
 * This module exports functions to create Supabase clients
 * for use in client-side code, including support for authenticated requests.
 * 
 * @module lib/supabase/client
 */
import { createBrowserClient } from '@supabase/ssr'

/**
 * createClient
 * Creates a Supabase client for browser environments
 * 
 * @returns A Supabase client instance
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * createClientWithAuth
 * Creates a Supabase client with an authorization token
 * 
 * @param token - The authorization token
 * @returns A Supabase client instance with the provided token
 */
export function createClientWithAuth(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  )
}