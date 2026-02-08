'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Briefcase, Loader2, ArrowRight, ArrowLeft } from 'lucide-react'

export default function OnboardingStage2() {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [checking, setChecking] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [workspaceName, setWorkspaceName] = useState('')
    const [workspaceDescription, setWorkspaceDescription] = useState('')

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/auth/login')
                    return
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('onboarding_stage, onboarding_completed')
                    .eq('id', user.id)
                    .single()

                if (profile?.onboarding_completed) {
                    router.push('/timeline')
                    return
                }

                if (profile && profile.onboarding_stage < 2) {
                    router.push('/onboarding/stage_1')
                    return
                }

                if (profile && profile.onboarding_stage > 2) {
                    router.push(`/onboarding/stage_${profile.onboarding_stage}`)
                    return
                }
            } catch (err) {
                console.error('Error checking onboarding:', err)
            } finally {
                setChecking(false)
            }
        }
        checkStatus()
    }, [router, supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Create workspace
            const { data: workspace, error: workspaceError } = await supabase
                .from('workspaces')
                .insert({
                    name: workspaceName,
                    description: workspaceDescription || null,
                    owner_id: user.id,
                })
                .select()
                .single()

            if (workspaceError) throw workspaceError
            if (!workspace) throw new Error('Failed to create workspace')

            // Create default list
            const { data: list, error: listError } = await supabase
                .from('lists')
                .insert({
                    name: 'Getting Started',
                    workspace_id: workspace.id,
                    created_by: user.id,
                })
                .select()
                .single()

            if (listError) throw listError
            if (!list) throw new Error('Failed to create list')

            // Update onboarding stage
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    onboarding_stage: 3,
                })
                .eq('id', user.id)

            if (profileError) throw profileError

            // Store workspace and list IDs in localStorage for next stage
            localStorage.setItem('onboarding_workspace_id', workspace.id)
            localStorage.setItem('onboarding_list_id', list.id)

            router.push('/onboarding/stage_3')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create workspace')
        } finally {
            setLoading(false)
        }
    }

    const handleBack = () => {
        router.push('/onboarding/stage_1')
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
                                    Create Your Workspace 🚀
                                </h1>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Step 2 of 3
                                </span>
                            </div>
                            <Progress value={66} className="h-2" />
                        </div>

                        {error && (
                            <Alert variant="destructive" className="mb-6">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Briefcase className="h-6 w-6 text-purple-600" />
                                <CardTitle>Create Your First Workspace</CardTitle>
                            </div>
                            <CardDescription>
                                Workspaces help you organize your tasks and collaborate with others.
                                We&apos;ll create a default list for you to get started.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="workspaceName">Workspace Name *</Label>
                                    <Input
                                        id="workspaceName"
                                        placeholder="My Personal Projects"
                                        value={workspaceName}
                                        onChange={(e) => setWorkspaceName(e.target.value)}
                                        required
                                        maxLength={255}
                                    />
                                    <p className="text-xs text-gray-500">Give your workspace a meaningful name</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="workspaceDescription">Description (Optional)</Label>
                                    <Textarea
                                        id="workspaceDescription"
                                        placeholder="What will you use this workspace for?"
                                        value={workspaceDescription}
                                        onChange={(e) => setWorkspaceDescription(e.target.value)}
                                        rows={3}
                                        maxLength={500}
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleBack}
                                        className="flex-1"
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                        disabled={loading || !workspaceName}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                Continue
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
