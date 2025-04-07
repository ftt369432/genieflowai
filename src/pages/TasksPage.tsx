import React, { useState, useMemo } from 'react';
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
  Menu
} from 'lucide-react';
import { useTaskStore, Task, TaskStatus, TaskPriority } from '../store/taskStore';
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
  DropdownMenuTrigger
} from '../components/ui/DropdownMenu';
import { Badge } from '../components/ui/Badge';
import { Tooltip } from '../components/ui/Tooltip';
import { Task as TasksTypeTask } from '../types/tasks';

// View modes
type ViewMode = 'kanban' | 'list';

// Column definition for list view
interface Column {
  id: string;
  name: string;
  accessor: keyof Task | ((task: Task) => React.ReactNode);
  sortable: boolean;
  width?: string;
}

// Create an adapter function to convert store task type to TasksTypeTask
const adaptTaskForConversion = (task: Task): TasksTypeTask => {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status === 'To Do' ? 'todo' :
           task.status === 'In Progress' ? 'in-progress' :
           'completed',
    priority: task.priority === 'High' ? 'high' :
             task.priority === 'Medium' ? 'medium' : 'low',
    dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
    tags: task.tags || [],
    assignedTo: task.assignedTo,
    createdAt: new Date(task.createdAt),
    updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
    estimatedTime: undefined // Add if your store task has this property
  };
};

