import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAgentStore } from '../store/agentStore';
import { AgentMetrics } from '../components/agents/AgentMetrics';
import { AgentActions } from '../components/agents/AgentActions';
import { AgentConfig } from '../components/agents/AgentConfig';
import { AgentLogs } from '../components/agents/AgentLogs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Brain, Activity, Settings, List, ArrowLeft } from 'lucide-react';

export function AgentDetail() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const agent = useAgentStore(state => state.agents.find(a => a.id === agentId));

  if (!agent) {
    return (
      <div className="p-8">
        <h2 className="text-xl text-red-500">Agent not found</h2>
        <button 
          onClick={() => navigate('/agents')}
          className="mt-4 text-blue-500 hover:underline"
        >
          Return to Agents
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 text-white p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/agents')}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            {agent.name}
          </h1>
          <p className="text-white/60 mt-1">
            {agent.description}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm ${
            agent.status === 'active' 
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {agent.status}
          </span>
          <button
            onClick={() => navigate(`/agents/${agent.id}/edit`)}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        {[
          { 
            label: 'Tasks Completed',
            value: agent.metrics.tasksCompleted,
            icon: Brain,
            color: 'text-purple-400'
          },
          { 
            label: 'Success Rate',
            value: `${Math.round(agent.metrics.successRate)}%`,
            icon: Activity,
            color: 'text-green-400'
          },
          { 
            label: 'Response Time',
            value: `${agent.metrics.responseTime}ms`,
            icon: Activity,
            color: 'text-blue-400'
          },
          { 
            label: 'Uptime',
            value: `${Math.round(agent.metrics.uptime)}h`,
            icon: Activity,
            color: 'text-yellow-400'
          }
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-sm rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-white/10 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-white/60">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="metrics" className="bg-white/5 backdrop-blur-sm rounded-lg">
        <TabsList className="border-b border-white/10 p-2">
          <TabsTrigger value="metrics" className="gap-2">
            <Activity className="w-4 h-4" />
            Metrics
          </TabsTrigger>
          <TabsTrigger value="actions" className="gap-2">
            <Brain className="w-4 h-4" />
            Actions
          </TabsTrigger>
          <TabsTrigger value="config" className="gap-2">
            <Settings className="w-4 h-4" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <List className="w-4 h-4" />
            Logs
          </TabsTrigger>
        </TabsList>
        
        <div className="p-6">
          <TabsContent value="metrics">
            <AgentMetrics agent={agent} />
          </TabsContent>
          
          <TabsContent value="actions">
            <AgentActions agent={agent} />
          </TabsContent>
          
          <TabsContent value="config">
            <AgentConfig agent={agent} />
          </TabsContent>
          
          <TabsContent value="logs">
            <AgentLogs agent={agent} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
} 