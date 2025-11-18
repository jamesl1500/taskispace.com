/**
 * Jarvis AI Bot Component
 * 
 * This component represents the Jarvis AI Bot button in the header.
 * It allows users to navigate to the AI assistant for enhanced productivity.
 * 
 * @module components/layout/Jarvis
 */
import React from 'react'
import { Button } from '@/components/ui/button'
import { Bot } from 'lucide-react'
import { useRouter } from 'next/navigation'

export const Jarvis: React.FC = () => {
  const router = useRouter()

  const handleJarvisClick = () => {
    router.push('/jarvis')
  }

  return (
    <Button variant="outline" size="sm" className="text-xs px-2" onClick={handleJarvisClick}>
      <Bot className="h-3 w-3 mr-1" />
      Jarvis
    </Button>
  )
}