/**
 * Workspaces related types and interfaces
 */

/**
 * Workspace interface
 */
export interface Workspace {
  id?: string
  name: string
  color: string
  description?: string | null
  owner_id: string
  icon?: string
  tasks?: string[]
  member_count?: number
  created_at: string
  updated_at: string
}

/**
 * Filters for fetching workspaces
 */
export interface WorkspaceFilters {
  search?: string
  sortBy?: 'name' | 'color' | 'created_at' | 'updated_at'
  sortOrder?: 'asc' | 'desc'
}

/**
 * Data required to create a workspace
 */
export interface CreateWorkspaceData {
  owner_id: string
  name: string
  color: string
  description?: string | null
}

/**
 * Data required to update a workspace
 */
export interface UpdateWorkspaceData {
  id: string
  name?: string
  color?: string
  description?: string | null
  icon?: string
  owner_id?: string
}