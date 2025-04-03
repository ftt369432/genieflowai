import React, { useState, useRef, useEffect } from 'react';
import { TeamsSidebar } from '../components/teams/TeamsSidebar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Plus, Search, Send, Paperclip, Smile, Users, Bookmark, Pin, Bell, Share2, Brain, Zap, FileText, MessageSquare, Bot, Sparkles, AtSign, ChevronDown } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import { Separator } from '../components/ui/Separator';
import { Badge } from '../components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/Tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/Popover';

// Define Message interface
interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
    role?: 'admin' | 'member' | 'guest' | 'ai';
  };
  timestamp: string;
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
  }[];
  attachments?: {
    type: 'image' | 'file' | 'link';
    name: string;
    url: string;
    thumbnail?: string;
    size?: string;
  }[];
  isAIGenerated?: boolean;
  aiMetadata?: {
    model: string;
    prompt?: string;
    confidence?: number;
  };
}

interface AIAssistant {
  id: string;
  name: string;
  avatar: string;
  description: string;
  capabilities: string[];
  isActive: boolean;
}

// Mock data for messages
const mockMessages: Message[] = [
  {
    id: 'm1',
    content: 'Hey team, I just pushed the latest design updates to the repository. Please take a look and let me know your thoughts!',
    sender: {
      id: 'user-1',
      name: 'Alex Johnson',
      avatar: '/avatars/user1.png',
      role: 'admin'
    },
    timestamp: '10:30 AM',
    reactions: [
      { emoji: '👍', count: 3, users: ['user-2', 'user-3', 'user-4'] },
      { emoji: '🔥', count: 2, users: ['user-2', 'user-5'] }
    ],
    attachments: [
      { type: 'file', name: 'design-update.pdf', url: '/files/design-update.pdf', size: '2.4 MB' }
    ]
  },
  {
    id: 'm2',
    content: 'Looks great! I especially like the new navigation structure. Did you consider adding the dropdown we discussed last week?',
    sender: {
      id: 'user-3',
      name: 'Jordan Lee',
      avatar: '/avatars/user3.png',
      role: 'member'
    },
    timestamp: '10:45 AM',
    reactions: [
      { emoji: '👏', count: 1, users: ['user-1'] }
    ]
  },
  {
    id: 'm3',
    content: 'Based on the team\'s discussion, I\'ve analyzed the design update and here are my observations:\n\n• The new navigation improves user flow by 20%\n• Mobile responsiveness is well implemented\n• Accessibility score is 98/100\n• Recommend adding keyboard shortcuts for power users\n\nI can help prepare documentation for these changes if needed.',
    sender: {
      id: 'ai-1',
      name: 'Design Assistant',
      avatar: '/avatars/ai-assistant.png',
      role: 'ai'
    },
    timestamp: '10:52 AM',
    isAIGenerated: true,
    aiMetadata: {
      model: 'Gemini Pro',
      confidence: 0.92
    }
  },
  {
    id: 'm4',
    content: 'Thanks for the analysis! That\'s really helpful. Could you draft a quick summary of these changes for our client meeting tomorrow?',
    sender: {
      id: 'user-2',
      name: 'Taylor Smith',
      avatar: '/avatars/user2.png',
      role: 'member'
    },
    timestamp: '11:05 AM',
    reactions: [
      { emoji: '✅', count: 1, users: ['user-1'] }
    ]
  }
];

// Mock data for AI assistants
const mockAIAssistants: AIAssistant[] = [
  {
    id: 'ai-1',
    name: 'Design Assistant',
    avatar: '/avatars/ai-design.png',
    description: 'Specialized in UI/UX design feedback and suggestions',
    capabilities: ['Design analysis', 'Accessibility checks', 'User flow optimization'],
    isActive: true
  },
  {
    id: 'ai-2',
    name: 'Code Helper',
    avatar: '/avatars/ai-code.png',
    description: 'Helps with code review, bug identification, and best practices',
    capabilities: ['Code review', 'Bug detection', 'Performance suggestions'],
    isActive: false
  },
  {
    id: 'ai-3',
    name: 'Project Manager',
    avatar: '/avatars/ai-pm.png',
    description: 'Assists with task management, deadlines, and resource allocation',
    capabilities: ['Timeline planning', 'Resource allocation', 'Risk assessment'],
    isActive: false
  }
];

