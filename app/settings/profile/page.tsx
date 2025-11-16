'use client'

import { useState, useEffect } from 'react'
import { useUpdateProfile, useCheckUsername } from '@/hooks/queries/useProfileQueries'
import { useAuthWithProfile } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, User, Camera, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'

export default function ProfileSettingsPage() {
  const router = useRouter()
  const { user, profile, loading, error } = useAuthWithProfile()
  const updateProfile = useUpdateProfile()

  const [formData, setFormData] = useState({
    user_name: '',
    display_name: '',
    bio: '',
    avatar_url: ''
  })

  const [originalUsername, setOriginalUsername] = useState('')
  const debouncedUsername = useDebounce(formData.user_name, 500)
  
  const { data: usernameCheck } = useCheckUsername(
    debouncedUsername,
    debouncedUsername !== originalUsername && debouncedUsername.length >= 3
  )

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        user_name: profile.user_name,
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || ''
      })
      setOriginalUsername(profile.user_name)
    }
  }, [profile])

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profile) return

    // Validate username format
    if (!/^[a-zA-Z0-9_-]{3,30}$/.test(formData.user_name)) {
      return
    }

    // Check if username is available if changed
    if (formData.user_name !== originalUsername && !usernameCheck?.available) {
      return
    }

    try {
      const updates: any = {}
      
      // Only include changed fields
      if (formData.user_name !== profile.user_name) {
        updates.user_name = formData.user_name
      }
      if (formData.display_name !== (profile.display_name || '')) {
        updates.display_name = formData.display_name || null
      }
      if (formData.bio !== (profile.bio || '')) {
        updates.bio = formData.bio || null
      }
      if (formData.avatar_url !== (profile.avatar_url || '')) {
        updates.avatar_url = formData.avatar_url || null
      }

      if (Object.keys(updates).length === 0) {
        // No changes made
        return
      }

      await updateProfile.mutateAsync(updates)
      
      // If username changed, redirect to new profile URL
      if (updates.user_name) {
        router.push(`/profiles/${updates.user_name}`)
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const isUsernameValid = /^[a-zA-Z0-9_-]{3,30}$/.test(formData.user_name)
  const usernameChanged = formData.user_name !== originalUsername
  const isUsernameAvailable = !usernameChanged || (usernameCheck?.available ?? false)

  const getInitials = (name: string | null, username: string) => {
    if (!name) return username.charAt(0).toUpperCase()
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-64" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || (!loading && !profile)) {
    const handleCreateProfile = async () => {
      try {
        const response = await fetch('/api/profiles/create-profile', {
          method: 'POST'
        })
        
        if (response.ok) {
          // Refresh the page to load the new profile
          window.location.reload()
        } else {
          console.error('Failed to create profile')
        }
      } catch (err) {
        console.error('Error creating profile:', err)
      }
    }

    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error || 'Your profile hasn\'t been created yet. This might happen if you signed up before the profile system was implemented.'}
            </p>
            <Button onClick={handleCreateProfile}>
              Create Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Edit Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={formData.avatar_url || undefined} alt={formData.display_name || formData.user_name} />
                <AvatarFallback className="text-lg">
                  {getInitials(formData.display_name, formData.user_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="avatar_url">Profile Picture URL</Label>
                <div className="flex space-x-2 mt-1">
                  <Input
                    id="avatar_url"
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={formData.avatar_url}
                    onChange={(e) => handleInputChange('avatar_url', e.target.value)}
                  />
                  <Button type="button" variant="outline" size="icon">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Username */}
            <div>
              <Label htmlFor="user_name">Username</Label>
              <Input
                id="user_name"
                value={formData.user_name}
                onChange={(e) => handleInputChange('user_name', e.target.value)}
                placeholder="username"
                className={`mt-1 ${!isUsernameValid ? 'border-destructive' : usernameChanged && isUsernameAvailable ? 'border-green-500' : ''}`}
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm text-muted-foreground">
                  3-30 characters, letters, numbers, underscore, or hyphen only
                </p>
                {usernameChanged && (
                  <div className="flex items-center space-x-1">
                    {debouncedUsername !== formData.user_name ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : isUsernameValid && isUsernameAvailable ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-500">Available</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 text-destructive" />
                        <span className="text-xs text-destructive">
                          {!isUsernameValid ? 'Invalid format' : 'Not available'}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Display Name */}
            <div>
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="Your display name"
                maxLength={100}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Optional. This is how your name will be displayed to others.
              </p>
            </div>

            {/* Bio */}
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                maxLength={500}
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {formData.bio.length}/500 characters
              </p>
            </div>

            {/* Current Info Display */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Preview</h4>
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={formData.avatar_url || undefined} alt={formData.display_name || formData.user_name} />
                  <AvatarFallback>
                    {getInitials(formData.display_name, formData.user_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {formData.display_name || formData.user_name}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    @{formData.user_name}
                  </Badge>
                </div>
              </div>
              {formData.bio && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {formData.bio}
                </p>
              )}
            </div>

            {/* Error Display */}
            {updateProfile.error && (
              <Alert variant="destructive">
                <AlertDescription>
                  {updateProfile.error.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/profiles/${profile.user_name}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  updateProfile.isPending ||
                  !isUsernameValid ||
                  (usernameChanged && !isUsernameAvailable)
                }
              >
                {updateProfile.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}