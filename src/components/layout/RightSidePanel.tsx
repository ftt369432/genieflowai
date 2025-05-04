import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { SwarmPanel } from '@/components/swarm/SwarmPanel'; // Try path relative to src
// Import KnowledgePanel or its content if it's a separate component
// import { KnowledgePanel } from '@/components/knowledge/KnowledgePanel'; 

interface RightSidePanelProps {
  // Add any necessary props, e.g., selectedDocs, systemPrompt for KnowledgePanel
}

export function RightSidePanel({ /* props */ }: RightSidePanelProps) {
  return (
    <div className="h-full flex flex-col border-l border-border/50 bg-muted/30 p-4">
      <Tabs defaultValue="knowledge" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start mb-4">
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="swarm">Swarm</TabsTrigger>
        </TabsList>
        
        <TabsContent value="knowledge" className="flex-1 overflow-y-auto">
          {/* Placeholder for Knowledge Panel Content */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Knowledge Base</h3>
            <p className="text-xs text-muted-foreground">
              Knowledge base content goes here (e.g., system prompt, documents).
            </p>
            {/* Add the actual knowledge base components/content here */}
          </div>
        </TabsContent>

        <TabsContent value="swarm" className="flex-1 overflow-y-auto">
          <SwarmPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}