import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/Table";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Checkbox } from "../ui/Checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/Popover";
import { Textarea } from "../ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";
import { Task, TaskPriority, TaskStatus } from "../../store/taskStore";
import { format } from 'date-fns';
import {
  MoreHorizontal,
  Calendar,
  ChevronDown,
  Check,
  ArrowUpDown,
  Plus,
  Tag,
  Edit,
  Trash2,
  AlignJustify,
  ArrowUp,
  ArrowDown,
  GripVertical
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "../ui/DropdownMenu";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Column configuration interface
export interface DataGridColumn {
  id: string;
  name: string;
  type: 'text' | 'select' | 'date' | 'checkbox' | 'multiselect' | 'tags' | 'longtext';
  accessor: keyof Task | ((task: Task) => React.ReactNode);
  editable?: boolean;
  options?: string[];
  width?: string;
  sortable?: boolean;
}

// Default columns configuration
const defaultColumns: DataGridColumn[] = [
  { 
    id: 'checkbox', 
    name: '', 
    type: 'checkbox', 
    accessor: 'completed' as keyof Task, 
    width: '40px',
    editable: true
  },
  { 
    id: 'title', 
    name: 'Title', 
    type: 'text', 
    accessor: 'title',
    editable: true,
    sortable: true
  },
  { 
    id: 'status', 
    name: 'Status', 
    type: 'select', 
    accessor: 'status',
    options: ['To Do', 'In Progress', 'Blocked', 'Done'],
    editable: true,
    sortable: true,
    width: '150px'
  },
  { 
    id: 'priority', 
    name: 'Priority', 
    type: 'select', 
    accessor: 'priority',
    options: ['Low', 'Medium', 'High', 'Urgent'],
    editable: true,
    sortable: true,
    width: '120px'
  },
  { 
    id: 'dueDate', 
    name: 'Due Date', 
    type: 'date', 
    accessor: 'dueDate',
    editable: true,
    sortable: true,
    width: '150px'
  },
  { 
    id: 'tags', 
    name: 'Tags', 
    type: 'tags', 
    accessor: 'tags',
    editable: true,
    width: '200px'
  },
  { 
    id: 'description', 
    name: 'Description', 
    type: 'longtext', 
    accessor: 'description',
    editable: true
  }
];

interface TaskDataGridProps {
  tasks: Task[];
  onTaskUpdate: (task: Partial<Task> & { id: string }) => void;
  onTaskDelete: (id: string) => void;
  onTaskCreate: (task: Task) => void;
}

export function TaskDataGrid({ tasks, onTaskUpdate, onTaskDelete, onTaskCreate }: TaskDataGridProps) {
  const [columns, setColumns] = useState<DataGridColumn[]>(defaultColumns);
  const [editingCell, setEditingCell] = useState<{ taskId: string; columnId: string } | null>(null);
  const [tempCellValue, setTempCellValue] = useState<any>('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [newTask, setNewTask] = useState<Task | null>(null);

  // Create a sorted copy of tasks based on sort configuration
  const sortedTasks = useMemo(() => {
    if (!sortConfig) return tasks;
    
    return [...tasks].sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Task];
      const bValue = b[sortConfig.key as keyof Task];
      
      if (aValue === undefined || aValue === null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bValue === undefined || bValue === null) return sortConfig.direction === 'asc' ? 1 : -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      
      return 0;
    });
  }, [tasks, sortConfig]);

  // Handle sorting when a column header is clicked
  const handleSort = (columnId: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig && sortConfig.key === columnId && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key: columnId, direction });
  };

  // Begin editing a cell
  const handleCellClick = (taskId: string, columnId: string, value: any) => {
    const column = columns.find(col => col.id === columnId);
    if (!column?.editable) return;
    
    setEditingCell({ taskId, columnId });
    setTempCellValue(value !== undefined ? value : '');
  };

  // Save the edited cell value
  const handleCellSave = () => {
    if (!editingCell) return;
    
    const { taskId, columnId } = editingCell;
    const column = columns.find(col => col.id === columnId);
    
    if (column && typeof column.accessor === 'string') {
      onTaskUpdate({ id: taskId, [column.accessor]: tempCellValue });
    }
    
    setEditingCell(null);
    setTempCellValue('');
  };

  // Cancel editing a cell
  const handleCellCancel = () => {
    setEditingCell(null);
    setTempCellValue('');
  };

  // Toggle a checkbox cell
  const handleCheckboxToggle = (taskId: string, columnId: string, checked: boolean) => {
    const column = columns.find(col => col.id === columnId);
    
    if (column && typeof column.accessor === 'string') {
      onTaskUpdate({ id: taskId, [column.accessor]: checked });
    }
  };

  // Handle select change
  const handleSelectChange = (taskId: string, columnId: string, value: string) => {
    const column = columns.find(col => col.id === columnId);
    
    if (column && typeof column.accessor === 'string') {
      onTaskUpdate({ id: taskId, [column.accessor]: value });
    }
  };

  // Handle tag addition
  const handleAddTag = (taskId: string, tag: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const updatedTags = [...(task.tags || []), tag];
    onTaskUpdate({ id: taskId, tags: updatedTags });
  };

  // Handle tag removal
  const handleRemoveTag = (taskId: string, tagToRemove: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const updatedTags = (task.tags || []).filter(tag => tag !== tagToRemove);
    onTaskUpdate({ id: taskId, tags: updatedTags });
  };

  // Handle column reordering
  const handleColumnReorder = (result: any) => {
    if (!result.destination) return;
    
    const reorderedColumns = [...columns];
    const [removed] = reorderedColumns.splice(result.source.index, 1);
    reorderedColumns.splice(result.destination.index, 0, removed);
    
    setColumns(reorderedColumns);
  };

  // Create a new empty task
  const handleCreateNewTask = () => {
    const newTaskTemplate: Task = {
      id: `task-${Date.now()}`,
      title: '',
      description: '',
      status: 'To Do' as TaskStatus,
      priority: 'Medium' as TaskPriority,
      createdAt: new Date().toISOString(),
      tags: [],
      completed: false
    };
    
    setNewTask(newTaskTemplate);
  };

  // Save the new task
  const handleSaveNewTask = () => {
    if (!newTask) return;
    onTaskCreate(newTask);
    setNewTask(null);
  };

  // Cancel new task creation
  const handleCancelNewTask = () => {
    setNewTask(null);
  };

  // Update new task field
  const handleNewTaskChange = (field: keyof Task, value: any) => {
    if (!newTask) return;
    setNewTask({ ...newTask, [field]: value });
  };

  // Render cell content based on column type
  const renderCellContent = (task: Task, column: DataGridColumn) => {
    // If we're editing this cell, show the editor
    if (editingCell && editingCell.taskId === task.id && editingCell.columnId === column.id) {
      switch (column.type) {
        case 'text':
          return (
            <Input
              autoFocus
              value={tempCellValue}
              onChange={(e) => setTempCellValue(e.target.value)}
              onBlur={handleCellSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCellSave();
                if (e.key === 'Escape') handleCellCancel();
              }}
            />
          );
        
        case 'longtext':
          return (
            <Textarea
              autoFocus
              value={tempCellValue}
              onChange={(e) => setTempCellValue(e.target.value)}
              onBlur={handleCellSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) handleCellSave();
                if (e.key === 'Escape') handleCellCancel();
              }}
            />
          );
        
        case 'select':
          return (
            <div className="w-full">
              <Select onValueChange={(value) => {
                setTempCellValue(value);
                setTimeout(handleCellSave, 100);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={tempCellValue || "Select..."} />
                </SelectTrigger>
                <SelectContent>
                  {column.options?.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        
        case 'date':
          return (
            <Input
              type="date"
              autoFocus
              value={tempCellValue ? new Date(tempCellValue).toISOString().split('T')[0] : ''}
              onChange={(e) => setTempCellValue(e.target.value)}
              onBlur={handleCellSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCellSave();
                if (e.key === 'Escape') handleCellCancel();
              }}
            />
          );
        
        default:
          return null;
      }
    }
    
    // Otherwise, show the formatted content
    if (typeof column.accessor === 'function') {
      return column.accessor(task);
    }
    
    const value = task[column.accessor as keyof Task];
    
    switch (column.type) {
      case 'checkbox':
        return (
          <Checkbox
            checked={!!value}
            onCheckedChange={(checked) => 
              handleCheckboxToggle(task.id, column.id, checked === true)
            }
          />
        );
      
      case 'text':
        return (
          <div className={task.completed ? 'line-through text-muted-foreground' : ''}>
            {value as string}
          </div>
        );
      
      case 'longtext':
        return value ? (
          <div className="max-w-md truncate" title={value as string}>
            {value as string}
          </div>
        ) : null;
      
      case 'select':
        const getSelectColor = () => {
          // Return appropriate color based on value
          if (column.id === 'status') {
            switch (value) {
              case 'Done': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
              case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
              case 'Blocked': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
              default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
            }
          }
          
          if (column.id === 'priority') {
            switch (value) {
              case 'Urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
              case 'High': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
              case 'Medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
              case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
              default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
            }
          }
          
          return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
        };
        
        return value ? (
          <div className="w-full">
            <Select onValueChange={(newValue) => 
              handleSelectChange(task.id, column.id, newValue)
            }>
              <SelectTrigger className={getSelectColor()}>
                <SelectValue placeholder={value as string} />
              </SelectTrigger>
              <SelectContent>
                {column.options?.map(option => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null;
      
      case 'date':
        return value ? (
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="h-3 w-3" />
            {format(new Date(value as string), 'MMM d, yyyy')}
          </div>
        ) : null;
      
      case 'tags':
        return (
          <div className="flex flex-wrap gap-1">
            {(task.tags || []).map(tag => (
              <Badge 
                key={tag} 
                variant="outline" 
                className="flex items-center gap-1 text-xs px-2 py-1"
              >
                {tag}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTag(task.id, tag);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </Badge>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-5 w-5 rounded-full p-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60 p-2">
                <div className="space-y-2">
                  <Input 
                    placeholder="Add tag..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleAddTag(task.id, e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <div className="grid grid-cols-2 gap-1">
                    {['Important', 'Bug', 'Feature', 'Improvement', 'Documentation', 'Research'].map(tag => (
                      <Button 
                        key={tag}
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddTag(task.id, tag)}
                        className="text-xs justify-start"
                      >
                        {tag}
                      </Button>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        );
      
      default:
        return value ? String(value) : null;
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-md border">
      <div className="flex justify-between items-center p-2 bg-muted/50">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowColumnCustomizer(!showColumnCustomizer)}
            className="text-xs gap-1"
          >
            <AlignJustify className="h-3 w-3" />
            Customize
          </Button>
        </div>
        
        <div>
          <Button 
            size="sm" 
            className="text-xs gap-1"
            onClick={handleCreateNewTask}
          >
            <Plus className="h-3 w-3" />
            New Row
          </Button>
        </div>
      </div>
      
      {/* Column customizer */}
      {showColumnCustomizer && (
        <div className="p-2 border-b bg-muted/30">
          <h3 className="text-sm font-medium mb-2">Customize Columns</h3>
          <DragDropContext onDragEnd={handleColumnReorder}>
            <Droppable droppableId="columns" direction="horizontal">
              {(provided) => (
                <div 
                  className="flex flex-wrap gap-2"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {columns.map((column, index) => (
                    <Draggable key={column.id} draggableId={column.id} index={index}>
                      {(provided) => (
                        <div
                          className="flex items-center border rounded-md px-2 py-1 bg-background"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <GripVertical className="h-3 w-3 mr-1 text-muted-foreground" />
                          <span className="text-xs">{column.name}</span>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      )}
      
      <div className="overflow-auto max-h-[calc(100vh-300px)]">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead 
                  key={column.id} 
                  style={{ width: column.width }}
                  className="whitespace-nowrap"
                >
                  <div className="flex items-center gap-1">
                    <span>{column.name}</span>
                    {column.sortable && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 w-5 p-0"
                        onClick={() => handleSort(column.id)}
                      >
                        {sortConfig?.key === column.id ? (
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
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {/* New task row */}
            {newTask && (
              <TableRow className="bg-muted/20">
                {columns.map((column) => (
                  <TableCell key={column.id}>
                    {column.id === 'checkbox' ? (
                      <Checkbox 
                        checked={newTask.completed}
                        onCheckedChange={(checked) => 
                          handleNewTaskChange('completed', checked === true)
                        }
                      />
                    ) : column.id === 'title' ? (
                      <Input
                        autoFocus
                        placeholder="Enter task title..."
                        value={newTask.title}
                        onChange={(e) => handleNewTaskChange('title', e.target.value)}
                      />
                    ) : column.id === 'status' ? (
                      <div className="w-full">
                        <Select 
                          onValueChange={(value) => 
                            handleNewTaskChange('status', value as TaskStatus)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={newTask.status} />
                          </SelectTrigger>
                          <SelectContent>
                            {column.options?.map(option => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : column.id === 'priority' ? (
                      <div className="w-full">
                        <Select 
                          onValueChange={(value) => 
                            handleNewTaskChange('priority', value as TaskPriority)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={newTask.priority} />
                          </SelectTrigger>
                          <SelectContent>
                            {column.options?.map(option => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ) : column.id === 'dueDate' ? (
                      <Input
                        type="date"
                        value={newTask.dueDate ? new Date(newTask.dueDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => handleNewTaskChange('dueDate', e.target.value)}
                      />
                    ) : column.id === 'description' ? (
                      <Input
                        placeholder="Description..."
                        value={newTask.description || ''}
                        onChange={(e) => handleNewTaskChange('description', e.target.value)}
                      />
                    ) : null}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 w-6 p-0"
                      onClick={handleSaveNewTask}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 w-6 p-0"
                      onClick={handleCancelNewTask}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            
            {/* Existing tasks */}
            {sortedTasks.map((task) => (
              <TableRow 
                key={task.id} 
                className={task.completed ? 'bg-muted/10' : ''}
              >
                {columns.map((column) => (
                  <TableCell 
                    key={`${task.id}-${column.id}`}
                    className="cursor-pointer"
                    onClick={() => {
                      if (column.id !== 'checkbox') {
                        handleCellClick(
                          task.id, 
                          column.id, 
                          typeof column.accessor === 'string' ? task[column.accessor as keyof Task] : ''
                        );
                      }
                    }}
                  >
                    {renderCellContent(task, column)}
                  </TableCell>
                ))}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onTaskUpdate({ id: task.id, completed: !task.completed })}>
                        {task.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onTaskUpdate({ id: task.id, status: task.status === 'Done' ? 'To Do' as TaskStatus : 'Done' as TaskStatus })}>
                        {task.status === 'Done' ? 'Move to To Do' : 'Move to Done'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onTaskDelete(task.id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 