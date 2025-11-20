'use client'

import { useState, useEffect } from 'react'
import { useAuthWithProfile } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Mail, 
  Lock, 
  Bell, 
  Trash2, 
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Upload,
  X,
  Crown,
  Sparkles,
  ExternalLink
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import type { SubscriptionWithUsage } from '@/types/subscriptions'
import { isUnlimited } from '@/types/subscriptions'

export default function SettingsPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuthWithProfile()
  const supabase = createClient()

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    display_name: '',
    user_name: '',
    bio: ''
  })

  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Email state
  const [email, setEmail] = useState('')
  const [newEmail, setNewEmail] = useState('')

  // Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    taskReminders: true,
    collaborationUpdates: true,
    weeklyDigest: false
  })

  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionWithUsage | null>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  // UI state
  const [activeTab, setActiveTab] = useState('profile')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Initialize form data
  useEffect(() => {
    if (profile) {
      setProfileForm({
        display_name: profile.display_name || '',
        user_name: profile.user_name || '',
        bio: profile.bio || ''
      })
      setAvatarPreview(profile.avatar_url || '')
    }
    if (user) {
      setEmail(user.email || '')
    }
  }, [profile, user])

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch('/api/subscription')
        if (response.ok) {
          const data = await response.json()
          setSubscription(data)
        }
      } catch (error) {
        console.error('Error fetching subscription:', error)
      } finally {
        setSubscriptionLoading(false)
      }
    }
    if (user) {
      fetchSubscription()
    }
  }, [user])

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        setErrorMessage('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.')
        setSaveStatus('error')
        return
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        setErrorMessage('File size too large. Maximum size is 5MB.')
        setSaveStatus('error')
        return
      }

      setAvatarFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAvatarUpload = async () => {
    if (!avatarFile) return

    setUploadingAvatar(true)
    setErrorMessage('')

    try {
      const formData = new FormData()
      formData.append('avatar', avatarFile)

      const response = await fetch('/api/settings/profile/avatar', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload avatar')
      }

      setAvatarPreview(data.url)
      setAvatarFile(null)
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      setSaveStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleAvatarDelete = async () => {
    setUploadingAvatar(true)
    setErrorMessage('')

    try {
      const response = await fetch('/api/settings/profile/avatar', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete avatar')
      }

      setAvatarPreview('')
      setAvatarFile(null)
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      setSaveStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveStatus('saving')
    setErrorMessage('')

    try {
      const response = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: profileForm.display_name || undefined,
          user_name: profileForm.user_name,
          bio: profileForm.bio || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      setSaveStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update profile')
    }
  }

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveStatus('saving')
    setErrorMessage('')

    if (!newEmail || newEmail === email) {
      setErrorMessage('Please enter a new email address')
      setSaveStatus('error')
      return
    }

    try {
      const response = await fetch('/api/settings/account/email', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update email')
      }

      setSaveStatus('success')
      setErrorMessage(data.message || 'Verification email sent to your new address')
      setNewEmail('')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      setSaveStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update email')
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveStatus('saving')
    setErrorMessage('')

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMessage('Passwords do not match')
      setSaveStatus('error')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters')
      setSaveStatus('error')
      return
    }

    try {
      const response = await fetch('/api/settings/security/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPassword: passwordForm.newPassword,
          confirmPassword: passwordForm.confirmPassword
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      setSaveStatus('success')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      setSaveStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to change password')
    }
  }

  const handleNotificationUpdate = async () => {
    setSaveStatus('saving')
    setErrorMessage('')

    try {
      const response = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifications)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update notifications')
      }

      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      setSaveStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update notifications')
    }
  }

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    setSaveStatus('saving')
    setErrorMessage('')

    try {
      const response = await fetch('/api/settings/danger/delete-account', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account')
      }

      // Sign out and redirect
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      setSaveStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to delete account')
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )
}

