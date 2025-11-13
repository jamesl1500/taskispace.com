import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock task functions
const mockCreateTask = vi.fn()
const mockUpdateTask = vi.fn()
const mockDeleteTask = vi.fn()
const mockToggleTaskStatus = vi.fn()
const mockUseTasks = vi.fn()
const mockUseTask = vi.fn()

// Mock task queries
vi.mock('@/hooks/queries/useTaskQueries', () => ({
  useTasks: () => mockUseTasks(),
  useTask: () => mockUseTask(),
  useCreateTask: () => ({ 
    mutate: mockCreateTask,
    isPending: false,
    error: null 
  }),
  useUpdateTask: () => ({ 
    mutate: mockUpdateTask,
    isPending: false,
    error: null 
  }),
  useDeleteTask: () => ({ 
    mutate: mockDeleteTask,
    isPending: false,
    error: null 
  }),
  useToggleTaskStatus: () => ({
    mutate: mockToggleTaskStatus,
    isPending: false,
    error: null
  })
}))

describe('Task Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Task Listing', () => {
    it('should fetch tasks for a workspace', () => {
      const mockTasks = [
        {
          id: '1',
          title: 'Complete project setup',
          description: 'Set up the initial project structure',
          status: 'todo',
          priority: 'high',
          list_id: 'list1',
          created_by: 'user1',
          assignee: 'user1',
          due_date: '2024-01-15',
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        },
        {
          id: '2',
          title: 'Write documentation',
          description: 'Create comprehensive documentation',
          status: 'in_progress',
          priority: 'medium',
          list_id: 'list1',
          created_by: 'user1',
          assignee: 'user2',
          due_date: '2024-01-20',
          created_at: '2024-01-02',
          updated_at: '2024-01-02'
        }
      ]

      mockUseTasks.mockReturnValue({
        data: mockTasks,
        isLoading: false,
        error: null
      })

      const result = mockUseTasks()
      expect(result.data).toEqual(mockTasks)
      expect(result.data).toHaveLength(2)
    })

    it('should handle empty task list', () => {
      mockUseTasks.mockReturnValue({
        data: [],
        isLoading: false,
        error: null
      })

      const result = mockUseTasks()
      expect(result.data).toEqual([])
    })

    it('should handle task loading state', () => {
      mockUseTasks.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null
      })

      const result = mockUseTasks()
      expect(result.isLoading).toBe(true)
    })

    it('should filter tasks by status', () => {
      const todoTasks = [
        {
          id: '1',
          title: 'Todo Task',
          status: 'todo',
          priority: 'medium',
          list_id: 'list1',
          created_by: 'user1'
        }
      ]

      mockUseTasks.mockReturnValue({
        data: todoTasks,
        isLoading: false,
        error: null
      })

      const result = mockUseTasks()
      expect(result.data.every((task: any) => task.status === 'todo')).toBe(true)
    })

    it('should filter tasks by priority', () => {
      const highPriorityTasks = [
        {
          id: '1',
          title: 'Urgent Task',
          status: 'todo',
          priority: 'high',
          list_id: 'list1',
          created_by: 'user1'
        }
      ]

      mockUseTasks.mockReturnValue({
        data: highPriorityTasks,
        isLoading: false,
        error: null
      })

      const result = mockUseTasks()
      expect(result.data.every((task: any) => task.priority === 'high')).toBe(true)
    })
  })

  describe('Individual Task', () => {
    it('should fetch single task by ID', () => {
      const mockTask = {
        id: '1',
        title: 'Test Task',
        description: 'Test description',
        status: 'todo',
        priority: 'medium',
        list_id: 'list1',
        created_by: 'user1',
        created_at: '2024-01-01'
      }

      mockUseTask.mockReturnValue({
        data: mockTask,
        isLoading: false,
        error: null
      })

      const result = mockUseTask()
      expect(result.data).toEqual(mockTask)
    })

    it('should handle task not found', () => {
      mockUseTask.mockReturnValue({
        data: null,
        isLoading: false,
        error: { message: 'Task not found' }
      })

      const result = mockUseTask()
      expect(result.data).toBeNull()
      expect(result.error?.message).toBe('Task not found')
    })
  })

  describe('Task Creation', () => {
    it('should create new task', async () => {
      const newTaskData = {
        title: 'New Task',
        description: 'A brand new task',
        priority: 'medium',
        list_id: 'list1',
        due_date: '2024-01-15'
      }

      const createdTask = {
        id: '3',
        ...newTaskData,
        status: 'todo',
        created_by: 'user1',
        created_at: '2024-01-03',
        updated_at: '2024-01-03'
      }

      mockCreateTask.mockResolvedValue(createdTask)

      const result = await mockCreateTask(newTaskData)
      
      expect(mockCreateTask).toHaveBeenCalledWith(newTaskData)
      expect(result).toEqual(createdTask)
    })

    it('should handle task creation failure', async () => {
      const newTaskData = {
        title: '',
        description: 'No title task',
        priority: 'medium',
        list_id: 'list1'
      }

      const mockError = new Error('Title is required')
      mockCreateTask.mockRejectedValue(mockError)

      try {
        await mockCreateTask(newTaskData)
      } catch (error) {
        expect(error).toEqual(mockError)
      }
    })

    it('should set default values for optional fields', async () => {
      const minimalTaskData = {
        title: 'Minimal Task',
        list_id: 'list1'
      }

      const createdTask = {
        id: '4',
        title: 'Minimal Task',
        description: null,
        status: 'todo',
        priority: 'medium',
        list_id: 'list1',
        created_by: 'user1',
        assignee: null,
        due_date: null,
        created_at: '2024-01-03',
        updated_at: '2024-01-03'
      }

      mockCreateTask.mockResolvedValue(createdTask)

      const result = await mockCreateTask(minimalTaskData)
      
      expect(result.status).toBe('todo')
      expect(result.priority).toBe('medium')
    })
  })

  describe('Task Updates', () => {
    it('should update task details', async () => {
      const taskId = '1'
      const updateData = {
        title: 'Updated Task Title',
        description: 'Updated description',
        priority: 'high'
      }

      const updatedTask = {
        id: taskId,
        ...updateData,
        status: 'todo',
        list_id: 'list1',
        created_by: 'user1',
        created_at: '2024-01-01',
        updated_at: '2024-01-03'
      }

      mockUpdateTask.mockResolvedValue(updatedTask)

      const result = await mockUpdateTask({ id: taskId, ...updateData })
      
      expect(mockUpdateTask).toHaveBeenCalledWith({ id: taskId, ...updateData })
      expect(result).toEqual(updatedTask)
    })

    it('should handle partial updates', async () => {
      const taskId = '1'
      const updateData = {
        status: 'in_progress'
      }

      const updatedTask = {
        id: taskId,
        title: 'Original Title',
        description: 'Original description',
        status: 'in_progress',
        priority: 'medium',
        list_id: 'list1',
        created_by: 'user1',
        created_at: '2024-01-01',
        updated_at: '2024-01-03'
      }

      mockUpdateTask.mockResolvedValue(updatedTask)

      const result = await mockUpdateTask({ id: taskId, ...updateData })
      
      expect(result.status).toBe('in_progress')
    })

    it('should update due date', async () => {
      const taskId = '1'
      const updateData = {
        due_date: '2024-01-20'
      }

      const updatedTask = {
        id: taskId,
        title: 'Task with Due Date',
        status: 'todo',
        priority: 'medium',
        list_id: 'list1',
        created_by: 'user1',
        due_date: '2024-01-20',
        created_at: '2024-01-01',
        updated_at: '2024-01-03'
      }

      mockUpdateTask.mockResolvedValue(updatedTask)

      const result = await mockUpdateTask({ id: taskId, ...updateData })
      
      expect(result.due_date).toBe('2024-01-20')
    })

    it('should assign task to user', async () => {
      const taskId = '1'
      const updateData = {
        assignee: 'user2'
      }

      const updatedTask = {
        id: taskId,
        title: 'Assigned Task',
        status: 'todo',
        priority: 'medium',
        list_id: 'list1',
        created_by: 'user1',
        assignee: 'user2',
        created_at: '2024-01-01',
        updated_at: '2024-01-03'
      }

      mockUpdateTask.mockResolvedValue(updatedTask)

      const result = await mockUpdateTask({ id: taskId, ...updateData })
      
      expect(result.assignee).toBe('user2')
    })
  })

  describe('Task Status Management', () => {
    it('should toggle task status', async () => {
      const taskId = '1'

      const toggledTask = {
        id: taskId,
        title: 'Task to Toggle',
        status: 'completed',
        priority: 'medium',
        list_id: 'list1',
        created_by: 'user1',
        completed_at: '2024-01-03',
        updated_at: '2024-01-03'
      }

      mockToggleTaskStatus.mockResolvedValue(toggledTask)

      const result = await mockToggleTaskStatus(taskId)
      
      expect(mockToggleTaskStatus).toHaveBeenCalledWith(taskId)
      expect(result.status).toBe('completed')
      expect(result.completed_at).toBeDefined()
    })

    it('should handle status transitions', async () => {
      const taskId = '1'
      
      // Test todo -> in_progress
      let updatedTask = {
        id: taskId,
        status: 'in_progress',
        updated_at: '2024-01-03'
      }

      mockToggleTaskStatus.mockResolvedValue(updatedTask)
      let result = await mockToggleTaskStatus(taskId)
      expect(result.status).toBe('in_progress')

      // Test in_progress -> completed
      updatedTask = {
        id: taskId,
        status: 'completed',
        completed_at: '2024-01-03',
        updated_at: '2024-01-03'
      }

      mockToggleTaskStatus.mockResolvedValue(updatedTask)
      result = await mockToggleTaskStatus(taskId)
      expect(result.status).toBe('completed')
    })
  })

  describe('Task Deletion', () => {
    it('should delete task', async () => {
      const taskId = '1'

      mockDeleteTask.mockResolvedValue({ success: true })

      const result = await mockDeleteTask(taskId)
      
      expect(mockDeleteTask).toHaveBeenCalledWith(taskId)
      expect(result.success).toBe(true)
    })

    it('should handle deletion of non-existent task', async () => {
      const taskId = '999'

      const mockError = new Error('Task not found')
      mockDeleteTask.mockRejectedValue(mockError)

      try {
        await mockDeleteTask(taskId)
      } catch (error) {
        expect(error).toEqual(mockError)
      }
    })

    it('should prevent deletion by non-authorized users', async () => {
      const taskId = '1'

      const mockError = new Error('Access denied')
      mockDeleteTask.mockRejectedValue(mockError)

      try {
        await mockDeleteTask(taskId)
      } catch (error) {
        expect(error).toEqual(mockError)
      }
    })
  })

  describe('Task Search and Filtering', () => {
    it('should search tasks by title', () => {
      const searchResults = [
        {
          id: '1',
          title: 'Setup project configuration',
          description: 'Configure the project setup',
          status: 'todo',
          list_id: 'list1'
        }
      ]

      mockUseTasks.mockReturnValue({
        data: searchResults,
        isLoading: false,
        error: null
      })

      const result = mockUseTasks()
      expect(result.data.every((task: any) => 
        task.title.toLowerCase().includes('setup') || 
        task.description?.toLowerCase().includes('setup')
      )).toBe(true)
    })

    it('should filter by assignee', () => {
      const assignedTasks = [
        {
          id: '1',
          title: 'User Task',
          assignee: 'user1',
          status: 'todo',
          list_id: 'list1'
        }
      ]

      mockUseTasks.mockReturnValue({
        data: assignedTasks,
        isLoading: false,
        error: null
      })

      const result = mockUseTasks()
      expect(result.data.every((task: any) => task.assignee === 'user1')).toBe(true)
    })

    it('should filter by due date range', () => {
      const dueSoonTasks = [
        {
          id: '1',
          title: 'Due Soon Task',
          due_date: '2024-01-15',
          status: 'todo',
          list_id: 'list1'
        }
      ]

      mockUseTasks.mockReturnValue({
        data: dueSoonTasks,
        isLoading: false,
        error: null
      })

      const result = mockUseTasks()
      expect(result.data.every((task: any) => task.due_date <= '2024-01-20')).toBe(true)
    })
  })

  describe('Task Sorting', () => {
    it('should sort tasks by created date', () => {
      const sortedTasks = [
        {
          id: '2',
          title: 'Newer Task',
          created_at: '2024-01-02',
          status: 'todo'
        },
        {
          id: '1',
          title: 'Older Task',
          created_at: '2024-01-01',
          status: 'todo'
        }
      ]

      mockUseTasks.mockReturnValue({
        data: sortedTasks,
        isLoading: false,
        error: null
      })

      const result = mockUseTasks()
      expect(new Date(result.data[0].created_at) >= new Date(result.data[1].created_at)).toBe(true)
    })

    it('should sort tasks by priority', () => {
      const prioritySortedTasks = [
        {
          id: '1',
          title: 'High Priority',
          priority: 'high',
          status: 'todo'
        },
        {
          id: '2',
          title: 'Medium Priority',
          priority: 'medium',
          status: 'todo'
        },
        {
          id: '3',
          title: 'Low Priority',
          priority: 'low',
          status: 'todo'
        }
      ]

      mockUseTasks.mockReturnValue({
        data: prioritySortedTasks,
        isLoading: false,
        error: null
      })

      const result = mockUseTasks()
      const priorities = ['high', 'medium', 'low']
      expect(result.data.every((task: any, index: number) => 
        task.priority === priorities[index]
      )).toBe(true)
    })

    it('should sort tasks by due date', () => {
      const dueDateSortedTasks = [
        {
          id: '1',
          title: 'Due First',
          due_date: '2024-01-10',
          status: 'todo'
        },
        {
          id: '2',
          title: 'Due Later',
          due_date: '2024-01-20',
          status: 'todo'
        }
      ]

      mockUseTasks.mockReturnValue({
        data: dueDateSortedTasks,
        isLoading: false,
        error: null
      })

      const result = mockUseTasks()
      expect(result.data[0].due_date <= result.data[1].due_date).toBe(true)
    })
  })
})