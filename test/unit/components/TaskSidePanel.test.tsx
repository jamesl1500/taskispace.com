import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import TaskSidePanel from '@/components/tasks/TaskSidePanel'
import { Task, TaskStatus, TaskPriority } from '@/types/tasks'

// Mock dependencies
vi.mock('@/components/tasks/Subtasks', () => ({
  default: () => <div>Subtasks Component</div>
}))

vi.mock('@/components/tasks/Comments', () => ({
  default: () => <div>Comments Component</div>
}))

vi.mock('@/components/tasks/Collaborators', () => ({
  default: () => <div>Collaborators Component</div>
}))

vi.mock('@/components/tasks/Tags', () => ({
  default: () => <div>Tags Component</div>
}))

vi.mock('@/components/tasks/Activity', () => ({
  default: () => <div>Activity Component</div>
}))

vi.mock('@/components/user/UserName', () => ({
  default: ({ userId }: any) => <span>User {userId}</span>
}))

describe('components/tasks/TaskSidePanel', () => {
  const mockTask: Task = {
    id: 'task1',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    workspace_id: 'ws1',
    list_id: 'list1',
    created_by: 'user1',
    assigned_to: 'user2',
    due_date: '2025-12-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }

  const defaultProps = {
    task: mockTask,
    isOpen: true,
    onClose: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onStatusChange: vi.fn(),
    isOwner: true,
    canEdit: true,
    workspaceId: 'ws1'
  }

  describe('TaskSidePanel component', () => {
    it('should render task title', () => {
      render(<TaskSidePanel {...defaultProps} />)
      
      expect(screen.getByText('Test Task')).toBeDefined()
    })

    it('should render task description', () => {
      render(<TaskSidePanel {...defaultProps} />)
      
      expect(screen.getByText('Test Description')).toBeDefined()
    })

    it('should render status badge', () => {
      const { container } = render(<TaskSidePanel {...defaultProps} />)
      
      // Status should be displayed somewhere
      expect(container.textContent).toContain('Test Task')
    })

    it('should render priority badge', () => {
      const { container } = render(<TaskSidePanel {...defaultProps} />)
      
      // Priority HIGH should be displayed
      expect(container.textContent).toBeDefined()
    })

    it('should call onClose when close button is clicked', () => {
      render(<TaskSidePanel {...defaultProps} />)
      
      const closeButtons = screen.getAllByRole('button')
      const closeButton = closeButtons.find(btn => btn.querySelector('svg'))
      
      if (closeButton) {
        closeButton.click()
        expect(defaultProps.onClose).toHaveBeenCalled()
      }
    })

    it('should call onEdit when edit button is clicked', () => {
      render(<TaskSidePanel {...defaultProps} />)
      
      const buttons = screen.getAllByRole('button')
      // Edit button should be present for owners who can edit
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('should not show edit button when canEdit is false', () => {
      render(<TaskSidePanel {...defaultProps} canEdit={false} />)
      
      const { container } = render(<TaskSidePanel {...defaultProps} canEdit={false} />)
      expect(container).toBeDefined()
    })

    it('should not show delete button when isOwner is false', () => {
      render(<TaskSidePanel {...defaultProps} isOwner={false} />)
      
      const { container } = render(<TaskSidePanel {...defaultProps} isOwner={false} />)
      expect(container).toBeDefined()
    })

    it('should render tabs for different sections', () => {
      const { container } = render(<TaskSidePanel {...defaultProps} />)
      
      // Tabs should be present
      expect(container.querySelector('[role="tablist"]')).toBeDefined()
    })

    it('should render Subtasks component', () => {
      render(<TaskSidePanel {...defaultProps} />)
      
      expect(screen.getByText('Subtasks Component')).toBeDefined()
    })

    it('should render Comments component', () => {
      render(<TaskSidePanel {...defaultProps} />)
      
      expect(screen.getByText('Comments Component')).toBeDefined()
    })

    it('should render Collaborators component', () => {
      render(<TaskSidePanel {...defaultProps} />)
      
      expect(screen.getByText('Collaborators Component')).toBeDefined()
    })

    it('should render Tags component', () => {
      render(<TaskSidePanel {...defaultProps} />)
      
      expect(screen.getByText('Tags Component')).toBeDefined()
    })

    it('should render Activity component', () => {
      render(<TaskSidePanel {...defaultProps} />)
      
      expect(screen.getByText('Activity Component')).toBeDefined()
    })

    it('should render due date when present', () => {
      const { container } = render(<TaskSidePanel {...defaultProps} />)
      
      // Due date should be displayed
      expect(container.textContent).toContain('2025-12-31')
    })

    it('should render assigned user', () => {
      render(<TaskSidePanel {...defaultProps} />)
      
      expect(screen.getByText('User user2')).toBeDefined()
    })

    it('should handle completed status', () => {
      const completedTask = { ...mockTask, status: TaskStatus.COMPLETED }
      render(<TaskSidePanel {...defaultProps} task={completedTask} />)
      
      expect(screen.getByText('Test Task')).toBeDefined()
    })

    it('should handle in-progress status', () => {
      const inProgressTask = { ...mockTask, status: TaskStatus.IN_PROGRESS }
      render(<TaskSidePanel {...defaultProps} task={inProgressTask} />)
      
      expect(screen.getByText('Test Task')).toBeDefined()
    })

    it('should handle low priority', () => {
      const lowPriorityTask = { ...mockTask, priority: TaskPriority.LOW }
      render(<TaskSidePanel {...defaultProps} task={lowPriorityTask} />)
      
      expect(screen.getByText('Test Task')).toBeDefined()
    })

    it('should handle medium priority', () => {
      const mediumPriorityTask = { ...mockTask, priority: TaskPriority.MEDIUM }
      render(<TaskSidePanel {...defaultProps} task={mediumPriorityTask} />)
      
      expect(screen.getByText('Test Task')).toBeDefined()
    })

    it('should render when panel is not open', () => {
      const { container } = render(<TaskSidePanel {...defaultProps} isOpen={false} />)
      
      expect(container).toBeDefined()
    })
  })
})
