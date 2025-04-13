import React from 'react';
import { Task, TaskStatus } from '../../store/taskStore';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { 
  Clock, 
  Calendar, 
  AlertCircle, 
  CheckCircle2,
  Plus,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';

interface TaskBoardProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onUpdateTask: (task: Partial<Task> & { id: string }) => void;
  onDeleteTask: (id: string) => void;
  onCreateTask: (task: Task) => void;
}

// Get the icon for a task status
const getStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case 'To Do':
      return <Clock className="w-4 h-4 text-blue-500" />;
    case 'In Progress':
      return <Calendar className="w-4 h-4 text-amber-500" />;
    case 'Blocked':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'Done':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    default:
      return <Clock className="w-4 h-4 text-blue-500" />;
  }
};

// Get the color for a task priority
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'Medium':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
    case 'Low':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Urgent':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
};

export function TaskBoard({ tasks, onSelectTask, onUpdateTask, onDeleteTask, onCreateTask }: TaskBoardProps) {
  // Define columns for the kanban board
  const columns = [
    { id: 'To Do', title: 'To Do', icon: <Clock className="w-5 h-5 text-blue-500" /> },
    { id: 'In Progress', title: 'In Progress', icon: <Calendar className="w-5 h-5 text-amber-500" /> },
    { id: 'Blocked', title: 'Blocked', icon: <AlertCircle className="w-5 h-5 text-red-500" /> },
    { id: 'Done', title: 'Done', icon: <CheckCircle2 className="w-5 h-5 text-green-500" /> }
  ];

  // Get tasks for a specific column
  const getColumnTasks = (columnId: string) => 
    tasks.filter(task => task.status === columnId);

  // Handle drag end for kanban board
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    const taskId = result.draggableId;
    const sourceColumn = source.droppableId;
    const destinationColumn = destination.droppableId;
    
    if (sourceColumn !== destinationColumn) {
      // If task is moved to a different column, update its status
      onUpdateTask({ id: taskId, status: destinationColumn as TaskStatus });
    }
  };

  // Create a placeholder task for the given column
  const handleCreateNewTask = (columnId: TaskStatus) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: 'New Task',
      description: '',
      status: columnId,
      priority: 'Medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completed: false,
      tags: []
    };
    
    onCreateTask(newTask);
    onSelectTask(newTask); // Open task for editing immediately
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {columns.map(column => (
          <div key={column.id} className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {column.icon}
                <h3 className="text-sm font-medium">{column.title}</h3>
                <Badge variant="outline" className="ml-2">
                  {getColumnTasks(column.id).length}
                </Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => handleCreateNewTask(column.id as TaskStatus)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <Droppable droppableId={column.id}>
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="bg-muted/30 rounded-lg p-2 flex-1 min-h-[50vh]"
                >
                  {getColumnTasks(column.id).map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="mb-2 cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => onSelectTask(task)}
                        >
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-sm font-medium line-clamp-2">{task.title}</h4>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectTask(task);
                                  }}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteTask(task.id);
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                {task.description}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between mt-2">
                              <Badge variant="secondary" className={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                              
                              {task.dueDate && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(task.dueDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {task.tags.slice(0, 3).map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {task.tags.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{task.tags.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
} 