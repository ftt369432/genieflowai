import React, { useState } from 'react';
import { PanelGroup, Panel } from 'react-resizable-panels';
import { AIChat } from '../legal/ai/AIChat';
import { ResearchAssistant } from '../research/ResearchAssistant';
import { Plus, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { ResizeHandle } from './ResizeHandle';
import * as Collapsible from '@radix-ui/react-collapsible';

interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
}

export function MainLayout() {
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [previousData, setPreviousData] = useState<{ id: string; content: string }[]>([]);

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      timestamp: new Date(),
    };
    setChatSessions([newSession, ...chatSessions]);
    setSelectedSession(newSession.id);
  };

  const handleSaveBot = (bot: { name: string; actions: any[] }) => {
    console.log('Saving bot:', bot);
    // Implement bot saving logic
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <PanelGroup direction="horizontal" className="w-full">
        {/* Left Panel - Chat History */}
        <Collapsible.Root open={isLeftPanelOpen} onOpenChange={setIsLeftPanelOpen}>
          <div className="flex h-full">
            <Collapsible.Content className="h-full">
              <Panel defaultSize={20} minSize={15} maxSize={30}>
                <div className="h-full flex flex-col bg-white dark:bg-gray-800">
                  <div className="p-4 border-b dark:border-gray-700">
                    <button
                      onClick={handleNewChat}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus size={16} />
                      <span>New Chat</span>
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                    {chatSessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => setSelectedSession(session.id)}
                        className={`w-full flex items-center space-x-2 p-2 rounded-lg mb-1 transition-colors ${
                          selectedSession === session.id
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        <MessageSquare size={16} />
                        <span className="flex-1 text-left truncate">{session.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </Panel>
            </Collapsible.Content>

            <Collapsible.Trigger asChild>
              <button
                className="p-2 bg-gray-100 dark:bg-gray-800 border-r dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                aria-label="Toggle chat history"
              >
                {isLeftPanelOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
            </Collapsible.Trigger>
          </div>
        </Collapsible.Root>

        {/* Main Chat Area */}
        <Panel 
          defaultSize={60} 
          minSize={40} 
          maxSize={isLeftPanelOpen && isRightPanelOpen ? 60 : 85}
        >
          <div className="h-full border-x dark:border-gray-700">
            <AIChat
              messages={[]}
              onSend={(message) => {
                setPreviousData([
                  ...previousData,
                  { id: message.id, content: message.content }
                ]);
              }}
            />
          </div>
        </Panel>

        {/* Right Panel - Research Assistant */}
        <Collapsible.Root open={isRightPanelOpen} onOpenChange={setIsRightPanelOpen}>
          <div className="flex h-full">
            <Collapsible.Trigger asChild>
              <button
                className="p-2 bg-gray-100 dark:bg-gray-800 border-l dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                aria-label="Toggle research panel"
              >
                {isRightPanelOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
              </button>
            </Collapsible.Trigger>

            <Collapsible.Content className="h-full">
              <Panel defaultSize={20} minSize={15} maxSize={30}>
                <ResearchAssistant
                  previousData={previousData}
                  onSaveBot={handleSaveBot}
                />
              </Panel>
            </Collapsible.Content>
          </div>
        </Collapsible.Root>
      </PanelGroup>
    </div>
  );
} 