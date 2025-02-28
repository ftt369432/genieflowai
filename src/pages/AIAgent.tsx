import React, { useState, useEffect } from 'react';
import { Bot, Brain, Zap, Clock, Target, Settings2, BarChart2, Loader2, Plus, ChevronDown, ArrowRight, Play, Pause, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Tooltip } from '../components/ui/Tooltip';
import { cn } from '../lib/utils';
import { v4 as uuidv4 } from 'uuid';
import { useAIAgent } from '../hooks/useAIAgent';
import { toast } from '../components/ui/Toast';

interface Agent {
  id: string;
  name: string;
  description: string;
  type: 'productivity' | 'learning' | 'research' | 'automation';
  status: 'active' | 'paused' | 'completed';
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  tasks: AgentTask[];
  insights: AgentInsight[];
  settings: {
    autoStart: boolean;
    priority: 'low' | 'medium' | 'high';
    schedule?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      time?: string;
      days?: string[];
    };
  };
}

interface AgentTask {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

interface AgentInsight {
  id: string;
  type: 'improvement' | 'warning' | 'achievement';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  timestamp: Date;
  metrics?: {
    before: number;
    after: number;
    unit: string;
  };
}

interface NewTaskFormData {
  title: string;
  description: string;
}

export function AIAgentPage() {
  const {
    agents,
    isProcessing,
    createAgent,
    updateAgent,
    deleteAgent,
    addTask,
    startAgent,
    pauseAgent,
    updateAgentSettings
  } = useAIAgent({
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    },
    onTaskComplete: (task) => {
      toast({
        title: 'Task Completed',
        description: `Successfully completed: ${task.title}`,
        variant: 'default'
      });
    },
    onInsightGenerated: (insight) => {
      toast({
        title: 'New Insight',
        description: insight.description,
        variant: 'default'
      });
    }
  });

  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showNewAgent, setShowNewAgent] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentType, setNewAgentType] = useState<Agent['type']>('productivity');
  const [showSettings, setShowSettings] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskData, setNewTaskData] = useState<NewTaskFormData>({
    title: '',
    description: ''
  });

  const handleCreateAgent = () => {
    if (!newAgentName.trim()) return;

    const agent = createAgent(newAgentName, newAgentType);
    setSelectedAgent(agent);
    setShowNewAgent(false);
    setNewAgentName('');

    toast({
      title: 'Agent Created',
      description: `Successfully created agent: ${agent.name}`,
      variant: 'default'
    });
  };

  const handleDeleteAgent = (agentId: string) => {
    deleteAgent(agentId);
    if (selectedAgent?.id === agentId) {
      setSelectedAgent(null);
    }

    toast({
      title: 'Agent Deleted',
      description: 'Successfully deleted the agent',
      variant: 'default'
    });
  };

  const handleCreateTask = async () => {
    if (!selectedAgent || !newTaskData.title.trim()) return;

    try {
      await addTask(selectedAgent.id, newTaskData);
      setShowNewTask(false);
      setNewTaskData({ title: '', description: '' });

      toast({
        title: 'Task Created',
        description: `Successfully added task: ${newTaskData.title}`,
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create task',
        variant: 'destructive'
      });
    }
  };

  const handleToggleAgent = (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    if (agent.status === 'active') {
      pauseAgent(agentId);
    } else {
      startAgent(agentId);
    }
  };

  return (
    <div className="flex h-full bg-background">
      {/* Left Sidebar */}
      <div className="w-80 border-r bg-card/50 backdrop-blur-sm flex flex-col">
        <div className="p-4 border-b">
          <Button
            className="w-full justify-start space-x-2"
            onClick={() => setShowNewAgent(true)}
          >
            <Plus className="w-4 h-4" />
            <span>New Agent</span>
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {agents.map(agent => (
            <Card
              key={agent.id}
              className={cn(
                'p-4 cursor-pointer transition-all duration-200 hover:shadow-md',
                selectedAgent?.id === agent.id && 'border-primary shadow-lg'
              )}
              onClick={() => setSelectedAgent(agent)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {agent.type === 'productivity' && <Zap className="w-4 h-4 text-yellow-500" />}
                  {agent.type === 'learning' && <Brain className="w-4 h-4 text-blue-500" />}
                  {agent.type === 'research' && <Target className="w-4 h-4 text-purple-500" />}
                  {agent.type === 'automation' && <Settings2 className="w-4 h-4 text-green-500" />}
                  <span className="font-medium">{agent.name}</span>
                </div>
                <span className={cn(
                  'px-2 py-1 rounded-full text-xs',
                  agent.status === 'active' && 'bg-green-100 text-green-800',
                  agent.status === 'paused' && 'bg-yellow-100 text-yellow-800',
                  agent.status === 'completed' && 'bg-blue-100 text-blue-800'
                )}>
                  {agent.status}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">{agent.description}</div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{agent.tasks.length} tasks</span>
                  <span>{new Date(agent.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block text-primary">
                        {Math.round(agent.progress)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex h-2 mb-4 overflow-hidden rounded bg-primary/10">
                    <div
                      style={{ width: `${agent.progress}%` }}
                      className="flex flex-col justify-center rounded bg-primary transition-all duration-500"
                    />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-card/50 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bot className="w-6 h-6 text-primary" />
              <div className="absolute -inset-1 bg-primary/20 rounded-full blur-sm animate-pulse" />
            </div>
            <h1 className="text-xl font-semibold">AI Agents</h1>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Agent Content */}
        {selectedAgent ? (
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Agent Header */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold">{selectedAgent.name}</h2>
                  <p className="text-muted-foreground">{selectedAgent.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={selectedAgent.status === 'active' ? 'destructive' : 'default'}
                    onClick={() => handleToggleAgent(selectedAgent.id)}
                  >
                    {selectedAgent.status === 'active' ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteAgent(selectedAgent.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Tasks Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Tasks</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewTask(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Task
                  </Button>
                </div>
                <div className="grid gap-4">
                  {selectedAgent.tasks.map(task => (
                    <Card key={task.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{task.title}</div>
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs',
                          task.status === 'completed' && 'bg-green-100 text-green-800',
                          task.status === 'in_progress' && 'bg-blue-100 text-blue-800',
                          task.status === 'pending' && 'bg-yellow-100 text-yellow-800',
                          task.status === 'failed' && 'bg-red-100 text-red-800'
                        )}>
                          {task.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      {task.error && (
                        <p className="mt-2 text-sm text-red-500">{task.error}</p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              {/* Insights Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Insights</h3>
                <div className="grid gap-4">
                  {selectedAgent.insights.map(insight => (
                    <Card key={insight.id} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {insight.type === 'improvement' && (
                            <ArrowRight className="w-4 h-4 text-green-500" />
                          )}
                          {insight.type === 'warning' && (
                            <RefreshCw className="w-4 h-4 text-yellow-500" />
                          )}
                          {insight.type === 'achievement' && (
                            <Target className="w-4 h-4 text-blue-500" />
                          )}
                          <div className="font-medium">{insight.title}</div>
                        </div>
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs',
                          insight.impact === 'high' && 'bg-green-100 text-green-800',
                          insight.impact === 'medium' && 'bg-yellow-100 text-yellow-800',
                          insight.impact === 'low' && 'bg-blue-100 text-blue-800'
                        )}>
                          {insight.impact} impact
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                      {insight.metrics && (
                        <div className="mt-2 flex items-center space-x-4 text-sm">
                          <span>Before: {insight.metrics.before}{insight.metrics.unit}</span>
                          <ArrowRight className="w-4 h-4" />
                          <span>After: {insight.metrics.after}{insight.metrics.unit}</span>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Bot className="w-12 h-12 text-primary mx-auto" />
              <h2 className="text-xl font-semibold">Select an Agent</h2>
              <p className="text-muted-foreground max-w-md">
                Choose an AI agent from the sidebar or create a new one to get started with workflow optimization.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* New Agent Dialog */}
      {showNewAgent && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <Card className="w-[400px] p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Agent</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="Enter agent name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <select
                  value={newAgentType}
                  onChange={(e) => setNewAgentType(e.target.value as Agent['type'])}
                  className="w-full mt-1 p-2 rounded-md border bg-background"
                >
                  <option value="productivity">Productivity</option>
                  <option value="learning">Learning</option>
                  <option value="research">Research</option>
                  <option value="automation">Automation</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowNewAgent(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAgent}>
                  Create Agent
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Add New Task Dialog */}
      {showNewTask && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <Card className="w-[400px] p-6">
            <h2 className="text-xl font-semibold mb-4">Create New Task</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={newTaskData.title}
                  onChange={(e) => setNewTaskData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={newTaskData.description}
                  onChange={(e) => setNewTaskData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description"
                  className="w-full mt-1 p-2 rounded-md border bg-background min-h-[100px]"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewTask(false);
                    setNewTaskData({ title: '', description: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateTask}>
                  Create Task
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
} 