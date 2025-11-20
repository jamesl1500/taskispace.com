import { describe, it, expect, vi, beforeEach } from 'vitest'
import { WorkspaceService } from '@/lib/services/workspace-service'
import type { CreateWorkspaceData, UpdateWorkspaceData, WorkspaceFilters } from '@/types/workspaces'

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: mockWorkspaces,
            error: null
          })),
          single: vi.fn(() => Promise.resolve({
            data: mockWorkspaces[0],
            error: null
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'new-ws', name: 'New Workspace' },
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { id: 'ws1', name: 'Updated Workspace' },
              error: null
            }))
          }))
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }))
}))

const mockWorkspaces = [
  {
    id: 'ws1',
    name: 'My Workspace',
    description: 'Test workspace',
    owner_id: 'user1',
    color: '#3b82f6',
    icon: '💼',
    created_at: new Date().toISOString()
  },
  {
    id: 'ws2',
    name: 'Team Workspace',
    description: 'Team collaboration',
    owner_id: 'user1',
    color: '#10b981',
    icon: '👥',
    created_at: new Date().toISOString()
  }
]

describe('lib/services/workspace-service', () => {
  let workspaceService: WorkspaceService

  beforeEach(() => {
    workspaceService = new WorkspaceService()
    vi.clearAllMocks()
  })

  describe('WorkspaceService', () => {
    it('should get workspaces for a user', async () => {
      const workspaces = await workspaceService.getWorkspaces('user1')
      
      expect(workspaces).toBeDefined()
      expect(Array.isArray(workspaces)).toBe(true)
      expect(workspaces.length).toBe(2)
    })

    it('should get workspaces with sort filters', async () => {
      const filters: WorkspaceFilters = {
        sortBy: 'name',
        sortOrder: 'asc'
      }
      
      const workspaces = await workspaceService.getWorkspaces('user1', filters)
      expect(workspaces).toBeDefined()
    })

    it('should get a single workspace by ID', async () => {
      const workspace = await workspaceService.getWorkspace('user1', 'ws1')
      
      expect(workspace).toBeDefined()
      expect(workspace.id).toBe('ws1')
      expect(workspace.name).toBe('My Workspace')
    })

    it('should create a new workspace', async () => {
      const workspaceData: CreateWorkspaceData = {
        name: 'New Workspace',
        description: 'A brand new workspace',
        color: '#f59e0b',
        icon: '🚀'
      }
      
      const workspace = await workspaceService.createWorkspace('user1', workspaceData)
      
      expect(workspace).toBeDefined()
      expect(workspace).toHaveProperty('id')
      expect(workspace).toHaveProperty('name')
    })

    it('should update an existing workspace', async () => {
      const updateData: UpdateWorkspaceData = {
        name: 'Updated Workspace',
        description: 'Updated description'
      }
      
      const workspace = await workspaceService.updateWorkspace('user1', 'ws1', updateData)
      
      expect(workspace).toBeDefined()
    })

    it('should delete a workspace', async () => {
      await expect(
        workspaceService.deleteWorkspace('user1', 'ws1')
      ).resolves.not.toThrow()
    })

    it('should handle errors when fetching workspaces', async () => {
      vi.mock('@/lib/supabase/server', () => ({
        createClient: vi.fn(() => ({
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({
                  data: null,
                  error: { message: 'Database error' }
                }))
              }))
            }))
          }))
        }))
      }))

      // Service should handle errors gracefully
      await expect(workspaceService.getWorkspaces('user1')).rejects.toThrow()
    })
  })
})
