/**
 * Conversation Page
 * Displays the list of conversations for the user.
 *
 * @returns {JSX.Element} The conversation page component.
 */
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { useConversations } from '@/hooks/queries/useConversationQueries';
import ConversationsList from '@/components/conversations/ConversationsList';
import { CreateConversationDialog } from '@/components/conversations/CreateConversationDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Plus, MessageSquare } from 'lucide-react';

export default function ConversationPage() {
  const { data: conversations, isLoading, error } = useConversations();
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  const handleCreateClick = () => {
    setIsCreateModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-900">
      <main className="p-4 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Conversations</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Connect and collaborate with your team
          </p>
        </div>
        <Button onClick={handleCreateClick} className="gap-2">
          <Plus className="h-4 w-4" />
          New Conversation
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      ) : error ? (
        <Card className="p-8 text-center">
          <div className="text-red-600 dark:text-red-400 font-medium mb-2">Error loading conversations</div>
          <div className="text-sm text-slate-600 dark:text-slate-400">{error.message}</div>
        </Card>
      ) : !conversations?.length ? (
        <Card className="p-12 text-center">
          <MessageSquare className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No conversations yet
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4 max-w-sm mx-auto">
            Start your first conversation to begin collaborating with your team.
          </p>
          <Button onClick={handleCreateClick} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Your First Conversation
          </Button>
        </Card>
      ) : (
        <ConversationsList conversations={conversations} />
      )}

      <CreateConversationDialog
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
      </main>
    </div>
  );
}