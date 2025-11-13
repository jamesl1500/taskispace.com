/**
 * User Service
 * Handles user-related operations
 * 
 * @module services/user-service
 */
import { supabaseAdminClient } from '@/lib/supabase/auth'

export class UserService {
     /**
      * getSupabaseClient
      * Gets the Supabase client instance
      * 
      * @private
      */
     private async getSupabaseClient() {
         return await supabaseAdminClient();
     }

    /**
     * getUserById
     * Fetch a user by their ID
     * 
     * @param userId - The ID of the user to fetch 
     * @returns The user data or null if not found
     */
    async getUserById(userId: string) {
        const supabase = await this.getSupabaseClient()
        const { data: user, error } = await supabase.auth.admin.getUserById(userId)

        if (error) {
            console.error('Error fetching user by ID:', error)
            throw error
        }

        console.log('UserService - fetched user data:', user, 'error:', error)
        return user
    }

    /**
     * updateUserProfile
     * Update a user's profile information
     * 
     * @param userId - The ID of the user to update
     * @param profileData - An object containing the profile fields to update
     * @returns The updated user data
     */
    async updateUserProfile(userId: string, profileData: Partial<{ name: string; avatar_url: string }>) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('users')
            .update(profileData)
            .eq('id', userId)

        if (error) {
            console.error('Error updating user profile:', error)
            throw error
        }

        return data
    }

    /**
     * deleteUser
     * Delete a user by their ID
     * 
     * @param userId - The ID of the user to delete
     * @returns The deleted user data
     */
    async deleteUser(userId: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('users')
            .delete()
            .eq('id', userId)

        if (error) {
            console.error('Error deleting user:', error)
            throw error
        }

        return data
    }
}