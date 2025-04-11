import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { setupGmailAPIToken, setupGmailLabels } from '../../services/email/setupEmailToken';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Textarea } from '../ui/Textarea';
import { toast } from 'sonner';

/**
 * Component to initialize Gmail connection with a given token
 */
export function InitializeGmailConnection() {
  const [tokenJson, setTokenJson] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const handleInitialize = async () => {
    if (!tokenJson) {
      toast.error('Please paste your token JSON data first');
      return;
    }

    setIsLoading(true);
    try {
      // Parse the token JSON
      const tokenData = JSON.parse(tokenJson);
      
      // Set up the token
      await setupGmailAPIToken(tokenData);
      
      // Set up labels if available
      const gmailLabels: Record<string, string> = {};
      if (tokenData.gmailLabels) {
        await setupGmailLabels(tokenData.gmailLabels);
      }
      
      setIsConnected(true);
      toast.success('Gmail connection initialized successfully');
    } catch (error) {
      console.error('Error initializing Gmail connection:', error);
      toast.error('Failed to initialize Gmail connection');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Initialize Gmail Connection</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Paste your Gmail token JSON data below to initialize the connection.
            </p>
            <Textarea
              value={tokenJson}
              onChange={(e) => setTokenJson(e.target.value)}
              placeholder='{"provider_token": "...", "access_token": "...", ...}'
              rows={10}
              className="font-mono text-xs"
            />
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={handleInitialize} 
              disabled={isLoading || isConnected}
            >
              {isLoading ? 'Initializing...' : isConnected ? 'Connected' : 'Initialize Connection'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 