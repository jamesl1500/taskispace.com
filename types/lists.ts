/**
 * List Interfaces and Types
 * 
 * @module types/lists
 */

/**
 * List Interface
 */
export interface List {
  id: string
  workspace_id: string
  color: string
  name: string
  created_by: string
  created_at: string
  updated_at: string
}

/**
 * List Member Interface
 */
export interface ListMember {
  id: string
  list_id: string
  user_id: string
  role: ListMemberRole
  added_at: string
  created_at: string
  updated_at: string
}

/**
 * List Member Role Enum
 */
export enum ListMemberRole {
  VIEWER = 'viewer',
  EDITOR = 'editor',
  ADMIN = 'admin'
}

/**
 * Create List Data Interface
 */
export interface CreateListData {
  name: string
  workspace_id: string
  color: string
  created_by: string
}

/**
 * Update List Data Interface
 */
export interface UpdateListData {
  name?: string
  workspace_id?: string
  Location?: string
  color?: string
  location?: string
}