import { LayoutDashboard, FileText, MessageSquare, User, Settings, Github, Book } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export function AppNavigation() {
  return (
    <nav>
      <NavLink to="/dashboard" icon={<LayoutDashboard className="h-5 w-5" />} label="Dashboard" />
      <NavLink to="/documents" icon={<FileText className="h-5 w-5" />} label="Documents" />
      <NavLink to="/knowledge-base" icon={<Book className="h-5 w-5" />} label="Knowledge Base" />
      <NavLink to="/chat" icon={<MessageSquare className="h-5 w-5" />} label="Chat" />
    </nav>
  );
} 