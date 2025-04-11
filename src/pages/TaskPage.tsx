import React, { useState } from 'react';
import { useTaskStore, Task } from '../store/taskStore';
import { TaskViewSwitcher, TaskViewType } from '../components/tasks/TaskViewSwitcher';
import { TaskDataGrid } from '../components/tasks/TaskDataGrid';
import { TaskBoard } from '../components/tasks/TaskBoard';
import { TaskList } from '../components/tasks/TaskList';
import { Button } from '../components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Plus, Search, Filter } from 'lucide-react';
import { Input } from '../components/ui/Input';

export function TaskPage() {
  const [viewType, setViewType] = useState<TaskViewType>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Get tasks from task store
  const { 
    tasks, 
    addTask, 
    updateTask, 
    deleteTask, 
    completeTask 
  } = useTaskStore();
  
  // Filter tasks based on search query
  const filteredTasks = tasks.filter(task => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(query) ||
      (task.description && task.description.toLowerCase().includes(query)) ||
      (task.tags && task.tags.some(tag => tag.toLowerCase().includes(query)))
    );
  });
  
  // Handle creating a new task
  const handleCreateTask = (task: Task) => {
    addTask(task);
  };
  
  // Handle updating a task
  const handleUpdateTask = (updatedTask: Partial<Task> & { id: string }) => {
    updateTask(updatedTask);
  };
  
  // Handle deleting a task
  const handleDeleteTask = (id: string) => {
    deleteTask(id);
  };
  
  // Render the appropriate view based on viewType
  const renderTaskView = () => {
    switch (viewType) {
      case 'board':
        return (
          <TaskBoard 
            tasks={filteredTasks}
            onTaskUpdate={handleUpdateTask}
            onTaskDelete={handleDeleteTask}
            onTaskCreate={handleCreateTask}
          />
        );
      case 'list':
        return (
          <TaskList 
            tasks={filteredTasks}
            onTaskUpdate={handleUpdateTask}
            onTaskDelete={handleDeleteTask}
            onTaskCreate={handleCreateTask}
          />
        );
      case 'grid':
      default:
        return (
          <TaskDataGrid 
            tasks={filteredTasks}
            onTaskUpdate={handleUpdateTask}
            onTaskDelete={handleDeleteTask}
            onTaskCreate={handleCreateTask}
          />
        );
    }
  };
  
  return (
    <div className="container px-4 py-6 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <TaskViewSwitcher activeView={viewType} onViewChange={setViewType} />
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Task
          </Button>
        </div>
      </div>
      
      <div className="bg-background rounded-lg border shadow-sm">
        {renderTaskView()}
      </div>
    </div>
  );
} 