import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAgentStore } from '../../store/agentStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import type { AgentType, AgentCapability } from '../../types/agents';

interface CreateAgentModalProps {
  onClose: () => void;
}

const agentTypes: Array<{value: AgentType; label: string}> = [
  { value: 'email', label: 'Email Assistant' },
  { value: 'document', label: 'Document Assistant' },
  { value: 'calendar', label: 'Calendar Assistant' },
  { value: 'task', label: 'Task Assistant' },
  { value: 'custom', label: 'Custom Assistant' }
];

const capabilities: Array<{value: AgentCapability; label: string}> = [
  { value: 'email-processing', label: 'Email Processing' },
  { value: 'document-analysis', label: 'Document Analysis' },
  { value: 'scheduling', label: 'Scheduling' },
  { value: 'task-management', label: 'Task Management' },
  { value: 'natural-language', label: 'Natural Language' },
  { value: 'calendar-management', label: 'Calendar Management' },
  { value: 'drafting', label: 'Content Drafting' }
];

export function CreateAgentModal({ onClose }: CreateAgentModalProps) {
  const createAgent = useAgentStore(state => state.createAgent);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'custom' as AgentType,
    capabilities: [] as AgentCapability[],
    description: ''
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.type) {
      newErrors.type = 'Type is required';
    }
    if (formData.capabilities.length === 0) {
      newErrors.capabilities = 'At least one capability is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCapabilitiesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(
      option => option.value as AgentCapability
    );
    setFormData({ ...formData, capabilities: selectedOptions });
    if (errors.capabilities) {
      setErrors(prev => ({ ...prev, capabilities: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      await createAgent({
        ...formData,
        id: crypto.randomUUID(),
        status: 'inactive',
        metrics: {
          tasksCompleted: 0,
          accuracy: 0,
          responseTime: 0,
          uptime: 0,
          successRate: 0
        }
      });
      onClose();
    } catch (error) {
      console.error('Failed to create agent:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Failed to create agent. Please try again.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Create New Agent</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
              if (errors.name) {
                setErrors(prev => ({ ...prev, name: '' }));
              }
            }}
            placeholder="Enter agent name"
            error={errors.name}
            required
          />

          <Select
            label="Type"
            value={formData.type}
            onChange={(e) => {
              setFormData({ ...formData, type: e.target.value as AgentType });
              if (errors.type) {
                setErrors(prev => ({ ...prev, type: '' }));
              }
            }}
            options={agentTypes}
            placeholder="Select agent type"
            error={errors.type}
          />

          <Select
            label="Capabilities"
            value={formData.capabilities}
            onChange={handleCapabilitiesChange}
            options={capabilities}
            multiple
            placeholder="Select capabilities"
            error={errors.capabilities}
          />

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => {
              setFormData({ ...formData, description: e.target.value });
              if (errors.description) {
                setErrors(prev => ({ ...prev, description: '' }));
              }
            }}
            placeholder="Enter agent description"
            error={errors.description}
            required
          />

          {errors.submit && (
            <p className="text-red-500 text-sm">{errors.submit}</p>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <Button 
              type="button"
              variant="ghost" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Agent'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 