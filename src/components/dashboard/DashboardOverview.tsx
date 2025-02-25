import React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ListTodo,
  Mail,
  Star,
  TrendingUp,
  AlertCircle,
  Calendar as CalendarIcon,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { format, isToday, isThisWeek } from 'date-fns';
import { testTasks, testEvents, testEmails } from '../../data/testData';
import { useThemeStore } from '../../store/themeStore';
import { cn } from '@/utils/cn';

export function DashboardOverview() {
  const { style } = useThemeStore();
  const isCyberpunk = style === 'cyberpunk';

  // Calculate task statistics
  const totalTasks = testTasks.length;
  const completedTasks = testTasks.filter(task => task.completed).length;
  const urgentTasks = testTasks.filter(task => task.priority === 'high').length;
  
  // Calculate today's events
  const todayEvents = testEvents.filter(event => isToday(event.start));
  const weekEvents = testEvents.filter(event => isThisWeek(event.start));
  
  // Calculate unread emails
  const unreadEmails = testEmails.filter(email => !email.read).length;

  return (
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {completedTasks}/{totalTasks}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
              <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Today's Events</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {todayEvents.length}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full">
              <CalendarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Urgent Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {urgentTasks}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Unread Emails</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {unreadEmails}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-full">
              <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Overview */}
        <Card className={cn(
          "p-6",
          isCyberpunk && "border border-cyberpunk-neon/50"
        )}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={cn(
              "text-lg font-semibold",
              isCyberpunk ? "text-cyberpunk-neon" : "text-gray-900 dark:text-white"
            )}>Today's Tasks</h2>
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                isCyberpunk 
                  ? "border-cyberpunk-neon/50 text-cyberpunk-neon hover:bg-cyberpunk-neon/10"
                  : "dark:border-gray-600 dark:text-gray-300"
              )}
            >
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {testTasks
              .filter(task => !task.completed)
              .slice(0, 4)
              .map(task => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg",
                    isCyberpunk
                      ? "bg-cyberpunk-darker/50 border border-cyberpunk-neon/30"
                      : "bg-gray-50/50 dark:bg-gray-700/50"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      isCyberpunk
                        ? task.priority === 'high'
                          ? "bg-red-500/20 text-red-400"
                          : task.priority === 'medium'
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-green-500/20 text-green-400"
                        : task.priority === 'high'
                        ? "bg-red-500/20 dark:bg-red-500/30"
                        : task.priority === 'medium'
                        ? "bg-amber-500/20 dark:bg-amber-500/30"
                        : "bg-green-500/20 dark:bg-green-500/30"
                    )}>
                      <Star className="h-4 w-4" />
                    </div>
                    <div>
                      <p className={cn(
                        "font-medium",
                        isCyberpunk ? "text-cyberpunk-neon" : "text-gray-900 dark:text-white"
                      )}>{task.title}</p>
                      <p className={cn(
                        "text-sm",
                        isCyberpunk ? "text-cyberpunk-neon/70" : "text-gray-600 dark:text-gray-400"
                      )}>
                        Due {format(task.dueDate, 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={cn(
                      "text-sm",
                      isCyberpunk ? "text-cyberpunk-neon/70" : "text-gray-600 dark:text-gray-400"
                    )}>{task.duration}m</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className={cn(
                        isCyberpunk 
                          ? "hover:bg-cyberpunk-neon/10 text-cyberpunk-neon"
                          : "hover:bg-gray-200/50 dark:hover:bg-gray-600/50"
                      )}
                    >
                      <Activity className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
          </div>
        </Card>

        {/* Calendar Overview */}
        <Card className={cn(
          "p-6",
          isCyberpunk && "border border-cyberpunk-neon/50"
        )}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={cn(
              "text-lg font-semibold",
              isCyberpunk ? "text-cyberpunk-neon" : "text-gray-900 dark:text-white"
            )}>Upcoming Events</h2>
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                isCyberpunk 
                  ? "border-cyberpunk-neon/50 text-cyberpunk-neon hover:bg-cyberpunk-neon/10"
                  : "dark:border-gray-600 dark:text-gray-300"
              )}
            >
              View Calendar
            </Button>
          </div>
          <div className="space-y-4">
            {weekEvents.slice(0, 4).map(event => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg",
                  isCyberpunk
                    ? "bg-cyberpunk-darker/50 border border-cyberpunk-neon/30"
                    : "bg-gray-50/50 dark:bg-gray-700/50"
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "p-2 rounded-full",
                    isCyberpunk
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-blue-500/20 dark:bg-blue-500/30"
                  )}>
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className={cn(
                      "font-medium",
                      isCyberpunk ? "text-cyberpunk-neon" : "text-gray-900 dark:text-white"
                    )}>{event.title}</p>
                    <p className={cn(
                      "text-sm",
                      isCyberpunk ? "text-cyberpunk-neon/70" : "text-gray-600 dark:text-gray-400"
                    )}>
                      {format(event.start, 'MMM dd, h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={cn(
                    "px-2 py-1 text-xs rounded-full",
                    isCyberpunk
                      ? event.type === 'meeting'
                        ? "bg-purple-500/20 text-purple-700 dark:text-purple-300"
                        : event.type === 'task'
                        ? "bg-blue-500/20 text-blue-700 dark:text-blue-300"
                        : "bg-green-500/20 text-green-700 dark:text-green-300"
                      : event.type === 'meeting'
                      ? "bg-purple-500/20 dark:bg-purple-500/30 text-purple-700 dark:text-purple-300"
                      : event.type === 'task'
                      ? "bg-blue-500/20 dark:bg-blue-500/30 text-blue-700 dark:text-blue-300"
                      : "bg-green-500/20 dark:bg-green-500/30 text-green-700 dark:text-green-300"
                  )}>
                    {event.type}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div>
        <Card className={cn(
          "p-6",
          isCyberpunk && "border border-cyberpunk-neon/50"
        )}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={cn(
              "text-lg font-semibold",
              isCyberpunk ? "text-cyberpunk-neon" : "text-gray-900 dark:text-white"
            )}>Recent Activity</h2>
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                isCyberpunk 
                  ? "border-cyberpunk-neon/50 text-cyberpunk-neon hover:bg-cyberpunk-neon/10"
                  : "dark:border-gray-600 dark:text-gray-300"
              )}
            >
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {testEmails.slice(0, 3).map(email => (
              <motion.div
                key={email.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg",
                  isCyberpunk
                    ? "bg-cyberpunk-darker/50 border border-cyberpunk-neon/30"
                    : "bg-gray-50/50 dark:bg-gray-700/50"
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "p-2 rounded-full",
                    isCyberpunk
                      ? "bg-indigo-500/20 text-indigo-400"
                      : "bg-indigo-500/20 dark:bg-indigo-500/30"
                  )}>
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <p className={cn(
                      "font-medium",
                      isCyberpunk ? "text-cyberpunk-neon" : "text-gray-900 dark:text-white"
                    )}>{email.subject}</p>
                    <p className={cn(
                      "text-sm",
                      isCyberpunk ? "text-cyberpunk-neon/70" : "text-gray-600 dark:text-gray-400"
                    )}>
                      From: {email.from}
                    </p>
                  </div>
                </div>
                <div className={cn(
                  "text-sm",
                  isCyberpunk ? "text-cyberpunk-neon/70" : "text-gray-600 dark:text-gray-400"
                )}>
                  {format(email.date, 'MMM dd, h:mm a')}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
} 