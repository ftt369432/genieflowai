import React from 'react';
import { Card } from '../ui/Card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area
} from 'recharts';
import { useAgentStore } from '../../store/agentStore';
import { startOfDay, eachDayOfInterval, subDays, format } from 'date-fns';
import type { Agent } from '../../types/agents';
import type { DailyActivity, PerformanceMetric, AgentFeedback } from '../../types/metrics';
import { Clock, Target, Zap, TrendingUp } from 'lucide-react';

interface AgentMetricsProps {
  agent: Agent;
}

export function AgentMetrics({ agent }: AgentMetricsProps) {
  const { actions, feedback } = useAgentStore();
  
  // Filter actions and feedback for this agent
  const agentActions = actions.filter(action => action.agentId === agent.id);
  const agentFeedback = feedback.filter(f => f.agentId === agent.id);

  // Calculate metrics
  const metrics = {
    dailyActivity: calculateDailyActivity(agentActions),
    performanceByType: calculatePerformanceByType(agentActions),
    recentFeedback: agentFeedback.slice(0, 5)
  };

  // Mock historical data - replace with real data
  const historicalData = Array.from({ length: 14 }).map((_, i) => ({
    date: new Date(Date.now() - (13 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
    tasks: Math.floor(Math.random() * 50) + 10,
    accuracy: 75 + Math.random() * 20,
    responseTime: 100 + Math.random() * 200,
  }));

  const tasksByType = {
    'email-processing': 45,
    'document-analysis': 32,
    'scheduling': 28,
    'task-management': 15,
  };

  return (
    <div className="space-y-8">
      {/* Performance Overview */}
      <div>
        <h3 className="text-lg font-medium mb-4">Performance Overview</h3>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-white/60">Accuracy Trend</span>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-white/60">Response Time</span>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="responseTime"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Task Distribution */}
      <div>
        <h3 className="text-lg font-medium mb-4">Task Distribution</h3>
        <div className="bg-white/5 rounded-lg p-4">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={Object.entries(tasksByType).map(([type, count]) => ({ type, count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="type" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: 'none',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 className="text-lg font-medium mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {agent.feedback.slice(0, 5).map((item, i) => (
            <div key={i} className="bg-white/5 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  item.type === 'success' 
                    ? 'bg-green-500/20 text-green-400'
                    : item.type === 'failure'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}>
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm">{item.feedback}</p>
                  <p className="text-xs text-white/40 mt-1">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityChart({ data }: ActivityChartProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Daily Activity</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="completed" stroke="#22c55e" name="Completed" />
            <Line type="monotone" dataKey="failed" stroke="#ef4444" name="Failed" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function PerformanceChart({ data }: PerformanceChartProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Performance by Type</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="successRate" fill="#3b82f6" name="Success Rate (%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function FeedbackList({ feedback }: FeedbackListProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Feedback</h3>
      <div className="space-y-4">
        {feedback.map((f) => (
          <div key={f.id} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Rating: {f.rating}/5</span>
                <span className="text-gray-500">•</span>
                <span className="text-sm text-gray-600">
                  {format(f.timestamp, 'MMM dd, yyyy')}
                </span>
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-600">{f.feedback}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Helper functions
function calculateDailyActivity(actions: any[]) {
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  return last7Days.map(date => {
    const dayStart = startOfDay(date);
    const dayActions = actions.filter(
      action => startOfDay(action.startTime).getTime() === dayStart.getTime()
    );

    return {
      date: format(date, 'MMM dd'),
      total: dayActions.length,
      completed: dayActions.filter(a => a.status === 'completed').length,
      failed: dayActions.filter(a => a.status === 'failed').length,
    };
  });
}

function calculatePerformanceByType(actions: any[]) {
  return Object.entries(
    actions.reduce((acc, action) => {
      if (!acc[action.type]) {
        acc[action.type] = { total: 0, completed: 0 };
      }
      acc[action.type].total++;
      if (action.status === 'completed') {
        acc[action.type].completed++;
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number }>)
  ).map(([type, stats]) => ({
    type,
    successRate: (stats.completed / stats.total) * 100,
    total: stats.total,
  }));
}

interface ActivityChartProps {
  data: DailyActivity[];
}

interface PerformanceChartProps {
  data: PerformanceMetric[];
}

interface FeedbackListProps {
  feedback: AgentFeedback[];
} 