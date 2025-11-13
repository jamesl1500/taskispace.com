'use client'

import { useState } from 'react'
import { useSubtasks, useCreateSubtask, useUpdateSubtask, useDeleteSubtask } from '@/hooks/queries/useTaskManagementQueries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { CheckSquare, Plus, Edit, Trash2, Check, X } from 'lucide-react'
import { Subtask } from '@/types/tasks'

interface SubtasksProps {
  taskId: string
  canEdit: boolean
}

export default function Subtasks({ taskId, canEdit }: SubtasksProps) {
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

  // React Query hooks
  const { 
    data: subtasks = [], 
    isLoading: loading, 
    error 
  } = useSubtasks(taskId)

  const createSubtaskMutation = useCreateSubtask()
  const updateSubtaskMutation = useUpdateSubtask()
  const deleteSubtaskMutation = useDeleteSubtask()

  const handleCreateSubtask = () => {
    if (!createForm.title.trim()) return

    createSubtaskMutation.mutate({
      task_id: taskId,
      title: createForm.title,
      description: createForm.description || undefined
    }, {
      onSuccess: () => {
        setCreateForm({ title: '', description: '' })
        setIsCreateDialogOpen(false)
      }
    })
  }

  const handleEditSubtask = () => {
    if (!editingSubtask || !editForm.title.trim()) return

    updateSubtaskMutation.mutate({
      id: editingSubtask.id,
      data: {
        title: editForm.title,
        description: editForm.description
      }
    }, {
      onSuccess: () => {
        setEditForm({ title: '', description: '' })
        setEditingSubtask(null)
        setIsEditDialogOpen(false)
      }
    })
  }

  const handleToggleSubtask = (subtask: Subtask) => {
    updateSubtaskMutation.mutate({
      id: subtask.id,
      data: {
        done: !subtask.completed
      }
    })
  }

  const handleDeleteSubtask = (subtaskId: string) => {
    if (confirm('Are you sure you want to delete this subtask?')) {
      deleteSubtaskMutation.mutate(subtaskId)
    }
  }

  const startEdit = (subtask: Subtask) => {
    setEditingSubtask(subtask)
    setEditForm({
      title: subtask.title,
      description: subtask.description || ''
    })
    setIsEditDialogOpen(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const completedCount = subtasks.filter((subtask: Subtask) => subtask.completed).length

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-red-600 dark:text-red-400">
            Failed to load subtasks. Please try again.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <CheckSquare className="h-5 w-5" />
            <span>Subtasks</span>
            {subtasks.length > 0 && (
              <Badge variant="secondary">
                {completedCount}/{subtasks.length}
              </Badge>
            )}
          </CardTitle>
          
          {canEdit && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center space-x-1">
                  <Plus className="h-4 w-4" />
                  <span>Add Subtask</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Subtask</DialogTitle>
                  <DialogDescription>
                    Add a new subtask to break down this task into smaller parts.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      value={createForm.title}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Subtask title..."
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Description (Optional)</label>
                    <Textarea
                      value={createForm.description}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Additional details..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex space-x-2 pt-4">
                    <Button 
                      onClick={handleCreateSubtask}
                      disabled={!createForm.title.trim() || createSubtaskMutation.isPending}
                      className="flex items-center space-x-1"
                    >
                      <Check className="h-4 w-4" />
                      <span>{createSubtaskMutation.isPending ? 'Creating...' : 'Create'}</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center space-x-3">
                <div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : subtasks.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No subtasks yet.</p>
            {canEdit && (
              <p className="text-sm">Break this task down into smaller parts.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {subtasks.map((subtask: Subtask) => (
              <div 
                key={subtask.id} 
                className={`flex items-start space-x-3 p-3 rounded-lg border ${
                  subtask.completed 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Checkbox
                  checked={subtask.completed}
                  onCheckedChange={() => handleToggleSubtask(subtask)}
                  className="mt-0.5"
                />
                
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium ${
                    subtask.completed 
                      ? 'line-through text-slate-500 dark:text-slate-400' 
                      : 'text-slate-900 dark:text-white'
                  }`}>
                    {subtask.title}
                  </h4>
                  
                  {subtask.description && (
                    <p className={`text-sm mt-1 ${
                      subtask.completed 
                        ? 'line-through text-slate-400 dark:text-slate-500' 
                        : 'text-slate-600 dark:text-slate-400'
                    }`}>
                      {subtask.description}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>Created {formatDate(subtask.created_at)}</span>
                    {subtask.completed && subtask.completed_at && (
                      <span>Completed {formatDate(subtask.completed_at)}</span>
                    )}
                  </div>
                </div>
                
                {canEdit && (
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(subtask)}
                      className="h-6 w-6 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      disabled={deleteSubtaskMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Subtask</DialogTitle>
              <DialogDescription>
                Update the subtask details.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Subtask title..."
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description (Optional)</label>
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button 
                  onClick={handleEditSubtask}
                  disabled={!editForm.title.trim() || updateSubtaskMutation.isPending}
                  className="flex items-center space-x-1"
                >
                  <Check className="h-4 w-4" />
                  <span>{updateSubtaskMutation.isPending ? 'Saving...' : 'Save'}</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}