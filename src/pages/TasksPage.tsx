import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Filter, Calendar, CheckCircle2, Circle, Clock, Tag, AlertCircle, MoreVertical, Search } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { Task, TaskPriority, TaskStatus } from '../types/tasks';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { TaskCard } from '../components/tasks/TaskCard';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Textarea } from '../components/ui/Textarea';
import { TaskConversionModal } from '../components/tasks/TaskConversionModal';
import { CalendarEvent } from '../types/calendar';
import { useCalendarStore } from '../store/calendarStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate: Date;
  assignee?: {
    name: string;
    avatar: string;
  };
  tags: string[];
}

const INITIAL_TASKS: Task[] = [
  {
    id: '1',
    title: 'Market Research Analysis',
    description: 'Analyze competitor data and create report',
    status: 'in_progress',
    priority: 'high',
    dueDate: new Date(Date.now() + 86400000 * 2),
    assignee: {
      name: 'Alice Cooper',
      avatar: '👩‍💼'
    },
    tags: ['research', 'analysis']
  },
  {
    id: '2',
    title: 'Update Documentation',
    description: 'Update API documentation with new endpoints',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date(Date.now() + 86400000 * 5),
    tags: ['documentation', 'development']
  },
  {
    id: '3',
    title: 'Client Presentation',
    description: 'Prepare Q1 results presentation',
    status: 'review',
    priority: 'high',
    dueDate: new Date(Date.now() + 86400000),
    assignee: {
      name: 'Bob Smith',
      avatar: '👨‍💼'
    },
    tags: ['presentation', 'client']
  }
];

export function TasksPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { tasks, addTask, updateTask, deleteTask, reorderTasks } = useTaskStore();
  const { addEvent } = useCalendarStore();
  const [showTaskConversion, setShowTaskConversion] = useState(false);
  const [tasksState, setTasksState] = useState<Task[]>(INITIAL_TASKS);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    reorderTasks(result.source.index, result.destination.index);
  };

  const filteredTasks = tasksState.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const columns = [
    { id: 'todo', title: 'To Do', icon: <Clock className="w-5 h-5" /> },
    { id: 'in_progress', title: 'In Progress', icon: <Calendar className="w-5 h-5" /> },
    { id: 'review', title: 'Review', icon: <AlertCircle className="w-5 h-5" /> },
    { id: 'done', title: 'Done', icon: <CheckCircle2 className="w-5 h-5" /> }
  ];

  const getColumnTasks = (columnId: string) =>
    filteredTasks.filter(task => task.status === columnId);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 max-w-7xl mx-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
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

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {columns.map(column => (
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
                        {task.assignee && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            {task.assignee.avatar}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 flex items-center gap-2">
                        <div className={`px-2 py-1 rounded text-xs ${
                          task.priority === 'high' ? 'bg-error/10 text-error' :
                          task.priority === 'medium' ? 'bg-warning/10 text-warning' :
                          'bg-success/10 text-success'
                        }`}>
                          {task.priority}
                        </div>
                        <div className="text-xs text-text-secondary">
                          Due {task.dueDate.toLocaleDateString()}
                        </div>
                      </div>

                      {task.tags.length > 0 && (
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

      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateTask={addTask}
      />

      <TaskConversionModal
        isOpen={showTaskConversion}
        onClose={() => setShowTaskConversion(false)}
        tasks={tasks}
        onConvert={(task: Task) => {
          // Handle task conversion
          const event: CalendarEvent = {
            id: crypto.randomUUID(),
            title: task.title,
            description: task.description,
            startDate: task.dueDate || new Date(),
            endDate: new Date((task.dueDate || new Date()).getTime() + (task.estimatedTime || 60) * 60000),
            type: 'task',
            status: 'scheduled',
            metadata: { taskId: task.id }
          };
          addEvent(event);
        }}
      />
    </motion.div>
  );
}

interface TaskColumnProps {
  title: string;
  tasks: Task[];
  icon: React.ElementType;
  status: TaskStatus;
}

function TaskColumn({ title, tasks, icon: Icon, status }: TaskColumnProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-5 w-5 text-gray-500" />
        <h2 className="font-medium">{title}</h2>
        <span className="ml-auto text-sm text-gray-500">{tasks.length}</span>
      </div>

      <Droppable droppableId={status}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-3"
          >
            <AnimatePresence>
              {tasks.map((task, index) => (
                <Draggable
                  key={task.id}
                  draggableId={task.id}
                  index={index}
                >
                  {(provided) => (
                    <motion.div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <TaskCard task={task} />
                    </motion.div>
                  )}
                </Draggable>
              ))}
            </AnimatePresence>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}