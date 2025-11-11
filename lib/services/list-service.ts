/**
 * List Service
 * Handles operations related to task lists.
 * 
 * Functions include:
 * - createList
 * - getLists
 * - updateList
 * - deleteList
 * - addTaskToList
 * - removeTaskFromList
 * 
 * @module services/list-service
 */
import { createClient } from '@/lib/supabase/server'
import { List, CreateListData, UpdateListData } from '@/types/lists'

export class ListService {
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
     * createList
     * Creates a new task list
     * 
     * @param userId - ID of the user creating the list
     * @param listData - Data for the new list
     * @returns A promise that resolves to the created List object
     */
    async createList(userId: string, listData: CreateListData): Promise<List> {
        const supabase = await this.getSupabaseClient()
        const { data, error } = await supabase
            .from('lists')
            .insert({
                ...listData,
                owner_id: userId
            })
            .single()

        if (error) {
            throw new Error(`Failed to create list: ${error.message}`)
        }

        return data
    }

    /**
     * getLists
     * Fetches all task lists for a given workspace
     * 
     * @param workspaceId - ID of the workspace whose lists are to be fetched
     * @returns A promise that resolves to an array of List objects
     */
    async getLists(workspaceId: string): Promise<List[]> {
        const supabase = await this.getSupabaseClient()
        const { data, error } = await supabase
            .from('lists')
            .select('*')
            .eq('workspace_id', workspaceId)

        if (error) {
            throw new Error(`Failed to fetch lists: ${error.message}`)
        }

        return data
    }

    /**
     * getList
     * Fetches a single task list by ID
     * 
     * @param listId - ID of the list to fetch
     * @returns A promise that resolves to the List object
     */
    async getList(listId: string): Promise<List> {
        const supabase = await this.getSupabaseClient()
        const { data, error } = await supabase
            .from('lists')
            .select('*')
            .eq('id', listId)
            .single()

        if (error) {
            throw new Error(`Failed to fetch list: ${error.message}`)
        }

        return data
    }

    /**
     * updateList
     * Updates an existing task list
     * 
     * @param listId - ID of the list to update
     * @param listData - Data to update the list with
     * @returns A promise that resolves to the updated List object
     */
    async updateList(listId: string, listData: UpdateListData): Promise<List> {
        const supabase = await this.getSupabaseClient()
        const { data, error } = await supabase
            .from('lists')
            .update(listData)
            .eq('id', listId)
            .single()

        if (error) {
            throw new Error(`Failed to update list: ${error.message}`)
        }

        return data
    }

    /**
     * deleteList
     * Deletes a task list by ID
     * 
     * @param listId - ID of the list to delete
     * @returns A promise that resolves to a boolean indicating success
     */
    async deleteList(listId: string): Promise<boolean> {
        const supabase = await this.getSupabaseClient()
        const { error } = await supabase
            .from('lists')
            .delete()
            .eq('id', listId)

        if (error) {
            throw new Error(`Failed to delete list: ${error.message}`)
        }

        return true
    }
}