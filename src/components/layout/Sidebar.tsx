import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';
import { Tooltip } from '../ui/Tooltip';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import {
  Home,
  Mail,
  Calendar,
  MessageSquare,
  Brain,
  Activity,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileText,
  HardDrive,
  Users,
  BarChart2,
  BookOpen,
  Zap,
  Phone,
  MessageCircle,
  Smartphone,
  Headphones,
  PhoneCall,
  MessagesSquare,
  Contact,
  Network,
  Share2,
  Users2,
  Workflow
} from 'lucide-react';

const sidebarItems = [
  // Core Features
  { path: '/', icon: Home, label: 'Dashboard', color: 'text-blue-500' },
  { path: '/email', icon: Mail, label: 'Email', color: 'text-indigo-500' },
  { path: '/calendar', icon: Calendar, label: 'Calendar', color: 'text-green-500' },
  { path: '/documents', icon: FileText, label: 'Documents', color: 'text-yellow-500' },
  
  // AI Features
  { 
    path: '/ai-assistant', 
    icon: MessageSquare, 
    label: 'AI Assistant', 
    color: 'text-orange-500',
    isPremium: true 
  },
  { 
    path: '/agents', 
    icon: Brain, 
    label: 'AI Agents', 
    color: 'text-purple-500',
    isPremium: true 
  },
  {
    path: '/drive',
    icon: HardDrive,
    label: 'AI Drive',
    color: 'text-cyan-500',
    isPremium: true
  },
  {
    path: '/ai-training',
    icon: BookOpen,
    label: 'AI Training',
    color: 'text-pink-500',
    isPremium: true
  },

  // Analytics & Data
  { 
    path: '/analytics', 
    icon: Activity, 
    label: 'Analytics', 
    color: 'text-emerald-500',
    isEnterprise: true 
  },
  { 
    path: '/knowledge', 
    icon: Database, 
    label: 'Knowledge Base', 
    color: 'text-violet-500',
    isEnterprise: true 
  },
  {
    path: '/insights',
    icon: BarChart2,
    label: 'Insights',
    color: 'text-amber-500',
    isEnterprise: true
  },
  
  // Collaboration
  { path: '/contacts', icon: Users, label: 'Contacts', color: 'text-teal-500' },
  { path: '/workflows', icon: Zap, label: 'Workflows', color: 'text-rose-500' },
  
  // Settings
  { path: '/settings', icon: Settings, label: 'Settings', color: 'text-gray-500' }
];

interface SidebarItemProps {
  item: typeof sidebarItems[0];
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  isCollapsed: boolean;
  isActive: boolean;
}

interface SidebarSection {
  title: string;
  items: typeof sidebarItems;
}

const sidebarSections: SidebarSection[] = [
  {
    title: 'Core Features',
    items: [
      { path: '/', icon: Home, label: 'Dashboard', color: 'text-blue-500' },
      { path: '/email', icon: Mail, label: 'Email', color: 'text-indigo-500' },
      { path: '/calendar', icon: Calendar, label: 'Calendar', color: 'text-green-500' },
      { path: '/documents', icon: FileText, label: 'Documents', color: 'text-yellow-500' },
    ]
  },
  {
    title: 'Collaboration',
    items: [
      { 
        path: '/workflows', 
        icon: Zap, 
        label: 'Workflows', 
        color: 'text-rose-500',
        isPremium: true 
      },
      { 
        path: '/teams', 
        icon: Users2, 
        label: 'Teams', 
        color: 'text-amber-500' 
      },
      { 
        path: '/chat', 
        icon: MessagesSquare, 
        label: 'Chat', 
        color: 'text-cyan-500' 
      },
      { 
        path: '/contacts', 
        icon: Users, 
        label: 'Contacts', 
        color: 'text-teal-500' 
      },
    ]
  },
  {
    title: 'Communication & Contacts',
    items: [
      { 
        path: '/phone', 
        icon: Phone, 
        label: 'Phone System', 
        color: 'text-rose-500',
        isPremium: true 
      },
      { 
        path: '/messaging', 
        icon: MessageCircle, 
        label: 'Text Messages', 
        color: 'text-pink-500',
        isPremium: true 
      },
      { 
        path: '/integrations', 
        icon: Share2, 
        label: 'Integrations', 
        color: 'text-orange-500',
        isPremium: true 
      },
    ]
  },
  {
    title: 'AI Features',
    items: [
      { 
        path: '/ai-assistant', 
        icon: MessageSquare, 
        label: 'AI Assistant', 
        color: 'text-orange-500',
        isPremium: true 
      },
      { 
        path: '/agents', 
        icon: Brain, 
        label: 'AI Agents', 
        color: 'text-purple-500',
        isPremium: true 
      },
      {
        path: '/drive',
        icon: HardDrive,
        label: 'AI Drive',
        color: 'text-cyan-500',
        isPremium: true
      },
      {
        path: '/ai-training',
        icon: BookOpen,
        label: 'AI Training',
        color: 'text-pink-500',
        isPremium: true
      },
    ]
  },
  {
    title: 'Analytics & Data',
    items: [
      { 
        path: '/analytics', 
        icon: Activity, 
        label: 'Analytics', 
        color: 'text-emerald-500',
        isEnterprise: true 
      },
      { 
        path: '/knowledge', 
        icon: Database, 
        label: 'Knowledge Base', 
        color: 'text-violet-500',
        isEnterprise: true 
      },
      {
        path: '/insights',
        icon: BarChart2,
        label: 'Insights',
        color: 'text-amber-500',
        isEnterprise: true
      },
    ]
  },
  {
    title: 'Settings & System',
    items: [
      { path: '/settings', icon: Settings, label: 'Settings', color: 'text-gray-500' },
      { 
        path: '/integrations/phone', 
        icon: Smartphone, 
        label: 'Phone Setup', 
        color: 'text-slate-500',
        isPremium: true 
      },
      { 
        path: '/network', 
        icon: Network, 
        label: 'Network', 
        color: 'text-zinc-500',
        isEnterprise: true 
      }
    ]
  }
];

