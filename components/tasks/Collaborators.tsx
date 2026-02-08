'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, MoreVertical, Edit, Trash2, Users, UserCheck, Eye } from 'lucide-react'
import { collaboratorsApi } from '@/lib/api/taskManagement'
import { TaskCollaborator, TaskCollaboratorRole } from '@/types/tasks'
import UserAvatar from '../user/UserAvatar'
import UserName from '../user/UserName'

interface CollaboratorsProps {
  taskId: string
  canManage: boolean
}

export default function Collaborators({ taskId, canManage }: CollaboratorsProps) {
  const [collaborators, setCollaborators] = useState<TaskCollaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCollaborator, setEditingCollaborator] = useState<TaskCollaborator | null>(null)
  
  const [addForm, setAddForm] = useState({
    user_id: '',
    role: TaskCollaboratorRole.OWNER as TaskCollaboratorRole
  })

  const loadCollaborators = useCallback(async () => {
    try {
      setLoading(true)
      const data = await collaboratorsApi.getByTaskId(taskId)
      setCollaborators(data)
    } catch (error) {
      console.error('Failed to load collaborators:', error)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  useEffect(() => {
    loadCollaborators()
  }, [loadCollaborators])

  const handleAddCollaborator = async () => {
    if (!addForm.user_id.trim()) return

    try {
      const newCollaborator = await collaboratorsApi.add({
        task_id: taskId,
        user_id: addForm.user_id,
        role: addForm.role as 'assignee' | 'reviewer' | 'observer'
      })
      
      setCollaborators(prev => [...prev, newCollaborator])
      setAddForm({ user_id: '', role: TaskCollaboratorRole.OBSERVER })
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Failed to add collaborator:', error)
      alert('Failed to add collaborator. Please try again.')
    }
  }

  const handleUpdateRole = async (collaboratorId: string, newRole: TaskCollaboratorRole) => {
    try {
      const updatedCollaborator = await collaboratorsApi.updateRole(collaboratorId, newRole as 'assignee' | 'reviewer' | 'observer')
      
      setCollaborators(prev => prev.map(c => 
        c.id === collaboratorId ? updatedCollaborator : c
      ))
      setIsEditDialogOpen(false)
      setEditingCollaborator(null)
    } catch (error) {
      console.error('Failed to update collaborator role:', error)
      alert('Failed to update collaborator role. Please try again.')
    }
  }

  const handleRemoveCollaborator = async (collaborator: TaskCollaborator) => {
    if (!confirm('Are you sure you want to remove this collaborator?')) return

    try {
      await collaboratorsApi.remove(collaborator.id)
      setCollaborators(prev => prev.filter(c => c.id !== collaborator.id))
    } catch (error) {
      console.error('Failed to remove collaborator:', error)
      alert('Failed to remove collaborator. Please try again.')
    }
  }

  const openEditDialog = (collaborator: TaskCollaborator) => {
    setEditingCollaborator(collaborator)
    setIsEditDialogOpen(true)
  }

  const getRoleIcon = (role: TaskCollaboratorRole) => {
    switch (role) {
      case TaskCollaboratorRole.OWNER:
        return <Users className="h-4 w-4" />
      case TaskCollaboratorRole.ASSIGNEE:
        return <UserCheck className="h-4 w-4" />
      case TaskCollaboratorRole.REVIEWER:
        return <Edit className="h-4 w-4" />
      case TaskCollaboratorRole.OBSERVER:
        return <Eye className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: TaskCollaboratorRole) => {
    switch (role) {
      case TaskCollaboratorRole.OWNER:
        return 'bg-purple-100 text-purple-800'
      case TaskCollaboratorRole.ASSIGNEE:
        return 'bg-blue-100 text-blue-800'
      case TaskCollaboratorRole.REVIEWER:
        return 'bg-green-100 text-green-800'
      case TaskCollaboratorRole.OBSERVER:
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-16 bg-gray-200 rounded animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">Collaborators</h4>
          <p className="text-sm text-gray-500">
            {collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canManage && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Collaborator
          </Button>
        )}
      </div>

      {/* Collaborators List */}
      <div className="space-y-2">
        {collaborators.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No collaborators yet</p>
            {canManage && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2"
                onClick={() => setIsAddDialogOpen(true)}
              >
                Add the first collaborator
              </Button>
            )}
          </div>
        ) : (
          collaborators.map((collaborator) => (
            <Card key={collaborator.id} className="border border-gray-200">
              <CardContent className="">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <UserAvatar userId={collaborator.user_id} size={40} />
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900">
                      <UserName userId={collaborator.user_id} />
                    </h5>
                    <p className="text-sm text-gray-500">
                      Added {new Date(collaborator.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <Badge className={`${getRoleColor(collaborator.role)} flex items-center gap-1`}>
                    {getRoleIcon(collaborator.role)}
                    {collaborator.role.charAt(0).toUpperCase() + collaborator.role.slice(1)}
                  </Badge>

                  {canManage && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(collaborator)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleRemoveCollaborator(collaborator)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Collaborator Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Collaborator</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">User ID or Email</label>
              <Input
                value={addForm.user_id}
                onChange={(e) => setAddForm(prev => ({ ...prev, user_id: e.target.value }))}
                placeholder="Enter user ID or email..."
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Role</label>
              <Select
                value={addForm.role}
                onValueChange={(value: TaskCollaboratorRole) => 
                  setAddForm(prev => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskCollaboratorRole.OWNER}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Owner - Full access to task and collaborators
                    </div>
                  </SelectItem>
                  <SelectItem value={TaskCollaboratorRole.ASSIGNEE}>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Assignee - Can edit and complete tasks
                    </div>
                  </SelectItem>
                  <SelectItem value={TaskCollaboratorRole.REVIEWER}>
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Reviewer - Can review and provide feedback
                    </div>
                  </SelectItem>
                  <SelectItem value={TaskCollaboratorRole.OBSERVER}>
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Observer - Can view task details
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCollaborator} disabled={!addForm.user_id.trim()}>
              Add Collaborator
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Collaborator Role</DialogTitle>
          </DialogHeader>
          
          {editingCollaborator && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar className="h-8 w-8">
                  <UserAvatar userId={editingCollaborator.user_id} size={32} />
                </Avatar>
                <div>
                  <p className="font-medium"><UserName userId={editingCollaborator.user_id} /></p>
                  <p className="text-sm text-gray-500">
                    Current role: {editingCollaborator.role.charAt(0).toUpperCase() + editingCollaborator.role.slice(1)}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">New Role</label>
                <Select
                  defaultValue={editingCollaborator.role}
                  onValueChange={(value: TaskCollaboratorRole) => 
                    handleUpdateRole(editingCollaborator.id, value)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TaskCollaboratorRole.OWNER}>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Owner
                      </div>
                    </SelectItem>
                    <SelectItem value={TaskCollaboratorRole.ASSIGNEE}>
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        Assignee
                      </div>
                    </SelectItem>
                    <SelectItem value={TaskCollaboratorRole.REVIEWER}>
                      <div className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        Reviewer
                      </div>
                    </SelectItem>
                    <SelectItem value={TaskCollaboratorRole.OBSERVER}>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Observer
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}