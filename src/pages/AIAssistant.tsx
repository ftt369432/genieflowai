import React, { useState, useRef, useEffect, useContext } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';
import { Bot, Send, Settings, Plus, MessageSquare, Users, Menu, PanelRightOpen, PanelRightClose, BookOpen, Users as UsersIcon, Mic, Paperclip, Image as ImageIconLucide, Folder } from 'lucide-react';
import type { Message, AIAssistant, Conversation, AIDocument } from '../types/ai';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { Tooltip, TooltipProvider } from '../components/ui/Tooltip';
import { AIErrorBoundary } from '../components/error/AIErrorBoundary';
import { v4 as uuidv4 } from 'uuid';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/Dialog';
import { Badge } from '../components/ui/Badge';
import { MarkdownMessage } from '../components/ai/MarkdownMessage';
import { AIContext } from '../contexts/AIContext';
import { useAssistantStore } from '../store/assistantStore';
import { Card } from '../components/ui/Card';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RightSidePanel } from '../components/layout/RightSidePanel';
import { useRightPanelState } from '../hooks/useRightPanelState';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/Popover";

export function AIAssistantPage() {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const {
    sendMessage,
  } = useContext(AIContext);
  const { theme, isDark } = useTheme();

  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const {
    isRightPanelCollapsed,
    openRightPanel,
    closeRightPanel,
    toggleRightPanel,
  } = useRightPanelState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const { assistants } = useAssistantStore();
  const [showAssistantsDialog, setShowAssistantsDialog] = useState<boolean>(false);
  const [selectedAssistant, setSelectedAssistant] = useState<AIAssistant | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [assistantToEdit, setAssistantToEdit] = useState<AIAssistant | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState<boolean>(false);
  const [newAssistantData, setNewAssistantData] = useState<Partial<AIAssistant>>({
    name: '',
    description: '',
    type: 'general',
    capabilities: [],
    systemPrompt: '',
    isActive: true,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (conversations.length === 0 && !currentConversation) {
      handleNewChat();
    }
    const currentConv = conversations.find((c) => c.id === currentConversation);
    if (currentConv) {
      setChatMessages(currentConv.messages);
    } else if (!currentConversation && conversations.length > 0) {
      setCurrentConversation(conversations[0].id);
    } else if (!currentConversation && conversations.length === 0) {
      setChatMessages([]);
    }
  }, [currentConversation, conversations]);

  const updateConversationTitle = (id: string, title: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === id ? { ...conv, title, updatedAt: new Date() } : conv
      )
    );
  };

  const handleNewChat = () => {
    const newConversation: Conversation = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      model: 'gemini-2.0-flash',
      provider: 'google',
    };
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversation(newConversation.id);
    setChatMessages([]);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const currentInput = input;
    setInput('');

    setIsProcessing(true);
    const userMessage: Message = {
      id: uuidv4(),
      content: currentInput,
      role: 'user',
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMessage]);

    const typingIndicatorId = uuidv4();
    const typingIndicatorMessage: Message = {
      id: typingIndicatorId,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      metadata: { isTyping: true },
    };
    setChatMessages((prev) => [...prev, typingIndicatorMessage]);

    try {
      const response = await sendMessage(currentInput, 'chat');

      setChatMessages((prev) => {
        const messagesWithoutIndicator = prev.filter(
          (msg) => msg.id !== typingIndicatorId
        );
        return [
          ...messagesWithoutIndicator,
          {
            id: uuidv4(),
            content: response,
            role: 'assistant',
            timestamp: new Date(),
            metadata: {},
          },
        ];
      });

      if (currentConversation) {
        setConversations((prevConvs) =>
          prevConvs.map((conv) => {
            if (conv.id === currentConversation) {
              const assistantResponseForHistory: Message = {
                id: uuidv4(),
                content: response,
                role: 'assistant',
                timestamp: new Date(),
                metadata: {},
              };
              return {
                ...conv,
                messages: [
                  ...conv.messages,
                  userMessage,
                  assistantResponseForHistory,
                ],
                updatedAt: new Date(),
              };
            }
            return conv;
          })
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setChatMessages((prev) => {
        const messagesWithoutIndicator = prev.filter(
          (msg) => msg.id !== typingIndicatorId
        );
        return [
          ...messagesWithoutIndicator,
          {
            id: uuidv4(),
            content:
              error instanceof Error
                ? `Error: ${error.message}`
                : 'An unknown error occurred',
            role: 'system',
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setIsProcessing(false);
      setChatMessages((prev) => prev.filter((msg) => msg.id !== typingIndicatorId));
    }
  };

  const renderMessage = (message: Message) => {
    if (message.metadata?.isTyping) {
      return <MarkdownMessage content={message.content} isStreaming={true} />;
    }
    return <MarkdownMessage content={message.content} />;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File selected:', e.target.files);
  };

  const toggleListening = () => {
    setIsListening((prev) => !prev);
  };

  return (
    <AIErrorBoundary>
      <TooltipProvider>
        <div
          className={cn(
            `min-h-screen bg-${
              theme === 'dark' ? 'gray-900' : 'white'
            } text-${isDark ? 'white' : 'gray-900'}`,
            'ai-assistant-container relative overflow-hidden'
          )}
        >
          <div className="flex h-screen">
            <div
              className={cn(
                'border-r border-border/50 bg-muted/30 transition-all duration-300 overflow-hidden',
                isLeftPanelCollapsed ? 'w-0' : 'w-64'
              )}
            >
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-border/50">
                  <Link 
                    to="/assistants"
                    className="w-full justify-start gap-2 mb-2 gleaming-silver-button inline-flex items-center px-4 py-2 rounded-md text-sm font-medium"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate('/assistants', { state: { user, session } });
                    }}
                  >
                    <Users className="h-4 w-4" />
                    Assistants
                  </Link>
                  <Button 
                    variant="outline"
                    className="w-full justify-start gap-2 slate-silver-gleam mb-4"
                    onClick={handleNewChat}
                  >
                    <Plus className="h-4 w-4 interactive-icon" />
                    New Chat
                  </Button>

                  {/* --- Recent Assistants Section --- */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground px-2">Recent Assistants</h4>
                    <div className="flex space-x-2 px-2">
                      {assistants.slice(0, 2).map(assistant => (
                        <TooltipProvider key={assistant.id}>
                          <Tooltip content={assistant.name}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-10 w-10 rounded-full p-0 overflow-hidden border border-border/50 hover:border-primary/50"
                              onClick={() => {
                                console.log("Switch to assistant:", assistant.name);
                                setSelectedAssistant(assistant);
                              }}
                            >
                              {assistant.avatar ? (
                                <img src={assistant.avatar} alt={assistant.name} className="h-full w-full object-cover" />
                              ) : (
                                <Bot className="h-5 w-5 text-muted-foreground" />
                              )}
                            </Button>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                      {assistants.length === 0 && (
                        <p className="text-xs text-muted-foreground px-2">No assistants yet.</p>
                      )}
                    </div>
                  </div>
                  {/* --- End Recent Assistants Section --- */}
                </div>

                <div className="flex-1 overflow-y-auto">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      className={cn(
                        'flex items-start gap-2 p-3 cursor-pointer hover:bg-muted/80 transition-colors sidebar-item',
                        currentConversation === conversation.id
                          ? 'bg-muted active'
                          : ''
                      )}
                      onClick={() => {
                        if (currentConversation !== conversation.id) {
                          setCurrentConversation(conversation.id);
                        }
                      }}
                    >
                      <MessageSquare className="h-4 w-4 mt-1 interactive-icon" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {conversation.title || 'New Chat'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(conversation.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-full">
              {/* Header */}
              <header className="flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur-md ai-header z-10">
                <div className="flex items-center gap-2">
                  {isLeftPanelCollapsed && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setIsLeftPanelCollapsed(false)}
                    >
                      <Menu className="h-4 w-4 interactive-icon" />
                    </Button>
                  )}

                  <h1 className="text-lg font-semibold">
                    {currentConversation
                      ? conversations.find((c) => c.id === currentConversation)
                          ?.title || 'Chat'
                      : 'New Chat'}
                  </h1>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 lg:hidden"
                    onClick={toggleRightPanel}
                  >
                    {isRightPanelCollapsed ? (
                      <PanelRightOpen className="h-4 w-4" />
                    ) : (
                      <PanelRightClose className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </header>

              {/* Chat Area - Add bottom padding */}
              <div className="flex-1 overflow-y-auto chat-container pb-32"> {/* Increased bottom padding significantly */}
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8"> {/* Keep padding for empty state */}
                    <Bot className="h-12 w-12 mb-4 text-muted-foreground interactive-icon" />
                    <h2 className="text-2xl font-semibold mb-2">
                      How can I help you today?
                    </h2>
                  </div>
                ) : (
                  <div className="space-y-6 p-4"> {/* Add padding here for message spacing */}
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        id={`message-${message.id}`}
                        className={cn(
                          'flex',
                          message.role === 'user'
                            ? 'justify-end'
                            : 'justify-start'
                        )}
                      >
                        <div
                          className={cn(
                            'max-w-3xl rounded-lg p-4',
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground message-user'
                              : 'bg-muted message-assistant'
                          )}
                        >
                          {renderMessage(message)}
                        </div>
                      </div>
                    ))}
                    {isProcessing && (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg typing-indicator">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200" />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          AI is thinking...
                        </span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input Area - Lifted floating styles */}
              <div className="sticky bottom-16 px-4 pt-4 pb-4 bg-gradient-to-t from-background via-background/90 to-transparent mt-auto"> {/* Changed bottom-8 to bottom-16 */}
                 {/* Centering and Max Width Wrapper */}
                 <div className="relative max-w-3xl mx-auto">
                   <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-background border border-border/50 rounded-xl shadow-lg p-2">
                     {/* Attachment Button Popover */}
                     <Popover>
                       <PopoverTrigger asChild>
                         {/* Position button inside the form area */}
                         <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                           <Paperclip className="h-4 w-4 interactive-icon" />
                         </Button>
                       </PopoverTrigger>
                       <PopoverContent className="w-48 p-2 mb-1">
                         {/* ... Popover content ... */}
                       </PopoverContent>
                     </Popover>
                     {/* Hidden file inputs (keep outside form or handle differently if needed) */}
                     
                     {/* Mic Button */}
                     <Button 
                       type="button" 
                       variant="ghost" 
                       size="icon" 
                       className="h-9 w-9 flex-shrink-0" 
                       onClick={toggleListening} 
                     >
                       <Mic className={cn("h-4 w-4 interactive-icon", isListening ? "text-red-500" : "")} />
                     </Button>

                     <Textarea
                       value={input}
                       onChange={(e) => setInput(e.target.value)}
                       onKeyDown={handleKeyDown}
                       placeholder="Message AI Assistant..."
                       className="flex-1 resize-none chat-input bg-transparent border-none focus:ring-0 focus:outline-none p-0 pl-2 pr-10" /* Simplified styles, adjust padding */
                       rows={1}
                     />
                     {/* Send Button */}
                     <Button 
                       type="submit" 
                       size="icon" 
                       className="h-9 w-9 primary flex-shrink-0" /* Use flex-shrink-0 */
                       disabled={isProcessing || !input.trim()}
                     >
                       <Send className="h-4 w-4 interactive-icon" />
                     </Button>
                   </form>
                 </div>
                 {/* Hidden file inputs moved outside form if needed, or handle via state */}
                 <input type="file" id="file-input-hidden" className="hidden" onChange={handleFileChange} multiple accept=".pdf,.doc,.docx,.txt,.md" />
                 <input type="file" id="image-input-hidden" className="hidden" onChange={handleFileChange} multiple accept="image/*" />
              </div>
            </div>
          </div>

          <div
            className={cn(
              'absolute top-0 right-0 h-full w-80 bg-background shadow-lg transition-transform duration-300 ease-in-out z-20',
              isRightPanelCollapsed ? 'translate-x-full' : 'translate-x-0'
            )}
          >
            <RightSidePanel />
          </div>

          <div
            className={cn(
              'absolute top-1/2 right-0 transform -translate-y-1/2 transition-opacity duration-300 z-30',
              !isRightPanelCollapsed && 'opacity-0 pointer-events-none'
            )}
          >
            <Button
              variant="secondary"
              className="rounded-l-full rounded-r-none h-20 w-10 p-0 flex flex-col items-center justify-center space-y-2 bg-muted/80 backdrop-blur-sm hover:bg-muted"
              onClick={openRightPanel}
            >
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>

          <div
            className={cn(
              'absolute top-4 right-80 mr-2 transition-opacity duration-300 z-30',
              isRightPanelCollapsed && 'opacity-0 pointer-events-none'
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/80 hover:bg-background"
              onClick={closeRightPanel}
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </TooltipProvider>

      <Dialog open={showAssistantsDialog} onOpenChange={setShowAssistantsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle>AI Assistants</DialogTitle>
              <DialogDescription>
                Select a trained assistant to use in your conversation. Chat
                history will be preserved.
              </DialogDescription>
            </div>
            <Button
              onClick={() => {
                setNewAssistantData({
                  name: '',
                  description: '',
                  type: 'general',
                  capabilities: [],
                  systemPrompt: '',
                  isActive: true,
                });
                setShowAssistantsDialog(false);
                setIsCreateDialogOpen(true);
              }}
              className="mt-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Assistant
            </Button>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
            {assistants.length > 0 ? (
              assistants.map((assistant) => (
                <Card
                  key={assistant.id}
                  className={cn(
                    'p-4 hover:shadow-md transition-shadow cursor-pointer relative',
                    selectedAssistant?.id === assistant.id
                      ? 'border-2 border-primary'
                      : ''
                  )}
                  onClick={() => setSelectedAssistant(assistant)}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 hover:bg-background"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAssistantToEdit(assistant);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-start pr-8">
                      <h3 className="text-lg font-semibold">{assistant.name}</h3>
                      <div
                        className={cn(
                          'px-2 py-1 rounded-full text-xs',
                          assistant.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        )}
                      >
                        {assistant.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>

                    {assistant.description && (
                      <p className="text-muted-foreground text-sm mt-2 flex-grow">
                        {assistant.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1 mt-3">
                      {assistant.capabilities?.slice(0, 3).map((capability, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {capability}
                        </Badge>
                      ))}
                      {assistant.capabilities?.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{assistant.capabilities.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/10">
                <p className="text-muted-foreground mb-4">
                  You haven't created any assistants yet.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  Create Your First Assistant
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssistantsDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedAssistant) {
                  setShowAssistantsDialog(false);

                  if (currentConversation) {
                    updateConversationTitle(
                      currentConversation,
                      `Chat with ${selectedAssistant.name}`
                    );
                  }

                  const systemMessage: Message = {
                    id: uuidv4(),
                    role: 'system',
                    content: `Switched to ${selectedAssistant.name} assistant. ${selectedAssistant.description || ''}`,
                    timestamp: new Date(),
                  };
                  setChatMessages((prev) => [...prev, systemMessage]);
                }
              }}
              disabled={!selectedAssistant}
            >
              Use Selected Assistant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Assistant</DialogTitle>
            <DialogDescription>
              Modify the assistant's details and capabilities.
            </DialogDescription>
          </DialogHeader>

          {assistantToEdit && (
            <div className="space-y-4">
              <Textarea
                value={assistantToEdit.description}
                onChange={(e) =>
                  setAssistantToEdit({
                    ...assistantToEdit,
                    description: e.target.value,
                  })
                }
                placeholder="Assistant Description"
              />
              <Textarea
                value={assistantToEdit.systemPrompt}
                onChange={(e) =>
                  setAssistantToEdit({
                    ...assistantToEdit,
                    systemPrompt: e.target.value,
                  })
                }
                placeholder="System Prompt"
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (assistantToEdit) {
                  setAssistantToEdit(null);
                  setIsEditDialogOpen(false);
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Assistant</DialogTitle>
            <DialogDescription>
              Define the assistant's details and capabilities.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              value={newAssistantData.description}
              onChange={(e) =>
                setNewAssistantData({
                  ...newAssistantData,
                  description: e.target.value,
                })
              }
              placeholder="Assistant Description"
            />
            <Textarea
              value={newAssistantData.systemPrompt}
              onChange={(e) =>
                setNewAssistantData({
                  ...newAssistantData,
                  systemPrompt: e.target.value,
                })
              }
              placeholder="System Prompt"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsCreateDialogOpen(false);
              }}
            >
              Create Assistant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AIErrorBoundary>
  );
}