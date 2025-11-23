'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  X, 
  Edit, 
  CheckCircle, 
  Trash2, 
  Clock, 
  User,
  Calendar,
  AlertCircle,
  MessageCircle,
  Users,
  Tag as TagIcon,
  Activity as ActivityIcon,
  CheckSquare
} from 'lucide-react'
import { Task, TaskStatus, TaskPriority } from '@/types/tasks'
import Subtasks from './Subtasks'
import Comments from './Comments'
import Collaborators from './Collaborators'
import Tags from './Tags'
import Activity from './Activity'
import UserName from '../user/UserName'

interface TaskSidePanelProps {
  task: Task
  isOpen: boolean
  onClose: () => void
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onStatusChange: (task: Task, status: TaskStatus) => void
  isOwner: boolean
  canEdit: boolean
  workspaceId: string
}

export default function TaskSidePanel({
  task,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  isOwner,
  canEdit,
  workspaceId
}: TaskSidePanelProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const handleStatusToggle = useCallback(() => {
    const newStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED
    onStatusChange(task, newStatus)
  }, [task, onStatusChange])

  const handleDelete = useCallback(() => {
    if (confirm('Are you sure you want to delete this task?')) {
      onDelete(task)
      onClose()
    }
  }, [task, onDelete, onClose])

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'bg-red-100 text-red-800 border-red-200'
      case TaskPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case TaskPriority.LOW:
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800 border-green-200'
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case TaskStatus.TODO:
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop Overlay */}
      <div 
        className="fixed inset-0 bg-black/70 z-40"
        onClick={onClose}
      />
      
      {/* Side Panel */}
      <div className="fixed right-0 top-0 h-screen w-[600px] bg-white border-l border-gray-200 shadow-lg z-50 flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0 mr-4">
              <h2 className="text-xl font-bold text-gray-900 mb-2 break-words">
                {task.title}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`${getStatusColor(task.status)} border`}>
                  {task.status === TaskStatus.COMPLETED && <CheckCircle className="h-3 w-3 mr-1" />}
                  {task.status === TaskStatus.IN_PROGRESS && <Clock className="h-3 w-3 mr-1" />}
                  {task.status === TaskStatus.TODO && <AlertCircle className="h-3 w-3 mr-1" />}
                  {task.status === TaskStatus.COMPLETED ? 'Completed' : 
                   task.status === TaskStatus.IN_PROGRESS ? 'In Progress' : 'Todo'}
                </Badge>
                <Badge className={`${getPriorityColor(task.priority)} border`}>
                  {task.priority} Priority
                </Badge>
                {task.due_date && (
                  <Badge variant="outline" className="border-orange-200 text-orange-800">
                    <Calendar className="h-3 w-3 mr-1" />
                    Due {new Date(task.due_date).toLocaleDateString()}
                  </Badge>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            {canEdit && (
              <>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(task)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={handleStatusToggle}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {task.status === TaskStatus.COMPLETED ? 'Mark Incomplete' : 'Mark Complete'}
                </Button>
              </>
            )}
            {(isOwner || canEdit) && (
              <Button 
                size="sm"
                variant="outline"
                onClick={handleDelete}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="flex-shrink-0 border-b border-gray-200 px-6 bg-gray-100">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="overview" className="text-xs">
                  <User className="h-3 w-3 mr-1" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="subtasks" className="text-xs">
                  <CheckSquare className="h-3 w-3 mr-1" />
                  Subtasks
                </TabsTrigger>
                <TabsTrigger value="comments" className="text-xs">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Comments
                </TabsTrigger>
                <TabsTrigger value="collaborators" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  Team
                </TabsTrigger>
                <TabsTrigger value="tags" className="text-xs">
                  <TagIcon className="h-3 w-3 mr-1" />
                  Tags
                </TabsTrigger>
                <TabsTrigger value="activity" className="text-xs">
                  <ActivityIcon className="h-3 w-3 mr-1" />
                  Activity
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <TabsContent value="overview" className="p-6 space-y-6 m-0">
                {/* Description */}
                {task.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Description</h4>
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                        {task.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Task Metadata */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Task Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4 border space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500 block">Created</span>
                        <span className="text-gray-900">
                          {new Date(task.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Last Updated</span>
                        <span className="text-gray-900">
                          {new Date(task.updated_at).toLocaleString()}
                        </span>
                      </div>
                      {task.completed_at && (
                        <>
                          <div>
                            <span className="text-gray-500 block">Completed</span>
                            <span className="text-gray-900">
                              {new Date(task.completed_at).toLocaleString()}
                            </span>
                          </div>
                        </>
                      )}
                      {task.assignee && (
                        <div>
                          <span className="text-gray-500 block">Assignee</span>
                          <span className="text-gray-900">{task.assignee}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500 block">Created By</span>
                        <span className="text-gray-900">
                          <UserName userId={task.created_by} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="subtasks" className="p-6 m-0">
                <Subtasks 
                  taskId={task.id} 
                  canEdit={canEdit}
                />
              </TabsContent>

              <TabsContent value="comments" className="p-6 m-0">
                <Comments 
                  taskId={task.id} 
                  canComment={canEdit || isOwner}
                />
              </TabsContent>

              <TabsContent value="collaborators" className="p-6 m-0">
                <Collaborators 
                  taskId={task.id} 
                  canManage={isOwner || canEdit}
                />
              </TabsContent>

              <TabsContent value="tags" className="p-6 m-0">
                <Tags 
                  taskId={task.id} 
                  workspaceId={workspaceId}
                  canEdit={canEdit || isOwner}
                />
              </TabsContent>

              <TabsContent value="activity" className="p-6 m-0">
                <Activity taskId={task.id} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </>
  )
}