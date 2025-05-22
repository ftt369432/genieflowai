import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type TaskStatus = 'To Do' | 'In Progress' | 'Blocked' | 'Done';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completed: boolean;
  createdAt: string;
  updatedAt?: string;
  assignedTo?: string;
  tags?: string[];
  projectId?: string;
  workflowId?: string;
  notebookId?: string;
  parentTaskId?: string;
  subTasks?: string[];
  estimatedTime?: number;
  templateId?: string;
  lastModifiedBy?: string;
  error?: string;
}

// Task template for quick task creation
export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  defaultPriority: TaskPriority;
  defaultTags: string[];
  defaultEstimatedTime?: number;
  defaultStatus: TaskStatus;
}

interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  projectId?: string;
  notebookId?: string;
  workflowId?: string;
  search?: string;
  completed?: boolean;
  tags?: string[];
  dueBefore?: Date;
  dueAfter?: Date;
  templateId?: string;
}

interface TaskState {
  tasks: Task[];
  templates: TaskTemplate[];
  currentFilter: TaskFilter;
  isLoading: boolean;
  error: string | null;
  
  // Task CRUD
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateTask: (task: Partial<Task> & { id: string }) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  getTasks: () => Task[];
  getTaskById: (id: string) => Task | undefined;
  
  // Task status management
  startTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  cancelTask: (id: string) => Promise<void>;
  
  // Subtask management
  addSubTask: (parentId: string, task: Partial<Task> & { title: string }) => Promise<string>;
  
  // Task filtering and sorting
  getFilteredTasks: () => Task[];
  setFilter: (filter: Partial<TaskFilter>) => void;
  
  // Task grouping
  getTasksForTimeBlock: (timeBlockId: string) => Task[];
  getTasksForProject: (projectId: string) => Task[];
  getTasksForNotebook: (notebookId: string) => Task[];
  getTasksForWorkflow: (workflowId: string) => Task[];
  
  // Template management
  addTemplate: (template: Omit<TaskTemplate, 'id'>) => Promise<string>;
  updateTemplate: (id: string, updates: Partial<TaskTemplate>) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  createTaskFromTemplate: (templateId: string, overrides?: Partial<Task>) => Promise<string>;
  
  // Task conversion
  convertTaskToEvent: (taskId: string) => Promise<string>;
  convertEventToTask: (eventId: string) => Promise<string>;
  
  // Error handling
  clearError: () => void;
  setError: (error: string) => void;
}

