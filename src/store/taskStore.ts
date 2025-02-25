import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, TaskStatus } from '../types/tasks';

interface TaskStore {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (sourceIndex: number, destinationIndex: number) => void;
  moveTask: (taskId: string, newStatus: TaskStatus) => void;
}

export const useTaskStore = create<TaskStore>()(
  persist(
    (set) => ({
      tasks: [],
      
      addTask: (taskData) => set((state) => ({
        tasks: [
          {
            ...taskData,
            id: crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          ...state.tasks,
        ],
      })),

      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id
            ? { ...task, ...updates, updatedAt: new Date() }
            : task
        ),
      })),

      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      })),

      reorderTasks: (sourceIndex, destinationIndex) => set((state) => {
        const newTasks = [...state.tasks];
        const [removed] = newTasks.splice(sourceIndex, 1);
        newTasks.splice(destinationIndex, 0, removed);
        return { tasks: newTasks };
      }),

      moveTask: (taskId, newStatus) => set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? { ...task, status: newStatus, updatedAt: new Date() }
            : task
        ),
      })),
    }),
    {
      name: 'task-store',
    }
  )
); 