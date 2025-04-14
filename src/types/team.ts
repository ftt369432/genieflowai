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

// New interface for Slack-like channels
export interface TeamChannel {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  createdAt: string;
  createdBy: TeamMember;
  members: TeamMember[];
  messages: TeamMessage[];
  pinnedMessages?: TeamMessage[];
  lastActivity?: string;
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
  parentMessageId?: string; // For threads attached to specific messages
  channelId?: string; // For channel-based threads
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
  threadId?: string; // Reference to a thread if this message started one
  channelId?: string; // Which channel this message belongs to
  hasThread?: boolean; // Indicator if this message has replies
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
  channels: TeamChannel[]; // Add channels to the Team interface
}

// Add type aliases for backwards compatibility
export type Page = TeamPage;
export type Thread = TeamThread;
export type Channel = TeamChannel; 