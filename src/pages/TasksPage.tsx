import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Clock, 
  Tag, 
  AlertCircle, 
  MoreVertical, 
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  Menu,
  Loader2,
  AlertTriangle,
  FileText,
  Sparkles
} from 'lucide-react';
import { useTaskStore, Task as StoreTask, TaskStatus, TaskPriority, TaskTemplate } from '../store/taskStore';
import { Task as ComponentTask } from '../types/tasks';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { TaskCard } from '../components/tasks/TaskCard';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Textarea } from '../components/ui/Textarea';
import { TaskConversionModal } from '../components/tasks/TaskConversionModal';
import { CalendarEvent } from '../store/calendarStore';
import { useCalendarStore } from '../store/calendarStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/Table";
import { Checkbox } from '../components/ui/Checkbox';
import { formatDistanceToNow } from 'date-fns';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '../components/ui/DropdownMenu';
import { Badge } from '../components/ui/Badge';
import { Tooltip } from '../components/ui/Tooltip';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';

// View modes
type ViewMode = 'kanban' | 'list';

// Column definition for list view
interface Column {
  id: string;
  name: string;
  accessor: keyof StoreTask | ((task: StoreTask) => React.ReactNode);
  sortable: boolean;
  width?: string;
}

// Helper function to convert store task to component task
const convertStoreTaskToComponentTask = (storeTask: StoreTask): ComponentTask => {
  // Ensure all required properties are present
  const componentTask: ComponentTask = {
    id: storeTask.id,
    title: storeTask.title,
    description: storeTask.description || '', // Convert undefined to empty string
    status: storeTask.status === 'Done' ? 'completed' :
            storeTask.status === 'In Progress' ? 'in-progress' : 'todo',
    priority: storeTask.priority.toLowerCase() as 'high' | 'medium' | 'low',
    createdAt: new Date(storeTask.createdAt),
    updatedAt: storeTask.updatedAt ? new Date(storeTask.updatedAt) : new Date(),
    dueDate: storeTask.dueDate ? new Date(storeTask.dueDate) : undefined,
    assignee: storeTask.assignedTo,
    tags: storeTask.tags || [],
    source: storeTask.notebookId ? {
      type: 'notebook',
      id: storeTask.notebookId
    } : storeTask.workflowId ? {
      type: 'manual',
      id: storeTask.workflowId
    } : undefined
  };
  return componentTask;
};

// Helper function to convert component task to store task
const convertComponentTaskToStoreTask = (componentTask: ComponentTask): Omit<StoreTask, 'id' | 'createdAt' | 'updatedAt'> => {
  // Convert component task to store task format
  const storeTask: Omit<StoreTask, 'id' | 'createdAt' | 'updatedAt'> = {
    title: componentTask.title,
    description: componentTask.description || undefined, // Convert empty string to undefined
    status: componentTask.status === 'completed' ? 'Done' :
            componentTask.status === 'in-progress' ? 'In Progress' : 'To Do',
    priority: (componentTask.priority.charAt(0).toUpperCase() + componentTask.priority.slice(1)) as TaskPriority,
    dueDate: componentTask.dueDate?.toISOString(),
    assignedTo: componentTask.assignee,
    tags: componentTask.tags,
    completed: false,
    templateId: undefined,
    lastModifiedBy: undefined,
    error: undefined,
    notebookId: componentTask.source?.type === 'notebook' ? componentTask.source.id : undefined,
    workflowId: componentTask.source?.type === 'manual' ? componentTask.source.id : undefined
  };
  return storeTask;
};

