import { useState, useEffect, useCallback } from 'react';
import { Task, TaskFilter, TaskStats } from '../types/tasks';
import { taskService } from '../services/tasks/taskService';

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [stats, setStats] = useState<TaskStats | null>(null);

  // Load tasks with optional filtering
  const loadTasks = useCallback(async (filter?: TaskFilter) => {
    setLoading(true);
    setError(null);
    try {
      const loadedTasks = await taskService.getTasks(filter);
      setTasks(loadedTasks);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load tasks'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Load task statistics
  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const taskStats = await taskService.getTaskStats();
      setStats(taskStats);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load task statistics'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new task
  const createTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const newTask = await taskService.createTask(task);
      setTasks(prevTasks => [...prevTasks, newTask]);
      return newTask;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create task'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update an existing task
  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedTask = await taskService.updateTask(id, updates);
      if (!updatedTask) throw new Error('Task not found');
      setTasks(prevTasks =>
        prevTasks.map(task => (task.id === id ? updatedTask : task))
      );
      return updatedTask;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update task'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a task
  const deleteTask = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await taskService.deleteTask(id);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete task'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a subtask
  const createSubTask = useCallback(async (parentId: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const newSubTask = await taskService.createSubTask(parentId, task);
      if (!newSubTask) throw new Error('Failed to create subtask');
      setTasks(prevTasks => [...prevTasks, newSubTask]);
      return newSubTask;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create subtask'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update task status
  const updateTaskStatus = useCallback(async (id: string, status: Task['status']) => {
    return updateTask(id, { status });
  }, [updateTask]);

  // Update task priority
  const updateTaskPriority = useCallback(async (id: string, priority: Task['priority']) => {
    return updateTask(id, { priority });
  }, [updateTask]);

  // Add tags to a task
  const addTags = useCallback(async (id: string, tags: string[]) => {
    const task = tasks.find(t => t.id === id);
    if (!task) throw new Error('Task not found');
    const updatedTags = [...new Set([...(task.tags || []), ...tags])];
    return updateTask(id, { tags: updatedTags });
  }, [tasks, updateTask]);

  // Remove tags from a task
  const removeTags = useCallback(async (id: string, tagsToRemove: string[]) => {
    const task = tasks.find(t => t.id === id);
    if (!task) throw new Error('Task not found');
    const updatedTags = (task.tags || []).filter(tag => !tagsToRemove.includes(tag));
    return updateTask(id, { tags: updatedTags });
  }, [tasks, updateTask]);

  // Assign task to user
  const assignTask = useCallback(async (id: string, assignee: string) => {
    return updateTask(id, { assignee });
  }, [updateTask]);

  // Set task due date
  const setDueDate = useCallback(async (id: string, dueDate: Date) => {
    return updateTask(id, { dueDate });
  }, [updateTask]);

  // Get tasks by project
  const getTasksByProject = useCallback(async (projectId: string) => {
    setLoading(true);
    setError(null);
    try {
      const projectTasks = await taskService.getTasksByProject(projectId);
      setTasks(projectTasks);
      return projectTasks;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load project tasks'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get tasks by notebook
  const getTasksByNotebook = useCallback(async (notebookId: string) => {
    setLoading(true);
    setError(null);
    try {
      const notebookTasks = await taskService.getTasksByNotebook(notebookId);
      setTasks(notebookTasks);
      return notebookTasks;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load notebook tasks'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get tasks by workflow
  const getTasksByWorkflow = useCallback(async (workflowId: string) => {
    setLoading(true);
    setError(null);
    try {
      const workflowTasks = await taskService.getTasksByWorkflow(workflowId);
      setTasks(workflowTasks);
      return workflowTasks;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load workflow tasks'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    loadTasks();
    loadStats();
  }, [loadTasks, loadStats]);

  return {
    tasks,
    loading,
    error,
    stats,
    loadTasks,
    loadStats,
    createTask,
    updateTask,
    deleteTask,
    createSubTask,
    updateTaskStatus,
    updateTaskPriority,
    addTags,
    removeTags,
    assignTask,
    setDueDate,
    getTasksByProject,
    getTasksByNotebook,
    getTasksByWorkflow
  };
} 