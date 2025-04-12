import React, { useState, useEffect, useMemo } from 'react';
import { useTaskStore, Task, TaskStatus, TaskPriority } from '../store/taskStore';
import { TaskViewSwitcher, TaskViewType } from '../components/tasks/TaskViewSwitcher';
import { TaskDataGrid } from '../components/tasks/TaskDataGrid';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Clock, 
  Calendar, 
  AlertCircle, 
  CheckCircle2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Menu,
  Brain
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { useParams, useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Checkbox } from '../components/ui/Checkbox';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/DropdownMenu';
import { TaskAIHelper } from '../components/tasks/TaskAIHelper';
import { TaskBoard } from '../components/tasks/TaskBoard';
import { TaskList } from '../components/tasks/TaskList';

export function TaskPage() {
  const { viewType: viewParam } = useParams<{ viewType?: string }>();
  const navigate = useNavigate();
  const [viewType, setViewType] = useState<TaskViewType>(
    viewParam === 'board' || viewParam === 'list' || viewParam === 'grid' 
      ? viewParam 
      : 'grid'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Task | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc',
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAISidebar, setShowAISidebar] = useState(false);
  
  // Get tasks from task store
  const { 
    tasks, 
    addTask, 
    updateTask, 
    deleteTask 
  } = useTaskStore();
  
  // Update URL when view type changes
  useEffect(() => {
    // If we're on the base /tasks route (no viewParam) or the viewParam doesn't match the current view
    if (!viewParam || viewParam !== viewType) {
      navigate(`/tasks/${viewType}`, { replace: true });
    }
  }, [viewType, viewParam, navigate]);

  // Filter tasks based on search query
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (!searchQuery) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query)) ||
        (task.tags && task.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    });
  }, [tasks, searchQuery]);
  
  // Sort tasks for list view
  const sortedTasks = useMemo(() => {
    let sortableTasks = [...filteredTasks];
    
    if (sortConfig.key && sortConfig.direction) {
      sortableTasks.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Task];
        const bValue = b[sortConfig.key as keyof Task];
        
        if (aValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return sortableTasks;
  }, [filteredTasks, sortConfig.key, sortConfig.direction]);

  // Request sort by column
  const requestSort = (key: keyof Task) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };
  
  // Kanban board columns
  const kanbanColumns = [
    { id: 'To Do', title: 'To Do', icon: <Clock className="w-5 h-5" /> },
    { id: 'In Progress', title: 'In Progress', icon: <Calendar className="w-5 h-5" /> },
    { id: 'Blocked', title: 'Blocked', icon: <AlertCircle className="w-5 h-5" /> },
    { id: 'Done', title: 'Done', icon: <CheckCircle2 className="w-5 h-5" /> }
  ];

  // Get tasks for a kanban column
  const getColumnTasks = (columnId: string) =>
    filteredTasks.filter(task => task.status === columnId);
    
  // Handle drag end for kanban view
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    const taskId = result.draggableId;
    const sourceColumn = source.droppableId;
    const destinationColumn = destination.droppableId;
    
    if (sourceColumn !== destinationColumn) {
      // If task is moved to a different column, update its status
      updateTask({ id: taskId, status: destinationColumn as TaskStatus });
    }
  };
  
  // Handle task selection
  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    if (!showAISidebar) {
      setShowAISidebar(true);
    }
  };
  
  // Handle creating a new task
  const handleCreateTask = (task: Task) => {
    addTask(task);
  };
  
  // Handle updating a task
  const handleUpdateTask = (updatedTask: Partial<Task> & { id: string }) => {
    updateTask(updatedTask);
    
    // If this was the selected task, update the selected task reference
    if (selectedTask && selectedTask.id === updatedTask.id) {
      setSelectedTask({ ...selectedTask, ...updatedTask });
    }
  };
  
  // Handle deleting a task
  const handleDeleteTask = (id: string) => {
    deleteTask(id);
    
    // If this was the selected task, clear the selection
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask(null);
    }
  };
  
  // Handle view type change
  const handleViewChange = (newView: TaskViewType) => {
    setViewType(newView);
  };

  // Column definition for list view
  const columns = [
    { id: 'status', name: 'Status', accessor: 'status', sortable: true, width: '120px' },
    { id: 'title', name: 'Title', accessor: 'title', sortable: true },
    { id: 'priority', name: 'Priority', accessor: 'priority', sortable: true, width: '100px' },
    { id: 'dueDate', name: 'Due Date', accessor: 'dueDate', sortable: true, width: '120px' },
    { id: 'tags', name: 'Tags', accessor: 'tags', sortable: false, width: '200px' },
    { id: 'actions', name: 'Actions', accessor: 'id', sortable: false, width: '80px' }
  ];
  
  // Apply AI enhancements to a task
  const handleAIEnhanceTask = (enhancedTask: Task) => {
    // Update the task in the store
    handleUpdateTask({
      id: enhancedTask.id,
      ...enhancedTask
    });
    
    // Update the selected task
    setSelectedTask(enhancedTask);
  };
  
  // Render the appropriate view based on viewType
  const renderTaskView = () => {
    const commonProps = {
      tasks,
      onSelectTask: handleTaskSelect,
      onUpdateTask: handleUpdateTask,
      onDeleteTask: handleDeleteTask,
      onCreateTask: handleCreateTask,
    };

    switch (viewType) {
      case 'board':
        return <TaskBoard {...commonProps} />;
      case 'list':
        return <TaskList {...commonProps} />;
      case 'grid':
        return <TaskDataGrid {...commonProps} />;
      default:
        return <TaskBoard {...commonProps} />;
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
          <TaskViewSwitcher activeView={viewType} onViewChange={handleViewChange} />
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            New Task
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2"
            onClick={() => setShowAISidebar(!showAISidebar)}
          >
            <Brain className="h-4 w-4 mr-1" />
            AI Assistant
          </Button>
        </div>
      </div>
      
      <div className="flex gap-6">
        <div className={`flex-1 bg-background rounded-lg border shadow-sm overflow-hidden ${!showAISidebar ? 'w-full' : 'w-3/4'}`}>
          {renderTaskView()}
        </div>
        
        {showAISidebar && (
          <div className="w-1/4">
            <TaskAIHelper 
              selectedTask={selectedTask}
              onEnhanceTask={handleAIEnhanceTask}
            />
          </div>
        )}
      </div>
    </div>
  );
} 