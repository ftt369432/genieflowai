import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Mail,
  Calendar,
  FileText,
  Users,
  MessageSquare,
  Bot,
  Library,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Email', href: '/email', icon: Mail },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Knowledge Base', href: '/knowledge-base', icon: Library },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'AI Assistant', href: '/ai-assistant', icon: MessageSquare },
];

export function Navigation() {
  return (
    <nav className="space-y-1">
      {navigation.map((item) => (
        <NavLink
          key={item.name}
          to={item.href}
          className={({ isActive }) =>
            `flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`
          }
        >
          <item.icon className="h-5 w-5 mr-3" />
          {item.name}
        </NavLink>
      ))}
    </nav>
  );
} 