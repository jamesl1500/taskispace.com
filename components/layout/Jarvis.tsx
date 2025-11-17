/**
 * Jarvis AI Bot Component
 * 
 * This component represents the Jarvis AI Bot button in the header.
 * It allows users to interact with the AI assistant for enhanced productivity.
 * 
 * @module components/layout/Jarvis
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bot } from 'lucide-react';

export const Jarvis: React.FC = () => {
  const [isJarvisOpen, setIsJarvisOpen] = useState(false);
  const [jarvisMessage, setJarvisMessage] = useState('');
  const [jarvisReplied, setJarvisReplied] = useState(false);
  const [conversation, setConversation] = useState<Array<{ author: 'user' | 'jarvis'; content: string; createdAt: string }>>([]);

  const [loadingNewMessage, setLoadingNewMessage] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  
  const handleJarvisClick = () => {
    // Logic to open Jarvis AI Bot interface goes here
    if (isJarvisOpen) {
      if(conversation.length > 0) {
        const con = confirm("Closing Jarvis will clear the current conversation. Do you want to proceed?");
        
        if (!con) {
          return;
        }
      }
      setJarvisReplied(false);
      setConversation([]);
      setLoadingNewMessage(false);
      setWaitingForResponse(false);
    }

    setIsJarvisOpen(!isJarvisOpen);
  };

  const handleSendMessage = (message: string) => {
    // Logic to send message to Jarvis AI and receive response
    const userMessage = { author: 'user' as const, content: message, createdAt: new Date().toISOString() };
    setConversation([...conversation, userMessage]);
    setLoadingNewMessage(true);
    setWaitingForResponse(true);

    // Now send to API
    const messagePayload = {
      message: message,
    };

    const sendMessageToJarvis = async () => {
      try {
        const response = await fetch('/api/jarvis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messagePayload),
        });

        const data = await response.json();

        if (data.reply) {
          const jarvisReply = { author: 'jarvis' as const, content: data.reply, createdAt: new Date().toISOString() };
          setConversation((prev) => [...prev, jarvisReply]);
          setJarvisReplied(true);
        }
      } catch (error) {
        console.error('Error communicating with Jarvis AI:', error);
      } finally {
        setLoadingNewMessage(false);
        setWaitingForResponse(false);
      }
    };

    sendMessageToJarvis();
  };

  return (
    <>
      <Button variant="outline" size="sm" className="text-xs px-2" onClick={handleJarvisClick}>
        <Bot className="h-3 w-3 mr-1" />
        Jarvis
      </Button>

      {isJarvisOpen && (
        <>
          <div className='modal-backdrop fixed inset-0 bg-black opacity-30 z-40' onClick={handleJarvisClick}></div>
          <div className="absolute top-12 right-14 mt-2 w-80 bg-white dark:bg-slate-800 rounded-md shadow-lg p-4 z-50">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Jarvis AI Assistant</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              How can I assist you today?
            </p>
            {!jarvisReplied && (
              <div className="mt-4 p-2 bg-slate-100 dark:bg-slate-700 rounded-md">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Try asking about tasks, projects, or anything else you need help with.
                </p>
              </div>
            )}

            {conversation.length > 0 && (
              <div className="mt-4 max-h-60 overflow-y-auto space-y-3">
                {conversation.map((msg, index) => (
                  <div key={index} className={msg.author === 'jarvis' ? 'flex justify-start' : 'flex justify-end'}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.author === 'jarvis'
                        ? 'bg-green-100 dark:bg-green-800 text-slate-900 dark:text-white'
                        : 'bg-blue-600 text-white'
                    }`}>
                      <div className="text-sm">{msg.content}</div>
                      <div className="text-xs mt-1 text-slate-500 dark:text-slate-400">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <form className="mt-4">
              {waitingForResponse && <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Waiting for response...</p>}
              {!waitingForResponse && (
                <input
                  type="text"
                  placeholder="Ask me anything..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
              {!waitingForResponse && (
                <Button type="submit" className="mt-2 w-full" onClick={(e) => {
                  e.preventDefault();
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  if (input.value.trim()) {
                    handleSendMessage(input.value);
                    input.value = '';
                  }
                }}>
                  {loadingNewMessage ? ('Sending...') : 'Send'}
                </Button>
              )}
            </form>
          </div>
        </>
      )}
    </>
  );
}