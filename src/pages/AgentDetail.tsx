import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAgentStore } from '../store/agentStore';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { 
  Brain, 
  Activity, 
  Zap, 
  ArrowLeft, 
  Play, 
  Pause, 
  Settings, 
  Trash2, 
  BarChart2,
  Clock,
  Code
} from 'lucide-react';
import { AgentLogs } from '../components/agents/AgentLogs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { formatDistanceToNow } from 'date-fns';
import { AgentChat } from '../components/agents/AgentChat';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { useAuditStore } from '../store/auditStore';
import { Agent, AutonomyLevel } from '../types/agent';

export function AgentDetail() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { 
    getAgent, 
    updateAgent, 
    deleteAgent, 
    activateAgent, 
    deactivateAgent,
    trainAgent,
    executeAction
  } = useAgentStore();
  
  const { auditLogs } = useAuditStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    autonomyLevel: 'supervised' as AutonomyLevel,
    temperature: 0.7,
    maxTokens: 1000
  });
  const [activeTab, setActiveTab] = useState('overview');
  
  const agent = agentId ? getAgent(agentId) : undefined;
  
  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name,
        description: agent.description,
        systemPrompt: agent.config.systemPrompt,
        autonomyLevel: agent.autonomyLevel,
        temperature: agent.config.temperature,
        maxTokens: agent.config.maxTokens
      });
    }
  }, [agent]);

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Brain className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Agent Not Found</h1>
        <p className="text-muted-foreground mb-6">The agent you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate('/agents')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Agents
        </Button>
      </div>
    );
  }
  
  const agentLogs = auditLogs.filter(log => log.sourceId === agentId);
  const lastActionDate = agentLogs.length > 0 
    ? new Date(agentLogs[0].timestamp)
    : agent.lastActive;
  
  const handleStatusToggle = () => {
    if (agent.status === 'active') {
      deactivateAgent(agent.id);
    } else {
      activateAgent(agent.id);
    }
  };
  
  const handleDeleteAgent = () => {
    if (window.confirm(`Are you sure you want to delete ${agent.name}?`)) {
      deleteAgent(agent.id);
      navigate('/agents');
    }
  };
  
  const handleSaveChanges = () => {
    updateAgent(agent.id, {
      name: formData.name,
      description: formData.description,
      autonomyLevel: formData.autonomyLevel,
      config: {
        ...agent.config,
        systemPrompt: formData.systemPrompt,
        temperature: parseFloat(formData.temperature.toString()),
        maxTokens: parseInt(formData.maxTokens.toString(), 10)
      }
    });
    setIsEditing(false);
  };
  
  const handleTrainAgent = async () => {
    try {
      await trainAgent(agent.id);
    } catch (error) {
      console.error('Error training agent:', error);
    }
  };
  
  const handleActionSubmit = async (action: string, input: any) => {
    try {
      return await executeAction(agent.id, action, input);
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
      throw error;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
          onClick={() => navigate('/agents')}
        >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        <div>
            <h1 className="text-2xl font-bold">{agent.name}</h1>
            <p className="text-muted-foreground">{agent.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={agent.status === 'active' ? 'destructive' : 'default'}
            onClick={handleStatusToggle}
          >
            {agent.status === 'active' 
              ? <>
                  <Pause className="mr-2 h-4 w-4" />
                  Deactivate Agent
                </> 
              : <>
                  <Play className="mr-2 h-4 w-4" />
                  Activate Agent
                </>
            }
          </Button>
          <Button variant="secondary" onClick={() => setIsEditing(!isEditing)}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button variant="outline" onClick={handleDeleteAgent}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${agent.status === 'active' ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
              <Activity className={`w-5 h-5 ${agent.status === 'active' ? 'text-green-500' : 'text-yellow-500'}`} />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="text-lg font-semibold capitalize">{agent.status}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Brain className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Type</div>
              <div className="text-lg font-semibold capitalize">{agent.type}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
            <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Zap className="w-5 h-5 text-amber-500" />
              </div>
              <div>
              <div className="text-sm text-muted-foreground">Performance</div>
              <div className="text-lg font-semibold">{agent.metrics.performance}%</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Clock className="w-5 h-5 text-purple-500" />
              </div>
            <div>
              <div className="text-sm text-muted-foreground">Last Active</div>
              <div className="text-lg font-semibold">{formatDistanceToNow(lastActionDate, { addSuffix: true })}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Agent Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Autonomy Level</label>
                  <div className="flex-1">
                    <select
                      className="w-full border rounded px-3 py-2"
                      value={formData.autonomyLevel}
                      onChange={e => setFormData({ ...formData, autonomyLevel: e.target.value as AutonomyLevel })}
                    >
                      <option value="supervised">Supervised</option>
                      <option value="semi-autonomous">Semi-Autonomous</option>
                      <option value="autonomous">Autonomous</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Temperature</label>
                  <Input 
                    type="number" 
                    min="0" 
                    max="1" 
                    step="0.1"
                    value={formData.temperature} 
                    onChange={e => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Tokens</label>
                  <Input 
                    type="number" 
                    min="100" 
                    step="100"
                    value={formData.maxTokens} 
                    onChange={e => setFormData({ ...formData, maxTokens: parseInt(e.target.value, 10) })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">System Prompt</label>
                <Textarea
                  value={formData.systemPrompt}
                  onChange={e => setFormData({ ...formData, systemPrompt: e.target.value })}
                  rows={6}
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleSaveChanges}>Save Changes</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">
              <Brain className="w-4 h-4 mr-2" />
              Overview
          </TabsTrigger>
            <TabsTrigger value="interact">
              <Code className="w-4 h-4 mr-2" />
              Interact
          </TabsTrigger>
            <TabsTrigger value="logs">
              <Activity className="w-4 h-4 mr-2" />
              Activity Logs
          </TabsTrigger>
            <TabsTrigger value="performance">
              <BarChart2 className="w-4 h-4 mr-2" />
              Performance
          </TabsTrigger>
        </TabsList>
        
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Agent Configuration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Agent Type</h3>
                          <p>{agent.type}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Model</h3>
                          <p>{agent.config.model}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Autonomy Level</h3>
                          <p className="capitalize">{agent.autonomyLevel}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Temperature</h3>
                          <p>{agent.config.temperature}</p>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">System Prompt</h3>
                        <div className="bg-muted p-3 rounded-md text-sm">
                          {agent.config.systemPrompt}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Capabilities</h3>
                        <div className="flex flex-wrap gap-2">
                          {agent.capabilities.map((capability, i) => (
                            <span key={i} className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                              {capability}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {agentLogs.length > 0 ? (
                      <div className="space-y-4">
                        {agentLogs.slice(0, 5).map((log) => (
                          <div key={log.id} className="border-b pb-4 last:border-0">
                            <div className="flex justify-between">
                              <h3 className="font-medium">{log.actionType}</h3>
                              <span className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {log.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        No activity recorded yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Agent Controls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button 
                        className="w-full" 
                        onClick={handleTrainAgent}
                        disabled={agent.status === 'training'}
                      >
                        <Brain className="mr-2 h-4 w-4" />
                        Train Agent
                      </Button>
                      <Button 
                        variant={agent.status === 'active' ? 'destructive' : 'default'}
                        className="w-full"
                        onClick={handleStatusToggle}
                      >
                        {agent.status === 'active' 
                          ? <>
                              <Pause className="mr-2 h-4 w-4" />
                              Deactivate Agent
                            </> 
                          : <>
                              <Play className="mr-2 h-4 w-4" />
                              Activate Agent
                            </>
                        }
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Completed Tasks</h3>
                        <p className="text-xl font-bold">{agent.metrics.tasks.completed} / {agent.metrics.tasks.total}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Success Rate</h3>
                        <p className="text-xl font-bold">{agent.metrics.successRate * 100}%</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Avg. Response Time</h3>
                        <p className="text-xl font-bold">{agent.metrics.responseTime.toFixed(2)}s</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="interact">
            <Card>
              <CardHeader>
                <CardTitle>Chat with {agent.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <AgentChat agent={agent} onAction={handleActionSubmit} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="logs">
            <AgentLogs agent={agent} />
          </TabsContent>
          
          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 flex items-center justify-center text-muted-foreground">
                  Performance metrics visualization would go here
        </div>
              </CardContent>
            </Card>
          </TabsContent>
      </Tabs>
      )}
    </div>
  );
} 