const SectionHeader = ({ title, isCollapsed }: { title: string; isCollapsed: boolean }) => {
  if (isCollapsed) return null;
  
  return (
    <motion.h3 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider"
    >
      {title}
    </motion.h3>
  );
};

const DraggableSidebarItem = ({ item, index, moveItem, isCollapsed, isActive }: SidebarItemProps) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'SIDEBAR_ITEM',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'SIDEBAR_ITEM',
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        moveItem(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  const itemContent = (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200",
        "hover:bg-gray-100 dark:hover:bg-gray-700",
        isActive && "bg-gray-100 dark:bg-gray-700",
        item.isPremium && "hover:ring-2 hover:ring-amber-500/20",
        item.isEnterprise && "hover:ring-2 hover:ring-purple-500/20"
      )}
    >
      <div className="flex items-center">
        <item.icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'} ${item.color} transition-colors`} />
        {!isCollapsed && <span className="font-medium">{item.label}</span>}
      </div>
      {!isCollapsed && (item.isPremium || item.isEnterprise) && (
        <span className={cn(
          "text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity",
          item.isPremium && "text-amber-500",
          item.isEnterprise && "text-purple-500"
        )}>
          {item.isPremium ? 'Premium' : 'Enterprise'}
        </span>
      )}
    </motion.div>
  );

  return (
    <motion.div 
      ref={(node) => drag(drop(node))} 
      style={{ opacity: isDragging ? 0.5 : 1 }}
      layout
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {isCollapsed ? (
        <Tooltip content={item.label} side="right">
          <Link to={item.path}>{itemContent}</Link>
        </Tooltip>
      ) : (
        <Link to={item.path}>{itemContent}</Link>
      )}
    </motion.div>
  );
};

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const [items, setItems] = useState(sidebarItems);
  const location = useLocation();

  useEffect(() => {
    const savedOrder = localStorage.getItem('sidebarOrder');
    if (savedOrder) {
      setItems(JSON.parse(savedOrder));
    }
  }, []);

  const moveItem = (dragIndex: number, hoverIndex: number) => {
    const newItems = [...items];
    const draggedItem = newItems[dragIndex];
    newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, draggedItem);
    setItems(newItems);
    localStorage.setItem('sidebarOrder', JSON.stringify(newItems));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <motion.div 
        className={cn(
          "fixed top-0 left-0 h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700",
          "transition-all duration-300 ease-in-out z-30",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <motion.nav className="h-full flex flex-col">
          <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <Brain className="h-8 w-8 text-primary-500" />
                <span className="font-bold text-lg">GenieFlow</span>
              </div>
            )}
            {isCollapsed && <Brain className="h-8 w-8 text-primary-500" />}
          </div>

          <div className="flex-1 overflow-y-auto">
            {sidebarSections.map((section, sectionIndex) => (
              <div key={section.title} className="py-2">
                {!isCollapsed && (
                  <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    {section.title}
                  </h3>
                )}
                {section.items.map((item, index) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-300",
                      "hover:bg-gray-100 dark:hover:bg-gray-700",
                      "transition-colors duration-150",
                      location.pathname === item.path && "bg-gray-100 dark:bg-gray-700 text-primary-500",
                      item.isPremium && "hover:ring-2 hover:ring-amber-500/20",
                      item.isEnterprise && "hover:ring-2 hover:ring-purple-500/20"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", item.color)} />
                    {!isCollapsed && (
                      <>
                        <span className="ml-3">{item.label}</span>
                        {(item.isPremium || item.isEnterprise) && (
                          <span className={cn(
                            "ml-auto text-xs font-medium",
                            item.isPremium ? "text-amber-500" : "text-purple-500"
                          )}>
                            {item.isPremium ? 'Premium' : 'Enterprise'}
                          </span>
                        )}
                      </>
                    )}
                  </Link>
                ))}
              </div>
            ))}
          </div>

          <button
            onClick={onToggle}
            className={cn(
              "absolute top-4 -right-3 bg-white dark:bg-gray-800 rounded-full p-1",
              "border border-gray-200 dark:border-gray-700",
              "hover:bg-gray-100 dark:hover:bg-gray-700",
              "transition-colors duration-150"
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </motion.nav>
      </motion.div>
    </DndProvider>
  );
}