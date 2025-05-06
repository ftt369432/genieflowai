import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/Tabs';
import { SwarmPanel } from '@/components/swarm/SwarmPanel';
import { Switch } from "@/components/ui/Switch"; // Import Switch
import { Label } from "@/components/ui/Label"; // Import Label

interface RightSidePanelProps {
  isAutoHideEnabled: boolean;
  onToggleAutoHide: (enabled: boolean) => void;
  // Add any other necessary props
}

export function RightSidePanel({ 
  isAutoHideEnabled,
  onToggleAutoHide,
  /* other props */ 
}: RightSidePanelProps) {
  return (
    <div className="h-full flex flex-col border-l border-border/50 bg-muted/30 p-4">
      {/* Add Auto-Hide Toggle */}
      <div className="flex items-center justify-between mb-4 px-1">
        <Label htmlFor="right-auto-hide-switch" className="text-xs text-muted-foreground">Auto-hide Panel</Label>
        <Switch
          id="right-auto-hide-switch"
          checked={isAutoHideEnabled}
          onCheckedChange={onToggleAutoHide}
          className="[&>span]:h-3 [&>span]:w-3 data-[state=checked]:bg-primary"
        />
      </div>

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