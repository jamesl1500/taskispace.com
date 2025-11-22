'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Loader2, User, Briefcase, CheckSquare } from 'lucide-react';

type OnboardingStep = 'profile' | 'workspace' | 'task' | 'complete';

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [step, setStep] = useState<OnboardingStep>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Profile data
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Workspace data
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  
  // Task data
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [listId, setListId] = useState<string | null>(null);

  const progressValue = {
    profile: 25,
    workspace: 50,
    task: 75,
    complete: 100,
  }[step];

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if username is available
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_name', username)
        .neq('id', user.id)
        .single();

      if (existingProfile) {
        setError('Username is already taken');
        setLoading(false);
        return;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          user_name: username,
          display_name: displayName || username,
          bio: bio || null,
          avatar_url: avatarUrl || null,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setStep('workspace');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create workspace
      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .insert({
          name: workspaceName,
          description: workspaceDescription || null,
          owner_id: user.id,
        })
        .select()
        .single();

      if (workspaceError) throw workspaceError;
      if (!workspace) throw new Error('Failed to create workspace');

      setWorkspaceId(workspace.id);

      // Create default list
      const { data: list, error: listError } = await supabase
        .from('lists')
        .insert({
          name: 'Getting Started',
          description: 'Your first task list',
          workspace_id: workspace.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (listError) throw listError;
      if (!list) throw new Error('Failed to create list');

      setListId(list.id);
      setStep('task');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !listId) throw new Error('Missing required data');

      // Create task
      const { error: taskError } = await supabase
        .from('tasks')
        .insert({
          title: taskTitle,
          description: taskDescription || null,
          list_id: listId,
          created_by: user.id,
          workspace_id: workspaceId,
          status: 'pending',
          priority: 'medium',
        });

      if (taskError) throw taskError;

      setStep('complete');
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push(`/workspaces/${workspaceId}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipTask = () => {
    if (workspaceId) {
      router.push(`/workspaces/${workspaceId}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome to Taskispace! 🎉
            </h1>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {step === 'profile' && 'Step 1 of 3'}
              {step === 'workspace' && 'Step 2 of 3'}
              {step === 'task' && 'Step 3 of 3'}
              {step === 'complete' && 'Complete!'}
            </span>
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Profile Setup */}
        {step === 'profile' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-6 w-6 text-blue-600" />
                <CardTitle>Set Up Your Profile</CardTitle>
              </div>
              <CardDescription>
                Let&apos;s personalize your account. You can always update this later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
                      {username.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">
                    Username <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="username"
                    placeholder="johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    required
                    minLength={3}
                    maxLength={30}
                  />
                  <p className="text-xs text-gray-500">
                    Lowercase letters, numbers, and underscores only
                  </p>
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
                  <p className="text-xs text-gray-500 text-right">
                    {bio.length}/500
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatarUrl">Avatar URL (optional)</Label>
                  <Input
                    id="avatarUrl"
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading || !username}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Workspace Setup */}
        {step === 'workspace' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Briefcase className="h-6 w-6 text-green-600" />
                <CardTitle>Create Your First Workspace</CardTitle>
              </div>
              <CardDescription>
                Workspaces help you organize your tasks and collaborate with others.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleWorkspaceSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="workspaceName">
                    Workspace Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="workspaceName"
                    placeholder="My Personal Projects"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    required
                    maxLength={255}
                  />
                  <p className="text-xs text-gray-500">
                    Examples: &quot;Work&quot;, &quot;Personal&quot;, &quot;Side Projects&quot;
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workspaceDescription">Description</Label>
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
                    onClick={() => setStep('profile')}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading || !workspaceName}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Continue'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Task Setup */}
        {step === 'task' && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckSquare className="h-6 w-6 text-purple-600" />
                <CardTitle>Create Your First Task</CardTitle>
              </div>
              <CardDescription>
                Let&apos;s add your first task to get started. You can skip this if you prefer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleTaskSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="taskTitle">
                    Task Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="taskTitle"
                    placeholder="Complete project proposal"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    required
                    maxLength={500}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskDescription">Description</Label>
                  <Textarea
                    id="taskDescription"
                    placeholder="Add any details about this task..."
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 <strong>Pro tip:</strong> You can add due dates, assign tasks to team members, 
                    add tags, and more after creating your task!
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkipTask}
                    disabled={loading}
                  >
                    Skip
                  </Button>
                  <Button type="submit" className="flex-1" disabled={loading || !taskTitle}>
                    {loading ? (
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
        )}

        {/* Complete */}
        {step === 'complete' && (
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-6">
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
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
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
