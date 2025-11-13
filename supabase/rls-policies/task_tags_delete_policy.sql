-- Row Level Security Policy for Deleting Task Tags
-- This policy ensures users can only delete task tags if they have proper permissions

-- First, let's check if we need to add a task_tag_id column to the task_tags table
-- The current schema uses composite primary key (task_id, tag_id)
-- If using task_tag_id, we would need to modify the table structure:

/*
-- Optional: Add task_tag_id column if not exists (run this migration first if needed)
ALTER TABLE public.task_tags 
ADD COLUMN IF NOT EXISTS task_tag_id uuid DEFAULT gen_random_uuid() UNIQUE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_task_tags_task_tag_id ON public.task_tags(task_tag_id);
*/

-- Enable RLS on task_tags table (if not already enabled)
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;

-- Policy for DELETE operations on task_tags table
-- Users can delete a task tag if they are:
-- 1. The workspace owner, OR
-- 2. A task collaborator with 'assignee' or 'reviewer' role

CREATE POLICY "Users can delete task tags they have access to" ON public.task_tags
FOR DELETE
TO authenticated
USING (
  -- Check if user is the workspace owner
  EXISTS (
    SELECT 1 
    FROM public.tasks t
    INNER JOIN public.lists l ON t.list_id = l.id
    INNER JOIN public.workspaces w ON l.workspace_id = w.id
    WHERE t.id = task_tags.task_id 
    AND w.owner_id = auth.uid()
  )
  OR
  -- Check if user is a task collaborator with appropriate role
  EXISTS (
    SELECT 1 
    FROM public.task_collaborators tc
    WHERE tc.task_id = task_tags.task_id 
    AND tc.user_id = auth.uid()
    AND tc.role IN ('assignee', 'reviewer')
  )
  OR
  -- Check if user is the task creator
  EXISTS (
    SELECT 1 
    FROM public.tasks t
    WHERE t.id = task_tags.task_id 
    AND t.created_by = auth.uid()
  )
);

-- Alternative policy if using task_tag_id for deletion
-- This would be used if the API deletes by task_tag_id specifically

CREATE POLICY "Users can delete task tags by task_tag_id" ON public.task_tags
FOR DELETE
TO authenticated
USING (
  -- For task_tag_id based deletion, same permission logic applies
  EXISTS (
    SELECT 1 
    FROM public.tasks t
    INNER JOIN public.lists l ON t.list_id = l.id
    INNER JOIN public.workspaces w ON l.workspace_id = w.id
    WHERE t.id = task_tags.task_id 
    AND w.owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 
    FROM public.task_collaborators tc
    WHERE tc.task_id = task_tags.task_id 
    AND tc.user_id = auth.uid()
    AND tc.role IN ('assignee', 'reviewer')
  )
  OR
  EXISTS (
    SELECT 1 
    FROM public.tasks t
    WHERE t.id = task_tags.task_id 
    AND t.created_by = auth.uid()
  )
);

-- Policy for SELECT operations (needed for the DELETE operation to work properly)
-- Users can view task tags if they have access to the task

CREATE POLICY "Users can view task tags they have access to" ON public.task_tags
FOR SELECT
TO authenticated
USING (
  -- Same permission logic as delete
  EXISTS (
    SELECT 1 
    FROM public.tasks t
    INNER JOIN public.lists l ON t.list_id = l.id
    INNER JOIN public.workspaces w ON l.workspace_id = w.id
    WHERE t.id = task_tags.task_id 
    AND w.owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 
    FROM public.task_collaborators tc
    WHERE tc.task_id = task_tags.task_id 
    AND tc.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 
    FROM public.tasks t
    WHERE t.id = task_tags.task_id 
    AND t.created_by = auth.uid()
  )
);

-- Policy for INSERT operations (adding tags to tasks)
CREATE POLICY "Users can add task tags they have access to" ON public.task_tags
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.tasks t
    INNER JOIN public.lists l ON t.list_id = l.id
    INNER JOIN public.workspaces w ON l.workspace_id = w.id
    WHERE t.id = task_tags.task_id 
    AND w.owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 
    FROM public.task_collaborators tc
    WHERE tc.task_id = task_tags.task_id 
    AND tc.user_id = auth.uid()
    AND tc.role IN ('assignee', 'reviewer')
  )
  OR
  EXISTS (
    SELECT 1 
    FROM public.tasks t
    WHERE t.id = task_tags.task_id 
    AND t.created_by = auth.uid()
  )
);

-- Index for better performance on frequent joins
CREATE INDEX IF NOT EXISTS idx_task_tags_task_id ON public.task_tags(task_id);
CREATE INDEX IF NOT EXISTS idx_task_tags_tag_id ON public.task_tags(tag_id);

-- Note: If the table structure needs to be updated to include task_tag_id:
/*
-- Migration script to add task_tag_id column
-- This should be run as a separate migration

BEGIN;

-- Add the task_tag_id column
ALTER TABLE public.task_tags 
ADD COLUMN task_tag_id uuid DEFAULT gen_random_uuid() UNIQUE;

-- Update existing rows to have unique task_tag_ids
UPDATE public.task_tags 
SET task_tag_id = gen_random_uuid() 
WHERE task_tag_id IS NULL;

-- Make the column NOT NULL
ALTER TABLE public.task_tags 
ALTER COLUMN task_tag_id SET NOT NULL;

-- Create unique index
CREATE UNIQUE INDEX idx_task_tags_task_tag_id_unique ON public.task_tags(task_tag_id);

COMMIT;
*/