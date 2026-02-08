'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Loader2, AlertCircle, CheckCircle2, Briefcase } from 'lucide-react'
import Link from 'next/link'
import { CreateWorkspaceData } from '@/types/workspaces'

const PRESET_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Slate', value: '#64748b' },
  { name: 'Gray', value: '#6b7280' },
]

export default function CreateWorkspacePage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [formData, setFormData] = useState<CreateWorkspaceData>({
    name: '',
    description: '',
    color: '#3b82f6',
    owner_id: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!user) {
      setError('You must be logged in to create a workspace')
      return
    }

    if (!formData.name.trim()) {
      setError('Workspace name is required')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          owner_id: user.id
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create workspace')
      }

      const newWorkspace = await response.json()
      setSuccess(true)
      
      // Redirect to the new workspace after a short delay
      setTimeout(() => {
        router.push(`/workspaces/${newWorkspace.id}`)
      }, 1500)
    } catch (err) {
      console.error('Error creating workspace:', err)
      setError(err instanceof Error ? err.message : 'Failed to create workspace')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleColorSelect = (color: string) => {
    setFormData(prev => ({ ...prev, color }))
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/auth/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/workspaces">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workspaces
            </Button>
          </Link>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div 
                className="h-12 w-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: formData.color }}
              >
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Create New Workspace</CardTitle>
                <CardDescription>
                  Set up a workspace to organize your projects and tasks
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Workspace Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Workspace Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Marketing Team, Personal Projects, Q1 2025"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={isSubmitting}
                  maxLength={100}
                />
                <p className="text-xs text-gray-500">
                  {formData.name.length}/100 characters
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the purpose of this workspace..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  disabled={isSubmitting}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500">
                  {(formData.description || '').length}/500 characters
                </p>
              </div>

              {/* Color Selection */}
              <div className="space-y-3">
                <Label>Workspace Color</Label>
                <div className="grid grid-cols-6 gap-3">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`h-12 rounded-lg transition-all relative ${
                        formData.color === color.value
                          ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => handleColorSelect(color.value)}
                      disabled={isSubmitting}
                      title={color.name}
                    >
                      {formData.color === color.value && (
                        <CheckCircle2 className="h-5 w-5 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Selected color: {PRESET_COLORS.find(c => c.value === formData.color)?.name || 'Custom'}
                </p>
              </div>

              {/* Custom Color */}
              <div className="space-y-2">
                <Label htmlFor="custom-color">Custom Color (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="custom-color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    disabled={isSubmitting}
                    className="h-12 w-24 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    disabled={isSubmitting}
                    placeholder="#3b82f6"
                    maxLength={7}
                    className="font-mono"
                  />
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Alert */}
              {success && (
                <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-600 dark:text-green-400">
                    Workspace created successfully! Redirecting...
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.name.trim()}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Briefcase className="h-4 w-4 mr-2" />
                      Create Workspace
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/workspaces')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-0">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Workspace Tips
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Use descriptive names to easily identify your workspaces</li>
              <li>• Choose colors to visually organize different projects</li>
              <li>• You can create lists within workspaces to organize tasks</li>
              <li>• Invite team members to collaborate on workspace tasks</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
