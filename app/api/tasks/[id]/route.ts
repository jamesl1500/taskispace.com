import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TaskService } from '@/lib/services/task-service'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const resolvedParams = await params

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', resolvedParams.id)
      .single()

    if (taskError) {
      if (taskError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 })
      }
      return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
    }

    // Add task comments, activity, and todo data
    const taskService = new TaskService();

    const [comments, activities, todos] = await Promise.all([
      taskService.getTaskCommentsByTaskId(resolvedParams.id),
      taskService.getTaskActivitiesByTaskId(resolvedParams.id),
      taskService.getTodosByTask(resolvedParams.id)
    ]);

    task.comments = comments;
    task.activities = activities;
    task.todos = todos;

    let listData = null
    let workspaceData = null
    
    if (task.list_id) {
      const { data: list } = await supabase
        .from('lists')
        .select('id, name, workspace_id')
        .eq('id', task.list_id)
        .single()

      if (list) {
        listData = list
        
        const { data: workspace } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', list.workspace_id)
          .single()
        
        if (workspace) {
          workspaceData = workspace
        }
      }
    }

    const responseData = {
      ...task,
      workspace: workspaceData,
      list: listData
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error in GET /api/tasks/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const resolvedParams = await params

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete the task - RLS policies will handle access control
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', resolvedParams.id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete task: ' + deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/tasks/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const resolvedParams = await params

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Update the task - RLS policies will handle access control
    const { data: updatedTasks, error: updateError } = await supabase
      .from('tasks')
      .update(body)
      .eq('id', resolvedParams.id)
      .select('*')

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update task: ' + updateError.message }, { status: 500 })
    }

    if (!updatedTasks || updatedTasks.length === 0) {
      return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 })
    }

    return NextResponse.json(updatedTasks[0])
  } catch (error) {
    console.error('Error in PATCH /api/tasks/[id]:', error)
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 })
  }
}