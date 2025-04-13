import React, { useState, useRef, useEffect } from 'react';
import { useAssistantStore } from '../../store/assistantStore';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/Card';
import { Checkbox } from '../ui/Checkbox';
import { Label } from '../ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/Tabs';
import { Badge } from '../ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/Dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/Collapsible';
import { Plus, Upload, Brain, MessageSquare, Book, Trash, Edit, PlusCircle, FileText, Save, ArrowRight, ChevronDown } from 'lucide-react';
import { nanoid } from 'nanoid';
import type { AIAssistant, AIModel, AIFolder, AIDocument, AIPrompt } from '../../types/ai';
import { Icons } from '../../components/ui/icons';

// Simple file upload component since we don't have the exact DocumentUploader
function SimpleFileUploader({ onUpload }: { onUpload: (files: File[]) => Promise<void> }) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    await onUpload(Array.from(files));
    // Reset the input value to allow uploading the same file again
    e.target.value = '';
  };
  
  return (
    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
      <Upload className="h-10 w-10 text-gray-400 mb-2" />
      <p className="text-sm text-gray-500 mb-4">Drag 'n' drop files here, or click to select files</p>
      <input
        type="file"
        onChange={handleFileChange}
        className="hidden"
        id="file-input"
        multiple
        accept=".txt,.md,.pdf,.doc,.docx"
      />
      <Button 
        variant="outline" 
        onClick={() => document.getElementById('file-input')?.click()}
      >
        Select Files
      </Button>
    </div>
  );
}

interface InteractiveAssistantCreatorProps {
  assistantId?: string;
  onSave?: (assistant: AIAssistant) => void;
  onCancel?: () => void;
}

