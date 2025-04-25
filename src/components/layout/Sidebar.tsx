import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useSidebarStore } from '../../store/sidebarStore';
import { AutoCollapseToggle } from './AutoCollapseToggle';
import {
  Home,
  Users,
  BarChart2,
  BookOpen,
  Wand2,
  MessageSquare,
  Bell,
  Cog,
  UserCircle,
  Layers,
  FolderKanban,
  Zap,
  CalendarDays,
  Clock,
  LineChart,
  Brain,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
  ListFilter,
  KanbanSquare,
  Database,
  FileText,
  ListTodo,
  HardDrive,
  PanelLeftClose,
  Mail,
  FolderOpen,
  Table,
  Gavel,
  Stethoscope,
  User,
  Settings,
  Network,
  GraduationCap,
  Briefcase,
  Cpu,
  ClipboardList,
  Calendar,
  PanelLeft,
  BarChart,
  Server,
  Activity,
  GitBranch
} from 'lucide-react';
import { useAssistantStore } from '../../store/assistantStore';

interface SidebarItem {
  title: string;
  icon: React.ElementType;
  href: string;
  notification?: number;
  color?: string;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const sidebarSections: SidebarSection[] = [
  {
    title: 'Core',
    items: [
      {
        title: 'Dashboard',
        icon: Home,
        href: '/',
        color: 'text-blue-500',
      },
      {
        title: 'Email',
        icon: Mail,
        href: '/email',
        color: 'text-indigo-500',
      },
      {
        title: 'Tasks',
        icon: ListTodo,
        href: '/tasks',
        color: 'text-orange-500',
      },
      {
        title: 'Calendar',
        icon: CalendarDays,
        href: '/calendar',
        color: 'text-green-500',
      },
      {
        title: 'Teams',
        icon: Users,
        href: '/teams',
        color: 'text-blue-400',
      },
    ],
  },
  {
    title: 'Documents & Knowledge',
    items: [
      {
        title: 'Documents',
        icon: FileText,
        href: '/documents',
        color: 'text-purple-500',
      },
      {
        title: 'Notebooks',
        icon: BookOpen,
        href: '/notebooks',
        color: 'text-teal-500',
      },
      {
        title: 'Projects',
        icon: Layers,
        href: '/projects',
        color: 'text-cyan-500',
      },
      {
        title: 'Knowledge Base',
        icon: Database,
        href: '/knowledge',
        color: 'text-amber-600', 
      },
    ],
  },
  {
    title: 'AI Features',
    items: [
      {
        title: 'Assistants',
        icon: Wand2,
        href: '/assistants',
        color: 'text-green-500 font-semibold',
      },
      {
        title: 'AI Assistant',
        icon: MessageSquare,
        href: '/assistant',
        color: 'text-pink-500',
      },
      {
        title: 'Genie Drive',
        icon: FolderOpen,
        href: '/drive',
        color: 'text-indigo-500',
      },
      {
        title: 'AI Agents',
        icon: Brain,
        href: '/agents',
        color: 'text-purple-500',
      },
      {
        title: 'Automation Hub',
        icon: Zap,
        href: '/automation',
        color: 'text-amber-500',
      },
    ],
  },
  {
    title: 'Analytics & Data',
    items: [
      {
        title: 'Analytics',
        icon: BarChart2,
        href: '/analytics',
        color: 'text-emerald-500',
      },
      {
        title: 'Audit Dashboard',
        icon: LineChart,
        href: '/dashboard/audit',
        color: 'text-yellow-500',
      },
    ],
  },
  {
    title: 'Settings',
    items: [
      {
        title: 'Notifications',
        icon: Bell,
        href: '/notifications',
        color: 'text-red-500',
        notification: 3,
      },
      {
        title: 'Settings',
        icon: Cog,
        href: '/settings',
        color: 'text-gray-500',
      },
      {
        title: 'Profile',
        icon: UserCircle,
        href: '/profile',
        color: 'text-sky-500',
      },
    ],
  },
  {
    title: 'Developer Tools',
    items: [
      {
        title: 'Email Test',
        icon: Mail,
        href: '/email-test',
        color: 'text-purple-500',
      },
    ],
  },
];

interface SidebarLinkProps {
  item: SidebarItem;
  isActive: boolean;
  isCollapsed: boolean;
}

function SidebarLink({ item, isActive, isCollapsed }: SidebarLinkProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActiveLink = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate(item.href);
  };

  if (isCollapsed) {
    return (
      <div className="relative group">
        <Link
          to={item.href}
          className={cn(
            "flex justify-center items-center h-10 w-10 rounded-md mx-auto",
            isActiveLink ? "bg-muted" : "hover:bg-muted/50"
          )}
          aria-label={item.title}
          onClick={handleClick}
        >
          <item.icon className={cn("h-5 w-5", item.color)} />
          {item.notification && (
            <span className="absolute top-0 right-1 h-4 w-4 rounded-full bg-primary text-[10px] flex items-center justify-center text-primary-foreground">
              {item.notification}
            </span>
          )}
        </Link>
        {/* Tooltip */}
        <div className="absolute left-full ml-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 py-1 rounded bg-gray-800 text-white text-xs whitespace-nowrap pointer-events-none">
          {item.title}
        </div>
      </div>
    );
  }

