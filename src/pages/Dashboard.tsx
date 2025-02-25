import React from 'react';
import { Brain, Users, Calendar, FileText, Activity, Zap } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface Metric {
  label: string;
  value: string;
  change: number;
  icon: React.ReactNode;
}

interface Activity {
  id: string;
  type: 'task' | 'agent' | 'message';
  title: string;
  description: string;
  timestamp: Date;
  status: 'completed' | 'in_progress' | 'pending';
}

export function Dashboard() {
  const metrics: Metric[] = [
    { label: 'Active Agents', value: '12', change: 2, icon: <Brain className="w-5 h-5" /> },
    { label: 'Team Members', value: '24', change: -1, icon: <Users className="w-5 h-5" /> },
    { label: 'Tasks Today', value: '47', change: 5, icon: <Calendar className="w-5 h-5" /> },
    { label: 'Documents', value: '156', change: 12, icon: <FileText className="w-5 h-5" /> },
  ];

  const recentActivities: Activity[] = [
    {
      id: '1',
      type: 'agent',
      title: 'Data Analysis Complete',
      description: 'Market research data analysis finished with 95% accuracy',
      timestamp: new Date(),
      status: 'completed'
    },
    {
      id: '2',
      type: 'task',
      title: 'New Task Created',
      description: 'Project planning for Q2 initiatives',
      timestamp: new Date(Date.now() - 3600000),
      status: 'in_progress'
    },
    {
      id: '3',
      type: 'message',
      title: 'AI Assistant Update',
      description: 'New capabilities added to conversation model',
      timestamp: new Date(Date.now() - 7200000),
      status: 'completed'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary">Welcome back! Here's your AI workspace overview.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Quick Action
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-primary/10">
                {metric.icon}
              </div>
              <div className={`text-sm ${metric.change >= 0 ? 'text-success' : 'text-error'}`}>
                {metric.change > 0 ? '+' : ''}{metric.change}%
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-text-primary">{metric.value}</div>
              <div className="text-sm text-text-secondary">{metric.label}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Recent Activity</h2>
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-3 rounded-lg hover:bg-primary/5">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'agent' ? 'bg-primary/10' :
                  activity.type === 'task' ? 'bg-warning/10' :
                  'bg-success/10'
                }`}>
                  {activity.type === 'agent' ? <Brain className="w-4 h-4" /> :
                   activity.type === 'task' ? <Calendar className="w-4 h-4" /> :
                   <FileText className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-text-primary">{activity.title}</h3>
                    <span className="text-sm text-text-secondary">
                      {activity.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mt-1">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions Panel */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">Quick Actions</h2>
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
              <Brain className="w-6 h-6" />
              <span>New Agent</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
              <Calendar className="w-6 h-6" />
              <span>Schedule Task</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
              <FileText className="w-6 h-6" />
              <span>Create Document</span>
            </Button>
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2">
              <Users className="w-6 h-6" />
              <span>Team Chat</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
} 