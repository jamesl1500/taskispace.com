'use client'

import { useState } from 'react'
import { useCreateConversation } from '@/hooks/useConversations'
import { CreateConversationData } from '@/types/conversations'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface CreateConversationDialogProps {
  children?: React.ReactNode
}

export default function CreateConversationDialog({ children }: CreateConversationDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<CreateConversationData>({
    title: '',
    description: ''
  })
  
  const createConversation = useCreateConversation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title && !formData.description) {
      toast.error('Please provide at least a title or description')
      return
    }

    try {
      await createConversation.mutateAsync(formData)
      toast.success('Conversation created successfully!')
      setOpen(false)
      setFormData({ title: '', description: '' })
    } catch (error) {
      toast.error('Failed to create conversation')
      console.error('Error creating conversation:', error)
    }
  }

  const handleInputChange = (field: keyof CreateConversationData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Conversation
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Conversation</DialogTitle>
          <DialogDescription>
            Start a new conversation with your team members.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter conversation title"
              value={formData.title || ''}
              onChange={(e) => handleInputChange('title', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Describe what this conversation is about..."
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createConversation.isPending}>
              {createConversation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create Conversation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}