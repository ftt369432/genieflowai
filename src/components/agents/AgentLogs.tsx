import React, { useState } from 'react';
import { Agent } from '../../types/agents';
import { useAgentStore } from '../../store/agentStore';
import { format } from 'date-fns';
import { Search, Filter, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface AgentLogsProps {
  agent: Agent;
}

export function AgentLogs({ agent }: AgentLogsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'success' | 'error' | 'pending'>('all');
  const { actions } = useAgentStore();

  const agentActions = actions
    .filter(action => action.agentId === agent.id)
    .filter(action => {
      if (filter === 'all') return true;
      return action.status === filter;
    })
    .filter(action => 
      action.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.input?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.output?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search logs..."
            className="pl-10"
          />
        </div>
        <Select
          value={filter}
          onChange={(value: any) => setFilter(value)}
          options={[
            { label: 'All', value: 'all' },
            { label: 'Success', value: 'success' },
            { label: 'Error', value: 'error' },
            { label: 'Pending', value: 'pending' }
          ]}
          icon={Filter}
        />
      </div>

      {/* Logs */}
      <div className="space-y-4">
        {agentActions.map((action) => (
          <div key={action.id} className="bg-white/5 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg ${
                action.status === 'completed'
                  ? 'bg-green-500/20 text-green-400'
                  : action.status === 'failed'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-yellow-500/20 text-yellow-400'
              }`}>
                {action.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : action.status === 'failed' ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{action.type}</p>
                  <span className="text-sm text-white/40">
                    {format(action.startedAt, 'MMM dd, yyyy HH:mm:ss')}
                  </span>
                </div>
                {action.input && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-white/60">Input:</p>
                    <pre className="text-sm bg-black/20 rounded p-2 overflow-x-auto">
                      {JSON.stringify(action.input, null, 2)}
                    </pre>
                  </div>
                )}
                {action.output && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-white/60">Output:</p>
                    <pre className="text-sm bg-black/20 rounded p-2 overflow-x-auto">
                      {JSON.stringify(action.output, null, 2)}
                    </pre>
                  </div>
                )}
                {action.error && (
                  <div className="mt-2 flex items-start gap-2 text-red-400">
                    <AlertCircle className="w-4 h-4 mt-0.5" />
                    <p className="text-sm">{action.error}</p>
                  </div>
                )}
                {action.completedAt && (
                  <p className="mt-2 text-sm text-white/40">
                    Duration: {
                      Math.round((action.completedAt.getTime() - action.startedAt.getTime()) / 1000)
                    }s
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {agentActions.length === 0 && (
          <div className="text-center py-8 text-white/40">
            No logs found {searchTerm && 'matching your search'}
          </div>
        )}
      </div>
    </div>
  );
} 