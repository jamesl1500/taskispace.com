import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SearchResult {
  id: string
  type: 'user' | 'workspace' | 'task'
  title: string
  subtitle?: string
  description?: string
  url: string
  metadata?: Record<string, unknown>
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all'
    const workspace_id = searchParams.get('workspace_id')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({
        results: [],
        total: 0,
        query: '',
        filters: {},
        execution_time: 0
      })
    }

    const startTime = Date.now()
    const results: SearchResult[] = []

    // Get current user for permission checks
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Search workspaces (user must be a member)
    if (type === 'all' || type === 'workspace') {
      const { data: workspaces } = await supabase
        .from('workspaces')
        .select(`
          id,
          name,
          description,
          color,
          created_at
        `)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(type === 'workspace' ? limit : 5)
        .range(offset, offset + limit - 1)

      if (workspaces) {
        for (const workspace of workspaces) {
          // Check if user is a member
          const { data: membership } = await supabase
            .from('workspace_members')
            .select('id')
            .eq('workspace_id', workspace.id)
            .eq('user_id', user.id)
            .single()

          if (membership) {
            results.push({
              id: workspace.id,
              type: 'workspace',
              title: workspace.name,
              description: workspace.description || '',
              url: `/workspaces/${workspace.id}`,
              metadata: {
                color: workspace.color,
                created_at: workspace.created_at
              }
            })
          }
        }
      }
    }

    // Search tasks (simplified approach)
    if (type === 'all' || type === 'task') {
      let taskQuery = supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          due_date,
          created_at,
          list_id
        `)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)

      // Apply filters
      if (status) {
        taskQuery = taskQuery.eq('status', status)
      }
      if (priority) {
        taskQuery = taskQuery.eq('priority', priority)
      }

      const { data: tasks } = await taskQuery
        .limit(type === 'task' ? limit : 5)
        .range(offset, offset + limit - 1)

      if (tasks) {
        for (const task of tasks) {
          // Get list info
          const { data: list } = await supabase
            .from('lists')
            .select('name, workspace_id')
            .eq('id', task.list_id)
            .single()

          if (list) {
            // Check if user has access to this workspace
            const { data: membership } = await supabase
              .from('workspace_members')
              .select('id')
              .eq('workspace_id', list.workspace_id)
              .eq('user_id', user.id)
              .single()

            if (membership && (!workspace_id || list.workspace_id === workspace_id)) {
              results.push({
                id: task.id,
                type: 'task',
                title: task.title,
                subtitle: list.name,
                description: task.description || '',
                url: `/tasks/${task.id}`,
                metadata: {
                  status: task.status,
                  priority: task.priority,
                  due_date: task.due_date,
                  created_at: task.created_at,
                  workspace_id: list.workspace_id
                }
              })
            }
          }
        }
      }
    }

    const executionTime = Date.now() - startTime

    // Sort results by relevance (exact matches first, then partial)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(query.toLowerCase())
      const bExact = b.title.toLowerCase().includes(query.toLowerCase())
      if (aExact && !bExact) return -1
      if (!aExact && bExact) return 1
      return 0
    })

    return NextResponse.json({
      results: results.slice(0, limit),
      total: results.length,
      query,
      filters: {
        type,
        workspace_id,
        status,
        priority,
        limit,
        offset
      },
      execution_time: executionTime
    })

  } catch (error) {
    console.error('Search API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}