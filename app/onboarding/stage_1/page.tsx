'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { User, Loader2, ArrowRight, Upload } from 'lucide-react'

export default function OnboardingStage1() {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [checking, setChecking] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [username, setUsername] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [bio, setBio] = useState('')
    const [avatarFile, setAvatarFile] = useState<File | null>(null)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

    const [avatarPreview, setAvatarPreview] = useState<string>('')

    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        checkOnboardingStatus()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const checkOnboardingStatus = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login')
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('onboarding_stage, onboarding_completed, user_name, display_name, bio, avatar_url')
                .eq('id', user.id)
                .single()

            if (profile?.onboarding_completed) {
                router.push('/timeline')
                return
            }

            if (profile && profile.onboarding_stage > 1) {
                router.push(`/onboarding/stage_${profile.onboarding_stage}`)
                return
            }

            // Pre-fill existing data if any (except username - let them choose)
            if (profile) {
                // Don't pre-fill username - let user choose
                setDisplayName(profile.display_name || '')
                setBio(profile.bio || '')
                setAvatarPreview(profile.avatar_url || '')
                setAvatarUrl(profile.avatar_url || null)
            }
        } catch (err) {
            console.error('Error checking onboarding:', err)
        } finally {
            setChecking(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Check if username is unique
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('user_name', username)
                .neq('id', user.id)
                .maybeSingle()

            if (existingProfile) {
                setError('Username is already taken. Please choose a different one.')
                setLoading(false)
                return
            }

            // If avatar file is selected, upload it first
            if (avatarFile) {
                setSaveStatus('saving')

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

                setAvatarUrl(data.url)
                setSaveStatus('success')
            }

            // Update profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    user_name: username,
                    display_name: displayName || username,
                    bio: bio || null,
                    avatar_url: avatarUrl,
                    onboarding_stage: 2
                })
                .eq('id', user.id)

            if (updateError) throw updateError

            router.push('/onboarding/stage_2')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

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

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        )
    }

    return (
        <div className="onboarding-page min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-4">
            <div className="onboarding-page-inner w-full h-full flex items-center justify-center p-4">
                <div className="w-full max-w-2xl">
                    <Card className="border-purple-100 bg-white backdrop-blur-sm">
                        <div className="px-6 pb-4">
                            <div className="flex justify-between items-center mb-2">
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                    Welcome to Taskispace! 🎉
                                </h1>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Step 1 of 3
                                </span>
                            </div>
                            <Progress value={33} className="h-2" />
                        </div>

                        {error && (
                            <Alert variant="destructive" className="mb-6">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <CardHeader className="">
                            <div className="flex items-center gap-2">
                                <User className="h-6 w-6 text-purple-600" />
                                <CardTitle>Set Up Your Profile</CardTitle>
                            </div>
                            <CardDescription>
                                Let&apos;s personalize your account. You can always update this later.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="flex justify-center mb-4">
                                    <Avatar className="h-24 w-24">
                                        <AvatarImage src={avatarPreview} />
                                        <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                            {username.charAt(0).toUpperCase() || '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="username">Username *</Label>
                                    <Input
                                        id="username"
                                        placeholder="johndoe"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                        required
                                        minLength={3}
                                        maxLength={30}
                                    />
                                    <p className="text-xs text-gray-500">This is your unique identifier. Only lowercase letters, numbers, and underscores.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="displayName">Display Name</Label>
                                    <Input
                                        id="displayName"
                                        placeholder="John Doe"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        maxLength={255}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <Textarea
                                        id="bio"
                                        placeholder="Tell us a bit about yourself..."
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        rows={3}
                                        maxLength={500}
                                    />
                                    <p className="text-xs text-gray-500">{bio.length}/500 characters</p>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-sm font-medium">Choose your avatar</p>
                                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                                        <div className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                                            <Upload className="mr-2 h-4 w-4" />
                                            Choose Avatar
                                        </div>
                                        <input
                                            id="avatar-upload"
                                            type="file"
                                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                            onChange={handleAvatarChange}
                                            className="hidden"
                                        />
                                    </Label>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                    disabled={loading || !username}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            Continue
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
