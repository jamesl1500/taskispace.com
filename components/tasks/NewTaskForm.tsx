/**
 * NewTaskForm.tsx
 *
 * This component renders a form for creating a new task.
 * It includes fields for task title, description, due date, priority, workspace, and list selection.
 * The form uses Shadcn UI components for styling and layout.
 *
 * @module components/tasks/NewTaskForm
 */
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { TaskPriority, TaskStatus } from '@/types/tasks'

export const NewTaskForm: React.FC = () => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [workspaces, setWorkspaces] = useState<Array<{ id: string; name: string }>>([])
  const [lists, setLists] = useState<Array<{ id: string; name: string }>>([])
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true)
  const [isLoadingLists, setIsLoadingLists] = useState(false)

  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<string>(TaskPriority.MEDIUM)
  const [status, setStatus] = useState<string>(TaskStatus.TODO)
  const [workspaceId, setWorkspaceId] = useState('')
  const [listId, setListId] = useState('')

  // Load workspaces on mount
  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        const response = await fetch('/api/workspaces')
        if (!response.ok) throw new Error('Failed to fetch workspaces')
        const data = await response.json()
        setWorkspaces(data || [])
      } catch (err) {
        console.error('Error fetching workspaces:', err)
        toast.error('Failed to load workspaces')
      } finally {
        setIsLoadingWorkspaces(false)
      }
    }
    fetchWorkspaces()
  }, [])

  // Load lists when workspace changes
  useEffect(() => {
    if (!workspaceId) {
      setLists([])
      setListId('')
      return
    }

    const fetchLists = async () => {
      setIsLoadingLists(true)
      try {
        const response = await fetch(`/api/lists?workspace_id=${workspaceId}`)
        if (!response.ok) throw new Error('Failed to fetch lists')
        const data = await response.json()
        setLists(data || [])
      } catch (err) {
        console.error('Error fetching lists:', err)
        toast.error('Failed to load lists')
      } finally {
        setIsLoadingLists(false)
      }
    }
    fetchLists()
  }, [workspaceId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (!title.trim()) {
      setError('Task title is required')
      return
    }
    if (!workspaceId) {
      setError('Please select a workspace')
      return
    }
    if (!listId) {
      setError('Please select a list')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          status,
          priority,
          workspace_id: workspaceId,
          list_id: listId,
          due_date: dueDate || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.upgrade) {
          // Subscription limit reached
          setError(`${data.error} (${data.current}/${data.limit})`)
          toast.error(data.error, {
            action: {
              label: 'Upgrade',
              onClick: () => router.push('/pricing'),
            },
          })
          return
        }
        throw new Error(data.error || 'Failed to create task')
      }

      toast.success('Task created successfully!', {
        icon: <CheckCircle2 className="w-4 h-4" />,
      })

      // Redirect to the task detail page or list
      router.push(`/tasks/${data.id}`)
    } catch (err) {
      console.error('Error creating task:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Task Details</CardTitle>
        <CardDescription>
          Fill in the details below to create a new task
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Workspace Selection */}
          <div className="space-y-2">
            <Label htmlFor="workspace">Workspace *</Label>
            <Select
              value={workspaceId}
              onValueChange={setWorkspaceId}
              disabled={isLoadingWorkspaces || isSubmitting}
            >
              <SelectTrigger id="workspace">
                <SelectValue placeholder="Select a workspace" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingWorkspaces ? (
                  <SelectItem value="loading" disabled>
                    Loading workspaces...
                  </SelectItem>
                ) : workspaces.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No workspaces available
                  </SelectItem>
                ) : (
                  workspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* List Selection */}
          <div className="space-y-2">
            <Label htmlFor="list">List *</Label>
            <Select
              value={listId}
              onValueChange={setListId}
              disabled={!workspaceId || isLoadingLists || isSubmitting}
            >
              <SelectTrigger id="list">
                <SelectValue placeholder="Select a list" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingLists ? (
                  <SelectItem value="loading" disabled>
                    Loading lists...
                  </SelectItem>
                ) : lists.length === 0 ? (
                  <SelectItem value="none" disabled>
                    {workspaceId ? 'No lists in this workspace' : 'Select a workspace first'}
                  </SelectItem>
                ) : (
                  lists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {workspaceId && lists.length === 0 && !isLoadingLists && (
              <p className="text-sm text-muted-foreground">
                No lists found. Create a list in this workspace first.
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              maxLength={255}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter task description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus} disabled={isSubmitting}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                  <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={TaskStatus.IN_REVIEW}>In Review</SelectItem>
                  <SelectItem value={TaskStatus.COMPLETED}>Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority} disabled={isSubmitting}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskPriority.LOW}>Low</SelectItem>
                  <SelectItem value={TaskPriority.MEDIUM}>Medium</SelectItem>
                  <SelectItem value={TaskPriority.HIGH}>High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isSubmitting}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}