'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, FolderOpen, Search, MoreVertical, Edit, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'

import { Workspace, CreateWorkspaceData, UpdateWorkspaceData, WorkspaceFilters } from '@/types'

export default function WorkspacesPage() {
  const { user, loading } = useAuth()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<WorkspaceFilters>({
    search: '',
    sortBy: 'updated_at',
    sortOrder: 'desc'
  })

  // Form states
  const [createForm, setCreateForm] = useState<CreateWorkspaceData>({
    name: '',
    description: '',
    color: '#3b82f6',
    owner_id: user ? user.id : '',
  })
  const [editForm, setEditForm] = useState<UpdateWorkspaceData>({
    id: '',
    name: '',
    description: '',
    color: '#3b82f6',
    icon: 'folder',
  })

  const loadWorkspaces = useCallback(async () => {
    setIsLoading(true)
    try {
      // Use service to fetch workspaces with filters
      const data = await fetch('/api/workspaces');
      const workspaces: Workspace[] = await data.json();

      if(!data.ok) {
        throw new Error('Failed to load workspaces')
      }

      if(!workspaces) {
        setWorkspaces([])
        return
      }
      
      // Apply filters
      let filtered = workspaces
      if (filters.search) {
        filtered = filtered.filter(w => 
          w.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
          w.description?.toLowerCase().includes(filters.search!.toLowerCase())
        )
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        const aVal = a[filters.sortBy!]
        const bVal = b[filters.sortBy!]
        const order = filters.sortOrder === 'desc' ? -1 : 1
        return aVal < bVal ? order : aVal > bVal ? -order : 0
      })
      
      setWorkspaces(filtered)
    } catch (error) {
      console.error('Failed to load workspaces:', error)
    } finally {
      setIsLoading(false)
    }
  }, [filters])

    useEffect(() => {
    if (user) {
      loadWorkspaces()
    }
  }, [user, filters, loadWorkspaces])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You need to be logged in to view this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/login">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleCreateWorkspace = async () => {
    try {
      // TODO: Replace with actual API call
      const newWorkspace: Workspace = {
        ...createForm,
        owner_id: user!.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkspace)
      })

      if (!response.ok) {
        throw new Error('Failed to create workspace')
      }

      setWorkspaces(prev => [...prev, newWorkspace])
      setCreateForm({ name: '', description: '', color: '#3b82f6', owner_id: user!.id })
      setIsCreateModalOpen(false)
    } catch (error) {
      console.error('Failed to create workspace:', error)
    }
  }

  const handleEditWorkspace = async () => {
    if (!editingWorkspace) return
    try {
      // TODO: Replace with actual API call
      const updatedWorkspace = {
        ...editingWorkspace,
        ...editForm,
        updated_at: new Date().toISOString()
      }

      const response = await fetch('/api/workspaces', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          id: editingWorkspace.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update workspace')
      }

      setWorkspaces(prev => prev.map(w => w.id === editingWorkspace.id ? updatedWorkspace : w))
      setEditingWorkspace(null)
      setEditForm({ id: '', name: '', description: '', color: '#3b82f6', icon: 'folder' })
      setIsEditModalOpen(false)
    } catch (error) {
      console.error('Failed to update workspace:', error)
    }
  }

  const handleDeleteWorkspace = async (workspace: Workspace) => {
    if (!confirm(`Are you sure you want to delete "${workspace.name}"? This action cannot be undone.`)) return
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/workspaces/${workspace.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to delete workspace')
      }

      setWorkspaces(prev => prev.filter(w => w.id !== workspace.id))
    } catch (error) {
      console.error('Failed to delete workspace:', error)
    }
  }

  const openEditModal = (workspace: Workspace) => {
    setEditingWorkspace(workspace)
    setEditForm({
      id: workspace.id || '',
      name: workspace.name,
      description: workspace.description,
      color: workspace.color,
      icon: workspace.icon || '',
      owner_id: workspace.owner_id || ''
    })
    setIsEditModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Workspaces
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Organize your tasks into focused workspaces
            </p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Workspace
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Workspace</DialogTitle>
                <DialogDescription>
                  Set up a new workspace to organize your tasks
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Workspace Name</Label>
                  <Input
                    id="name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({...prev, name: e.target.value}))}
                    placeholder="Enter workspace name"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={createForm.description || ''}
                    onChange={(e) => setCreateForm(prev => ({...prev, description: e.target.value}))}
                    placeholder="Describe your workspace"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      id="color"
                      value={createForm.color}
                      onChange={(e) => setCreateForm(prev => ({...prev, color: e.target.value}))}
                      className="w-12 h-8 rounded border"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{createForm.color}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWorkspace} disabled={!createForm.name.trim()}>
                  Create Workspace
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-lg border">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search workspaces..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({...prev, search: e.target.value}))}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Select 
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('-')
                setFilters(prev => ({...prev, sortBy: sortBy as WorkspaceFilters['sortBy'], sortOrder: sortOrder as WorkspaceFilters['sortOrder']}))
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="updated_at-desc">Recently Updated</SelectItem>
                <SelectItem value="updated_at-asc">Oldest Updated</SelectItem>
                <SelectItem value="created_at-desc">Newest Created</SelectItem>
                <SelectItem value="created_at-asc">Oldest Created</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Workspaces Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
              <Card key={workspace.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: workspace.color }}
                      />
                      <CardTitle className="text-lg">{workspace.name}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/workspaces/${workspace.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditModal(workspace)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteWorkspace(workspace)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription className="mt-2">
                    {workspace.description || 'No description'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                    <div className="flex items-center space-x-1">
                      <FolderOpen className="h-4 w-4" />
                      <span>{workspace.tasks?.length || 0} tasks</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{workspace.member_count || 1} member{(workspace.member_count || 1) !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Created {new Date(workspace.created_at).toLocaleDateString()}</span>
                    <Badge variant="outline" className="text-xs">
                      {workspace.owner_id === user!.id ? 'Owner' : 'Member'}
                    </Badge>
                  </div>
                  <Link href={`/workspaces/${workspace.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Open Workspace
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}

            {workspaces.length === 0 && !isLoading && (
              <div className="col-span-full text-center py-12">
                <FolderOpen className="h-16 w-16 text-slate-400 dark:text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No workspaces found
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  {filters.search ? 'No workspaces match your search.' : 'Create your first workspace to get started.'}
                </p>
                {!filters.search && (
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Workspace
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Edit Workspace Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Workspace</DialogTitle>
              <DialogDescription>
                Update your workspace details
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Workspace Name</Label>
                <Input
                  id="edit-name"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm(prev => ({...prev, name: e.target.value}))}
                  placeholder="Enter workspace name"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm(prev => ({...prev, description: e.target.value}))}
                  placeholder="Describe your workspace"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-color">Color</Label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    id="edit-color"
                    value={editForm.color || '#3b82f6'}
                    onChange={(e) => setEditForm(prev => ({...prev, color: e.target.value}))}
                    className="w-12 h-8 rounded border"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">{editForm.color}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditWorkspace}>
                Update Workspace
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}