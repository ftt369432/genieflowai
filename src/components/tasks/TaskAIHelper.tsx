import React, { useState } from 'react';
import { Sparkle, Send, Tag, Mail, Search, Brain, Clock, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/Card';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Task } from '../../types/task';
import { useAIConnector } from '../../hooks/useAIConnector';
import { useTaskStore } from '../../store/taskStore';
import { Spinner } from '../ui/Spinner';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogFooter,
  DialogHeader,
  DialogDescription,
  DialogTrigger,
  DialogClose
} from '../ui/Dialog';
import { useToast } from '../../hooks/useToast';

interface TaskAIHelperProps {
  selectedTask?: Task | null;
  onEnhanceTask?: (task: Task) => void;
  mode?: 'compact' | 'full';
}

export function TaskAIHelper({ selectedTask, onEnhanceTask, mode = 'full' }: TaskAIHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'enhance' | 'convert' | 'search'>('enhance');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [emailResult, setEmailResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { enhanceTask, convertTaskToEmail, searchKnowledgeBase } = useAIConnector();
  const { updateTask } = useTaskStore();
  const { toast } = useToast();
  
  const handleEnhanceTask = async () => {
    if (!selectedTask) return;
    
    setIsLoading(true);
    try {
      const enhancedTask = await enhanceTask(selectedTask);
      
      if (enhancedTask) {
        // Update the task in the store
        updateTask({
          id: enhancedTask.id,
          tags: enhancedTask.tags,
          priority: enhancedTask.priority
        });
        
        // Call the callback if provided
        if (onEnhanceTask) {
          onEnhanceTask(enhancedTask);
        }
        
        toast({
          title: "Task Enhanced",
          description: "AI has improved your task with relevant tags and details",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error enhancing task:', error);
      toast({
        title: "Enhancement Failed",
        description: "There was an error enhancing your task",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleConvertToEmail = async () => {
    if (!selectedTask) return;
    
    setIsLoading(true);
    try {
      const emailDraft = await convertTaskToEmail(selectedTask);
      if (emailDraft) {
        setEmailResult(emailDraft.body);
        setActiveTab('convert');
      }
    } catch (error) {
      console.error('Error converting task to email:', error);
      toast({
        title: "Conversion Failed",
        description: "There was an error converting your task to email",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = async () => {
    if (!searchQuery) return;
    
    setIsLoading(true);
    try {
      const results = await searchKnowledgeBase(searchQuery);
      setSearchResults(results);
      setActiveTab('search');
    } catch (error) {
      console.error('Error searching knowledge base:', error);
      toast({
        title: "Search Failed",
        description: "There was an error searching the knowledge base",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin text-primary">
            <Spinner />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">AI is working on your request...</p>
        </div>
      );
    }
    
    switch (activeTab) {
      case 'enhance':
        return (
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-4">
              AI can enhance your task with better descriptions, tags, and time estimates.
            </p>
            
            {selectedTask && (
              <div className="rounded-md border p-4 mb-4">
                <h3 className="font-medium">{selectedTask.title}</h3>
                {selectedTask.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedTask.description}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedTask.tags?.map(tag => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            <Button 
              onClick={handleEnhanceTask} 
              className="w-full" 
              disabled={!selectedTask}
            >
              <Sparkle className="mr-2 h-4 w-4" />
              Enhance with AI
            </Button>
          </div>
        );
        
      case 'convert':
        return (
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-4">
              Convert this task to a well-formatted email to share with your team.
            </p>
            
            {emailResult ? (
              <div className="rounded-md border p-4 mb-4">
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap text-sm font-sans">
                    {emailResult}
                  </pre>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button 
                    onClick={() => {
                      navigator.clipboard.writeText(emailResult);
                      toast({
                        title: "Copied to clipboard",
                        variant: "default"
                      });
                    }} 
                    variant="outline" 
                    size="sm"
                  >
                    Copy to Clipboard
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                onClick={handleConvertToEmail} 
                className="w-full" 
                disabled={!selectedTask}
              >
                <Mail className="mr-2 h-4 w-4" />
                Generate Email
              </Button>
            )}
          </div>
        );
        
      case 'search':
        return (
          <div className="p-4">
            <p className="text-sm text-muted-foreground mb-4">
              Search your knowledge base for information related to this task.
            </p>
            
            <div className="flex mb-4">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search knowledge base..."
                className="mr-2"
              />
              <Button onClick={handleSearch} size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            {searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((result, index) => (
                  <div key={index} className="rounded-md border p-3">
                    <h4 className="font-medium">{result.document?.title || 'Document'}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {result.document?.content?.substring(0, 150) || 'No content'}...
                    </p>
                    <div className="flex justify-between mt-2">
                      <Badge variant="outline" className="text-xs">
                        Relevance: {Math.round(result.similarity * 100)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <p className="text-sm text-center text-muted-foreground">
                No results found. Try a different search term.
              </p>
            ) : null}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  if (mode === 'compact') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Brain className="h-4 w-4" />
            <span>AI Help</span>
          </Button>
        </DialogTrigger>
        
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Task AI Assistant</DialogTitle>
            <DialogDescription>
              Use AI to enhance your task management
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex border-b">
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'enhance' ? 'border-b-2 border-primary' : 'text-muted-foreground'}`}
              onClick={() => setActiveTab('enhance')}
            >
              Enhance
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'convert' ? 'border-b-2 border-primary' : 'text-muted-foreground'}`}
              onClick={() => setActiveTab('convert')}
            >
              Email
            </button>
            <button
              className={`px-4 py-2 font-medium text-sm ${activeTab === 'search' ? 'border-b-2 border-primary' : 'text-muted-foreground'}`}
              onClick={() => setActiveTab('search')}
            >
              Search
            </button>
          </div>
          
          {renderContent()}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">AI Task Assistant</CardTitle>
      </CardHeader>
      
      <div className="flex border-b">
        <button
          className={`flex-1 px-4 py-2 font-medium text-sm ${activeTab === 'enhance' ? 'border-b-2 border-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('enhance')}
        >
          Enhance
        </button>
        <button
          className={`flex-1 px-4 py-2 font-medium text-sm ${activeTab === 'convert' ? 'border-b-2 border-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('convert')}
        >
          Email
        </button>
        <button
          className={`flex-1 px-4 py-2 font-medium text-sm ${activeTab === 'search' ? 'border-b-2 border-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('search')}
        >
          Search
        </button>
      </div>
      
      {renderContent()}
    </Card>
  );
} 