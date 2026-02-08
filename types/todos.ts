/**
 * Types for Todo items.
 * 
 * @module types/todos
 */

/**
 * Todo Item
 * @interface Todo
 */
export interface Todo {
  id: string;
  task_id: string;
  assignee_id?: string;
  todo_name: string;
  todo_position: number;
  todo_completed: boolean;
  todo_duedate?: Date;
  todo_priority?: 'low' | 'medium' | 'high';
  created_at: Date;
}

/**
 * Todo Creation Data
 * @interface TodoCreationData
 */
export interface TodoCreationData {
  task_id: string;
  assignee_id?: string;
  todo_name: string;
  todo_position?: number;
  todo_duedate?: Date;
  todo_priority?: 'low' | 'medium' | 'high';
}

/**
 * Todo Update Data
 * @interface TodoUpdateData
 */
export interface TodoUpdateData {
  assignee_id?: string;
  todo_name?: string;
  todo_position?: number;
  todo_completed?: boolean;
  todo_duedate?: Date;
  todo_priority?: 'low' | 'medium' | 'high';
}