export function TasksPage() {
  const { 
    tasks, 
    templates,
    isLoading,
    error,
    addTask, 
    updateTask, 
    deleteTask,
    createTaskFromTemplate,
    convertTaskToEvent,
    clearError
  } = useTaskStore();
  
  const { syncTasksToCalendar } = useCalendarStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showTaskConversion, setShowTaskConversion] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [sortConfig, setSortConfig] = useState<{ key: keyof StoreTask | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc',
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  
  // For column reordering in list view
  const [columns, setColumns] = useState<Column[]>([
    { id: 'status', name: 'Status', accessor: 'status', sortable: true, width: '120px' },
    { id: 'title', name: 'Title', accessor: 'title', sortable: true },
    { id: 'priority', name: 'Priority', accessor: 'priority', sortable: true, width: '100px' },
    { id: 'dueDate', name: 'Due Date', accessor: (task) => task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-', sortable: true, width: '120px' },
    { id: 'tags', name: 'Tags', accessor: (task) => (
      <div className="flex flex-wrap gap-1">
        {task.tags?.map(tag => (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    ), sortable: false },
    { id: 'actions', name: 'Actions', accessor: () => null, sortable: false, width: '80px' }
  ]);

  // Convert store tasks to component tasks for the conversion modal
  const componentTasks = useMemo(() => tasks.map(convertStoreTaskToComponentTask), [tasks]);

  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Handle drag end for kanban view
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;
    
    const { source, destination, draggableId } = result;
    
    // If dropped in the same place, do nothing
    if (source.droppableId === destination.droppableId && 
        source.index === destination.index) {
      return;
    }
    
    try {
      // Update the task's status
      await updateTask({
        id: draggableId,
        status: destination.droppableId as TaskStatus
      });
      
      toast.success('Task moved successfully');
    } catch (err) {
      toast.error('Failed to move task');
      console.error('Error moving task:', err);
    }
  };

  // Filter tasks by search query and other filters
  const filteredTasks = useCallback(() => {
    return tasks.filter(task => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(searchLower);
        const descMatch = task.description?.toLowerCase().includes(searchLower);
        const tagMatch = task.tags?.some(tag => tag.toLowerCase().includes(searchLower));
        
        if (!titleMatch && !descMatch && !tagMatch) {
          return false;
        }
      }
      
      return true;
    });
  }, [tasks, searchQuery]);

  // Sort tasks for list view
  const sortedTasks = useCallback(() => {
    let sortableTasks = [...filteredTasks()];
    
    if (sortConfig.key && sortConfig.direction) {
      sortableTasks.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof StoreTask];
        const bValue = b[sortConfig.key as keyof StoreTask];
        
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
  const requestSort = (key: keyof StoreTask) => {
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
    filteredTasks().filter(task => task.status === columnId);

  // Handle column reordering in list view
  const moveColumn = (dragIndex: number, hoverIndex: number) => {
    const draggedColumn = columns[dragIndex];
    const newColumns = [...columns];
    newColumns.splice(dragIndex, 1);
    newColumns.splice(hoverIndex, 0, draggedColumn);
    setColumns(newColumns);
  };

  // Convert task to event handler
  const handleConvertTaskToEvent = useCallback(async (task: ComponentTask) => {
    try {
      // First convert the component task to a store task
      const storeTask = convertComponentTaskToStoreTask(task);
      // Add the task to the store
      const taskId = await addTask(storeTask);
      // Then convert it to an event
      await convertTaskToEvent(taskId);
      setShowTaskConversion(false);
      toast.success('Task converted to calendar event');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to convert task to event');
    }
  }, [addTask, convertTaskToEvent]);

  // Create task from template
  const handleCreateFromTemplate = async (templateId: string) => {
    try {
      await createTaskFromTemplate(templateId);
      toast.success('Task created from template');
      setSelectedTemplate(null);
    } catch (err) {
      toast.error('Failed to create task from template');
      console.error('Error creating task from template:', err);
    }
  };

  // Handle task selection
  const handleTaskSelect = (taskId: string) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  // Handle bulk actions
  const handleBulkAction = async (action: 'delete' | 'complete' | 'convert') => {
    try {
      const selectedTaskIds = Array.from(selectedTasks);
      
      switch (action) {
        case 'delete':
          await Promise.all(selectedTaskIds.map(id => deleteTask(id)));
          toast.success('Selected tasks deleted');
          break;
          
        case 'complete':
          await Promise.all(selectedTaskIds.map(id => 
            updateTask({ id, status: 'Done', completed: true })
          ));
          toast.success('Selected tasks completed');
          break;
          
        case 'convert':
          const tasksToConvert = selectedTaskIds
            .map(id => tasks.find(t => t.id === id))
            .filter((t): t is StoreTask => t !== undefined && t.dueDate !== undefined);
            
          await Promise.all(tasksToConvert.map(task => convertTaskToEvent(task.id)));
          toast.success('Selected tasks converted to events');
          break;
      }
      
      setSelectedTasks(new Set());
    } catch (err) {
      toast.error(`Failed to perform bulk ${action} action`);
      console.error(`Error performing bulk ${action}:`, err);
    }
    };
    
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading tasks...</span>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Tasks</h1>
          
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="kanban" className="flex items-center gap-1">
              <LayoutGrid className="h-4 w-4" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-1">
              <List className="h-4 w-4" />
              List
              </TabsTrigger>
            </TabsList>
          </Tabs>
          </div>
        
        <div className="flex items-center space-x-2">
          {/* Template selector */}
          <Select
            value={selectedTemplate || ''}
            onValueChange={(value) => {
              if (value) {
                handleCreateFromTemplate(value);
              }
              setSelectedTemplate(null);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Create from template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map(template => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Create task button */}
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
        />
      </div>

        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
        
        {selectedTasks.size > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Menu className="h-4 w-4 mr-2" />
                Bulk Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Actions for {selectedTasks.size} tasks</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleBulkAction('complete')}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as Complete
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('convert')}>
                <Calendar className="h-4 w-4 mr-2" />
                Convert to Events
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleBulkAction('delete')}
                className="text-red-600"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Filters panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <Card>
              <CardContent className="p-4">
            <TaskFilters 
              onFilterChange={(filters) => {
                    // Implement filtering logic if needed
                    console.log('Filters changed:', filters);
              }} 
            />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <Card>
        <CardContent className="p-4">
          {viewMode === 'kanban' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
              <div className="grid grid-cols-4 gap-4">
            {kanbanColumns.map(column => (
                  <div key={column.id} className="flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                    {column.icon}
                        <h3 className="font-medium">{column.title}</h3>
                  </div>
                      <Badge variant="secondary">
                        {getColumnTasks(column.id).length}
                      </Badge>
                </div>

                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`
                            flex-1 p-2 rounded-lg min-h-[200px]
                            ${snapshot.isDraggingOver ? 'bg-muted/50' : 'bg-muted/20'}
                          `}
                        >
                          {getColumnTasks(column.id).map((task, index) => {
                            const componentTask = convertStoreTaskToComponentTask(task);
                            return (
                              <Draggable
                                key={task.id}
                                draggableId={task.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`
                                      mb-2
                                      ${snapshot.isDragging ? 'opacity-50' : ''}
                                    `}
                                  >
                                    <TaskCard
                                      task={componentTask}
                                      onToggle={() => updateTask({ 
                                id: task.id, 
                                completed: !task.completed,
                                status: !task.completed ? 'Done' : 'To Do'
                                      })}
                                      onEnhance={() => handleConvertTaskToEvent(componentTask)}
                          />
                        </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                          
                          {getColumnTasks(column.id).length === 0 && (
                            <div className="h-20 border border-dashed rounded-md flex items-center justify-center">
                              <p className="text-sm text-muted-foreground">No tasks</p>
                            </div>
                          )}
                          </div>
                        )}
                    </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedTasks.size === filteredTasks().length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTasks(new Set(filteredTasks().map(t => t.id)));
                        } else {
                          setSelectedTasks(new Set());
                        }
                      }}
                    />
                  </TableHead>
                  {columns.map(column => (
                    <TableHead 
                      key={column.id} 
                      className={column.sortable ? 'cursor-pointer' : ''}
                      onClick={() => column.sortable && requestSort(column.id as keyof StoreTask)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.name}</span>
                        {column.sortable && sortConfig.key === column.id && (
                          sortConfig.direction === 'asc' 
                            ? <ArrowUp className="h-4 w-4" />
                            : <ArrowDown className="h-4 w-4" />
                            )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTasks().map(task => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedTasks.has(task.id)}
                        onCheckedChange={() => handleTaskSelect(task.id)}
                      />
                    </TableCell>
                    {columns.map(column => (
                      <TableCell key={column.id}>
                        {typeof column.accessor === 'function'
                          ? column.accessor(task)
                          : task[column.accessor]}
                    </TableCell>
                    ))}
                  </TableRow>
                ))}
                
                {sortedTasks().length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <FileText className="h-8 w-8 mb-2" />
                        <p>No tasks found</p>
                    <Button
                          variant="link"
                      onClick={() => setShowCreateModal(true)}
                    >
                          Create a task
                    </Button>
                      </div>
                  </TableCell>
                </TableRow>
                )}
              </TableBody>
            </Table>
          )}
          </CardContent>
        </Card>

      {/* Modals */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateTask={async (taskData) => {
          try {
            // Fill in required fields for ComponentTask
            const now = new Date();
            const componentTask: ComponentTask = {
            ...taskData,
            id: crypto.randomUUID(),
              createdAt: now,
              updatedAt: now,
              description: taskData.description || '',
              status: taskData.status || 'todo',
              priority: taskData.priority || 'medium',
            tags: taskData.tags || [],
            };
            const storeTask = convertComponentTaskToStoreTask(componentTask);
            await addTask(storeTask);
            toast.success('Task created successfully');
            setShowCreateModal(false);
          } catch (err) {
            toast.error('Failed to create task');
            console.error('Error creating task:', err);
          }
        }}
      />

      <TaskConversionModal
        isOpen={showTaskConversion}
        onClose={() => setShowTaskConversion(false)}
        tasks={componentTasks.filter(t => t.status !== 'completed' && t.dueDate)}
        onConvert={handleConvertTaskToEvent}
      />
    </div>
  );
}