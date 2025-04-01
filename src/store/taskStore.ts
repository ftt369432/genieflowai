import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
}

interface TaskState {
  tasks: Task[];
  currentFilter: TaskFilter;
  addTask: (task: Task) => void;
  updateTask: (task: Partial<Task> & { id: string }) => void;
  deleteTask: (id: string) => void;
  getTasks: () => Task[];
  getTaskById: (id: string) => Task | undefined;
  startTask: (id: string) => void;
  completeTask: (id: string) => void;
  cancelTask: (id: string) => void;
  addSubTask: (parentId: string, task: Partial<Task> & { title: string }) => string;
  getFilteredTasks: () => Task[];
  setFilter: (filter: Partial<TaskFilter>) => void;
  getTasksForTimeBlock: (timeBlockId: string) => Task[];
  getTasksForProject: (projectId: string) => Task[];
  getTasksForNotebook: (notebookId: string) => Task[];
  getTasksForWorkflow: (workflowId: string) => Task[];
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [
        {
          id: '1',
          title: 'Finish project proposal',
          description: 'Complete the draft and send for review',
          status: 'In Progress',
          priority: 'High',
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
          completed: false,
          createdAt: new Date().toISOString(),
          tags: ['work', 'project']
        },
        {
          id: '2',
          title: 'Schedule team meeting',
          description: 'Weekly sync with engineering team',
          status: 'To Do',
          priority: 'Medium',
          dueDate: new Date(Date.now() + 86400000 * 1).toISOString(), // 1 day from now
          completed: false,
          createdAt: new Date().toISOString(),
          tags: ['work', 'meeting']
        },
        {
          id: '3',
          title: 'Research new technologies',
          description: 'Look into new frontend frameworks',
          status: 'To Do',
          priority: 'Low',
          dueDate: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
          completed: false,
          createdAt: new Date().toISOString(),
          tags: ['research', 'personal']
        },
        {
          id: '4',
          title: 'Prepare presentation',
          description: 'Create slides for client meeting',
          status: 'Blocked',
          priority: 'Urgent',
          dueDate: new Date(Date.now() + 86400000 * 1).toISOString(), // 1 day from now
          completed: false,
          createdAt: new Date().toISOString(),
          tags: ['work', 'client']
        },
        {
          id: '5',
          title: 'Review pull requests',
          description: 'Check pending PRs in the repository',
          status: 'Done',
          priority: 'Medium',
          dueDate: new Date(Date.now() - 86400000 * 1).toISOString(), // 1 day ago
          completed: true,
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['work', 'code']
        }
      ],
      currentFilter: {},
      
      addTask: (task) => set((state) => ({ 
        tasks: [...state.tasks, task] 
      })),
      
      updateTask: (updatedTask) => set((state) => ({
        tasks: state.tasks.map(task => 
          task.id === updatedTask.id
            ? { ...task, ...updatedTask, updatedAt: new Date().toISOString() }
            : task
        )
      })),
      
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(task => task.id !== id)
      })),
      
      startTask: (id) => {
        const now = new Date();
        set((state) => ({
          tasks: state.tasks.map(task => 
            task.id === id
              ? {
                  ...task,
                  status: 'In Progress',
                  updatedAt: now.toISOString()
                }
              : task
          )
        }));
      },
      
      completeTask: (id) => {
        const now = new Date();
        set((state) => ({
          tasks: state.tasks.map(task => 
            task.id === id
              ? {
                  ...task,
                  status: 'Done',
                  completed: true,
                  updatedAt: now.toISOString()
                }
              : task
          )
        }));
      },
      
      cancelTask: (id) => {
        const now = new Date();
        set((state) => ({
          tasks: state.tasks.map(task => 
            task.id === id
              ? {
                  ...task,
                  status: 'Blocked',
                  updatedAt: now.toISOString()
                }
              : task
          )
        }));
      },
      
      addSubTask: (parentId, task) => {
        const now = new Date();
        const id = Math.random().toString(36).substring(2, 9);
        
        set((state) => {
          // Add the subtask
          const newTasks = [
            ...state.tasks,
            {
              ...task,
              id,
              parentTaskId: parentId,
              createdAt: now.toISOString(),
              updatedAt: now.toISOString(),
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
                    updatedAt: now.toISOString()
                  }
                : t
            )
          };
        });
        
        return id;
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
            
            if (!titleMatch && !descMatch) {
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
        // For simplicity, we're just returning an empty array
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
      }
    }),
    {
      name: 'task-storage',
    }
  )
); 