// Default task templates
const defaultTemplates: TaskTemplate[] = [
  {
    id: 'default-meeting',
    name: 'Meeting',
    description: 'Schedule and prepare for a meeting',
    defaultPriority: 'Medium',
    defaultTags: ['meeting', 'work'],
    defaultEstimatedTime: 60,
    defaultStatus: 'To Do'
  },
  {
    id: 'default-research',
    name: 'Research',
    description: 'Research and analyze a topic',
    defaultPriority: 'Medium',
    defaultTags: ['research', 'analysis'],
    defaultEstimatedTime: 120,
    defaultStatus: 'To Do'
  },
  {
    id: 'default-review',
    name: 'Review',
    description: 'Review and provide feedback',
    defaultPriority: 'High',
    defaultTags: ['review', 'feedback'],
    defaultEstimatedTime: 45,
    defaultStatus: 'To Do'
  }
];

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      templates: defaultTemplates,
      currentFilter: {},
      isLoading: false,
      error: null,
      
      addTask: async (task) => {
        try {
          set({ isLoading: true, error: null });
          const id = uuidv4();
          const now = new Date().toISOString();
          
          const newTask: Task = {
            ...task,
            id,
            createdAt: now,
            updatedAt: now,
            completed: false,
            status: task.status || 'To Do',
            priority: task.priority || 'Medium',
            tags: task.tags || []
          };
          
          set(state => ({ tasks: [...state.tasks, newTask] }));
          return id;
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to add task';
          set({ error });
          throw new Error(error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      updateTask: async (updatedTask) => {
        try {
          set({ isLoading: true, error: null });
          const now = new Date().toISOString();
          
          set(state => ({
            tasks: state.tasks.map(task => 
              task.id === updatedTask.id
                ? { ...task, ...updatedTask, updatedAt: now }
                : task
            )
          }));
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to update task';
          set({ error });
          throw new Error(error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      deleteTask: async (id) => {
        try {
          set({ isLoading: true, error: null });
          
          // First, delete all subtasks
          const task = get().tasks.find(t => t.id === id);
          if (task?.subTasks?.length) {
            set(state => ({
              tasks: state.tasks.filter(t => !task.subTasks?.includes(t.id))
            }));
          }
          
          // Then delete the task itself
          set(state => ({
            tasks: state.tasks.filter(task => task.id !== id)
          }));
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to delete task';
          set({ error });
          throw new Error(error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      startTask: async (id) => {
        try {
          set({ isLoading: true, error: null });
          const now = new Date().toISOString();
          
          set(state => ({
            tasks: state.tasks.map(task => 
              task.id === id
                ? {
                    ...task,
                    status: 'In Progress',
                    updatedAt: now
                  }
                : task
            )
          }));
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to start task';
          set({ error });
          throw new Error(error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      completeTask: async (id) => {
        try {
          set({ isLoading: true, error: null });
          const now = new Date().toISOString();
          
          set(state => ({
            tasks: state.tasks.map(task => 
              task.id === id
                ? {
                    ...task,
                    status: 'Done',
                    completed: true,
                    updatedAt: now
                  }
                : task
            )
          }));
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to complete task';
          set({ error });
          throw new Error(error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      cancelTask: async (id) => {
        try {
          set({ isLoading: true, error: null });
          const now = new Date().toISOString();
          
          set(state => ({
            tasks: state.tasks.map(task => 
              task.id === id
                ? {
                    ...task,
                    status: 'Blocked',
                    updatedAt: now
                  }
                : task
            )
          }));
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to cancel task';
          set({ error });
          throw new Error(error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      addSubTask: async (parentId, task) => {
        try {
          set({ isLoading: true, error: null });
          const now = new Date().toISOString();
          const id = uuidv4();
          
          set(state => {
            // Add the subtask
            const newTasks = [
              ...state.tasks,
              {
                ...task,
                id,
                parentTaskId: parentId,
                createdAt: now,
                updatedAt: now,
                completed: false,
                status: task.status || 'To Do',
                priority: task.priority || 'Medium',
                tags: task.tags || []
              }
            ];
            
            // Update the parent task's subTasks array
            return {
              tasks: newTasks.map(t => 
                t.id === parentId
                  ? {
                      ...t,
                      subTasks: [...(t.subTasks || []), id],
                      updatedAt: now
                    }
                  : t
              )
            };
          });
          
          return id;
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to add subtask';
          set({ error });
          throw new Error(error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      getTasks: () => get().tasks,
      
      getTaskById: (id) => get().tasks.find(task => task.id === id),
      
      getFilteredTasks: () => {
        const { tasks, currentFilter } = get();
        
        return tasks.filter(task => {
          // Status filter
          if (currentFilter.status && task.status !== currentFilter.status) {
            return false;
          }
          
          // Priority filter
          if (currentFilter.priority && task.priority !== currentFilter.priority) {
            return false;
          }
          
          // Assignee filter
          if (currentFilter.assigneeId && task.assignedTo !== currentFilter.assigneeId) {
            return false;
          }
          
          // Project filter
          if (currentFilter.projectId && task.projectId !== currentFilter.projectId) {
            return false;
          }
          
          // Notebook filter
          if (currentFilter.notebookId && task.notebookId !== currentFilter.notebookId) {
            return false;
          }
          
          // Workflow filter
          if (currentFilter.workflowId && task.workflowId !== currentFilter.workflowId) {
            return false;
          }
          
          // Template filter
          if (currentFilter.templateId && task.templateId !== currentFilter.templateId) {
            return false;
          }
          
          // Completed filter
          if (currentFilter.completed !== undefined && task.completed !== currentFilter.completed) {
            return false;
          }
          
          // Tag filter
          if (currentFilter.tags && currentFilter.tags.length > 0) {
            if (!task.tags || !currentFilter.tags.some(tag => task.tags?.includes(tag))) {
              return false;
            }
          }
          
          // Search filter
          if (currentFilter.search) {
            const searchLower = currentFilter.search.toLowerCase();
            const titleMatch = task.title.toLowerCase().includes(searchLower);
            const descMatch = task.description?.toLowerCase().includes(searchLower);
            const tagMatch = task.tags?.some(tag => tag.toLowerCase().includes(searchLower));
            
            if (!titleMatch && !descMatch && !tagMatch) {
              return false;
            }
          }
          
          // Due date filters
          if (currentFilter.dueBefore && task.dueDate && new Date(task.dueDate) > currentFilter.dueBefore) {
            return false;
          }
          
          if (currentFilter.dueAfter && task.dueDate && new Date(task.dueDate) < currentFilter.dueAfter) {
            return false;
          }
          
          return true;
        });
      },
      
      setFilter: (filter) => set((state) => ({
        currentFilter: { ...state.currentFilter, ...filter }
      })),
      
      getTasksForTimeBlock: (timeBlockId) => {
        // This would typically connect to a relation between tasks and time blocks
        return [];
      },
      
      getTasksForProject: (projectId) => {
        return get().tasks.filter(task => task.projectId === projectId);
      },
      
      getTasksForNotebook: (notebookId) => {
        return get().tasks.filter(task => task.notebookId === notebookId);
      },
      
      getTasksForWorkflow: (workflowId) => {
        return get().tasks.filter(task => task.workflowId === workflowId);
      },
      
      // Template management
      addTemplate: async (template) => {
        try {
          set({ isLoading: true, error: null });
          const id = uuidv4();
          
          set(state => ({
            templates: [...state.templates, { ...template, id }]
          }));
          
          return id;
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to add template';
          set({ error });
          throw new Error(error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      updateTemplate: async (id, updates) => {
        try {
          set({ isLoading: true, error: null });
          
          set(state => ({
            templates: state.templates.map(template => 
              template.id === id ? { ...template, ...updates } : template
            )
          }));
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to update template';
          set({ error });
          throw new Error(error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      deleteTemplate: async (id) => {
        try {
          set({ isLoading: true, error: null });
          
          set(state => ({
            templates: state.templates.filter(template => template.id !== id)
          }));
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to delete template';
          set({ error });
          throw new Error(error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      createTaskFromTemplate: async (templateId, overrides = {}) => {
        try {
          set({ isLoading: true, error: null });
          
          const template = get().templates.find(t => t.id === templateId);
          if (!template) {
            throw new Error('Template not found');
          }
          
          const taskId = await get().addTask({
            title: overrides.title || template.name,
            description: overrides.description || template.description,
            priority: overrides.priority || template.defaultPriority,
            status: overrides.status || template.defaultStatus,
            tags: overrides.tags || template.defaultTags,
            estimatedTime: overrides.estimatedTime || template.defaultEstimatedTime,
            templateId: template.id,
            completed: false,
            ...overrides
          });
          
          return taskId;
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to create task from template';
          set({ error });
          throw new Error(error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Task conversion
      convertTaskToEvent: async (taskId) => {
        try {
          set({ isLoading: true, error: null });
          
          const task = get().tasks.find(t => t.id === taskId);
          if (!task) {
            throw new Error('Task not found');
          }
          
          if (!task.dueDate) {
            throw new Error('Task must have a due date to convert to event');
          }
          
          // This would typically call the calendar store to create an event
          // For now, we'll just return a mock event ID
          const eventId = uuidv4();
          
          // Update the task to link it to the event
          await get().updateTask({
            id: taskId,
            workflowId: eventId // Using workflowId as a temporary link to the event
          });
          
          return eventId;
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to convert task to event';
          set({ error });
          throw new Error(error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      convertEventToTask: async (eventId) => {
        try {
          set({ isLoading: true, error: null });
          
          // This would typically get the event from the calendar store
          // For now, we'll just create a mock task
          const taskId = await get().addTask({
            title: 'Task from Event',
            status: 'To Do',
            priority: 'Medium',
            workflowId: eventId, // Using workflowId as a temporary link to the event
            completed: false // Ensure completed is set
          });
          
          return taskId;
        } catch (err) {
          const error = err instanceof Error ? err.message : 'Failed to convert event to task';
          set({ error });
          throw new Error(error);
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Error handling
      clearError: () => set({ error: null }),
      setError: (error) => set({ error })
    }),
    {
      name: 'task-storage',
    }
  )
); 