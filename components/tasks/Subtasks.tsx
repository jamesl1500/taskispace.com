'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, MoreVertical, Edit, Trash2, CheckCircle } from 'lucide-react'
import { subtasksApi } from '@/lib/api/taskManagement'
import { Subtask } from '@/types/tasks'

interface SubtasksProps {
  taskId: string
  canEdit: boolean
}

export default function Subtasks({ taskId, canEdit }: SubtasksProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null)
  
  const [createForm, setCreateForm] = useState({
    title: '',
    description: ''
  })
  
  const [editForm, setEditForm] = useState({
    title: '',
    description: ''
  })

  const loadSubtasks = useCallback(async () => {
    try {
      setLoading(true)
      const data = await subtasksApi.getByTaskId(taskId)
      setSubtasks(data)
    } catch (error) {
      console.error('Failed to load subtasks:', error)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  // Load subtasks
  useEffect(() => {
    loadSubtasks()
  }, [loadSubtasks])

  const handleCreateSubtask = async () => {
    if (!createForm.title.trim()) return

    try {
      const newSubtask = await subtasksApi.create({
        task_id: taskId,
        title: createForm.title,
        description: createForm.description || undefined
      })
      
      setSubtasks(prev => [...prev, newSubtask])
      setCreateForm({ title: '', description: '' })
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Failed to create subtask:', error)
      alert('Failed to create subtask. Please try again.')
    }
  }

  const handleEditSubtask = async () => {
    if (!editingSubtask || !editForm.title.trim()) return

    try {
      const updatedSubtask = await subtasksApi.update(editingSubtask.id, {
        title: editForm.title,
        description: editForm.description
      })
      
      setSubtasks(prev => prev.map(subtask => 
        subtask.id === editingSubtask.id ? updatedSubtask : subtask
      ))
      setIsEditDialogOpen(false)
      setEditingSubtask(null)
    } catch (error) {
      console.error('Failed to update subtask:', error)
      alert('Failed to update subtask. Please try again.')
    }
  }

  const handleToggleComplete = async (subtask: Subtask) => {
    try {
      const updatedSubtask = await subtasksApi.update(subtask.id, {
        completed: !subtask.completed
      })
      
      setSubtasks(prev => prev.map(s => 
        s.id === subtask.id ? updatedSubtask : s
      ))
    } catch (error) {
      console.error('Failed to toggle subtask completion:', error)
      alert('Failed to update subtask. Please try again.')
    }
  }

  const handleDeleteSubtask = async (subtask: Subtask) => {
    if (!confirm('Are you sure you want to delete this subtask?')) return

    try {
      await subtasksApi.delete(subtask.id)
      setSubtasks(prev => prev.filter(s => s.id !== subtask.id))
    } catch (error) {
      console.error('Failed to delete subtask:', error)
      alert('Failed to delete subtask. Please try again.')
    }
  }

  const openEditDialog = (subtask: Subtask) => {
    setEditingSubtask(subtask)
    setEditForm({
      title: subtask.title,
      description: subtask.description || ''
    })
    setIsEditDialogOpen(true)
  }

  const completedCount = subtasks.filter(s => s.completed).length
  const totalCount = subtasks.length

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">Subtasks</h4>
          {totalCount > 0 && (
            <p className="text-sm text-gray-500">
              {completedCount} of {totalCount} completed
            </p>
          )}
        </div>
        {canEdit && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Subtask
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      )}

      {/* Subtasks List */}
      <div className="space-y-2">
        {subtasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No subtasks yet</p>
            {canEdit && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                Create the first subtask
              </Button>
            )}
          </div>
        ) : (
          subtasks.map((subtask) => (
            <Card key={subtask.id} className="border border-gray-200">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={() => handleToggleComplete(subtask)}
                    disabled={!canEdit}
                    className="mt-0.5"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h5 className={`font-medium ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {subtask.title}
                    </h5>
                    {subtask.description && (
                      <p className={`text-sm mt-1 ${subtask.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                        {subtask.description}
                      </p>
                    )}
                    {subtask.completed_at && (
                      <p className="text-xs text-gray-400 mt-2">
                        Completed {new Date(subtask.completed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>

                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(subtask)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteSubtask(subtask)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
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

      {/* Create Subtask Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Subtask</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={createForm.title}
                onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter subtask title..."
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <Textarea
                value={createForm.description}
                onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add a description..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubtask} disabled={!createForm.title.trim()}>
              Create Subtask
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subtask Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subtask</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter subtask title..."
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Add a description..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubtask} disabled={!editForm.title.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}