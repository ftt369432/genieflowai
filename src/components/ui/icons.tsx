import React from 'react';
import {
  Send,
  Loader2,
  Sparkles,
  ArrowRight,
  Brain,
  MessageSquare,
  Book,
  Settings,
  FileText,
  Upload,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Folder,
  FolderPlus,
  PlusCircle,
  Plus,
  Search,
  HardDrive,
  User,
  Users,
  Calendar,
  Mail,
  Bell,
  HelpCircle,
  Info,
  AlertCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

export type IconProps = React.HTMLAttributes<SVGElement>;

export const Icons = {
  send: Send,
  loader: Loader2,
  sparkles: Sparkles,
  arrowRight: ArrowRight,
  brain: Brain,
  messageSquare: MessageSquare,
  book: Book,
  settings: Settings,
  fileText: FileText,
  upload: Upload,
  check: Check,
  x: X,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  folder: Folder,
  folderPlus: FolderPlus,
  plusCircle: PlusCircle,
  plus: Plus,
  search: Search,
  hardDrive: HardDrive,
  user: User,
  users: Users,
  calendar: Calendar,
  mail: Mail,
  bell: Bell,
  helpCircle: HelpCircle,
  info: Info,
  alertCircle: AlertCircle,
  alertTriangle: AlertTriangle,
  externalLink: ExternalLink,
  
  // Custom components
  spinner: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      className={`animate-spin ${props.className || ''}`}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  ),
  
  logo: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a4.5 4.5 0 0 0 0 9 4.5 4.5 0 0 1 0 9" />
      <path d="M12 2c2.5 0 4.5 4 4.5 9s-2 9-4.5 9" />
    </svg>
  )
}; 