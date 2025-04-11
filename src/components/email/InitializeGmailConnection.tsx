import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { setupGmailAPIToken, setupGmailLabels } from '../../services/email/setupEmailToken';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Textarea } from '../ui/Textarea';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

/**
 * Component to initialize Gmail connection with a given token
 */
export function InitializeGmailConnection() {
  const [tokenJson, setTokenJson] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const navigate = useNavigate();

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
      
      // Navigate to the bypass page to avoid routing issues
      setTimeout(() => {
        // Use the bypass route to force redirect to inbox
        window.location.href = '/email/bypass';
      }, 1500);
    } catch (error) {
      console.error('Error initializing Gmail connection:', error);
      toast.error('Failed to initialize Gmail connection: ' + (error instanceof Error ? error.message : String(error)));
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
              placeholder={`{
  "access_token": "ya29.your-access-token-value-here",
  "refresh_token": "1//your-refresh-token-value-here",
  "scope": "https://www.googleapis.com/auth/gmail.readonly",
  "token_type": "Bearer",
  "expiry_date": 1698765432123
}`}
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