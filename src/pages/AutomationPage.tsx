import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ArrowRight, CalendarDays, Mail, MessageSquare, Database, Search, Inbox, Filter
} from 'lucide-react';

export function AutomationPage() {
  const navigate = useNavigate();
  const { workflows, addWorkflow, runWorkflow } = useWorkflowStore();
  const { agents } = useAgentStore();
  const { syncAutomationsToCalendar } = useCalendarStore();
  const { scheduleRecurringTimeBlocks } = useCalendarAutomation();
  const [activeTab, setActiveTab] = useState('workflows');
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
      workflow.description.toLowerCase().includes(searchQuery.toLowerCase());
    
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
    // In a real app, this would create a workflow from the template
    // and then navigate to the edit page
    navigate(`/agent-wizard?template=${templateId}`);
  };

  const currentWorkflow = selectedWorkflow 
    ? workflows.find(w => w.id === selectedWorkflow) 
    : null;

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Automation Hub</h1>
          <p className="text-muted-foreground">Create, manage, and monitor your automated workflows</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/agent-wizard')}>
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
          <Button onClick={() => navigate('/agent-wizard')}>
            <Sparkles className="h-4 w-4 mr-2" />
            AI Workflow Wizard
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              {Math.round((workflows.filter(w => w.status === 'active').length / Math.max(workflows.length, 1)) * 100)}% of all workflows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Tasks</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.filter(w => w.trigger === 'scheduled').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Next: Today at 3:00 PM
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Triggers</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.filter(w => w.trigger === 'event').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {triggers.filter(t => t.enabled).length} active triggers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="triggers">Triggers</TabsTrigger>
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
                className="border rounded-md text-sm p-1"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredWorkflows.length > 0 ? (
              filteredWorkflows.map(workflow => (
                <Card 
                  key={workflow.id}
                  className={`cursor-pointer transition-shadow hover:shadow-md ${selectedWorkflow === workflow.id ? 'border-primary' : ''}`}
                  onClick={() => setSelectedWorkflow(workflow.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{workflow.name}</CardTitle>
                        <CardDescription className="mt-1">{workflow.description}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(workflow.status)}>
                        {workflow.status.charAt(0).toUpperCase() + workflow.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {workflow.trigger === 'manual' ? 'Manual' : 
                         workflow.trigger === 'scheduled' ? 'Scheduled' : 'Event-based'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {workflow.steps.length} steps
                      </Badge>
                      {workflow.lastRun && (
                        <Badge variant="outline" className="text-xs">
                          Last run: {new Date(workflow.lastRun).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between pt-0">
                    <Button variant="outline" size="sm" className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/agent-wizard?id=${workflow.id}`);
                      }}>
                      <Settings className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunWorkflow(workflow.id);
                      }}>
                      <Play className="h-3.5 w-3.5 mr-1" />
                      Run Now
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="mb-2">No workflows found</p>
                <Button onClick={() => navigate('/agent-wizard')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Workflow
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="triggers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {triggers.map(trigger => (
              <Card key={trigger.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <trigger.icon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{trigger.name}</CardTitle>
                    </div>
                    <Switch 
                      checked={trigger.enabled} 
                      onCheckedChange={(checked) => {
                        setTriggers(prev => 
                          prev.map(t => t.id === trigger.id ? {...t, enabled: checked} : t)
                        );
                      }} 
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <div className="font-semibold mb-1">Connected Workflows:</div>
                    <div className="pl-4 text-muted-foreground">
                      {workflows.filter(w => 
                        w.trigger === 'event' && 
                        w.triggerConfig?.event === trigger.id
                      ).length > 0 ? (
                        workflows.filter(w => 
                          w.trigger === 'event' && 
                          w.triggerConfig?.event === trigger.id
                        ).map(w => (
                          <div key={w.id} className="flex items-center gap-1">
                            <ChevronRight className="h-3 w-3" />
                            <span>{w.name}</span>
                          </div>
                        ))
                      ) : (
                        <span className="italic">No workflows connected</span>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">
                    <Settings2 className="h-3.5 w-3.5 mr-1" />
                    Configure
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {automationTemplates.map(template => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-md">
                      <template.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {template.triggers.map(trigger => (
                      <Badge key={trigger} variant="outline" className="text-xs">
                        {trigger}
                      </Badge>
                    ))}
                    <Badge variant="outline" className="text-xs bg-primary/5">
                      {template.category}
                    </Badge>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full"
                    onClick={() => handleCreateFromTemplate(template.id)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Create Workflow
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {selectedWorkflow && currentWorkflow && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-xl">Workflow Details: {currentWorkflow.name}</CardTitle>
            <CardDescription>{currentWorkflow.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-sm text-muted-foreground mb-1">Status</div>
                  <div className="font-medium">
                    <Badge className={getStatusColor(currentWorkflow.status)}>
                      {currentWorkflow.status.charAt(0).toUpperCase() + currentWorkflow.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-sm text-muted-foreground mb-1">Trigger</div>
                  <div className="font-medium">
                    {currentWorkflow.trigger === 'manual' ? 'Manual' : 
                    currentWorkflow.trigger === 'scheduled' ? 'Scheduled' : 'Event-based'}
                  </div>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-sm text-muted-foreground mb-1">Steps</div>
                  <div className="font-medium">{currentWorkflow.steps.length}</div>
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-sm text-muted-foreground mb-1">Last Run</div>
                  <div className="font-medium">
                    {currentWorkflow.lastRun ? new Date(currentWorkflow.lastRun).toLocaleString() : 'Never'}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-2">Workflow Steps</h3>
                <div className="space-y-3">
                  {currentWorkflow.steps.map((step, index) => {
                    const agent = agents.find(a => a.id === step.agentId);
                    return (
                      <div key={step.id} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                        <div className="bg-primary/10 text-primary font-medium rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-grow">
                          <div className="font-medium">{step.name}</div>
                          <div className="text-sm text-muted-foreground">{step.description}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              Agent: {agent?.name || 'Unknown'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Action: {step.actionType}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <div className="flex gap-2">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                View Runs
              </Button>
              <Button variant="outline">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate(`/agent-wizard?id=${currentWorkflow.id}`)}>
                <Settings className="h-4 w-4 mr-2" />
                Edit Workflow
              </Button>
              <Button onClick={() => handleRunWorkflow(currentWorkflow.id)}>
                <Play className="h-4 w-4 mr-2" />
                Run Now
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
} 