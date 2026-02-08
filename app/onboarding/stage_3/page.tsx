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
import { CheckSquare, Loader2, ArrowLeft, Sparkles } from 'lucide-react'

export default function OnboardingStage3() {
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(false)
    const [checking, setChecking] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [completing, setCompleting] = useState(false)

    const [taskTitle, setTaskTitle] = useState('')
    const [taskDescription, setTaskDescription] = useState('')
    const [workspaceId, setWorkspaceId] = useState<string | null>(null)
    const [listId, setListId] = useState<string | null>(null)

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

                if (profile && profile.onboarding_stage < 3) {
                    router.push(`/onboarding/stage_${profile.onboarding_stage}`)
                    return
                }

                // Get workspace and list IDs from localStorage
                const savedWorkspaceId = localStorage.getItem('onboarding_workspace_id')
                const savedListId = localStorage.getItem('onboarding_list_id')

                if (!savedWorkspaceId || !savedListId) {
                    router.push('/onboarding/stage_2')
                    return
                }

                setWorkspaceId(savedWorkspaceId)
                setListId(savedListId)
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
            if (!user || !listId || !workspaceId) throw new Error('Missing required data')

            // Create task
            const { error: taskError } = await supabase
                .from('tasks')
                .insert({
                    title: taskTitle,
                    description: taskDescription || null,
                    list_id: listId,
                    created_by: user.id,
                    status: 'todo',
                    priority: 'medium',
                })

            if (taskError) throw taskError

            await completeOnboarding()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create task')
            setLoading(false)
        }
    }

    const handleSkip = async () => {
        await completeOnboarding()
    }

    const completeOnboarding = async () => {
        setCompleting(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            // Mark onboarding as complete
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    onboarding_completed: true,
                    onboarding_stage: 4,
                    onboarding_completed_at: new Date().toISOString()
                })
                .eq('id', user.id)

            if (profileError) throw profileError

            // Clear localStorage
            localStorage.removeItem('onboarding_workspace_id')
            localStorage.removeItem('onboarding_list_id')

            // Show completion message briefly, then redirect
            setTimeout(() => {
                router.push(`/workspaces/${workspaceId}`)
            }, 2000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to complete onboarding')
            setCompleting(false)
        }
    }

    const handleBack = () => {
        router.push('/onboarding/stage_2')
    }

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:to-gray-800">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
        )
    }

    if (completing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-4">
                <Card className="w-full max-w-md text-center border-purple-100 bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <div className="flex justify-center mb-4">
                            <div className="rounded-full bg-gradient-to-br from-purple-500 to-pink-500 p-3">
                                <Sparkles className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <CardTitle className="text-3xl">All Set! 🚀</CardTitle>
                        <CardDescription className="text-lg mt-2">
                            You&apos;re ready to start managing your tasks with Taskispace
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            Redirecting you to your workspace...
                        </p>
                        <div className="flex justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
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
                                    Create Your First Task ✨
                                </h1>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Step 3 of 3
                                </span>
                            </div>
                            <Progress value={100} className="h-2" />
                        </div>

                        {error && (
                            <Alert variant="destructive" className="mb-6">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <CheckSquare className="h-6 w-6 text-purple-600" />
                                <CardTitle>Create Your First Task</CardTitle>
                            </div>
                            <CardDescription>
                                Add your first task to get started. You can always skip this step and add tasks later.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="taskTitle">Task Title *</Label>
                                    <Input
                                        id="taskTitle"
                                        placeholder="Complete my first task"
                                        value={taskTitle}
                                        onChange={(e) => setTaskTitle(e.target.value)}
                                        required
                                        maxLength={255}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="taskDescription">Description (Optional)</Label>
                                    <Textarea
                                        id="taskDescription"
                                        placeholder="Add details about this task..."
                                        value={taskDescription}
                                        onChange={(e) => setTaskDescription(e.target.value)}
                                        rows={4}
                                        maxLength={1000}
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleBack}
                                        disabled={loading}
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleSkip}
                                        disabled={loading}
                                        className="flex-1"
                                    >
                                        Skip for now
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                        disabled={loading || !taskTitle}
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                Complete Setup
                                                <Sparkles className="ml-2 h-4 w-4" />
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
