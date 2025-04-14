import React from 'react';
import { TaskStats as TaskStatsType } from '../../types/tasks';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Progress } from '../ui/progress';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  ArrowUp, 
  ArrowDown,
  BarChart3
} from 'lucide-react';

interface TaskStatsProps {
  stats: TaskStatsType;
}

export function TaskStats({ stats }: TaskStatsProps) {
  const completionRate = (stats.completed / stats.total) * 100;
  const inProgressRate = (stats.inProgress / stats.total) * 100;
  const blockedRate = (stats.blocked / stats.total) * 100;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.completed} completed, {stats.inProgress} in progress
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
          <Progress value={completionRate} className="mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.dueSoon}</div>
          <p className="text-xs text-muted-foreground">
            {stats.overdue} overdue tasks
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Priority Distribution</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <ArrowUp className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium">High: {stats.byPriority.high}</span>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <ArrowUp className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">Medium: {stats.byPriority.medium}</span>
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <ArrowDown className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Low: {stats.byPriority.low}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Task Status</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Completed</span>
                <span className="text-sm text-muted-foreground">{completionRate.toFixed(1)}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">In Progress</span>
                <span className="text-sm text-muted-foreground">{inProgressRate.toFixed(1)}%</span>
              </div>
              <Progress value={inProgressRate} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Blocked</span>
                <span className="text-sm text-muted-foreground">{blockedRate.toFixed(1)}%</span>
              </div>
              <Progress value={blockedRate} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 