// Add expert responses for different topics
const expertResponses = {
  stocks: {
    'AAPL': 'Apple Inc. (AAPL) is currently trading at $182.52, up 1.2% today. The company recently announced record Q2 earnings with revenue of $94.8 billion. Analysts have a consensus "Buy" rating with a price target of $198.',
    'MSFT': 'Microsoft Corp. (MSFT) is currently trading at $417.88, up 0.5% today. Their cloud division Azure reported 27% growth in the latest quarter. The company has shown strong performance in AI integration across their product suite.',
    'GOOGL': 'Alphabet Inc. (GOOGL) is trading at $172.23, down 0.3% today. Google\'s advertising revenue continues to be strong, while their cloud business is growing at 28% year-over-year. Recent AI innovations like Gemini are positioning them well against competitors.',
    'AMZN': 'Amazon.com Inc. (AMZN) is currently at $182.15, up 1.8% today. AWS remains their most profitable division, though retail showed strong recovery in the latest quarter. Their advertising business is becoming a significant revenue source.',
    'TSLA': 'Tesla Inc. (TSLA) is trading at $175.22, down 2.1% today. Vehicle deliveries grew 6% year-over-year in the latest quarter. The company continues to face challenges with production ramp-up of new models and increasing competition in the EV market.',
  } as Record<string, string>,
  project: {
    'timeline': 'Based on the current progress and resource allocation, I estimate the project will be completed in approximately 12 weeks. Critical path items include the API integration (4 weeks), UI development (6 weeks, can overlap with API work), and testing/QA (3 weeks). I recommend adding a 15% buffer for unexpected issues.',
    'budget': 'The current project budget allocation stands at $245,000, with 35% already utilized. Major upcoming expenses include developer resources ($120,000), cloud infrastructure ($35,000), and third-party services ($28,000). Based on current burn rate, we\'re tracking within 5% of planned expenditure.',
    'resources': 'The project currently has 8 team members allocated: 3 full-stack developers, 2 frontend specialists, 1 DevOps engineer, 1 product manager, and 1 QA specialist. Based on the current timeline, we may need an additional frontend resource for weeks 6-10 to meet the UI development deadline.',
    'risks': 'Key project risks include: 1) Dependency on third-party API with historically variable uptime (mitigation: implement cached responses), 2) New technology stack for team (mitigation: additional training and external consultant), 3) Tight deadline with limited buffer (mitigation: prioritize MVP features and define clear scope boundaries).',
  },
  marketing: {
    'campaign': 'Based on historical data, the current campaign is performing 22% better than our Q1 efforts. Key metrics: CTR of 4.2% (up from 3.1%), conversion rate of 2.8% (up from 2.2%), and CAC of $38 (down from $45). Top performing channels are Instagram (42% of conversions) and Google Search (35%).',
    'competitors': 'Main competitor analysis shows they\'ve increased ad spend by approximately 30% this quarter. Their messaging is focusing more on sustainability and premium features, while price promotion frequency has decreased by 15%. Their social engagement metrics are up 25%, primarily on TikTok and YouTube.',
    'audience': 'Customer segmentation analysis reveals our fastest growing demographic is now 25-34 year old urban professionals, representing 38% of new customers (up from 29% last year). Product feature preferences within this segment prioritize mobile integration, premium design, and subscription options over one-time purchases.',
  },
  default: 'I\'m Genie Expert, your AI team member. I can help with questions about stocks, project management, marketing, and many other topics. Just mention me with @Genie Expert followed by your question, and I\'ll provide insights based on the latest available information.'
};

