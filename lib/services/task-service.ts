/**
 * Tasks Service
 * 
 * @module services/task-service
 */
import { Todo, TodoCreationData, TodoUpdateData } from '@/types';
import { Task, Subtask, TaskActivity, TaskComment } from '@/types';

import { createClient } from '@/lib/supabase/server';

export class TaskService {
    /**
     * Get a task by its ID
     * 
     * @param id - The ID of the task
     * @returns The task object
     */
    async getTaskById(id: string): Promise<Task> {
        if(!id) throw new Error("Task ID is required");

        // Try and find the task
        try {
            const supabase = await createClient();
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                throw error;
            }

            if (!data) {
                throw new Error("Task not found");
            }

            return data;
        } catch (error) {
            throw new Error("Failed to fetch task");
        }
    }

    /**
     * Get subtasks for a specific task
     * 
     * @param taskId - The ID of the task
     * @returns An array of subtasks
     */
    async getSubtasksByTaskId(taskId: string): Promise<Subtask[]> {
        if(!taskId) throw new Error("Task ID is required");

        // Try and find the subtasks
        try {
            const supabase = await createClient();
            const { data, error } = await supabase
                .from('subtasks')
                .select('*')
                .eq('task_id', taskId);

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error) {
            throw new Error("Failed to fetch subtasks");
        }
    }

    /**
     * Get task activities for a specific task
     * 
     * @param taskId - The ID of the task
     * @returns An array of task activities
     */
    async getTaskActivitiesByTaskId(taskId: string): Promise<TaskActivity[]> {
        if(!taskId) throw new Error("Task ID is required");

        // Try and find the task activities
        try {
            const supabase = await createClient();
            const { data, error } = await supabase
                .from('task_activity')
                .select('*')
                .eq('task_id', taskId);

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error) {
            throw new Error("Failed to fetch task activities");
        }
    }

    /**
     * Get comments for a specific task
     * 
     * @param taskId - The ID of the task
     * @returns An array of task comments
     */
    async getTaskCommentsByTaskId(taskId: string): Promise<TaskComment[]> {
        if(!taskId) throw new Error("Task ID is required");

        // Try and find the task comments
        try {
            const supabase = await createClient();
            const { data, error } = await supabase
                .from('task_comments')
                .select('*')
                .eq('task_id', taskId);

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error) {
            throw new Error("Failed to fetch task comments");
        }
    }

    /**
     * Create a new Todo item
     * 
     * @param data - Data for the new Todo item
     * @returns The created Todo item
     */
    async createTodo(data: TodoCreationData): Promise<Todo> {
        // Implementation goes here
        throw new Error("Method not implemented.");
    }

    /**
     * Update an existing Todo item
     * 
     * @param id - ID of the Todo item to update
     * @param data - Updated data for the Todo item
     * @returns The updated Todo item
     */
    async updateTodo(id: string, data: TodoUpdateData): Promise<Todo> {
        // Implementation goes here
        throw new Error("Method not implemented.");
    }

    /**
     * Delete a Todo item
     * 
     * @param id - ID of the Todo item to delete
     * @returns A boolean indicating success or failure
     */
    async deleteTodo(id: string): Promise<boolean> {
        // Implementation goes here
        throw new Error("Method not implemented.");
    }
    
    /**
     * Fetch all Todo items for a specific task
     * 
     * @param taskId - ID of the task
     * @returns An array of Todo items
     */
    async getTodosByTask(taskId: string): Promise<Todo[]> {
        if (!taskId) throw new Error("Task ID is required");

        try {
            const supabase = await createClient();
            const { data, error } = await supabase
                .from('task_todos')
                .select('*')
                .eq('task_id', taskId);

            if (error) {
                throw error;
            }

            return data || [];
        } catch (error) {
            throw new Error("Failed to fetch todos");
        }
    }
}