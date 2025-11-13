-- Database triggers for automatic membership assignment
-- Alternative approach using PostgreSQL triggers instead of API logic

-- Trigger for automatically adding list creators as list members
CREATE OR REPLACE FUNCTION add_list_creator_as_member()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the list creator as an admin member
  INSERT INTO public.list_members (list_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for list creation
DROP TRIGGER IF EXISTS trigger_add_list_creator_as_member ON public.lists;
CREATE TRIGGER trigger_add_list_creator_as_member
  AFTER INSERT ON public.lists
  FOR EACH ROW
  EXECUTE FUNCTION add_list_creator_as_member();

-- Trigger for automatically adding task creators as task collaborators
CREATE OR REPLACE FUNCTION add_task_creator_as_collaborator()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the task creator as an assignee collaborator
  INSERT INTO public.task_collaborators (task_id, user_id, role, added_by)
  VALUES (NEW.id, NEW.created_by, 'assignee', NEW.created_by);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for task creation
DROP TRIGGER IF EXISTS trigger_add_task_creator_as_collaborator ON public.tasks;
CREATE TRIGGER trigger_add_task_creator_as_collaborator
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION add_task_creator_as_collaborator();

-- Optional: Trigger for logging list creation activity
CREATE OR REPLACE FUNCTION log_list_creation_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the list creation activity
  INSERT INTO public.activity (actor, list_id, type, payload)
  VALUES (
    NEW.created_by, 
    NEW.id, 
    'list_created',
    jsonb_build_object(
      'list_name', NEW.name,
      'workspace_id', NEW.workspace_id
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for list creation activity logging
DROP TRIGGER IF EXISTS trigger_log_list_creation_activity ON public.lists;
CREATE TRIGGER trigger_log_list_creation_activity
  AFTER INSERT ON public.lists
  FOR EACH ROW
  EXECUTE FUNCTION log_list_creation_activity();

-- Optional: Trigger for logging task creation activity
CREATE OR REPLACE FUNCTION log_task_creation_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the task creation activity
  INSERT INTO public.task_activity (task_id, actor, type, payload)
  VALUES (
    NEW.id,
    NEW.created_by,
    'task_created',
    jsonb_build_object(
      'title', NEW.title,
      'status', NEW.status,
      'priority', NEW.priority
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger for task creation activity logging
DROP TRIGGER IF EXISTS trigger_log_task_creation_activity ON public.tasks;
CREATE TRIGGER trigger_log_task_creation_activity
  AFTER INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION log_task_creation_activity();

-- Note: If you choose to use database triggers instead of API logic,
-- you can remove the corresponding code from the API routes.
-- 
-- Benefits of triggers:
-- - Guaranteed execution regardless of how data is inserted
-- - Cannot be bypassed by direct database access
-- - Consistent across all API endpoints
-- 
-- Benefits of API logic:
-- - More explicit and easier to debug
-- - Better error handling and logging
-- - Can be conditionally applied based on business logic