export const TeamsPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState({
    name: 'design-showcase',
    description: 'Design discussions and resources'
  });
  
  const [messageInput, setMessageInput] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [activeAssistants, setActiveAssistants] = useState<string[]>(['ai-1']);
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const mentionsRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleAIAssistant = (id: string) => {
    if (activeAssistants.includes(id)) {
      setActiveAssistants(activeAssistants.filter(assistantId => assistantId !== id));
    } else {
      setActiveAssistants([...activeAssistants, id]);
    }
  };

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      const newMessage: Message = {
        id: `m${messages.length + 1}`,
        content: messageInput,
        sender: {
          id: 'user-1',
          name: 'Alex Johnson',
          avatar: '/avatars/user1.png',
          role: 'admin'
        },
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages([...messages, newMessage]);
      setMessageInput('');
      
      // Check if the message mentions the AI expert
      if (messageInput.includes('@Genie Expert')) {
        setTimeout(() => {
          const query = messageInput.split('@Genie Expert')[1].trim().toLowerCase();
          
          // Generate AI expert response based on the query
          let expertResponse = expertResponses.default;
          
          // Check for stock symbols (uppercase 1-5 letter words)
          const stockMatch = query.match(/\b[A-Z]{1,5}\b/g);
          if (stockMatch) {
            for (const symbol of stockMatch) {
              if (expertResponses.stocks[symbol]) {
                expertResponse = expertResponses.stocks[symbol];
                break;
              }
            }
          } 
          // Check for project management topics
          else if (query.includes('timeline') || query.includes('when') || query.includes('deadline')) {
            expertResponse = expertResponses.project.timeline;
          } else if (query.includes('budget') || query.includes('cost') || query.includes('money')) {
            expertResponse = expertResponses.project.budget;
          } else if (query.includes('resources') || query.includes('team') || query.includes('people')) {
            expertResponse = expertResponses.project.resources;
          } else if (query.includes('risk') || query.includes('issues') || query.includes('problems')) {
            expertResponse = expertResponses.project.risks;
          }
          // Check for marketing topics
          else if (query.includes('campaign') || query.includes('marketing')) {
            expertResponse = expertResponses.marketing.campaign;
          } else if (query.includes('competitor') || query.includes('competition')) {
            expertResponse = expertResponses.marketing.competitors;
          } else if (query.includes('audience') || query.includes('demographic') || query.includes('customers')) {
            expertResponse = expertResponses.marketing.audience;
          }
          
          const aiResponse: Message = {
            id: `m${messages.length + 2}`,
            content: expertResponse,
            sender: {
              id: 'ai-expert',
              name: 'Genie Expert',
              avatar: '/avatars/ai-expert.png',
              role: 'ai'
            },
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAIGenerated: true,
            aiMetadata: {
              model: 'Gemini Pro',
              confidence: 0.95
            }
          };
          
          setMessages(currentMessages => [...currentMessages, aiResponse]);
        }, 1000);
      }
    }
  };
  
  const handleAIAssist = () => {
    if (messageInput.trim()) {
      // This would trigger AI to process the current message
      console.log('AI processing message:', messageInput);
      // In a real implementation, we'd wait for the AI response before clearing
      setMessageInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // If the user types '@', show the mentions dropdown
    if (e.key === '@') {
      setShowMentions(true);
      setMentionFilter('');
    }
    // If user presses Enter without shift, send the message
    else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } 
    // Hide mentions dropdown on escape
    else if (e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    
    // If we're showing mentions and there's an @ symbol, update the filter
    if (showMentions) {
      const lastAtPos = e.target.value.lastIndexOf('@');
      if (lastAtPos !== -1) {
        setMentionFilter(e.target.value.slice(lastAtPos + 1));
      } else {
        setShowMentions(false);
      }
    }
  };

  const insertMention = (name: string) => {
    const lastAtPos = messageInput.lastIndexOf('@');
    if (lastAtPos !== -1) {
      const newInput = messageInput.slice(0, lastAtPos) + `@${name} ` + messageInput.slice(lastAtPos + 1 + mentionFilter.length);
      setMessageInput(newInput);
    }
    setShowMentions(false);
    messageInputRef.current?.focus();
  };

  // Filter mentions based on input
  const mentions = [
    { id: 'ai-expert', name: 'Genie Expert', avatar: '/avatars/ai-expert.png', role: 'ai' },
    { id: 'user-1', name: 'Alex Johnson', avatar: '/avatars/user1.png', role: 'admin' },
    { id: 'user-2', name: 'Taylor Smith', avatar: '/avatars/user2.png', role: 'member' },
    { id: 'user-3', name: 'Jordan Lee', avatar: '/avatars/user3.png', role: 'member' },
  ].filter(mention => 
    mention.name.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <TeamsSidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b px-4 py-2 flex items-center justify-between">
          <div className="flex items-center">
            <div className="mr-4">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold flex items-center">
                {currentPage.name}
                <Badge variant="outline" className="ml-2 px-1.5 py-0">Page</Badge>
                {activeAssistants.length > 0 && (
                  <Badge variant="outline" className="ml-2 px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200">
                    <Brain className="h-3 w-3 mr-1" /> AI Enhanced
                  </Badge>
                )}
              </h1>
              <p className="text-sm text-muted-foreground">{currentPage.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Users className="h-4 w-4 mr-1" />
              <span className="text-xs">12</span>
            </Button>
            <Button variant="ghost" size="sm">
              <Bookmark className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Pin className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Bell className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </header>
        
        {/* Main area split between chat and AI panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Messages area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Scrollable messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.isAIGenerated ? 'bg-purple-50 dark:bg-purple-900/10 p-3 rounded-lg' : ''}`}
                >
                  <div className="mr-3 flex-shrink-0">
                    <Avatar className={`h-8 w-8 ${message.sender.role === 'ai' ? 'ring-2 ring-purple-300 ring-offset-2' : ''}`}>
                      <AvatarImage src={message.sender.avatar} alt={message.sender.name} />
                      <AvatarFallback>{message.sender.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <span className="font-semibold">{message.sender.name}</span>
                      {message.sender.role === 'admin' && (
                        <Badge variant="outline" className="ml-2 py-0 h-4 text-[10px]">Admin</Badge>
                      )}
                      {message.sender.role === 'ai' && (
                        <Badge variant="outline" className="ml-2 py-0 h-4 text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                          <Bot className="h-2 w-2 mr-1" /> AI
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground ml-2">{message.timestamp}</span>
                    </div>
                    <div className="mt-1 whitespace-pre-line">
                      {message.content}
                    </div>
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {message.attachments.map((attachment, i) => (
                          <div 
                            key={i} 
                            className="border rounded-md p-2 flex items-center bg-muted/30"
                          >
                            <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                            <div>
                              <div className="text-sm font-medium">{attachment.name}</div>
                              {attachment.size && <div className="text-xs text-muted-foreground">{attachment.size}</div>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {message.reactions.map((reaction, i) => (
                          <div 
                            key={i} 
                            className="border rounded-full px-2 py-0.5 text-xs flex items-center bg-background hover:bg-accent cursor-pointer"
                          >
                            <span className="mr-1">{reaction.emoji}</span>
                            <span>{reaction.count}</span>
                          </div>
                        ))}
                        <div className="border rounded-full px-2 py-0.5 text-xs flex items-center bg-background hover:bg-accent cursor-pointer">
                          <Plus className="h-3 w-3" />
                        </div>
                      </div>
                    )}
                    {message.isAIGenerated && message.aiMetadata && (
                      <div className="mt-2 text-xs text-muted-foreground flex items-center">
                        <Sparkles className="h-3 w-3 mr-1 text-purple-500" />
                        <span>Generated by {message.aiMetadata.model}</span>
                        {message.aiMetadata.confidence && (
                          <span className="ml-2">· Confidence: {Math.round(message.aiMetadata.confidence * 100)}%</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message input */}
            <div className="p-4 border-t">
              <div className="flex items-start relative">
                <Textarea 
                  ref={messageInputRef}
                  className="flex-1 min-h-[80px] resize-none"
                  placeholder="Type your message here... Use @Genie Expert to ask questions about stocks, projects, etc."
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                />
                
                {/* Mentions dropdown */}
                {showMentions && (
                  <div 
                    ref={mentionsRef}
                    className="absolute top-full mt-1 left-0 bg-white dark:bg-gray-800 shadow-md rounded-md border border-border overflow-hidden w-56 z-10"
                  >
                    {mentions.length > 0 ? (
                      mentions.map(mention => (
                        <div
                          key={mention.id}
                          className="flex items-center px-3 py-2 hover:bg-muted cursor-pointer"
                          onClick={() => insertMention(mention.name)}
                        >
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={mention.avatar} alt={mention.name} />
                            <AvatarFallback>{mention.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{mention.name}</span>
                          {mention.role === 'ai' && (
                            <Badge variant="outline" className="ml-2 py-0 h-4 text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                              <Bot className="h-2 w-2 mr-1" /> AI
                            </Badge>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-muted-foreground text-sm">No matches found</div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <AtSign className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-0" align="start">
                      <div className="font-medium text-xs p-2 border-b">Mention someone</div>
                      <div className="max-h-60 overflow-y-auto">
                        {mentions.map(mention => (
                          <div
                            key={mention.id}
                            className="flex items-center px-3 py-2 hover:bg-muted cursor-pointer"
                            onClick={() => insertMention(mention.name)}
                          >
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarImage src={mention.avatar} alt={mention.name} />
                              <AvatarFallback>{mention.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{mention.name}</span>
                            {mention.role === 'ai' && (
                              <Badge variant="outline" className="ml-2 py-0 h-4 text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                                <Bot className="h-2 w-2 mr-1" /> AI
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`${showAIPanel ? 'bg-purple-100 text-purple-700' : ''}`}
                          onClick={() => setShowAIPanel(!showAIPanel)}
                        >
                          <Brain className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>AI Assistants</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={handleAIAssist} disabled={!messageInput.trim()}>
                    <Zap className="h-4 w-4 mr-1 text-purple-500" />
                    AI Assist
                  </Button>
                  <Button size="sm" onClick={handleSendMessage} disabled={!messageInput.trim()}>
                    <Send className="h-4 w-4 mr-1" />
                    Send
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* AI assistant panel - conditionally displayed */}
          {showAIPanel && (
            <div className="w-80 border-l p-4 flex flex-col bg-gray-50 dark:bg-gray-900">
              <h3 className="font-semibold mb-3 flex items-center">
                <Brain className="h-4 w-4 mr-2 text-purple-500" />
                AI Assistants
              </h3>
              
              <div className="mb-4">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search assistants..." 
                    className="h-8 text-xs pl-8"
                  />
                </div>
              </div>
              
              <div className="space-y-3 flex-1 overflow-y-auto">
                {/* Genie Expert Card */}
                <div 
                  className="p-3 rounded-lg border border-purple-300 bg-purple-50 dark:bg-purple-900/10"
                >
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2 ring-2 ring-purple-300 ring-offset-2">
                      <AvatarImage src="/avatars/ai-expert.png" alt="Genie Expert" />
                      <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium text-sm">Genie Expert</div>
                      <div className="text-xs text-muted-foreground">Your AI team member for expert insights</div>
                    </div>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="mt-2">
                    <div className="text-xs font-medium mb-1">Expert Knowledge Areas:</div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">Stock Market</Badge>
                      <Badge variant="outline" className="text-[10px]">Project Management</Badge>
                      <Badge variant="outline" className="text-[10px]">Marketing</Badge>
                      <Badge variant="outline" className="text-[10px]">Technology</Badge>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-muted-foreground">
                    <p>Mention with @Genie Expert followed by your question to get insights in the conversation.</p>
                  </div>
                </div>

                {mockAIAssistants.map(assistant => (
                  <div 
                    key={assistant.id}
                    className={`p-3 rounded-lg border ${activeAssistants.includes(assistant.id) ? 'border-purple-300 bg-purple-50 dark:bg-purple-900/10' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={assistant.avatar} alt={assistant.name} />
                        <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{assistant.name}</div>
                        <div className="text-xs text-muted-foreground">{assistant.description}</div>
                      </div>
                      <Button 
                        variant={activeAssistants.includes(assistant.id) ? "default" : "outline"} 
                        size="sm"
                        className={`h-7 ${activeAssistants.includes(assistant.id) ? 'bg-purple-500' : ''}`}
                        onClick={() => toggleAIAssistant(assistant.id)}
                      >
                        {activeAssistants.includes(assistant.id) ? 'Active' : 'Activate'}
                      </Button>
                    </div>
                    
                    {assistant.capabilities && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {assistant.capabilities.map((capability, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">
                            {capability}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                
                <Button variant="outline" className="w-full mt-4 text-sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Create Custom Assistant
                </Button>
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Quick AI Actions</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    <Sparkles className="h-3.5 w-3.5 mr-2 text-purple-500" />
                    Summarize conversation
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    <Sparkles className="h-3.5 w-3.5 mr-2 text-purple-500" />
                    Extract action items
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                    <Sparkles className="h-3.5 w-3.5 mr-2 text-purple-500" />
                    Generate meeting notes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 