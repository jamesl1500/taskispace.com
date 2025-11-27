"use client";

import { useParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useConversation, useConversationMessages, useSendMessage, useConversationMembers } from "@/hooks/queries/useConversationQueries";
import { useAuth } from "@/hooks/queries/useAuthQueries";
import { Send, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const conversationId = params?.id;
  const { user } = useAuth();
  const { data: conversation, isLoading: convLoading, error: convError } = useConversation(conversationId);
  const { data: messages, isLoading: msgsLoading, error: msgsError } = useConversationMessages(conversationId);
  const { data: members } = useConversationMembers(conversationId);
  const [text, setText] = useState("");
  const { mutate: sendMessage, isPending } = useSendMessage(conversationId || "");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onSend = () => {
    if (!conversationId || !text.trim()) return;
    sendMessage({ content: text.trim() });
    setText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const isLoading = convLoading || msgsLoading;
  const memberCount = members?.length || 0;

  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-900">
      <main className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto w-full">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 border-b shadow-sm">
          <div className="flex items-center gap-4">
            <Link href="/conversations">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="flex-1">
              {isLoading ? (
                <Skeleton className="h-6 w-64" />
              ) : convError ? (
                <div className="text-red-600 text-sm">{convError.message}</div>
              ) : (
                <div>
                  <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {conversation?.title || "Untitled Conversation"}
                  </h1>
                  {conversation?.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {conversation.description}
                    </p>
                  )}
                </div>
              )}
            </div>
            {memberCount > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Users className="h-3 w-3" />
                {memberCount} member{memberCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {isLoading ? (
              <>
                <Skeleton className="h-16 w-3/4" />
                <Skeleton className="h-16 w-2/3 ml-auto" />
                <Skeleton className="h-16 w-1/2" />
              </>
            ) : msgsError ? (
              <Card className="p-6 text-center">
                <div className="text-red-600 text-sm">{msgsError.message}</div>
              </Card>
            ) : !messages?.length ? (
              <Card className="p-8 text-center">
                <div className="text-slate-500 dark:text-slate-400">
                  No messages yet. Start the conversation!
                </div>
              </Card>
            ) : (
              messages.slice().reverse().map((message) => {
                const isOwnMessage = message.user_id === user?.id;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${isOwnMessage
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                        }`}
                    >
                      <div className="text-sm">{message.content}</div>
                      <div
                        className={`text-xs mt-1 ${isOwnMessage
                            ? 'text-blue-100'
                            : 'text-slate-500 dark:text-slate-400'
                          }`}
                      >
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1"
            />
            <Button
              onClick={onSend}
              disabled={!text.trim() || isPending}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {isPending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}