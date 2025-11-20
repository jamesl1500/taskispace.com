'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import { CreateConversationDialog } from '@/components/conversations/CreateConversationDialog'
import { useProfileByUsername } from '@/hooks/queries/useProfileQueries'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, MessageCircle } from 'lucide-react'
import Link from 'next/link'

export default function NewConversationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(true)
  
  const preSelectedUsername = searchParams.get('user')
  const { data: preSelectedProfile } = useProfileByUsername(preSelectedUsername)

  const handleDialogClose = (open: boolean) => {
    setShowDialog(open)
    if (!open) {
      // Navigate back when dialog is closed
      router.back()
    }
  }

  const getInitials = (name: string | null, username: string) => {
    if (!name) return username.charAt(0).toUpperCase()
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/conversations">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Conversations
          </Button>
        </Link>
        
        <h1 className="text-3xl font-bold mb-2">Create New Conversation</h1>
        <p className="text-muted-foreground">
          {preSelectedProfile 
            ? `Starting a conversation with ${preSelectedProfile.display_name || preSelectedProfile.user_name}`
            : 'Start a new conversation with your team members'
          }
        </p>
      </div>

      {preSelectedProfile && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={preSelectedProfile.avatar_url || undefined} />
                <AvatarFallback>
                  {getInitials(preSelectedProfile.display_name, preSelectedProfile.user_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="font-semibold">
                  {preSelectedProfile.display_name || preSelectedProfile.user_name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  @{preSelectedProfile.user_name}
                </p>
              </div>
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="text-center py-12">
          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Ready to Start Chatting?</h3>
          <p className="text-muted-foreground mb-6">
            {preSelectedProfile
              ? `Click below to create a conversation with ${preSelectedProfile.display_name || preSelectedProfile.user_name}.`
              : 'Create a new conversation to start collaborating with your team.'
            }
          </p>
          <Button onClick={() => setShowDialog(true)}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Create Conversation
          </Button>
        </CardContent>
      </Card>

      <CreateConversationDialog
        open={showDialog}
        onOpenChange={handleDialogClose}
        preSelectedUser={preSelectedUsername || undefined}
      />
    </div>
      </div>
  )
}