// Subscription Tab Component
function SubscriptionTab({ 
  subscription, 
  subscriptionLoading,
  isProcessing,
  setIsProcessing
}: {
  subscription: SubscriptionWithUsage | null
  subscriptionLoading: boolean
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void
}) {
  const router = useRouter()

  const handleManageBilling = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/stripe/portal')
      if (!response.ok) {
        throw new Error('Failed to create portal session')
      }
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error opening billing portal:', error)
      toast.error('Failed to open billing portal')
      setIsProcessing(false)
    }
  }

  const getUsagePercentage = (current: number, limit: number): number => {
    if (isUnlimited(limit)) return 0
    return Math.min((current / limit) * 100, 100)
  }

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-red-600 dark:text-red-400'
    if (percentage >= 70) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return '[&>div]:bg-red-500'
    if (percentage >= 70) return '[&>div]:bg-yellow-500'
    return '[&>div]:bg-green-500'
  }

  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!subscription) {
    return (
      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <CardTitle>Subscription Not Found</CardTitle>
          </div>
          <CardDescription>
            We couldn&apos;t load your subscription details. Please try again later.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const isPro = subscription.plan?.name === 'Pro'
  const limits = (subscription.plan?.limits || {}) as Record<string, number>

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2 text-xl">
                {isPro ? (
                  <Crown className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Sparkles className="w-5 h-5 text-gray-400" />
                )}
                {subscription.plan?.name === 'free' ? 'Free Plan' : 'Pro Plan'}
              </CardTitle>
              <CardDescription>
                {isPro
                  ? `$${subscription.plan?.price_monthly || 5}/month · Unlimited productivity power`
                  : 'Essential features to get you started'}
              </CardDescription>
            </div>
            {subscription.status === 'active' && (
              <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 h-fit px-3 py-1">
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                Active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isPro ? (
            <div className="space-y-4">
              {subscription.current_period_end && (
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Next billing date
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Your subscription will automatically renew
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                    {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}
              <Button 
                onClick={handleManageBilling} 
                disabled={isProcessing}
                variant="outline"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Manage Billing
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  🚀 Unlock unlimited tasks, workspaces, and premium AI features with Pro
                </p>
              </div>
              <Button
                onClick={() => router.push('/pricing')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Usage This Month</CardTitle>
          <CardDescription>Track your resource usage against plan limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <UsageItem
            label="Tasks Created"
            current={subscription.usage.tasks}
            limit={limits.maxTasks || 50}
            getUsagePercentage={getUsagePercentage}
            getUsageColor={getUsageColor}
            getProgressColor={getProgressColor}
          />

          <UsageItem
            label="Workspaces"
            current={subscription.usage.workspaces}
            limit={limits.maxWorkspaces || 1}
            getUsagePercentage={getUsagePercentage}
            getUsageColor={getUsageColor}
            getProgressColor={getProgressColor}
          />

          <UsageItem
            label="Friends"
            current={subscription.usage.friends}
            limit={limits.maxFriends || 10}
            getUsagePercentage={getUsagePercentage}
            getUsageColor={getUsageColor}
            getProgressColor={getProgressColor}
          />

          <UsageItem
            label="Nudges Sent Today"
            current={subscription.usage.nudgesToday}
            limit={limits.maxNudgesPerDay || 3}
            getUsagePercentage={getUsagePercentage}
            getUsageColor={getUsageColor}
            getProgressColor={getProgressColor}
          />

          <UsageItem
            label="Jarvis Conversations"
            current={subscription.usage.jarvisConversationsThisMonth}
            limit={limits.jarvisConversationsPerMonth || 5}
            getUsagePercentage={getUsagePercentage}
            getUsageColor={getUsageColor}
            getProgressColor={getProgressColor}
          />

          <UsageItem
            label="Jarvis AI Tokens"
            current={subscription.usage.jarvisTokensThisMonth}
            limit={limits.jarvisTokensPerMonth || 10000}
            getUsagePercentage={getUsagePercentage}
            getUsageColor={getUsageColor}
            getProgressColor={getProgressColor}
            formatNumber
          />
        </CardContent>
      </Card>

      {/* Upgrade Prompt */}
      {!isPro && (
        <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Need More Capacity?
            </CardTitle>
            <CardDescription className="text-blue-800 dark:text-blue-200">
              Upgrade to Pro for unlimited tasks, workspaces, friends, and enhanced Jarvis AI capabilities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/pricing')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              <Crown className="w-4 h-4 mr-2" />
              View Pro Features
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Usage Item Component
function UsageItem({
  label,
  current,
  limit,
  getUsagePercentage,
  getUsageColor,
  getProgressColor,
  formatNumber = false
}: {
  label: string
  current: number
  limit: number
  getUsagePercentage: (current: number, limit: number) => number
  getUsageColor: (percentage: number) => string
  getProgressColor: (percentage: number) => string
  formatNumber?: boolean
}) {
  const percentage = getUsagePercentage(current, limit)
  const displayCurrent = formatNumber ? current.toLocaleString() : current
  const displayLimit = isUnlimited(limit) ? '∞' : formatNumber ? limit.toLocaleString() : limit

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className={`font-semibold ${getUsageColor(percentage)}`}>
          {displayCurrent} / {displayLimit}
        </span>
      </div>
      {!isUnlimited(limit) && (
        <Progress 
          value={percentage} 
          className={`h-2 ${getProgressColor(percentage)}`}
        />
      )}
    </div>
  )
}
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-900 py-10">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 shadow-sm border-b border-border mb-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Subscription</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="danger" className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Danger</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information and bio</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  {/* Avatar Upload */}
                  <div className="space-y-4">
                    <Label>Profile Picture</Label>
                    <div className="flex items-center gap-6">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={avatarPreview} alt={profileForm.display_name || 'Avatar'} />
                        <AvatarFallback className="text-2xl">
                          {profileForm.display_name?.charAt(0)?.toUpperCase() || 
                           profileForm.user_name?.charAt(0)?.toUpperCase() || 
                           'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="flex gap-2">
                          <Label htmlFor="avatar-upload" className="cursor-pointer">
                            <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                              <Upload className="mr-2 h-4 w-4" />
                              Choose Image
                            </div>
                            <input
                              id="avatar-upload"
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                              onChange={handleAvatarChange}
                              className="hidden"
                            />
                          </Label>
                          {avatarFile && (
                            <Button
                              type="button"
                              onClick={handleAvatarUpload}
                              disabled={uploadingAvatar}
                            >
                              {uploadingAvatar ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload
                                </>
                              )}
                            </Button>
                          )}
                          {avatarPreview && !avatarFile && (
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={handleAvatarDelete}
                              disabled={uploadingAvatar}
                            >
                              {uploadingAvatar ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <X className="mr-2 h-4 w-4" />
                                  Remove
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG, GIF or WebP. Max size 5MB.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="display_name">Full Name</Label>
                    <Input
                      id="display_name"
                      value={profileForm.display_name}
                      onChange={(e) => setProfileForm({ ...profileForm, display_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="user_name">Username</Label>
                    <Input
                      id="user_name"
                      value={profileForm.user_name}
                      onChange={(e) => setProfileForm({ ...profileForm, user_name: e.target.value })}
                      placeholder="johndoe"
                      pattern="[a-zA-Z0-9_-]{3,30}"
                      title="Username must be 3-30 characters and can only contain letters, numbers, hyphens, and underscores"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your unique username (3-30 characters, letters, numbers, hyphens, and underscores only)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {profileForm.bio.length}/500
                    </p>
                  </div>

                  {saveStatus === 'error' && errorMessage && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}

                  {saveStatus === 'success' && (
                    <Alert className="border-green-200 bg-green-50 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>Profile updated successfully!</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" disabled={saveStatus === 'saving'}>
                    {saveStatus === 'saving' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Tab */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Email Address</CardTitle>
                <CardDescription>Manage your email address</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmailUpdate} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="current_email">Current Email</Label>
                    <Input
                      id="current_email"
                      value={email}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new_email">New Email Address</Label>
                    <Input
                      id="new_email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="newemail@example.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      You&apos;ll receive a verification email at your new address
                    </p>
                  </div>

                  {saveStatus === 'error' && errorMessage && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}

                  {saveStatus === 'success' && errorMessage && (
                    <Alert className="border-blue-200 bg-blue-50 text-blue-800">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" disabled={saveStatus === 'saving' || !newEmail}>
                    {saveStatus === 'saving' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Update Email
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Enter new password"
                      minLength={8}
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm New Password</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      minLength={8}
                    />
                  </div>

                  {saveStatus === 'error' && errorMessage && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}

                  {saveStatus === 'success' && (
                    <Alert className="border-green-200 bg-green-50 text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>Password changed successfully!</AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    disabled={saveStatus === 'saving' || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  >
                    {saveStatus === 'saving' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Changing...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Change Password
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription">
            <SubscriptionTab 
              subscription={subscription}
              subscriptionLoading={subscriptionLoading}
              isProcessing={isProcessing}
              setIsProcessing={setIsProcessing}
            />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, emailNotifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="task-reminders">Task Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminders for upcoming task deadlines
                      </p>
                    </div>
                    <Switch
                      id="task-reminders"
                      checked={notifications.taskReminders}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, taskReminders: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="collaboration-updates">Collaboration Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Notifications when someone mentions you or comments
                      </p>
                    </div>
                    <Switch
                      id="collaboration-updates"
                      checked={notifications.collaborationUpdates}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, collaborationUpdates: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="weekly-digest">Weekly Digest</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive a weekly summary of your activity
                      </p>
                    </div>
                    <Switch
                      id="weekly-digest"
                      checked={notifications.weeklyDigest}
                      onCheckedChange={(checked) => 
                        setNotifications({ ...notifications, weeklyDigest: checked })
                      }
                    />
                  </div>
                </div>

                {saveStatus === 'error' && errorMessage && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                {saveStatus === 'success' && (
                  <Alert className="border-green-200 bg-green-50 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>Notification preferences updated!</AlertDescription>
                  </Alert>
                )}

                <Button onClick={handleNotificationUpdate} disabled={saveStatus === 'saving'}>
                  {saveStatus === 'saving' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>Irreversible and destructive actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">Delete Account</h3>
                    <p className="text-sm text-red-700 mb-4">
                      Once you delete your account, there is no going back. This will permanently delete your account,
                      all your tasks, workspaces, and remove you from all collaborations.
                    </p>
                  </div>

                  {!showDeleteConfirm ? (
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Are you absolutely sure? This action cannot be undone.
                        </AlertDescription>
                      </Alert>
                      <div className="flex gap-2">
                        <Button 
                          variant="destructive" 
                          onClick={handleDeleteAccount}
                          disabled={saveStatus === 'saving'}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {saveStatus === 'saving' ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            'Yes, Delete My Account'
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={saveStatus === 'saving'}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {saveStatus === 'error' && errorMessage && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errorMessage}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}