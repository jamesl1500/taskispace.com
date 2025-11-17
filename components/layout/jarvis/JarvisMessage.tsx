/**
 * Jarvis AI Bot Message Component
 * 
 * This component represents a message from the Jarvis AI Bot in the chat interface.
 * It is styled differently from user messages to distinguish it as an AI-generated response.
 * 
 * @module components/layout/jarvis/JarvisMessage
 */
import React from 'react';

interface JarvisMessageProps {
  author: 'jarvis';
  content: string;
  createdAt: string;
}

export const JarvisMessage: React.FC<JarvisMessageProps> = ({ author, content, createdAt }) => {
  return (
    <div className="flex justify-start">
        <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-green-100 dark:bg-green-800 text-slate-900 dark:text-white">
            <div className="font-semibold text-green-700 dark:text-green-300">{author}</div>
            <div className="text-sm">{content}</div>
            <div className="text-xs mt-1 text-slate-500 dark:text-slate-400">
            {new Date(createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
            })}
            </div>
        </div>
    </div>
  );
};