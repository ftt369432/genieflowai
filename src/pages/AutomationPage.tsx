import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWorkflowStore } from '../store/workflowStore';
import { useAgentStore } from '../store/agentStore';
import { useCalendarStore } from '../store/calendarStore';
import { useCalendarAutomation } from '../hooks/useCalendarAutomation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Switch } from '../components/ui/Switch';
import { Label } from '../components/ui/Label';
import { Separator } from '../components/ui/Separator';
import { 
  Play, Pause, Settings, File, Workflow, Clock, Calendar, CalendarClock, Bell, 
  BarChart2, Zap, Plus, ChevronRight, Sparkles, RefreshCw, Eye, Trash2, Settings2,
  ArrowRight, CalendarDays, Mail, MessageSquare, Database, Search, Inbox, Filter,
  Users, Brain, Activity, X
} from 'lucide-react';
import { ActiveAgentsPanel } from '../components/ai/ActiveAgentsPanel';
import { AgentSuggestionPanel } from '../components/agents/AgentSuggestionPanel';
import { SwarmPanel } from '../components/swarm/SwarmPanel';
import { useSwarmStore } from '../stores/swarmStore';

export function AutomationPage() {
  const navigate = useNavigate();
  const { workflows, addWorkflow, runWorkflow } = useWorkflowStore();
  const { agents, selectAgent } = useAgentStore();
  const { swarms } = useSwarmStore();
  const { syncAutomationsToCalendar } = useCalendarStore();
  const { scheduleRecurringTimeBlocks } = useCalendarAutomation();
  const [activeTab, setActiveTab] = useState('workflows');
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Scheduler states
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleType, setScheduleType] = useState<'once' | 'recurring'>('once');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleFrequency, setScheduleFrequency] = useState('daily');

  // Trigger states
  const [triggers, setTriggers] = useState([
    { id: 'email-received', name: 'Email Received', enabled: true, icon: Mail },
    { id: 'file-uploaded', name: 'File Uploaded', enabled: false, icon: File },
    { id: 'task-created', name: 'Task Created', enabled: true, icon: Workflow },
    { id: 'calendar-event', name: 'Calendar Event', enabled: false, icon: Calendar },
    { id: 'message-received', name: 'Message Received', enabled: true, icon: MessageSquare },
    { id: 'data-updated', name: 'Database Updated', enabled: false, icon: Database },
  ]);

  // Agent metrics
  const agentMetrics = {
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.status === 'active').length,
    averagePerformance: agents.length > 0
      ? Math.round(agents.reduce((acc, curr) => acc + curr.metrics.performance, 0) / agents.length)
      : 0,
    totalTasks: agents.reduce((acc, curr) => acc + curr.metrics.tasks.total, 0)
  };

  // Handle selecting an agent
  const handleSelectAgent = (id: string) => {
    selectAgent(id);
    console.log("Selected agent:", id);
  };

  // Filter agents based on search query
  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(agentSearchQuery.toLowerCase()) ||
    agent.type.toLowerCase().includes(agentSearchQuery.toLowerCase()) ||
    (agent.description && agent.description.toLowerCase().includes(agentSearchQuery.toLowerCase()))
  );

  // Quick automation templates
  const automationTemplates = [
    {
      id: 'email-processing',
      name: 'Email Processing',
      description: 'Automatically categorize and respond to emails',
      icon: Mail,
      triggers: ['email-received'],
      category: 'Communication'
    },
    {
      id: 'meeting-notes',
      name: 'Meeting Notes',
      description: 'Generate and distribute meeting summaries',
      icon: CalendarDays,
      triggers: ['calendar-event'],
      category: 'Productivity'
    },
    {
      id: 'data-analysis',
      name: 'Data Analysis',
      description: 'Regular data analysis and reporting',
      icon: BarChart2,
      triggers: ['scheduled', 'data-updated'],
      category: 'Analytics'
    },
    {
      id: 'task-delegation',
      name: 'Task Delegation',
      description: 'Automatically assign and follow up on tasks',
      icon: Workflow,
      triggers: ['task-created'],
      category: 'Team'
    },
    {
      id: 'time-blocking',
      name: 'Smart Time Blocking',
      description: 'AI schedule optimization for focused work',
      icon: Clock,
      triggers: ['scheduled'],
      category: 'Productivity'
    }
  ];

  // Status badge colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  // Filter workflows based on search and status
  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = searchQuery === '' || 
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (workflow.description && workflow.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || workflow.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleRunWorkflow = async (workflowId: string) => {
    try {
      await runWorkflow(workflowId);
      // Optionally show a success notification
    } catch (error) {
      console.error('Error running workflow:', error);
      // Show error notification
    }
  };

  const handleCreateFromTemplate = (templateId: string) => {
    navigate(`/agent-wizard?template=${templateId}&type=workflow`);
  };

  const currentWorkflow = selectedWorkflow 
    ? workflows.find(w => w.id === selectedWorkflow) 
    : null;

  // Dummy agent templates for AgentSuggestionPanel - replace with actual data source
  const agentTemplateSuggestions = [
      {
        id: 'researcher',
        name: 'Research Assistant',
        description: 'Helps with research and data analysis',
        type: 'research',
        capabilities: ['Web Search', 'Data Analysis', 'Report Generation']
      },
      {
        id: 'coder',
        name: 'Code Assistant',
        description: 'Helps with coding and development',
        type: 'development',
        capabilities: ['Code Generation', 'Code Review', 'Debugging']
      },
  ];

  const handleCreateAgentFromTemplate = (template: any) => {
    // Logic to create an agent from a template, potentially navigating to agent wizard
    console.log('Create agent from template:', template);
    navigate(`/agent-wizard?creationMode=agent&templateName=${template.name}&templateType=${template.type}&templateCapabilities=${template.capabilities.join(',')}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">AI Workspace</h1>
          <p className="text-muted-foreground">Manage your AI agents, workflows, and swarms</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/agent-wizard?creationMode=workflow')}>
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
          <Button onClick={() => navigate('/agent-wizard?creationMode=agent')}>
             <Brain className="h-4 w-4 mr-2" />
            New Agent
          </Button>
          <Button onClick={() => navigate('/configure-swarm')} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Users className="h-4 w-4 mr-2" />
            New Swarm
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.filter(w => w.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((workflows.filter(w => w.status === 'active').length / Math.max(workflows.length, 1)) * 100)}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentMetrics.activeAgents}</div>
            <p className="text-xs text-muted-foreground">
               {Math.round((agentMetrics.activeAgents / Math.max(agentMetrics.totalAgents, 1)) * 100)}% of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Swarms</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{swarms.length}</div>
             <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks Processed (Agents)</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agentMetrics.totalTasks}</div>
            <p className="text-xs text-muted-foreground">Across all agents</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="swarms">Swarms</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search workflows..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="status-filter" className="text-sm">Status:</Label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-md text-sm p-1 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkflows.map((workflow) => (
              <Card key={workflow.id} className="flex flex-col justify-between dark:bg-gray-800">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                    <Badge className={getStatusColor(workflow.status)}>{workflow.status}</Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground">ID: {workflow.id}</CardDescription>
                  <CardDescription>{workflow.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong className="text-muted-foreground">Trigger:</strong> {workflow.trigger}</p>
                  <p><strong className="text-muted-foreground">Steps:</strong> {workflow.steps.length}</p>
                  <p><strong className="text-muted-foreground">Created:</strong> {new Date(workflow.created).toLocaleDateString()}</p>
                  {workflow.lastRun && (
                    <p><strong className="text-muted-foreground">Last Run:</strong> {new Date(workflow.lastRun).toLocaleString()}</p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
                  <Button variant="outline" size="sm" onClick={() => {/* TODO: Workflow manage modal or view */ console.log('Manage workflow', workflow.id)}}>
                    <Settings className="h-4 w-4 mr-1" /> Manage
                  </Button>
                  <Button size="sm" onClick={() => handleRunWorkflow(workflow.id)} disabled={workflow.status === 'running'}>
                    {workflow.status === 'running' ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
                    Run
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {filteredWorkflows.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground">No workflows match your criteria.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{agentMetrics.totalAgents}</div>
                  <div className="text-sm text-muted-foreground">Total Agents</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Activity className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{agentMetrics.activeAgents}</div>
                  <div className="text-sm text-muted-foreground">Active Agents</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Zap className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{agentMetrics.averagePerformance}%</div>
                  <div className="text-sm text-muted-foreground">Avg. Performance</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{agentMetrics.totalTasks}</div>
                  <div className="text-sm text-muted-foreground">Total Tasks</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search agents..."
                className="w-full pl-10 dark:bg-gray-700 dark:border-gray-600"
                value={agentSearchQuery}
                onChange={(e) => setAgentSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <ActiveAgentsPanel onSelectAgent={handleSelectAgent} agents={filteredAgents} />

        </TabsContent>

        <TabsContent value="swarms" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Manage Swarms</h2>
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <Card className="dark:bg-gray-800"><CardHeader><CardTitle className="text-sm">Total Swarms</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{swarms.length}</div></CardContent></Card>
           </div>
          <SwarmPanel />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Available Templates</h2>
          </div>
          
          <Card className="dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Workflow Templates</CardTitle>
              <CardDescription>Quick-start new automations.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {automationTemplates.map((template) => (
                <Card key={template.id} className="flex flex-col dark:bg-gray-700">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <template.icon className="h-6 w-6 text-primary" />
                      <CardTitle>{template.name}</CardTitle>
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className="mt-auto pt-4 border-t dark:border-gray-600">
                    <Button className="w-full" onClick={() => handleCreateFromTemplate(template.id)}>
                      <Plus className="h-4 w-4 mr-2" /> Use Template
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Agent Templates</CardTitle>
              <CardDescription>Bootstrap new agents with predefined capabilities.</CardDescription>
            </CardHeader>
            <CardContent>
               <AgentSuggestionPanel
                patterns={agentTemplateSuggestions}
                onCreateAgent={handleCreateAgentFromTemplate}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedWorkflow && currentWorkflow && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl dark:bg-gray-800">
            <CardHeader>
              <CardTitle>Manage Workflow: {currentWorkflow.name}</CardTitle>
              <Button variant="ghost" size="icon" className="absolute top-4 right-4" onClick={() => setSelectedWorkflow(null)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="max-h-[70vh] overflow-y-auto">
              <p>Details for workflow ID: {currentWorkflow.id}</p>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t dark:border-gray-700 pt-4">
              <Button variant="outline" onClick={() => setSelectedWorkflow(null)}>Cancel</Button>
              <Button>Save Changes</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
} 