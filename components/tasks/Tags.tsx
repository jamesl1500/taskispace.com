'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, X, Tag } from 'lucide-react'
import { useTaskTags, useWorkspaceTags, useAddTaskTag, useRemoveTaskTag } from '@/hooks/queries/useTaskManagementQueries'

interface Tag {
  id: string
  name: string
  color: string
  workspace_id: string
  created_at: string
  task_tag_id?: string
  assigned_at?: string
}

interface TagsProps {
  taskId: string
  workspaceId: string
  canEdit: boolean
}

const TAG_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' }
]

export default function Tags({ taskId, workspaceId, canEdit }: TagsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isCreateNewTag, setIsCreateNewTag] = useState(false)
  
  const [addForm, setAddForm] = useState({
    selectedTagId: '',
    newTagName: '',
    newTagColor: TAG_COLORS[0].value
  })

  // React Query hooks
  const { data: taskTags = [], isLoading: tagsLoading } = useTaskTags(taskId)
  const { data: workspaceTags = [], isLoading: workspaceTagsLoading } = useWorkspaceTags(workspaceId)
  const addTagMutation = useAddTaskTag()
  const removeTagMutation = useRemoveTaskTag()

  const loading = tagsLoading || workspaceTagsLoading

  const handleAddTag = async () => {
    try {
      if (isCreateNewTag) {
        if (!addForm.newTagName.trim()) return
        
        await addTagMutation.mutateAsync({
          taskId,
          tagName: addForm.newTagName,
          tagColor: addForm.newTagColor
        })
      } else {
        if (!addForm.selectedTagId) return
        
        await addTagMutation.mutateAsync({
          taskId,
          tagId: addForm.selectedTagId
        })
      }
      
      // Reset form and close dialog
      setAddForm({
        selectedTagId: '',
        newTagName: '',
        newTagColor: TAG_COLORS[0].value
      })
      setIsCreateNewTag(false)
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Failed to add tag:', error)
      alert('Failed to add tag. Please try again.')
    }
  }

  const handleRemoveTag = async (tag: Tag) => {
    if (!tag.task_tag_id) {
      console.error('No task_tag_id found for tag:', tag)
      return
    }

    try {
      await removeTagMutation.mutateAsync(tag.task_tag_id)
    } catch (error) {
      console.error('Failed to remove tag:', error)
      alert('Failed to remove tag. Please try again.')
    }
  }

  const availableTags = workspaceTags.filter(
    (workspaceTag: Tag) => {
      const isAlreadyAssigned = taskTags.some((taskTag: Tag) => 
        taskTag.id === workspaceTag.id || taskTag.name === workspaceTag.name
      )
      return !isAlreadyAssigned
    }
  )

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">Tags</h4>
          <p className="text-sm text-gray-500">
            {taskTags.length} tag{taskTags.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canEdit && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setIsAddDialogOpen(true)}
            disabled={addTagMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Tag
          </Button>
        )}
      </div>

      {/* Tags Display */}
      <div className="flex flex-wrap gap-2">
        {taskTags.length === 0 ? (
          <div className="text-center py-8 text-gray-500 w-full">
            <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No tags yet</p>
            {canEdit && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2"
                onClick={() => setIsAddDialogOpen(true)}
                disabled={addTagMutation.isPending}
              >
                Add the first tag
              </Button>
            )}
          </div>
        ) : (
          taskTags.map((tag: Tag) => (
            <Badge
              key={tag.task_tag_id || tag.id}
              className="flex items-center gap-1 pr-1"
              style={{ 
                backgroundColor: `${tag.color}20`, 
                color: tag.color,
                border: `1px solid ${tag.color}40`
              }}
            >
              <span>{tag.name}</span>
              {canEdit && (
                <button
                  onClick={() => handleRemoveTag(tag)}
                  disabled={removeTagMutation.isPending}
                  className="ml-1 hover:bg-black/10 rounded-full p-0.5 disabled:opacity-50"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))
        )}
      </div>

      {/* Add Tag Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tag</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Toggle between existing and new tag */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={!isCreateNewTag ? "default" : "outline"}
                onClick={() => setIsCreateNewTag(false)}
              >
                Use Existing Tag
              </Button>
              <Button
                size="sm"
                variant={isCreateNewTag ? "default" : "outline"}
                onClick={() => setIsCreateNewTag(true)}
              >
                Create New Tag
              </Button>
            </div>

            {isCreateNewTag ? (
              <>
                {/* New Tag Form */}
                <div>
                  <label className="text-sm font-medium">Tag Name</label>
                  <Input
                    value={addForm.newTagName}
                    onChange={(e) => setAddForm(prev => ({ ...prev, newTagName: e.target.value }))}
                    placeholder="Enter tag name..."
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Tag Color</label>
                  <Select
                    value={addForm.newTagColor}
                    onValueChange={(value) => setAddForm(prev => ({ ...prev, newTagColor: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TAG_COLORS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: color.value }}
                            />
                            {color.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Preview */}
                {addForm.newTagName && (
                  <div>
                    <label className="text-sm font-medium">Preview</label>
                    <div className="mt-1">
                      <Badge
                        style={{ 
                          backgroundColor: `${addForm.newTagColor}20`, 
                          color: addForm.newTagColor,
                          border: `1px solid ${addForm.newTagColor}40`
                        }}
                      >
                        {addForm.newTagName}
                      </Badge>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Existing Tag Selection */}
                {availableTags.length > 0 ? (
                  <div>
                    <label className="text-sm font-medium">Select Tag</label>
                    <Select
                      value={addForm.selectedTagId}
                      onValueChange={(value) => setAddForm(prev => ({ ...prev, selectedTagId: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose a tag..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTags.map((tag: Tag) => (
                          <SelectItem key={tag.id} value={tag.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: tag.color }}
                              />
                              {tag.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>No available tags.</p>
                    <p className="text-sm">Create a new tag</p>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false)
              setIsCreateNewTag(false)
              setAddForm({
                selectedTagId: '',
                newTagName: '',
                newTagColor: TAG_COLORS[0].value
              })
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddTag} 
              disabled={
                addTagMutation.isPending ||
                (isCreateNewTag 
                  ? !addForm.newTagName.trim()
                  : !addForm.selectedTagId && availableTags.length > 0
                )
              }
            >
              {addTagMutation.isPending ? 'Adding...' : 'Add Tag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}