  return (
    <Link
      to={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-muted",
        isActiveLink ? "bg-muted font-medium active" : "text-muted-foreground"
      )}
      onClick={handleClick}
      aria-current={isActiveLink ? "page" : undefined}
    >
      <item.icon className={cn("h-5 w-5", item.color)} />
      <span className="sidebar-item-text">{item.title}</span>
      {item.notification && (
        <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
          {item.notification}
        </span>
      )}
    </Link>
  );
}

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ isCollapsed: propIsCollapsed, onToggle }: SidebarProps) {
  const { isOpen, autoCollapse, toggleAutoCollapse } = useSidebarStore();
  const [isCollapsed, setIsCollapsed] = useState(propIsCollapsed ?? false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Use prop isCollapsed if provided, otherwise use internal state
  const collapsed = propIsCollapsed !== undefined ? propIsCollapsed : isCollapsed;

  // Sync with props when they change
  useEffect(() => {
    if (propIsCollapsed !== undefined) {
      setIsCollapsed(propIsCollapsed);
    }
  }, [propIsCollapsed]);

  // Auto-collapse functionality
  useEffect(() => {
    if (!autoCollapse) return;

    // Function to handle mouse enter/leave
    const handleMouseEnter = () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      
      if (collapsed && onToggle) {
        onToggle(); // Use the parent's toggle function to ensure state stays in sync
      } else if (collapsed) {
        setIsCollapsed(false);
      }
    };

    const handleMouseLeave = () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      
      hoverTimeoutRef.current = setTimeout(() => {
        if (!collapsed && onToggle) {
          onToggle(); // Use the parent's toggle function to ensure state stays in sync
        } else if (!collapsed) {
          setIsCollapsed(true);
        }
        hoverTimeoutRef.current = null;
      }, 500); // Small delay to prevent accidental collapses
    };

    // Add event listeners
    const sidebarElement = sidebarRef.current;
    if (sidebarElement) {
      sidebarElement.addEventListener('mouseenter', handleMouseEnter);
      sidebarElement.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      // Clean up event listeners and timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (sidebarElement) {
        sidebarElement.removeEventListener('mouseenter', handleMouseEnter);
        sidebarElement.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [autoCollapse, collapsed, onToggle]);

  const handleToggleSidebar = () => {
    if (onToggle) {
      onToggle();
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  // Get responsive classes
  const sidebarClasses = cn(
    "flex flex-col h-screen border-r bg-background transition-all duration-300",
    collapsed ? "w-[70px]" : "w-64"
  );

  const navLinks = [
    { to: '/', icon: <Home size={20} />, label: 'Dashboard' },
    { to: '/assistant', icon: <MessageSquare size={20} />, label: 'AI Assistant' },
    { to: '/agents', icon: <Cpu size={20} />, label: 'Agents' },
    { to: '/swarm', icon: <Network size={20} />, label: 'Swarm' },
    { to: '/legal-swarm', icon: <Briefcase size={20} />, label: 'Legal Swarm' },
    { to: '/profile', icon: <User size={20} />, label: 'Profile' },
    { to: '/settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div
      ref={sidebarRef}
      className={sidebarClasses}
      role="navigation"
    >
      <div className="h-16 flex items-center px-4 border-b shadow-sm">
        <div className="flex items-center justify-between w-full">
          {!collapsed && (
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              GenieFlow AI
            </h1>
          )}
          {collapsed && (
            <GraduationCap className="h-5 w-5 mx-auto text-primary" />
          )}
          <button
            onClick={handleToggleSidebar}
            className={cn(
              "p-2 rounded-md hover:bg-muted transition-colors",
              collapsed && "mx-auto"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>

      {/* Sidebar Sections Content */}
      <div className="flex-1 overflow-y-auto py-2">
        {sidebarSections.map((section) => (
          <div key={section.title} className="py-2">
            {!collapsed && (
              <h3 className="px-3 text-xs font-medium text-muted-foreground mb-1">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <SidebarLink 
                  key={item.href}
                  item={item}
                  isActive={location.pathname === item.href || location.pathname.startsWith(item.href + '/')}
                  isCollapsed={collapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Auto-collapse toggle at the bottom */}
      <div className="mt-auto pt-2 border-t border-border/60">
        <div className={collapsed ? "px-2 py-3" : ""}>
          <AutoCollapseToggle compact={collapsed} />
        </div>
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            <p>GenieFlowAI v1.0.0</p>
            <p>© 2025 GenieFlow Inc.</p>
          </div>
        </div>
      </div>
    </div>
  );
}