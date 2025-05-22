import React, { useState, useRef, useEffect, useContext } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';
import { Bot, Send, Settings, Plus, MessageSquare, Users, Menu, PanelRightOpen, PanelRightClose, BookOpen, Users as UsersIcon, Mic, Paperclip, Image as ImageIconLucide, Folder, Upload, ChevronLeft, Camera } from 'lucide-react';
import type { Message, AIAssistant, Conversation } from '../types/ai';
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
import { Switch } from "@/components/ui/Switch";
import { Label } from "@/components/ui/Label";
import type { MultimodalPart } from '../hooks/useAIProvider';
import * as pdfjsLib from 'pdfjs-dist';

// Configure the workerSrc for pdf.js
// THIS REQUIRES YOU TO MANUALLY COPY 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs'
// TO YOUR 'public/' FOLDER as 'public/pdf.worker.min.mjs'
if (typeof window !== 'undefined') { // Ensure this runs only in the browser
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'; // Corrected extension to .mjs
}

export function AIAssistantPage() {
  const navigate: any = useNavigate();
  const { user: _user, session: _session } = useAuth();
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
  const manuallyCollapsedLeft = useRef(false); // Track manual state

  const {
    isRightPanelCollapsed,
    openRightPanel,
    closeRightPanel,
    toggleRightPanel,
  } = useRightPanelState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLeftPanelAutoHideEnabled, setIsLeftPanelAutoHideEnabled] = useState(true);
  const [isLeftPanelHovered, setIsLeftPanelHovered] = useState(false);
  const leftPanelCollapseTimer = useRef<NodeJS.Timeout | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [stagedFileParts, setStagedFileParts] = useState<MultimodalPart[]>([]);

  const manuallyCollapsedRight = useRef(false); // Track manual state for right panel

  // Add state for right panel auto-hide
  const [isRightPanelAutoHideEnabled, setIsRightPanelAutoHideEnabled] = useState(true); // Default to enabled
  const [isRightPanelHovered, setIsRightPanelHovered] = useState(false);
  const rightPanelCollapseTimer = useRef<NodeJS.Timeout | null>(null);

  // Add state for drag-and-drop
  const [isDraggingOver, setIsDraggingOver] = useState(false);

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

  useEffect(() => {
    return () => {
      if (leftPanelCollapseTimer.current) {
        console.log('LOG: Cleanup - Clearing leftPanelCollapseTimer');
        clearTimeout(leftPanelCollapseTimer.current);
      }
      if (rightPanelCollapseTimer.current) {
        console.log('LOG: Cleanup - Clearing rightPanelCollapseTimer');
        clearTimeout(rightPanelCollapseTimer.current);
      }
    };
  }, []);

  const handleLeftPanelMouseEnter = () => {
    console.log('LOG: [LP Enter]', 'AutoHide:', isLeftPanelAutoHideEnabled, 'Collapsed:', isLeftPanelCollapsed, 'Manual:', manuallyCollapsedLeft.current, 'Hovered:', isLeftPanelHovered);
    if (isLeftPanelAutoHideEnabled) {
      if (leftPanelCollapseTimer.current) {
        console.log('LOG: [LP Enter] Clearing LPTimer');
        clearTimeout(leftPanelCollapseTimer.current);
        leftPanelCollapseTimer.current = null;
      }
      setIsLeftPanelHovered(true);
      console.log('LOG: [LP Enter] Set Hovered TRUE');
      if (isLeftPanelCollapsed && !manuallyCollapsedLeft.current) {
         console.log('LOG: [LP Enter] Auto-expanding LP');
         setIsLeftPanelCollapsed(false);
      }
    }
  };

  const handleLeftPanelMouseLeave = () => {
    console.log('LOG: [LP Leave]', 'AutoHide:', isLeftPanelAutoHideEnabled, 'Collapsed:', isLeftPanelCollapsed, 'Manual:', manuallyCollapsedLeft.current, 'Hovered:', isLeftPanelHovered);
    if (isLeftPanelAutoHideEnabled) {
      setIsLeftPanelHovered(false);
      console.log('LOG: [LP Leave] Set Hovered FALSE');
      if (leftPanelCollapseTimer.current) {
        console.log('LOG: [LP Leave] Clearing existing LPTimer');
        clearTimeout(leftPanelCollapseTimer.current);
      }
      if (!isLeftPanelCollapsed) {
        console.log('LOG: [LP Leave] Setting LPTimer (700ms)');
        leftPanelCollapseTimer.current = setTimeout(() => {
          console.log('LOG: [LPTimer CB]', 'AutoHide:', isLeftPanelAutoHideEnabled, 'Manual:', manuallyCollapsedLeft.current);
          // If timer fires, it means mouse left and didn't re-enter to clear this timer.
          // Collapse if AutoHide is still enabled.
          if (isLeftPanelAutoHideEnabled) {
             console.log('LOG: [LPTimer CB] Auto-collapsing LP, Reset Manual');
             manuallyCollapsedLeft.current = false; 
             setIsLeftPanelCollapsed(true);
          } else {
            console.log('LOG: [LPTimer CB] AutoHide is OFF. Conditions NOT MET for collapse');
          }
        }, 700);
      } else {
        console.log('LOG: [LP Leave] LP already collapsed, NOT setting timer');
      }
    }
  };

  const toggleLeftPanelManually = (collapse: boolean) => {
    console.log('LOG: [ToggleLPManual] ActionCollapse:', collapse, 'CurrentManual:', manuallyCollapsedLeft.current);
    if (leftPanelCollapseTimer.current) {
      console.log('LOG: [ToggleLPManual] Clearing LPTimer');
      clearTimeout(leftPanelCollapseTimer.current);
      leftPanelCollapseTimer.current = null;
    }
    manuallyCollapsedLeft.current = collapse; 
    setIsLeftPanelCollapsed(collapse);
    setIsLeftPanelHovered(false); 
    console.log('LOG: [ToggleLPManual] Set Collapsed:', collapse, 'Manual:', manuallyCollapsedLeft.current, 'Hovered: FALSE');
  };

  const handleRightPanelMouseEnter = () => {
    console.log('LOG: [RP Enter]', 'AutoHide:', isRightPanelAutoHideEnabled, 'Collapsed:', isRightPanelCollapsed, 'Manual:', manuallyCollapsedRight.current, 'Hovered:', isRightPanelHovered);
    if (isRightPanelAutoHideEnabled) {
      if (rightPanelCollapseTimer.current) {
        console.log('LOG: [RP Enter] Clearing RPTimer');
        clearTimeout(rightPanelCollapseTimer.current);
        rightPanelCollapseTimer.current = null;
      }
      setIsRightPanelHovered(true);
      console.log('LOG: [RP Enter] Set Hovered TRUE');
      if (isRightPanelCollapsed && !manuallyCollapsedRight.current) {
        console.log('LOG: [RP Enter] Auto-expanding RP');
        openRightPanel(); 
        manuallyCollapsedRight.current = false;
      }
    }
  };

  const handleRightPanelMouseLeave = () => {
    console.log('LOG: [RP Leave]', 'AutoHide:', isRightPanelAutoHideEnabled, 'Collapsed:', isRightPanelCollapsed, 'Manual:', manuallyCollapsedRight.current, 'Hovered:', isRightPanelHovered);
    if (isRightPanelAutoHideEnabled) {
      setIsRightPanelHovered(false);
      console.log('LOG: [RP Leave] Set Hovered FALSE');
      if (rightPanelCollapseTimer.current) {
        console.log('LOG: [RP Leave] Clearing existing RPTimer');
        clearTimeout(rightPanelCollapseTimer.current);
      }
      if (!isRightPanelCollapsed) {
        console.log('LOG: [RP Leave] Setting RPTimer (700ms)');
        rightPanelCollapseTimer.current = setTimeout(() => {
          console.log('LOG: [RPTimer CB]', 'AutoHide:', isRightPanelAutoHideEnabled, 'Manual:', manuallyCollapsedRight.current);
          // If timer fires, it means mouse left and didn't re-enter to clear this timer.
          // Collapse if AutoHide is still enabled.
          if (isRightPanelAutoHideEnabled) {
            console.log('LOG: [RPTimer CB] Auto-collapsing RP, Reset Manual');
            manuallyCollapsedRight.current = false; 
            closeRightPanel(); 
          } else {
            console.log('LOG: [RPTimer CB] AutoHide is OFF. Conditions NOT MET for collapse');
          }
        }, 700);
      } else {
        console.log('LOG: [RP Leave] RP already collapsed, NOT setting timer');
      }
    }
  };

  const toggleRightPanelManually = (collapse: boolean) => {
    console.log('LOG: [ToggleRPManual] ActionCollapse:', collapse, 'CurrentManual:', manuallyCollapsedRight.current);
    if (rightPanelCollapseTimer.current) {
      console.log('LOG: [ToggleRPManual] Clearing RPTimer');
      clearTimeout(rightPanelCollapseTimer.current);
      rightPanelCollapseTimer.current = null;
    }
    manuallyCollapsedRight.current = collapse; 
    if (collapse) {
      closeRightPanel();
    } else {
      openRightPanel();
    }
    setIsRightPanelHovered(false); 
    console.log('LOG: [ToggleRPManual] Called hook. Set Manual:', manuallyCollapsedRight.current, 'Hovered: FALSE');
  };

  const updateConversationTitle = (id: string, title: string) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === id ? { ...conv, title, updatedAt: new Date() } : conv
      )
    );
  };

  const handleNewChat = () => {
    console.log("LOG: Starting new General Chat");
    setSelectedAssistant(null); 

    const newConversation: Conversation = {
      id: uuidv4(),
      title: 'New Chat', 
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      model: 'gemini-2.0-flash',
      provider: 'google',
      systemPrompt: '', 
      assistantId: undefined, 
      assistantName: undefined, 
    };
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversation(newConversation.id);
    // setChatMessages([]); // This will be handled by the useEffect watching currentConversation
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    console.log('[AIAssistantPage] handleSubmit triggered. Input:', input, 'Processing:', isProcessing);
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
      const currentConv = conversations.find(c => c.id === currentConversation);
      const systemPromptForAPI = currentConv?.systemPrompt;

      // Prepare parts for multimodal message
      const partsToSend: MultimodalPart[] = [];
      
      // Add user text input if present
      if (currentInput.trim()) {
        partsToSend.push({ text: currentInput.trim() });
      }

      // Add staged file parts (images)
      if (stagedFileParts.length > 0) {
        partsToSend.push(...stagedFileParts);
      }

      if (partsToSend.length === 0 && !systemPromptForAPI) {
        // Avoid sending completely empty messages if there's no text, no files, and no system prompt
        console.log("[AIAssistantPage] Skipping empty message send. Parts:", partsToSend, "SystemPrompt:", systemPromptForAPI);
        setIsProcessing(false);
        setChatMessages((prev) => prev.filter((msg) => msg.id !== typingIndicatorId));
        return;
      }
      
      console.log('[AIAssistantPage] About to call sendMessage. Parts:', partsToSend, 'SystemPrompt:', systemPromptForAPI);
      // Pass the parts array and systemPrompt option to sendMessage
      // useAIProvider.sendMessage will handle prepending the systemPrompt to the parts if it exists.
      const response = await sendMessage(partsToSend, 'chat', { systemPrompt: systemPromptForAPI });
      console.log('[AIAssistantPage] sendMessage call returned. Response:', response);

      // Clear staged files after successful send
      setStagedFileParts([]);
      setUploadedFiles([]); // Also clear the preview files

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
      console.error('[AIAssistantPage] Error in handleSubmit sending message:', error);
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
      console.log('[AIAssistantPage] handleSubmit finally block. Setting isProcessing to false.');
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

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFileParts: MultimodalPart[] = [];
    const filePreviews: File[] = Array.from(files);
    let processedFileCount = 0;

    for (const file of filePreviews) {
      if (file.type.startsWith('image/')) {
        try {
          const base64String = await readFileAsBase64(file);
          newFileParts.push({ 
            inlineData: { 
              mimeType: file.type, 
              data: base64String.split(',')[1]
            }
          });
          processedFileCount++;
        } catch (error) {
          console.error("Error reading image file as base64:", error);
        }
      } else if (file.type === 'application/pdf') {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map((item: any) => item.str).join(' \n'); // item is TextItem
            fullText += '\n\n'; // Page separator
          }
          if (fullText.trim()) {
            newFileParts.push({ text: `PDF Content: ${file.name}\n\n${fullText.trim()}` });
            processedFileCount++;
          }
        } catch (error) {
          console.error("Error processing PDF file:", error);
        }
      } else if (file.type === 'text/plain' || file.type === 'text/markdown') {
        try {
          const textContent = await file.text();
          if (textContent.trim()) {
            newFileParts.push({ text: `Text File Content: ${file.name}\n\n${textContent.trim()}` });
            processedFileCount++;
          }
        } catch (error) {
          console.error("Error reading text file:", error);
        }
      }
      // TODO: Add handling for other file types if necessary
    }

    if (newFileParts.length > 0) {
      setStagedFileParts(prevParts => [...prevParts, ...newFileParts]);
      // We only add successfully processed files to the preview that results in a part
      // This logic might need refinement if we want to show all selected files even if some fail processing.
      setUploadedFiles(prev => [...prev, ...filePreviews.slice(0, processedFileCount)]); 

      const systemMessageContent = `Processed ${processedFileCount} file(s) (images, PDFs, text). Ready to send with your next message.`;
      const systemMessage: Message = {
        id: uuidv4(),
        content: systemMessageContent,
        role: 'system',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, systemMessage]);
    } else if (files.length > 0) {
      // If files were selected but none were processed into parts (e.g., all unsupported types or errors)
      const systemMessage: Message = {
        id: uuidv4(),
        content: `Selected ${files.length} file(s), but none could be processed for sending (supported: images, PDF, .txt, .md).`,
        role: 'system',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, systemMessage]);
    }
  };

  // Helper function to read file as Base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    event.target.value = ''; 
  };

  const handleGeneralFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Log selected files to the console
    if (event.target.files) {
      console.log('General files selected:', event.target.files);
      setUploadedFiles(Array.from(event.target.files));
      handleFiles(event.target.files);
    }
    event.target.value = ''; 
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const relatedTarget = e.relatedTarget as Node;
    if (!e.currentTarget.contains(relatedTarget)) {
      setIsDraggingOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      console.log('Dropped files:', files);
      handleFiles(files);
    }
  };

  const toggleListening = () => {
    setIsListening((prev) => !prev);
  };

  // Capability Handlers
  const handleUploadFile = () => {
    console.log('Upload File selected');
    const fileInput = document.getElementById('general-file-input-hidden') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleRecordAudio = () => {
    console.log('Record Audio selected');
    // Implement record audio logic here
  };

  const handleCamera = () => {
    console.log('Camera selected');
    // Implement camera logic here
  };

  const handleMyDrive = () => {
    console.log('MyDrive selected');
    // Implement MyDrive logic here
  };

  const handleStartChatWithAssistant = (assistant: AIAssistant) => {
    console.log("LOG: Starting chat with assistant:", assistant.name, assistant.id);
    setSelectedAssistant(assistant); 

    const newConversation: Conversation = {
      id: uuidv4(),
      title: assistant.name, // Use assistant's name as the primary title
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      // Example for model: use assistant's specific model if defined, else a default
      // You might need a more sophisticated way to determine the model based on assistant.type or capabilities
      model: assistant.systemPrompt ? 'custom-prompt-model' : 'gemini-2.0-flash', // Placeholder logic
      provider: 'google', 
      assistantId: assistant.id,
      assistantName: assistant.name,
      systemPrompt: assistant.systemPrompt || '', 
    };
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversation(newConversation.id);
    // setChatMessages([]); // This will be handled by the useEffect watching currentConversation
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
              onMouseEnter={handleLeftPanelMouseEnter}
              onMouseLeave={handleLeftPanelMouseLeave}
            >
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => toggleLeftPanelManually(true)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="auto-hide-switch" className="text-xs text-muted-foreground">Auto-hide</Label>
                      <Switch
                        id="auto-hide-switch"
                        checked={isLeftPanelAutoHideEnabled}
                        onCheckedChange={(checked) => {
                          console.log('LOG: [LP AutoHide Switch] Value changed to:', checked);
                          setIsLeftPanelAutoHideEnabled(checked);
                          if (!checked) {
                            if (leftPanelCollapseTimer.current) {
                              console.log('LOG: [LP AutoHide Switch] Auto-hide disabled, clearing LPTimer');
                              clearTimeout(leftPanelCollapseTimer.current);
                              leftPanelCollapseTimer.current = null;
                            }
                          } else {
                            if (!isLeftPanelCollapsed && !isLeftPanelHovered) {
                                console.log('LOG: [LP AutoHide Switch] Auto-hide enabled, re-evaluating mouse leave for potential collapse');
                                handleLeftPanelMouseLeave(); 
                            }
                          }
                        }}
                        className="[&>span]:h-3 [&>span]:w-3 data-[state=checked]:bg-primary"
                      />
                    </div>
                  </div>

                  <Link 
                    to="/assistants"
                    className="w-full justify-start gap-2 mb-2 gleaming-silver-button inline-flex items-center px-4 py-2 rounded-md text-sm font-medium"
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
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="p-3 border-b border-border/50">
                    <h4 className="text-xs font-semibold text-muted-foreground px-1 mb-2">My Assistants</h4>
                    <div className="space-y-1">
                      {assistants.map((assistant) => (
                        <div
                          key={assistant.id}
                          className={cn(
                            'flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer hover:bg-muted/80 transition-colors sidebar-item',
                            selectedAssistant?.id === assistant.id ? 'bg-muted active font-medium' : 'text-muted-foreground'
                          )}
                          onClick={() => {
                            console.log('LOG: Assistant selected in new list:', assistant.name, assistant.id);
                            handleStartChatWithAssistant(assistant);
                          }}
                          title={assistant.description || assistant.name} // Show description on hover
                        >
                          {assistant.avatar ? (
                            <img src={assistant.avatar} alt={assistant.name} className="h-6 w-6 rounded-full object-cover" />
                          ) : (
                            <Bot className="h-5 w-5" /> 
                          )}
                          <span className="sidebar-item-text text-sm truncate">{assistant.name}</span>
                        </div>
                      ))}
                      {assistants.length === 0 && (
                        <p className="text-xs text-muted-foreground px-3 py-2">No assistants defined yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="p-3">
                    <h4 className="text-xs font-semibold text-muted-foreground px-1 mb-2">Recent Chats</h4>
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
                            console.log("LOG: Selecting existing conversation:", conversation.title, "ID:", conversation.id);
                            setCurrentConversation(conversation.id);
                            // When selecting an old conversation, also set the selectedAssistant
                            const linkedAssistant = conversation.assistantId ? assistants.find(a => a.id === conversation.assistantId) : null;
                            setSelectedAssistant(linkedAssistant || null); 
                            console.log("LOG: Switched to conversation, active assistant:", linkedAssistant?.name || "General Chat");
                            // chatMessages will be updated by the useEffect watching currentConversation
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
            </div>

            <div 
              className="flex-1 flex flex-col h-full relative"
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <header className="flex items-center justify-between p-3 border-b bg-background/95 backdrop-blur-md ai-header z-10">
                <div className="flex items-center gap-3">
                  {isLeftPanelCollapsed && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleLeftPanelManually(false)}
                    >
                      <Menu className="h-4 w-4 interactive-icon" />
                    </Button>
                  )}

                  {selectedAssistant ? (
                    selectedAssistant.avatar ? (
                      <img src={selectedAssistant.avatar} alt={selectedAssistant.name} className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <Bot className="h-6 w-6 text-muted-foreground" />
                    )
                  ) : (
                    <MessageSquare className="h-6 w-6 text-muted-foreground" />
                  )}
                  
                  <h1 className="text-lg font-semibold truncate">
                    {selectedAssistant 
                      ? selectedAssistant.name 
                      : currentConversation
                        ? conversations.find((c) => c.id === currentConversation)?.title || 'Chat'
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

              <div className="flex-1 overflow-y-auto chat-container pb-32">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <Bot className="h-12 w-12 mb-4 text-muted-foreground interactive-icon" />
                    <h2 className="text-2xl font-semibold mb-2">
                      How can I help you today?
                    </h2>
                  </div>
                ) : (
                  <div className="space-y-6 p-4">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        id={`message-${message.id}`}
                        className={cn(
                          'flex items-end',
                          message.role === 'user'
                            ? 'justify-end'
                            : 'justify-start gap-2'
                        )}
                      >
                        {/* Conditional Avatar for Assistant Messages */}
                        {message.role === 'assistant' && (
                          <>
                            {selectedAssistant && selectedAssistant.avatar ? (
                              <img 
                                src={selectedAssistant.avatar} 
                                alt={selectedAssistant.name} 
                                className="h-8 w-8 rounded-full object-cover mb-1"
                              />
                            ) : (
                              <Bot className="h-8 w-8 text-muted-foreground mb-1" />
                            )}
                          </>
                        )}

                        <div
                          className={cn(
                            'max-w-3xl rounded-lg p-3',
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

              <div className="sticky bottom-8 px-4 pt-4 pb-4 bg-gradient-to-t from-background via-background/90 to-transparent mt-auto">
                 <div className="relative max-w-3xl mx-auto">
                   <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-background border border-border/50 rounded-xl shadow-lg p-2">
                     {/* ADD CAPABILITIES POPOVER (PLUS BUTTON) */}
                     <Popover>
                       <PopoverTrigger asChild>
                         <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0">
                           <Plus className="h-4 w-4 interactive-icon" />
                         </Button>
                       </PopoverTrigger>
                       <PopoverContent className="w-52 p-2 mb-1"> {/* Made popover slightly wider */}
                         <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleUploadFile}>
                           <Folder className="h-4 w-4 interactive-icon" />
                           Upload File
                         </Button>
                         <Button variant="ghost" className="w-full justify-start gap-2" onClick={toggleListening}> {/* Changed to toggleListening */}
                           <Mic className={cn("h-4 w-4 interactive-icon", isListening ? "text-red-500" : "")} />
                           {isListening ? "Stop Listening" : "Record Audio"}
                         </Button>
                         <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleCamera}>
                           <Camera className="h-4 w-4 interactive-icon" />
                           Camera
                         </Button>
                         <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleMyDrive}>
                           <Upload className="h-4 w-4 interactive-icon" />
                           MyDrive
                         </Button>
                       </PopoverContent>
                     </Popover>
                     
                     {/* REMOVED standalone Mic Button */}

                     <Textarea
                       value={input}
                       onChange={(e) => setInput(e.target.value)}
                       onKeyDown={handleKeyDown}
                       placeholder="Message AI Assistant..."
                       className="flex-1 resize-none chat-input bg-transparent border-none focus:ring-0 focus:outline-none p-0 pl-2 pr-2" // Added pr-2 for spacing from send
                       rows={1}
                     />
                     <Button 
                       type="submit" 
                       size="icon" 
                       className="h-9 w-9 primary flex-shrink-0"
                       disabled={isProcessing || !input.trim() && stagedFileParts.length === 0}
                     >
                       <Send className="h-4 w-4 interactive-icon" />
                     </Button>
                   </form>
                 </div>
                 <input type="file" id="file-input-hidden" className="hidden" onChange={handleFileChange} multiple accept=".pdf,.doc,.docx,.txt,.md" />
                 <input type="file" id="image-input-hidden" className="hidden" onChange={handleFileChange} multiple accept="image/*" />
                 <input type="file" id="general-file-input-hidden" className="hidden" onChange={handleGeneralFileChange} multiple />
              </div>

              {isDraggingOver && (
                <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm flex items-center justify-center z-40 pointer-events-none">
                  <div className="border-2 border-dashed border-primary p-12 rounded-lg text-center">
                    <Upload className="h-12 w-12 mx-auto text-primary mb-4" />
                    <p className="font-semibold text-primary">Drop files here</p>
                    <p className="text-sm text-muted-foreground">Upload documents, images, etc.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div 
            className={cn(
              "absolute top-0 right-0 h-full bg-background shadow-lg transition-all duration-300 ease-in-out z-20 overflow-hidden",
              isRightPanelCollapsed ? "w-0" : "w-80"
            )}
            onMouseEnter={handleRightPanelMouseEnter}
            onMouseLeave={handleRightPanelMouseLeave}
          >
            <RightSidePanel 
              isAutoHideEnabled={isRightPanelAutoHideEnabled}
              onToggleAutoHide={(checked) => {
                console.log('LOG: [RP AutoHide Switch] Value changed to:', checked);
                setIsRightPanelAutoHideEnabled(checked);
                if (!checked) {
                  if (rightPanelCollapseTimer.current) {
                    console.log('LOG: [RP AutoHide Switch] Auto-hide disabled, clearing RPTimer');
                    clearTimeout(rightPanelCollapseTimer.current);
                    rightPanelCollapseTimer.current = null;
                  }
                } else {
                  if (!isRightPanelCollapsed && !isRightPanelHovered) {
                    console.log('LOG: [RP AutoHide Switch] Auto-hide enabled, re-evaluating mouse leave for potential collapse');
                    handleRightPanelMouseLeave();
                  }
                }
              }}
            />
          </div>

          <div
            className={cn(
              'absolute top-1/2 right-0 transform -translate-y-1/2 transition-opacity duration-300 z-30',
              !isRightPanelCollapsed && 'opacity-0 pointer-events-none'
            )}
          >
            <Button
              variant="secondary"
              className="rounded-l-full rounded-r-none h-20 w-10 p-0 flex flex-col items-center justify-center space-y-2 bg-gray-600/70 text-gray-100 shadow-lg backdrop-blur-sm hover:bg-gray-500/70"
              onClick={() => toggleRightPanelManually(false)}
            >
              <BookOpen className="h-4 w-4" />
              <UsersIcon className="h-4 w-4" />
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
              onClick={() => toggleRightPanelManually(true)}
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </TooltipProvider>

      <Dialog open={showAssistantsDialog} onOpenChange={setShowAssistantsDialog}>
        <DialogContent className="max-w-3xl" aria-describedby="assistants-description">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle>AI Assistants</DialogTitle>
              <DialogDescription id="assistants-description">
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