import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { useCalendarStore } from '../../store/calendarStore';
import { useTaskStore } from '../../store/taskStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Clock, Calendar, Zap, TrendingUp, BrainCircuit } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';
import { cn } from '../../lib/utils';

export function CalendarAnalytics() {
  const { events, getEventsByDateRange, timeBlocks } = useCalendarStore();
  const { tasks, getTaskStats } = useTaskStore();
  
  // Calculate analytics for current week
  const currentWeekStats = useMemo(() => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const eventsInWeek = getEventsByDateRange(weekStart, weekEnd);
    
    // Calculate daily event counts
    const dailyEventCounts = weekDays.map(day => {
      const dayEvents = eventsInWeek.filter(event => 
        new Date(event.start).toDateString() === day.toDateString()
      );
      
      return {
        date: format(day, 'EEE'),
        total: dayEvents.length,
        tasks: dayEvents.filter(e => e.taskId).length,
        meetings: dayEvents.filter(e => !e.taskId && !e.timeBlockId && !e.automationId).length,
        focus: dayEvents.filter(e => e.timeBlockId).length,
      };
    });
    
    // Calculate focus block distribution by time of day
    const focusBlocks = timeBlocks.filter(block => block.focusMode);
    const morningFocus = focusBlocks.filter(block => {
      const hour = new Date(block.start).getHours();
      return hour >= 5 && hour < 12;
    }).length;
    
    const afternoonFocus = focusBlocks.filter(block => {
      const hour = new Date(block.start).getHours();
      return hour >= 12 && hour < 17;
    }).length;
    
    const eveningFocus = focusBlocks.filter(block => {
      const hour = new Date(block.start).getHours();
      return hour >= 17 && hour < 22;
    }).length;
    
    const focusDistribution = [
      { name: 'Morning', value: morningFocus, color: '#FCD34D' },
      { name: 'Afternoon', value: afternoonFocus, color: '#60A5FA' },
      { name: 'Evening', value: eveningFocus, color: '#8B5CF6' },
    ];
    
    // Calculate productivity score
    const taskCompletion = eventsInWeek.filter(e => e.taskId && e.completed).length;
    const totalTasks = eventsInWeek.filter(e => e.taskId).length;
    const completionRate = totalTasks > 0 ? (taskCompletion / totalTasks) * 100 : 0;
    
    const focusTime = timeBlocks.reduce((total, block) => {
      if (!block.focusMode) return total;
      const start = new Date(block.start);
      const end = new Date(block.end);
      return total + ((end.getTime() - start.getTime()) / (60 * 60 * 1000));
    }, 0);
    
    const productivityScore = Math.min(Math.round((completionRate * 0.6) + (focusTime * 2)), 100);
    
    // Calculate recommended improvements
    const improvements = [];
    
    if (completionRate < 70) {
      improvements.push({
        title: 'Task Completion',
        description: 'Try breaking tasks into smaller chunks for better completion rates',
        icon: TrendingUp
      });
    }
    
    if (focusTime < 3) {
      improvements.push({
        title: 'Focus Time',
        description: 'Add more focus blocks to increase deep work time',
        icon: Clock
      });
    }
    
    const noMorningFocus = morningFocus === 0;
    if (noMorningFocus && afternoonFocus > 0) {
      improvements.push({
        title: 'Morning Focus',
        description: 'Consider adding focus time in the morning when energy is typically higher',
        icon: Zap
      });
    }
    
    // Find best productivity day
    const productivityByDay = dailyEventCounts.map(day => {
      const dayProductivity = (day.focus * 2) + (day.tasks * 0.5);
      return { day: day.date, productivity: dayProductivity };
    });
    
    const bestDay = [...productivityByDay].sort((a, b) => b.productivity - a.productivity)[0];
    
    return {
      dailyEventCounts,
      focusDistribution,
      completionRate,
      focusTime,
      productivityScore,
      improvements,
      bestDay
    };
  }, [events, timeBlocks, getEventsByDateRange]);
  
  const taskStats = getTaskStats();
  
  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BrainCircuit className="mr-2 h-5 w-5 text-purple-500" />
              Productivity Score
            </CardTitle>
            <CardDescription>Based on task completion and focus time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              <div 
                className={cn(
                  "text-5xl font-bold mb-2",
                  currentWeekStats.productivityScore > 80 ? "text-green-500" : 
                  currentWeekStats.productivityScore > 60 ? "text-amber-500" : "text-red-500"
                )}
              >
                {currentWeekStats.productivityScore}%
              </div>
              <Progress 
                value={currentWeekStats.productivityScore} 
                className="w-full h-2"
                indicatorClassName={cn(
                  currentWeekStats.productivityScore > 80 ? "bg-gradient-to-r from-emerald-500 to-green-500" : 
                  currentWeekStats.productivityScore > 60 ? "bg-gradient-to-r from-amber-400 to-amber-500" : 
                  "bg-gradient-to-r from-red-400 to-red-500"
                )}
              />
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-1">Tasks</Badge>
                  {Math.round(currentWeekStats.completionRate)}%
                </div>
                <div className="flex items-center">
                  <Badge variant="outline" className="mr-1">Focus</Badge>
                  {Math.round(currentWeekStats.focusTime)}h
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-blue-500" />
              Weekly Activity
            </CardTitle>
            <CardDescription>Events distribution by day</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentWeekStats.dailyEventCounts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'focus' ? 'Focus Blocks' : name === 'tasks' ? 'Tasks' : 'Meetings']}
                  labelFormatter={(label) => `${label}`}
                />
                <Bar dataKey="tasks" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="meetings" stackId="a" fill="#60A5FA" radius={[4, 4, 0, 0]} />
                <Bar dataKey="focus" stackId="a" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Clock className="mr-2 h-5 w-5 text-indigo-500" />
              Focus Distribution
            </CardTitle>
            <CardDescription>Best focus times by time of day</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] flex flex-col justify-center">
            {currentWeekStats.focusDistribution.some(d => d.value > 0) ? (
              <div className="flex items-center space-x-6">
                <ResponsiveContainer width="60%" height={150}>
                  <PieChart>
                    <Pie
                      data={currentWeekStats.focusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => percent > 0.1 ? `${name}` : ''}
                    >
                      {currentWeekStats.focusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} blocks`, 'Focus Blocks']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1 text-sm">
                  {currentWeekStats.focusDistribution.map((entry) => (
                    <div key={entry.name} className="flex items-center">
                      <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
                      <span>{entry.name}: {entry.value} blocks</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                No focus blocks scheduled this week
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Zap className="mr-2 h-5 w-5 text-amber-500" />
              Productivity Insights
            </CardTitle>
            <CardDescription>Personalized recommendations to improve your productivity</CardDescription>
          </CardHeader>
          <CardContent>
            {currentWeekStats.improvements.length > 0 ? (
              <div className="space-y-4">
                {currentWeekStats.improvements.map((improvement, i) => (
                  <div key={i} className="flex p-3 rounded-lg bg-muted/50">
                    <improvement.icon className="h-6 w-6 mr-3 text-primary" />
                    <div>
                      <h4 className="font-medium">{improvement.title}</h4>
                      <p className="text-sm text-muted-foreground">{improvement.description}</p>
                    </div>
                  </div>
                ))}
                
                {currentWeekStats.bestDay && (
                  <div className="flex p-3 rounded-lg bg-muted/50">
                    <TrendingUp className="h-6 w-6 mr-3 text-primary" />
                    <div>
                      <h4 className="font-medium">Most Productive Day</h4>
                      <p className="text-sm text-muted-foreground">
                        {currentWeekStats.bestDay.day} is your most productive day this week
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Not enough data to provide insights yet
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
              Task Progress
            </CardTitle>
            <CardDescription>Current task status and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-lg font-bold text-amber-500">{taskStats.upcoming}</span>
                  <span className="text-xs text-muted-foreground">Upcoming</span>
                </div>
                
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-lg font-bold text-blue-500">{taskStats.total - taskStats.completed}</span>
                  <span className="text-xs text-muted-foreground">In Progress</span>
                </div>
                
                <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-lg font-bold text-green-500">{taskStats.completed}</span>
                  <span className="text-xs text-muted-foreground">Completed</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Overall Completion</span>
                  <span>{taskStats.completed} / {taskStats.total}</span>
                </div>
                <Progress 
                  value={taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0} 
                  className="h-2"
                  indicatorClassName="bg-gradient-to-r from-blue-500 to-green-500"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span>High Priority</span>
                  <Progress 
                    value={taskStats.byPriority.high > 0 ? 
                      ((taskStats.byPriority.high - taskStats.byStatus.completed) / taskStats.byPriority.high) * 100 : 0
                    } 
                    className="w-40 h-2"
                    indicatorClassName="bg-red-500"
                  />
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span>Medium Priority</span>
                  <Progress 
                    value={taskStats.byPriority.medium > 0 ? 
                      ((taskStats.byPriority.medium - taskStats.byStatus.completed) / taskStats.byPriority.medium) * 100 : 0
                    } 
                    className="w-40 h-2"
                    indicatorClassName="bg-amber-500"
                  />
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span>Low Priority</span>
                  <Progress 
                    value={taskStats.byPriority.low > 0 ? 
                      ((taskStats.byPriority.low - taskStats.byStatus.completed) / taskStats.byPriority.low) * 100 : 0
                    } 
                    className="w-40 h-2"
                    indicatorClassName="bg-blue-500"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 