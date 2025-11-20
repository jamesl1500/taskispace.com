/**
 * New Task Page
 * Provides a form for creating a new task.
 *
 * @returns {JSX.Element} The new task page component.
 */
'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { NewTaskForm } from '@/components/tasks/NewTaskForm'
import { Button } from '@/components/ui/button'

export default function NewTaskPage() {
  return (
    <div className="min-h-screen bg-gray-200 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <Link href="/tasks">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Tasks
            </Button>
          </Link>
        </div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Create New Task
          </h1>
          <p className="text-muted-foreground">
            Add a new task to your workspace
          </p>
        </div>
        <NewTaskForm />
      </div>
    </div>
  )
}