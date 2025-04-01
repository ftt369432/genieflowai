import React, { useState } from 'react';
import { useAgentStore } from '../../store/agentStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Agent, AgentAction } from '../../types/agent';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Calendar, 
  Search,
  Filter,
  Download,
  RefreshCw,
  ArrowUpDown
} from 'lucide-react';

interface AgentLogsProps {
  agent: Agent;
}

export function AgentLogs({ agent }: AgentLogsProps) {
  const { actions } = useAgentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter actions for this agent
  const agentActions = actions.filter(action => action.agentId === agent.id);

  // Apply filters
  const filteredActions = agentActions.filter(action => {
    // Apply search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      !searchQuery || 
      action.type.toLowerCase().includes(searchLower) || 
      (action.input && JSON.stringify(action.input).toLowerCase().includes(searchLower)) ||
      (action.output && JSON.stringify(action.output).toLowerCase().includes(searchLower));
    
    // Apply status filter
    const matchesStatus = !statusFilter || action.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Apply sorting
  const sortedActions = [...filteredActions].sort((a, b) => {
    const dateA = new Date(a.startedAt).getTime();
    const dateB = new Date(b.startedAt).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      'completed': 'bg-green-100 text-green-800 hover:bg-green-200',
      'failed': 'bg-red-100 text-red-800 hover:bg-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatJson = (json: any) => {
    try {
      if (typeof json === 'string') {
        return json;
      }
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return 'Invalid JSON';
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString();
  };
  
  const handleExportLogs = () => {
    const exportData = agentActions.map(action => ({
      id: action.id,
      type: action.type,
      status: action.status,
      startedAt: action.startedAt,
      completedAt: action.completedAt,
      input: action.input,
      output: action.output,
      error: action.error
    }));
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent_${agent.id}_logs_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold mb-1">Agent Logs</h2>
          <p className="text-sm text-muted-foreground">
            {agentActions.length} total actions recorded
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}>
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge 
                className={!statusFilter ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}
                onClick={() => setStatusFilter(null)}
                variant="outline"
              >
                All
              </Badge>
              <Badge 
                className={statusFilter === 'completed' ? getStatusColor('completed') : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}
                onClick={() => setStatusFilter('completed')}
                variant="outline"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Completed
              </Badge>
              <Badge 
                className={statusFilter === 'pending' ? getStatusColor('pending') : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}
                onClick={() => setStatusFilter('pending')}
                variant="outline"
              >
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </Badge>
              <Badge 
                className={statusFilter === 'failed' ? getStatusColor('failed') : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}
                onClick={() => setStatusFilter('failed')}
                variant="outline"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Failed
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {sortedActions.length > 0 ? (
            <div className="space-y-4">
              {sortedActions.map((action) => (
                <Card key={action.id} className="overflow-hidden">
                  <CardHeader className="py-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(action.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(action.status)}
                            {action.status}
                          </span>
                        </Badge>
                        <span className="font-medium">{action.type}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(action.startedAt)}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="py-3 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-1">Input</h4>
                        <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">
                          {formatJson(action.input)}
                        </pre>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-1">
                          {action.status === 'failed' ? 'Error' : 'Output'}
                        </h4>
                        <pre className={`text-xs p-2 rounded overflow-auto max-h-40 ${
                          action.status === 'failed' 
                            ? 'bg-red-50' 
                            : 'bg-gray-50'
                        }`}>
                          {action.status === 'failed' 
                            ? action.error || 'Unknown error' 
                            : action.output ? formatJson(action.output) : 'No output'}
                        </pre>
                      </div>
                    </div>
                    
                    {action.completedAt && (
                      <div className="text-xs text-muted-foreground mt-2">
                        Duration: {((new Date(action.completedAt).getTime() - new Date(action.startedAt).getTime()) / 1000).toFixed(2)}s
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No logs found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter 
                  ? 'Try adjusting your search or filters' 
                  : 'This agent has not executed any actions yet'}
              </p>
            </div>
          )}
        </CardContent>
        
        {agentActions.length > 10 && filteredActions.length > 10 && (
          <CardFooter>
            <Button variant="outline" className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Load More Logs
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
} 