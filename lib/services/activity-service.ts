/**
 * Activity Service
 * 
 * Handles user activity tracking and logging.
 * 
 * @module services/activity-service
 */
import { createClient } from '@/lib/supabase/client'
import { Activity, CreateActivityInput, ActivityFilter, ActivityLog } from '@/types/activity'

export default class ActivityService {

    /**
     * Activity Table Name
     * 
     * The name of the database table where activities are stored.
     * 
     * @private
     */
    private static tableName = 'activity';

    /**
     * User ID
     * 
     * The ID of the user whose activities are being managed.
     * 
     * @private
     */
    private userId: string;

    /**
     * Constructor
     * 
     * Initializes the ActivityService with a specific user ID.
     * 
     * @param userId - ID of the user
     */
    constructor(userId: string) {
        this.userId = userId;
    }

    /**
     * LogActivity
     * 
     * Logs a user activity to the database.
     * 
     * @param userId - ID of the user performing the activity
     * @param type - Type of activity
     * @param payload - Optional additional payload about the activity
     */
    async logActivity(type: string, payload?: Record<string, number>) {
        // Ensure we have a user ID set
        if(this.userId)
        {
            // Enter a try block
            try {
                // Init supabase
                const supabase = createClient();

                // Insert record
                const { data: Activity, error } = await supabase
                    .from(ActivityService.tableName)
                    .insert({
                        actor: this.userId,
                        type,
                        payload
                    })
                    .select();

                // Make sure there was no error
                if(error){
                    console.error('Error inserting activity:', error);
                    throw new Error('Failed to log activity: ' + error.message);
                }

                // Return the created activity
                return Activity;
            } catch (error){
                console.error('Error logging activity:', error);
                throw new Error('Failed to log activity', { cause: error as Error });
            }
        }else{
            throw new Error('User ID is not set for ActivityService');
        }
    }
}