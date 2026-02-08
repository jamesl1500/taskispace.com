'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mail, UserPlus, Trash2, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface WorkspaceInvitation {
  id: string
  workspace_id: string
  email: string
  token: string
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  role: string
  expires_at: string
  accepted_at: string | null
  created_at: string
  invited_by_profile: {
    user_name: string
    display_name: string
    avatar_url: string | null
  }
}

interface WorkspaceInvitationsProps {
  workspaceId: string
}

export function WorkspaceInvitations({ workspaceId }: WorkspaceInvitationsProps) {
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetchInvitations()
  }, [workspaceId])

  const fetchInvitations = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/workspaces/${workspaceId}/invitations`)
      if (response.ok) {
        const data = await response.json()
        setInvitations(data)
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
      toast.error('Failed to load invitations')
    } finally {
      setLoading(false)
    }
  }

  const handleSendInvitation = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    try {
      setSending(true)
      const response = await fetch(`/api/workspaces/${workspaceId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      toast.success('Invitation sent successfully!')
      setEmail('')
      setRole('member')
      setIsDialogOpen(false)
      fetchInvitations()
    } catch (error) {
      console.error('Error sending invitation:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation')
    } finally {
      setSending(false)
    }
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) {
      return
    }

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/invitations/${invitationId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to revoke invitation')
      }

      toast.success('Invitation revoked')
      fetchInvitations()
    } catch (error) {
      console.error('Error revoking invitation:', error)
      toast.error('Failed to revoke invitation')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>
      case 'expired':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200"><XCircle className="w-3 h-3 mr-1" />Expired</Badge>
      case 'revoked':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Revoked</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const copyInvitationLink = (token: string) => {
    const link = `${window.location.origin}/accept-invitation?token=${token}`
    navigator.clipboard.writeText(link)
    toast.success('Invitation link copied to clipboard!')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Workspace Invitations</h3>
          <p className="text-sm text-muted-foreground">Invite people to collaborate on this workspace</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite to Workspace</DialogTitle>
              <DialogDescription>
                Send an invitation to someone to join this workspace. They'll need to create an account or log in to accept.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendInvitation()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={sending}>
                Cancel
              </Button>
              <Button onClick={handleSendInvitation} disabled={sending}>
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
        </div>
      ) : invitations.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Mail className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-muted-foreground">No invitations sent yet</p>
            <p className="text-sm text-muted-foreground mt-2">Invite team members to start collaborating</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {invitations.map((invitation) => (
            <Card key={invitation.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Invited {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                          {invitation.status === 'pending' && ` • Expires ${formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}`}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{invitation.role}</Badge>
                    {getStatusBadge(invitation.status)}
                    {invitation.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyInvitationLink(invitation.token)}
                        >
                          Copy Link
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRevokeInvitation(invitation.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
