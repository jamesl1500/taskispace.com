/**
 * Workspaces Services
 * Handles business logic related to workspaces
 * 
 * @module services/workspace-service
 */
import { createClient } from '@/lib/supabase/server'
import { Workspace, CreateWorkspaceData, UpdateWorkspaceData, WorkspaceFilters } from '@/types/workspaces'

export class WorkspaceService {
    /**
     * getSupabaseClient
     * Gets the Supabase client instance
     * 
     * @private
     */
    private async getSupabaseClient() {
        return await createClient();
    }

    /**
     * getWorkspaces
     * Fetches workspaces for a given user with optional filters
     * 
     * @param userId - ID of the user whose workspaces are to be fetched
     * @param filters - Optional filters for fetching workspaces
     * @returns A promise that resolves to an array of Workspace objects
     */
    async getWorkspaces(userId: string, filters?: WorkspaceFilters): Promise<Workspace[]> {
        const supabase = await this.getSupabaseClient()
        const { data, error } = await supabase
            .from('workspaces')
            .select('*')
            .eq('owner_id', userId)
            .order(filters?.sortBy || 'created_at', { ascending: filters?.sortOrder === 'asc' })

        if (error) {
            throw new Error(`Failed to fetch workspaces: ${error.message}`)
        }

        return data
    }

    /**
     * getWorkspace
     * Fetches a single workspace by ID with its lists and tasks for a given user
     * 
     * @param userId - ID of the user
     * @param workspaceId - ID of the workspace to fetch
     * @returns A promise that resolves to the Workspace object with lists and tasks
     */
    async getWorkspace(userId: string, workspaceId: string): Promise<Workspace> {
        const supabase = await this.getSupabaseClient()
        const { data, error } = await supabase
            .from('workspaces')
            .select('*')
            .eq('id', workspaceId)
            .eq('owner_id', userId)
            .single()

        if (error) {
            throw new Error(`Failed to fetch workspace: ${error.message}`)
        }

        return data
    }

    /**
     * createWorkspace
     * Creates a new workspace for a given user
     * 
     * @param userId - ID of the user
     * @param workspaceData - Data for the new workspace
     * @returns A promise that resolves to the created Workspace object
     */
    async createWorkspace(userId: string, workspaceData: CreateWorkspaceData): Promise<Workspace> {
        console.log('Creating workspace for user ID 2:', workspaceData)
        const supabase = await this.getSupabaseClient()
        const { data, error } = await supabase
            .from('workspaces')
            .insert({
                ...workspaceData,
                owner_id: userId
            })
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to create workspace: ${error.message}`)
        }

        return data
    }

    /**
     * updateWorkspace
     * Updates an existing workspace for a given user
     * 
     * @param userId - ID of the user
     * @param workspaceId - ID of the workspace to update
     * @param updateData - Data to update the workspace with
     * @returns A promise that resolves to the updated Workspace object
     */
    async updateWorkspace(userId: string, workspaceId: string, updateData: UpdateWorkspaceData): Promise<Workspace> {
        const supabase = await this.getSupabaseClient()
        const { data, error } = await supabase
            .from('workspaces')
            .update(updateData)
            .eq('id', workspaceId)
            .eq('owner_id', userId)
            .select()
            .single()

        if (error) {
            throw new Error(`Failed to update workspace: ${error.message}`)
        }

        return data
    }

    /**
     * deleteWorkspace
     * Deletes a workspace for a given user
     * 
     * @param userId - ID of the user
     * @param workspaceId - ID of the workspace to delete
     * @returns A promise that resolves when the workspace is deleted
     */
    async deleteWorkspace(userId: string, workspaceId: string): Promise<void> {
        const supabase = await this.getSupabaseClient()
        const { error } = await supabase
            .from('workspaces')
            .delete()
            .eq('id', workspaceId)
            .eq('owner_id', userId)

        if (error) {
            throw new Error(`Failed to delete workspace: ${error.message}`)
        }
    }
}