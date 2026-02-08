'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, AlertCircle, Mail, Building2, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

interface InvitationDetails {
  id: string
  workspace_id: string
  email: string
  role: string
  status: string
  expires_at: string
  workspace: {
    id: string
    name: string
    description: string | null
  }
  invited_by_profile: {
    user_name: string
    display_name: string
    avatar_url: string | null
  }
}

function AcceptInvitationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const token = searchParams.get('token')

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided')
      setLoading(false)
      return
    }

    fetchInvitationDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const fetchInvitationDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/invitations/verify?token=${token}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Invalid invitation')
      }

      setInvitation(data)
    } catch (err) {
      console.error('Error fetching invitation:', err)
      setError(err instanceof Error ? err.message : 'Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async () => {
    if (!user) {
      // Store token in session storage and redirect to signup
      sessionStorage.setItem('invitation_token', token!)
      router.push(`/auth/signup?email=${encodeURIComponent(invitation?.email || '')}`)
      return
    }

    if (user.email !== invitation?.email) {
      setError('Please sign in with the email address this invitation was sent to')
      return
    }

    try {
      setAccepting(true)
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation')
      }

      setSuccess(true)
      
      // Redirect to workspace after a short delay
      setTimeout(() => {
        router.push(`/workspaces/${invitation?.workspace_id}`)
      }, 2000)
    } catch (err) {
      console.error('Error accepting invitation:', err)
      setError(err instanceof Error ? err.message : 'Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-purple-600" />
            <p className="text-muted-foreground">Loading invitation details...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <CardTitle>Invalid Invitation</CardTitle>
            </div>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">Return to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-green-200">
          <CardHeader>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-6 h-6" />
              <CardTitle>Success!</CardTitle>
            </div>
            <CardDescription>You&apos;ve successfully joined the workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Redirecting to workspace...
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-purple-100">
        <CardHeader>
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl shadow-xl mb-4 mx-auto">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-center text-2xl">Workspace Invitation</CardTitle>
          <CardDescription className="text-center">
            You&apos;ve been invited to join a workspace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {invitation && (
            <>
              {/* Workspace Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-100 dark:border-purple-900">
                  <Building2 className="w-10 h-10 text-purple-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-lg">{invitation.workspace.name}</p>
                    {invitation.workspace.description && (
                      <p className="text-sm text-muted-foreground">{invitation.workspace.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Invited by</p>
                    <p className="font-medium">{invitation.invited_by_profile.display_name || invitation.invited_by_profile.user_name}</p>
                  </div>
                  <Badge>{invitation.role}</Badge>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-900">
                  <div className="flex items-start gap-2">
                    <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Invitation sent to</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">{invitation.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {!user ? (
                <div className="space-y-3">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You need to create an account or sign in to accept this invitation
                    </AlertDescription>
                  </Alert>
                  <Button 
                    onClick={handleAcceptInvitation}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    Create Account & Accept
                  </Button>
                  <Link href={`/auth/login?email=${encodeURIComponent(invitation.email)}`} className="block">
                    <Button variant="outline" className="w-full">
                      Already have an account? Sign In
                    </Button>
                  </Link>
                </div>
              ) : user.email === invitation.email ? (
                <Button 
                  onClick={handleAcceptInvitation}
                  disabled={accepting}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {accepting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Accept Invitation
                    </>
                  )}
                </Button>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This invitation was sent to {invitation.email}, but you&apos;re signed in as {user.email}.
                    Please sign out and create an account with the invited email address.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  )
}