export function InteractiveAssistantCreator({ assistantId, onSave, onCancel }: InteractiveAssistantCreatorProps) {
  const { 
    assistants, 
    addAssistant, 
    updateAssistant, 
    getAssistantById,
    assignFolderToAssistant,
    removeFolderFromAssistant,
    getAssistantFolders
  } = useAssistantStore();
  
  const { 
    folders, 
    addFolder, 
    documents, 
    addDocument, 
    generateEmbedding,
    tags,
    addTag
  } = useKnowledgeBaseStore();
  
  // Basic assistant information
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [assistantPurpose, setAssistantPurpose] = useState('');
  
  // Interactive chat with AI during creation
  const [messages, setMessages] = useState<{role: 'user' | 'assistant' | 'system', content: string}[]>([
    {
      role: 'system', 
      content: 'I\'m here to help you create a specialized AI assistant. We can design it together, adding knowledge, setting behaviors, and creating prompts.'
    },
    {
      role: 'assistant',
      content: 'Let\'s create your specialized assistant! What specific task or purpose would you like this assistant to help with?'
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Prompts for knowledge base
  const [savedPrompts, setSavedPrompts] = useState<AIPrompt[]>([]);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptContent, setNewPromptContent] = useState('');
  const [newPromptCategory, setNewPromptCategory] = useState('legal');
  const [newPromptTags, setNewPromptTags] = useState<string[]>([]);
  
  // Knowledge base creation during assistant setup
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);
  
  // Load data if editing existing assistant
  useEffect(() => {
    if (assistantId) {
      const assistant = getAssistantById(assistantId);
      if (assistant) {
        setName(assistant.name);
        setDescription(assistant.description || '');
        setSystemPrompt(assistant.systemPrompt || '');
        setSelectedFolders(getAssistantFolders(assistantId));
        
        // Add a welcome back message for editing
        setMessages([
          ...messages,
          {
            role: 'assistant',
            content: `Welcome back! We're editing your "${assistant.name}" assistant. What would you like to modify or improve?`
          }
        ]);
      }
    }
  }, [assistantId, getAssistantById, getAssistantFolders]);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Send message to AI during creation process
  const sendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    // Add user message
    const userMessage = { role: 'user' as const, content: currentMessage };
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    
    // Simulate AI response (in a real implementation, this would call your AI backend)
    setIsLoading(true);
    
    try {
      const userMessageLower = currentMessage.toLowerCase();
      let aiResponse = "";
      
      // Check for intent to create a folder
      if (userMessageLower.match(/create (?:a )?(?:new )?folder|make (?:a )?folder|add (?:a )?folder/i)) {
        // Extract folder name if provided
        const folderNameMatch = currentMessage.match(/(?:called|named) ["']?([^"']+)["']?/i);
        if (folderNameMatch && folderNameMatch[1]) {
          // User provided a folder name, create it
          const extractedName = folderNameMatch[1].trim();
          setNewFolderName(extractedName);
          
          // Wait a bit then trigger folder creation
          setTimeout(() => {
            setShowNewFolderDialog(true);
            createNewFolder();
          }, 500);
          
          aiResponse = `I'm creating a new folder called "${extractedName}" for your assistant now.`;
        } else {
          // Just show the folder creation dialog
          setShowNewFolderDialog(true);
          aiResponse = "Let's create a new folder. Please enter a name for the folder in the dialog.";
        }
      }
      // Check for intent to set up system prompt
      else if (userMessageLower.includes('system prompt') || 
              userMessageLower.includes('instructions') ||
              userMessageLower.includes('tell it how to behave') ||
              userMessageLower.includes('how should it act')) {
        
        // Generate a contextual system prompt based on the assistant's purpose
        let generatedPrompt = "";
        
        if (assistantPurpose.toLowerCase().includes('legal') || userMessageLower.includes('legal')) {
          generatedPrompt = `You are an AI assistant specializing in legal matters. Provide helpful information while being clear about legal limitations. You are not a lawyer and should remind users to consult with legal professionals for specific advice. Focus on explaining legal concepts, helping draft documents, and providing general information about legal procedures.`;
        } 
        else if (assistantPurpose.toLowerCase().includes('write') || assistantPurpose.toLowerCase().includes('content') || userMessageLower.includes('writing')) {
          generatedPrompt = `You are an AI writing assistant designed to help with content creation. You can help draft articles, blog posts, emails, and other written content. You aim to be creative, clear, and match the appropriate tone for the context. You can also help review and improve existing writing with suggestions for clarity, style, and grammar.`;
        }
        else if (assistantPurpose.toLowerCase().includes('research') || userMessageLower.includes('research')) {
          generatedPrompt = `You are a research assistant designed to help analyze information, find patterns, and organize knowledge. You can help with literature reviews, data analysis, and fact-checking. You should encourage systematic approaches to research and help maintain academic rigor.`;
        }
        else {
          generatedPrompt = `You are a helpful AI assistant focused on ${assistantPurpose || 'providing useful information'}. You aim to be clear, accurate, and helpful. When you don't know something, you admit your limitations rather than making up information.`;
        }
        
        // Set the system prompt
        setSystemPrompt(generatedPrompt);
        
        aiResponse = `I've created a system prompt for your assistant:\n\n"${generatedPrompt}"\n\nYou can edit this in the Basic Info tab if you want to make changes.`;
      }
      // Check for intent to upload documents
      else if (userMessageLower.includes('upload') || 
              userMessageLower.includes('document') || 
              userMessageLower.includes('file') ||
              userMessageLower.includes('pdf') ||
              userMessageLower.includes('add document')) {
        
        if (selectedFolders.length === 0) {
          // No folders selected yet
          if (folders.length === 0) {
            // Create a default folder
            const defaultFolderName = assistantPurpose ? 
              `${assistantPurpose.charAt(0).toUpperCase() + assistantPurpose.slice(1)} Resources` : 
              'Knowledge Base';
            
            setNewFolderName(defaultFolderName);
            
            // Show creation confirmation
            aiResponse = `I'll create a default folder called "${defaultFolderName}" first, then you can upload documents to it. Would you like to proceed?`;
            
            // Wait a bit then create the folder
            setTimeout(() => {
              createNewFolder();
              setUploadMode(true);
            }, 1000);
          } else {
            // Suggest selecting a folder
            aiResponse = `You have ${folders.length} folders available. Please select one from the Knowledge tab before uploading documents, or let me know if you'd like to create a new folder.`;
            
            // Auto-switch to knowledge tab
            setActiveTab('knowledge');
          }
        } else {
          // Folder is selected, enable upload mode
          setUploadMode(true);
          aiResponse = "Great! You can now upload documents using the file uploader that's appeared in the Knowledge tab. Your documents will help your assistant learn and provide better responses.";
          
          // Switch to knowledge tab
          setActiveTab('knowledge');
        }
      }
      // Check for intent to name the assistant
      else if (userMessageLower.match(/name (?:the|this|my) assistant|call (?:the|this|my) assistant|assistant(?:'s)? name/i)) {
        const nameMatch = currentMessage.match(/(?:name it|call it|named) ["']?([^"']+)["']?/i);
        if (nameMatch && nameMatch[1]) {
          const extractedName = nameMatch[1].trim();
          setName(extractedName);
          aiResponse = `Great! I've named your assistant "${extractedName}". Would you like to add a short description as well?`;
        } else {
          aiResponse = `What would you like to name your assistant? For example, you could call it "Legal Research Assistant" or something else relevant to its purpose.`;
        }
      }
      // Check for intent to set a description
      else if (userMessageLower.includes('description') || 
              userMessageLower.includes('describe') ||
              userMessageLower.match(/what (?:it|the assistant) does/i)) {
        
        if (userMessageLower.match(/description should be|make the description|set the description/i)) {
          // Extract the description
          const descriptionMatch = currentMessage.match(/(?:description should be|make the description|set the description) ["']?([^"']+)["']?/i);
          if (descriptionMatch && descriptionMatch[1]) {
            const extractedDescription = descriptionMatch[1].trim();
            setDescription(extractedDescription);
            aiResponse = `Perfect! I've set the description to: "${extractedDescription}". This will help users understand what your assistant does.`;
          } else {
            aiResponse = `What would you like the description to be? This helps users understand what your assistant can help them with.`;
          }
        } else {
          // Auto-generate a description based on purpose
          const generatedDescription = `AI assistant specialized in ${assistantPurpose || 'helping with various tasks'}. Can answer questions and provide assistance with related topics.`;
          setDescription(generatedDescription);
          aiResponse = `I've generated a description: "${generatedDescription}". Feel free to edit it in the Basic Info tab if you'd like something different.`;
        }
      }
      // Check if user wants to save/finish
      else if (userMessageLower.match(/save|create|finish|done|ready|complete|that's all|good to go/i)) {
        // Check if we have enough info to create a minimal assistant
        if (!name) {
          // Generate a name based on purpose if needed
          const generatedName = assistantPurpose ? 
            `${assistantPurpose.charAt(0).toUpperCase() + assistantPurpose.slice(1)} Assistant` : 
            'New Assistant';
          setName(generatedName);
        }
        
        if (!description) {
          // Generate a description based on purpose if needed
          const generatedDescription = `AI assistant specialized in ${assistantPurpose || 'helping with various tasks'}`;
          setDescription(generatedDescription);
        }
        
        if (!systemPrompt) {
          // Generate a basic system prompt if needed
          const generatedPrompt = `You are a helpful AI assistant focused on ${assistantPurpose || 'providing useful information'}. You aim to be clear, accurate, and helpful.`;
          setSystemPrompt(generatedPrompt);
        }
        
        aiResponse = `Great! Your assistant is ready to be created. I've prepared everything based on our conversation. Click the "Create Assistant" button when you're ready, or feel free to make any final adjustments in the tabs above.`;
        
        // Auto-show the save button by scrolling to it
        setTimeout(() => {
          document.querySelector('button[type="button"]:last-child')?.scrollIntoView({ behavior: 'smooth' });
        }, 1000);
      }
      // First message - capture purpose
      else if (assistantPurpose === '') {
        // Capture the purpose from their first message
        setAssistantPurpose(currentMessage);
        
        // Generate suggestions based on the purpose
        const suggestions = [];
        if (currentMessage.toLowerCase().includes('legal')) {
          suggestions.push('legal documents', 'contract analysis', 'legal research');
        } else if (currentMessage.toLowerCase().includes('write') || currentMessage.toLowerCase().includes('content')) {
          suggestions.push('article writing', 'blog posts', 'editing');
        } else if (currentMessage.toLowerCase().includes('research')) {
          suggestions.push('literature review', 'data analysis', 'finding sources');
        }
        
        const suggestionText = suggestions.length > 0 ? 
          `\n\nBased on your needs, this assistant could help with: ${suggestions.join(', ')}. Would you like to focus on any of these specific areas?` : 
          '';
        
        aiResponse = `Great! I'll help you build an assistant for ${currentMessage}. Let's customize it to meet your needs.${suggestionText}\n\nWhat kind of knowledge should this assistant have access to? You can add documents and create knowledge folders for it.`;
      }
      // General fallback response
      else {
        const responses = [
          `I understand you're interested in "${currentMessage}". Let me help you incorporate that into your assistant. Would you like to add some documents related to this topic?`,
          `"${currentMessage}" sounds important for your assistant. Would you like me to create a knowledge folder for this topic?`,
          `I can help implement "${currentMessage}" for your assistant. Do you want me to generate a system prompt that focuses on this aspect?`,
          `Thanks for sharing that! Would you like your assistant to be named based on this focus area? I can suggest some names.`,
          `I'll make sure your assistant is well-equipped to handle "${currentMessage}". Would you like to add some example prompts to help it understand this area better?`
        ];
        
        // Choose a random response
        aiResponse = responses[Math.floor(Math.random() * responses.length)];
      }

      // Add AI response after a short delay to simulate thinking
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error in AI interaction:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I encountered an error processing your request. Please try again." 
      }]);
      setIsLoading(false);
    }
  };
  
  // Create a new folder for the knowledge base
  const createNewFolder = () => {
    if (!newFolderName.trim()) return;
    
    const newFolder: AIFolder = {
      id: `folder-${nanoid()}`,
      name: newFolderName,
      documents: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: null,
    };
    
    addFolder(newFolder);
    setSelectedFolders(prev => [...prev, newFolder.id]);
    setNewFolderName('');
    setShowNewFolderDialog(false);
    
    // Acknowledge in chat
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: `I've created a new folder called "${newFolderName}" and added it to your assistant's knowledge base. You can now upload documents to this folder.` 
    }]);
  };
  
  // Save a new prompt to the knowledge base
  const savePrompt = () => {
    if (!newPromptName.trim() || !newPromptContent.trim()) return;
    
    const newPrompt: AIPrompt = {
      id: `prompt-${nanoid()}`,
      name: newPromptName,
      content: newPromptContent,
      category: newPromptCategory,
      tags: newPromptTags,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setSavedPrompts(prev => [...prev, newPrompt]);
    
    // Also save as a document in the knowledge base if folders are selected
    if (selectedFolders.length > 0) {
      const promptDocument: AIDocument = {
        id: `doc-${nanoid()}`,
        content: `# ${newPromptName}\n\n${newPromptContent}`,
        metadata: {
          source: 'prompt-library',
          title: newPromptName,
          category: newPromptCategory,
          tags: newPromptTags,
        },
        folderId: selectedFolders[0], // Add to first selected folder
        tags: newPromptTags,
      };
      
      addDocument(promptDocument);
      
      // Acknowledge in chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I've saved your prompt "${newPromptName}" to your knowledge base. Your assistant will be able to learn from this.` 
      }]);
    }
    
    // Reset form
    setNewPromptName('');
    setNewPromptContent('');
    setNewPromptTags([]);
  };
  
  // Handle document upload
  const handleDocumentUpload = async (files: File[]) => {
    if (selectedFolders.length === 0) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Please select or create a folder first before uploading documents.' 
      }]);
      return;
    }
    
    setIsLoading(true);
    try {
      for (const file of files) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const content = e.target?.result as string;
          
          const document: AIDocument = {
            id: `doc-${nanoid()}`,
            content: content,
            metadata: {
              source: 'upload',
              title: file.name,
              date: new Date(),
            },
            folderId: selectedFolders[0], // Add to first selected folder
            tags: [],
          };
          
          // Generate embedding and add to knowledge base
          const docWithEmbedding = await generateEmbedding(document);
          addDocument(docWithEmbedding);
        };
        reader.readAsText(file);
      }
      
      // Acknowledge in chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I've added ${files.length} document(s) to your assistant's knowledge base. These will help your assistant provide more accurate and relevant information.` 
      }]);
    } catch (error) {
      console.error('Error uploading documents:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I'm sorry, I encountered an error uploading your documents. Please try again." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save the assistant
  const handleSave = () => {
    setIsLoading(true);
    
    try {
      // Create a default AI model
      const defaultModel: AIModel = {
        id: 'default-model',
        name: 'Default Model',
        provider: 'openai',
        capabilities: ['text-generation', 'chat'],
        contextSize: 8192
      };
      
      if (assistantId) {
        // Update existing assistant
        updateAssistant(assistantId, {
          name,
          description,
          systemPrompt,
        });
        
        // Update folder assignments
        const currentFolders = getAssistantFolders(assistantId);
        
        // Remove folders that were deselected
        currentFolders.forEach(folderId => {
          if (!selectedFolders.includes(folderId)) {
            removeFolderFromAssistant(assistantId, folderId);
          }
        });
        
        // Add newly selected folders
        selectedFolders.forEach(folderId => {
          if (!currentFolders.includes(folderId)) {
            assignFolderToAssistant(assistantId, folderId);
          }
        });
        
        if (onSave) {
          const updatedAssistant = getAssistantById(assistantId);
          if (updatedAssistant) {
            onSave(updatedAssistant);
          }
        }
      } else {
        // Create new assistant
        const newAssistant = addAssistant({
          name: name || `${assistantPurpose} Assistant`,
          description: description || `AI assistant specialized in ${assistantPurpose}`,
          systemPrompt,
          model: defaultModel,
          type: 'general',
          capabilities: ['text-generation', 'chat', 'document-analysis'],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Assign selected folders
        selectedFolders.forEach(folderId => {
          assignFolderToAssistant(newAssistant.id, folderId);
        });
        
        // Save the conversation as a document for reference
        const conversationDocument: AIDocument = {
          id: `doc-${nanoid()}`,
          content: messages
            .filter(m => m.role !== 'system')
            .map(m => `${m.role.toUpperCase()}: ${m.content}`)
            .join('\n\n'),
          metadata: {
            source: 'assistant-creation',
            title: `${name || assistantPurpose} - Creation Conversation`,
            date: new Date(),
          },
          folderId: selectedFolders[0] || null,
          tags: ['assistant-creation', assistantPurpose],
        };
        
        if (selectedFolders.length > 0) {
          addDocument(conversationDocument);
        }
        
        if (onSave) {
          onSave(newAssistant);
        }
      }
      
      // Add all prompt tags to the knowledge base tags
      savedPrompts.forEach(prompt => {
        prompt.tags?.forEach(tag => {
          if (!tags.includes(tag)) {
            addTag(tag);
          }
        });
      });
      
    } catch (error) {
      console.error('Error saving assistant:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle folder selection
  const handleFolderToggle = (folderId: string) => {
    setSelectedFolders(prev => 
      prev.includes(folderId)
        ? prev.filter(id => id !== folderId)
        : [...prev, folderId]
    );
  };
  
  // Handle tag selection for prompts
  const handleTagToggle = (tag: string) => {
    setNewPromptTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  return (
    <div className="flex flex-col space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {assistantId ? 'Edit Assistant' : 'Create New Assistant'}
          </CardTitle>
          <CardDescription>
            Interactively create and configure your specialized AI assistant
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Brain size={16} />
                <span>Basic Info</span>
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="flex items-center gap-2">
                <Book size={16} />
                <span>Knowledge</span>
              </TabsTrigger>
              <TabsTrigger value="prompts" className="flex items-center gap-2">
                <MessageSquare size={16} />
                <span>Prompts</span>
              </TabsTrigger>
              <TabsTrigger value="interact" className="flex items-center gap-2">
                <MessageSquare size={16} />
                <span>Interactive Setup</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={assistantPurpose ? `${assistantPurpose} Assistant` : "Assistant Name"}
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={`AI assistant specialized in ${assistantPurpose || '...'}`}
                />
              </div>
              
              <div>
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Instructions that define how the assistant behaves"
                  rows={4}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="knowledge" className="space-y-4">
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-medium">Knowledge Base Folders</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowNewFolderDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  <span>New Folder</span>
                </Button>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded p-3">
                {folders.length > 0 ? (
                  folders.map(folder => (
                    <div key={folder.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`folder-${folder.id}`}
                        checked={selectedFolders.includes(folder.id)}
                        onCheckedChange={() => handleFolderToggle(folder.id)}
                      />
                      <Label htmlFor={`folder-${folder.id}`} className="cursor-pointer">
                        {folder.name}
                      </Label>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">
                    No folders found. Create folders to organize your assistant's knowledge.
                  </p>
                )}
              </div>
              
              {selectedFolders.length > 0 && (
                <div className="mt-4">
                  <Button 
                    variant="secondary" 
                    onClick={() => setUploadMode(!uploadMode)}
                    className="flex items-center gap-2"
                  >
                    <Upload size={16} />
                    <span>Upload Documents</span>
                  </Button>
                  
                  {uploadMode && (
                    <div className="mt-4 p-4 border rounded">
                      <SimpleFileUploader onUpload={handleDocumentUpload} />
                    </div>
                  )}
                </div>
              )}
              
              <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Knowledge Base Folder</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="folderName">Folder Name</Label>
                      <Input
                        id="folderName"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder={`${assistantPurpose || 'New'} Resources`}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowNewFolderDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button onClick={createNewFolder}>
                        Create Folder
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>
            
            <TabsContent value="prompts" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Saved Prompts</h3>
                <p className="text-sm text-muted-foreground">
                  Add template prompts to your assistant's knowledge base to help it understand common requests.
                </p>
                
                <div className="space-y-4 border rounded p-4">
                  <div>
                    <Label htmlFor="promptName">Prompt Name</Label>
                    <Input
                      id="promptName"
                      value={newPromptName}
                      onChange={(e) => setNewPromptName(e.target.value)}
                      placeholder="E.g., Request for Production Template"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="promptContent">Prompt Content</Label>
                    <Textarea
                      id="promptContent"
                      value={newPromptContent}
                      onChange={(e) => setNewPromptContent(e.target.value)}
                      placeholder="Enter the template or example prompt here..."
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="promptCategory">Category</Label>
                    <select
                      id="promptCategory"
                      value={newPromptCategory}
                      onChange={(e) => setNewPromptCategory(e.target.value)}
                      className="w-full p-2 border rounded mt-1"
                    >
                      <option value="legal">Legal</option>
                      <option value="document">Document</option>
                      <option value="petition">Petition</option>
                      <option value="communication">Communication</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {['template', 'legal', 'petition', 'document', 'discovery', ...tags]
                        .filter((tag, index, self) => self.indexOf(tag) === index) // Remove duplicates
                        .map(tag => (
                          <Badge 
                            key={tag}
                            variant={newPromptTags.includes(tag) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => handleTagToggle(tag)}
                          >
                            {tag}
                          </Badge>
                        ))
                      }
                      <Badge 
                        variant="outline" 
                        className="cursor-pointer bg-transparent"
                        onClick={() => {
                          const tag = prompt('Enter new tag:');
                          if (tag && !newPromptTags.includes(tag)) {
                            setNewPromptTags(prev => [...prev, tag]);
                          }
                        }}
                      >
                        + Add Tag
                      </Badge>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={savePrompt}
                    disabled={!newPromptName || !newPromptContent}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Save size={16} />
                    <span>Save Prompt to Knowledge Base</span>
                  </Button>
                </div>
                
                {savedPrompts.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">Your Saved Prompts</h4>
                    <div className="space-y-2">
                      {savedPrompts.map((prompt, index) => (
                        <Collapsible key={prompt.id} className="border rounded-md">
                          <CollapsibleTrigger className="flex justify-between items-center p-3 w-full text-left">
                            <div className="flex items-center gap-2">
                              <span>{prompt.name}</span>
                              <Badge variant="secondary" className="ml-2">
                                {prompt.category}
                              </Badge>
                            </div>
                            <ChevronDown className="h-4 w-4" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="p-3 border-t">
                            <div className="space-y-2">
                              <pre className="whitespace-pre-wrap bg-secondary p-2 rounded text-sm">
                                {prompt.content}
                              </pre>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {prompt.tags?.map(tag => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="interact" className="space-y-4">
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  {/* Welcome message */}
                  {messages.length === 0 && (
                    <div className="text-center p-6">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Icons.sparkles className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-medium">Interactive Assistant Creator</h3>
                      <p className="text-muted-foreground mt-2">
                        Tell me what kind of assistant you want to create, and I'll help you build it step by step.
                      </p>
                    </div>
                  )}

                  {/* Chat messages */}
                  {messages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div 
                        className={`
                          max-w-3/4 p-3 rounded-lg
                          ${message.role === 'user' 
                            ? 'bg-primary text-primary-foreground rounded-br-none' 
                            : 'bg-muted rounded-bl-none border border-border'
                          }
                        `}
                      >
                        {message.role === 'assistant' ? (
                          <div className="prose dark:prose-invert prose-sm max-w-none">
                            {message.content.split('\n').map((line, i) => (
                              <React.Fragment key={i}>
                                {line}
                                {i < message.content.split('\n').length - 1 && <br />}
                              </React.Fragment>
                            ))}
                          </div>
                        ) : (
                          <div>{message.content}</div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted p-3 rounded-lg rounded-bl-none border border-border max-w-3/4">
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                          <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Invisible element to scroll to */}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message input */}
                <div className="p-4 border-t">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    className="flex space-x-2"
                  >
                    <Input 
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      placeholder="Ask anything about your assistant..."
                      className="flex-1"
                      disabled={isLoading}
                    />
                    <Button 
                      type="submit" 
                      size="icon" 
                      disabled={!currentMessage.trim() || isLoading}
                      variant="default"
                      className="shrink-0"
                    >
                      {isLoading ? <Icons.loader className="h-4 w-4 animate-spin" /> : <Icons.send className="h-4 w-4" />}
                    </Button>
                  </form>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Try asking: "Create a folder called Examples", "Set a system prompt", or "I'm done, save it"
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? 'Saving...' : (assistantId ? 'Update Assistant' : 'Create Assistant')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 