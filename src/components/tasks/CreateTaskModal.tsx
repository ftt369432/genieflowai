import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Task, TaskPriority, TaskStatus } from '../../types/tasks';
import { Dialog, DialogContent, Input, Button, Select, Textarea } from '../ui';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'completed']),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.date().optional(),
  tags: z.array(z.string()),
  estimatedTime: z.number().min(0).optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function CreateTaskModal({ isOpen, onClose, onCreateTask }: CreateTaskModalProps) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      status: 'todo',
      priority: 'medium',
      tags: [],
    },
  });

  const onSubmit = async (data: TaskFormData) => {
    try {
      await onCreateTask(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent title="Create New Task">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              {...register('title')}
              placeholder="Task title"
              error={errors.title?.message}
            />
          </div>

          <div>
            <Textarea
              {...register('description')}
              placeholder="Description (optional)"
              error={!!errors.description}
              helperText={errors.description?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              {...register('priority')}
              label="Priority"
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
              error={errors.priority?.message}
            />

            <Input
              {...register('dueDate')}
              type="date"
              label="Due Date"
              error={errors.dueDate?.message}
            />
          </div>

          <div>
            <Input
              {...register('estimatedTime', { valueAsNumber: true })}
              type="number"
              label="Estimated Time (minutes)"
              error={errors.estimatedTime?.message}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 