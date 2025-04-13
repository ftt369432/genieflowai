export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'member';
  status: 'online' | 'offline' | 'away';
}

export interface DirectMessage {
  id: string;
  user: TeamMember;
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount: number;
  lastMessageTime?: string;
}

export interface TeamPage {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  createdBy: TeamMember;
}

export interface TeamThread {
  id: string;
  title: string;
  createdAt: string;
  lastUpdate: string;
  messageCount: number;
  participants: TeamMember[];
  lastMessage?: string;
  creator: TeamMember;
}

export interface TeamMessage {
  id: string;
  content: string;
  timestamp: string;
  sender: TeamMember;
  attachments?: {
    id: string;
    name: string;
    type: string;
    url: string;
  }[];
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
  }[];
  isAI?: boolean;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  createdAt: string;
  members: TeamMember[];
  pages: TeamPage[];
  threads: TeamThread[];
  directMessages: DirectMessage[];
  messages: TeamMessage[];
}

// Add type aliases for backwards compatibility
export type Page = TeamPage;
export type Thread = TeamThread; 