export function TasksPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { tasks, addTask, updateTask, deleteTask } = useTaskStore();
  const { addEvent } = useCalendarStore();
  const [showTaskConversion, setShowTaskConversion] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Task | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc',
  });
  
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

  // Handle drag end for kanban view
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    // Simple implementation without the reorderTasks function
    // This is a placeholder for the actual reordering logic
    console.log('Reordering tasks:', result.source.index, result.destination.index);
  };

  // Filter tasks by search query
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      false
    );
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

  // Handle column reordering in list view
  const moveColumn = (dragIndex: number, hoverIndex: number) => {
    const draggedColumn = columns[dragIndex];
    const newColumns = [...columns];
    newColumns.splice(dragIndex, 1);
    newColumns.splice(hoverIndex, 0, draggedColumn);
    setColumns(newColumns);
  };

  // Convert task to event handler
  const handleConvertTaskToEvent = (task: Task) => {
    // Create a calendar event object compatible with your calendar store
    const event: Omit<CalendarEvent, 'id'> = {
      title: task.title,
      description: task.description || '',
      start: task.dueDate ? new Date(task.dueDate) : new Date(),
      end: task.dueDate 
        ? new Date(new Date(task.dueDate).getTime() + 60 * 60000) 
        : new Date(Date.now() + 60 * 60000),
      allDay: false,
      sourceId: 'tasks',
      taskId: task.id,
      tags: task.tags || [],
      completed: task.completed
    };
    
    // Add the event to the calendar store
    addEvent(event);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 max-w-7xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <Button
              onClick={() => setViewMode('kanban')}
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              className="flex items-center gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              Board
            </Button>
            <Button
              onClick={() => setViewMode('list')}
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="flex items-center gap-2"
            >
              <List className="h-4 w-4" />
              List
            </Button>
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
          <Button
            onClick={() => setShowTaskConversion(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            To Calendar
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <Input
          type="search"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-6"
          >
            <TaskFilters 
              onFilterChange={(filters) => {
                // Implement filtering logic
              }} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kanbanColumns.map(column => (
              <div key={column.id} className="space-y-4">
                {/* Column Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {column.icon}
                    <h3 className="font-semibold text-text-primary">{column.title}</h3>
                    <span className="text-sm text-text-secondary">
                      ({getColumnTasks(column.id).length})
                    </span>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>

                {/* Tasks */}
                <div className="space-y-3">
                  {getColumnTasks(column.id).map(task => (
                    <Card key={task.id} className="cursor-pointer hover:border-primary/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium text-text-primary">{task.title}</h4>
                            <p className="text-sm text-text-secondary line-clamp-2">
                              {task.description}
                            </p>
                          </div>
                          <Checkbox 
                            checked={task.completed} 
                            onCheckedChange={() => {
                              updateTask({ 
                                id: task.id, 
                                completed: !task.completed,
                                status: !task.completed ? 'Done' : 'To Do'
                              });
                            }}
                          />
                        </div>
                        
                        <div className="mt-3 flex items-center gap-2">
                          <div className={`px-2 py-1 rounded text-xs ${
                            task.priority === 'Urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            task.priority === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                            task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {task.priority}
                          </div>
                          {task.dueDate && (
                            <div className="text-xs text-text-secondary">
                              Due {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>

                        {task.tags && task.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {task.tags.map(tag => (
                              <span
                                key={tag}
                                className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setShowTaskConversion(true)}>
                                Convert to Calendar Event
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                updateTask({ 
                                  id: task.id, 
                                  completed: !task.completed,
                                  status: !task.completed ? 'Done' : 'To Do'
                                });
                              }}>
                                Mark as {task.completed ? 'Incomplete' : 'Complete'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => deleteTask(task.id)}>
                                Delete Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {getColumnTasks(column.id).length === 0 && (
                    <div className="p-4 rounded-lg border border-dashed border-border text-center">
                      <p className="text-sm text-text-secondary">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox />
                  </TableHead>
                  {columns.map((column, index) => (
                    <TableHead 
                      key={column.id} 
                      className={`${column.width ? column.width : ''}`}
                    >
                      <div className="flex items-center gap-1 select-none">
                        <span>{column.name}</span>
                        {column.sortable && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5"
                            onClick={() => requestSort(column.id as keyof Task)}
                          >
                            {sortConfig.key === column.id ? (
                              sortConfig.direction === 'asc' ? (
                                <ArrowUp className="h-3 w-3" />
                              ) : (
                                <ArrowDown className="h-3 w-3" />
                              )
                            ) : (
                              <ArrowUpDown className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-5 w-5 ml-auto"
                        >
                          <Menu className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTasks.map(task => (
                  <TableRow key={task.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                    <TableCell>
                      <Checkbox 
                        checked={task.completed} 
                        onCheckedChange={() => {
                          updateTask({ 
                            id: task.id, 
                            completed: !task.completed,
                            status: !task.completed ? 'Done' : 'To Do'
                          });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={task.status === 'Done' ? 'success' : task.status === 'Blocked' ? 'destructive' : task.status === 'In Progress' ? 'default' : 'outline'}>
                          {task.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className={task.completed ? 'line-through text-gray-500' : ''}>
                          {task.title}
                        </span>
                        {task.description && (
                          <span className="text-xs text-gray-500 truncate max-w-md">
                            {task.description}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        task.priority === 'Urgent' ? 'destructive' :
                        task.priority === 'High' ? 'secondary' :
                        task.priority === 'Medium' ? 'secondary' :
                        'outline'
                      }>
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {task.tags?.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setShowTaskConversion(true)}>
                              Convert to Calendar Event
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              updateTask({ 
                                id: task.id, 
                                completed: !task.completed,
                                status: !task.completed ? 'Done' : 'To Do'
                              });
                            }}>
                              Mark as {task.completed ? 'Incomplete' : 'Complete'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteTask(task.id)}>
                              Delete Task
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Empty row for adding new task */}
                <TableRow className="bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                  <TableCell colSpan={7}>
                    <Button
                      variant="ghost"
                      className="w-full h-8 flex items-center justify-center gap-2 text-gray-500"
                      onClick={() => setShowCreateModal(true)}
                    >
                      <Plus className="h-4 w-4" />
                      Add New Task
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateTask={(taskData) => {
          // Add ID and other required fields and ensure the status is properly formatted
          const storeTask: Task = {
            ...taskData,
            id: crypto.randomUUID(),
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: taskData.status === 'completed' ? 'Done' : 
                    taskData.status === 'in-progress' ? 'In Progress' : 'To Do',
            priority: (taskData.priority?.charAt(0).toUpperCase() + taskData.priority?.slice(1)) as TaskPriority,
            tags: taskData.tags || [],
            dueDate: taskData.dueDate ? taskData.dueDate.toISOString() : undefined
          };
          addTask(storeTask);
        }}
      />

      <TaskConversionModal
        isOpen={showTaskConversion}
        onClose={() => setShowTaskConversion(false)}
        tasks={tasks.map(adaptTaskForConversion)}
        onConvert={(typesTask) => {
          // Find the original task in the store
          const storeTask = tasks.find(t => t.id === typesTask.id);
          if (storeTask) {
            handleConvertTaskToEvent(storeTask);
          }
        }}
      />
    </motion.div>
  );
}