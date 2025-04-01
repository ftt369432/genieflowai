import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../providers/SupabaseProvider';
import { useEmail } from '../../contexts/EmailContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { useNavigate } from 'react-router-dom';
import { EmailAgent } from '../../services/agents/EmailAgent';
import { v4 as uuidv4 } from 'uuid';

interface EmailAccountConnectProps {
  onConnectionStart?: () => void;
  onConnectionSuccess?: () => void;
  onConnectionError?: (error: string) => void;
}

export function EmailAccountConnect({
  onConnectionStart,
  onConnectionSuccess,
  onConnectionError
}: EmailAccountConnectProps) {
  const { user } = useSupabase();
  const emailContext = useEmail();
  const navigate = useNavigate();
  
  const [imapConfig, setImapConfig] = useState({
    email: '',
    password: '',
    imapHost: '',
    imapPort: 993,
    smtpHost: '',
    smtpPort: 587,
    useSSL: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [agentInitialized, setAgentInitialized] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);

  // Initialize email agent for testing
  useEffect(() => {
    const initializeAgent = async () => {
      try {
        // Create an instance of EmailAgent for debugging
        const agent = new EmailAgent({
          id: `debug-email-agent-${uuidv4()}`,
          name: 'Debug Email Assistant',
          type: 'email'
        });
        
        console.log('Email agent initialized:', agent.getId());
        
        // Test basic agent functionality
        const testResult = await agent.testAgentAction('manageFolders', {
          accountId: 'test-account',
          action: 'list'
        });
        
        console.log('Test agent action result:', testResult);
        setAgentInitialized(true);
      } catch (err) {
        console.error('Failed to initialize email agent:', err);
      }
    };
    
    initializeAgent();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setImapConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleConnectGoogle = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setConnectionStatus('connecting');
    
    // Notify parent component that connection is starting
    onConnectionStart?.();
    
    try {
      const account = await emailContext.addGoogleAccount();
      setConnectedEmail(account.email);
      setSuccess(`Google account "${account.email}" connected successfully!`);
      setConnectionStatus('success');
      onConnectionSuccess?.();
      
      // Log agent status to help debug
      if (agentInitialized) {
        console.log('Email agent is initialized and ready to process emails');
      } else {
        console.warn('Email agent is not initialized yet, AI features may be limited');
      }
      
      // After a brief delay to show the success message, navigate to the inbox
      setTimeout(() => {
        navigate('/email');
      }, 1500);
    } catch (err: any) {
      setConnectionStatus('error');
      const errorDetails = err.message || 'Failed to connect Google account';
      console.error('Google connection error:', err);
      
      // Provide more specific error messages based on common issues
      let userFriendlyMessage = errorDetails;
      
      if (errorDetails.includes('redirect_uri_mismatch')) {
        userFriendlyMessage = 'Authentication configuration error: Redirect URI mismatch. Please contact support or try again.';
      } else if (errorDetails.includes('popup_closed_by_user') || errorDetails.includes('popup_closed')) {
        userFriendlyMessage = 'Authentication window was closed before completion. Please try again.';
      } else if (errorDetails.includes('popup_blocked') || errorDetails.includes('blocked')) {
        userFriendlyMessage = 'Authentication popup was blocked by your browser. Please allow popups for this site and try again.';
      } else if (errorDetails.includes('Cross-Origin-Opener-Policy')) {
        userFriendlyMessage = 'Browser security policy blocked the authentication. Try disabling browser extensions or using incognito mode.';
      }
      
      setError(userFriendlyMessage);
      onConnectionError?.(userFriendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectIMAP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    // Notify parent component that connection is starting
    onConnectionStart?.();
    
    try {
      await emailContext.addIMAPAccount(imapConfig);
      setSuccess('IMAP account connected successfully!');
      onConnectionSuccess?.();
      
      // Reset form
      setImapConfig({
        email: '',
        password: '',
        imapHost: '',
        imapPort: 993,
        smtpHost: '',
        smtpPort: 587,
        useSSL: true
      });
      
      // Log agent status to help debug
      if (agentInitialized) {
        console.log('Email agent is initialized and ready to process emails');
      } else {
        console.warn('Email agent is not initialized yet, AI features may be limited');
      }
      
      // After a brief delay to show the success message, navigate to the inbox
      setTimeout(() => {
        navigate('/email');
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect IMAP account';
      console.error('IMAP connection error:', err);
      setError(errorMessage);
      onConnectionError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    // Instead of just returning a message, let's return a proper authentication prompt
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-400 text-yellow-800 p-4 rounded mb-4">
          <p className="font-medium">Authentication Required</p>
          <p className="mt-1">Please log in to connect and manage your email accounts.</p>
        </div>
        
        <Card className="p-6 shadow-md">
          <h3 className="text-xl font-medium mb-4">Authentication Required</h3>
          <p className="text-gray-600 mb-6">
            You need to be logged in to manage your email accounts. Please log in or sign up to continue.
          </p>
          <Button 
            onClick={() => navigate('/login')}
            className="w-full"
          >
            Go to Login Page
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}
      
      {!agentInitialized && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Initializing AI features... Some AI capabilities may not be available until initialization is complete.
        </div>
      )}
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Google Account Connection */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-sm">
          <h3 className="text-xl font-medium mb-4 flex items-center">
            <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Connect with Google
          </h3>
          <p className="text-gray-600 mb-6">
            Connect your Gmail account to access emails, labels, and send messages through GenieFlow.
            <span className="block mt-2 text-sm text-gray-500">Your data is secure and we only request the permissions needed to manage your emails.</span>
          </p>
          
          {connectionStatus === 'success' && connectedEmail && (
            <div className="bg-green-100 text-green-800 p-4 rounded-md mb-4 flex items-start">
              <div className="mr-3 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Successfully connected!</p>
                <p className="mt-1 text-sm">{connectedEmail}</p>
                <p className="mt-2 text-sm">Redirecting to inbox...</p>
              </div>
            </div>
          )}
          
          <div className="mt-4">
            <Button 
              onClick={handleConnectGoogle}
              disabled={isLoading || connectionStatus === 'success'}
              className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </>
              ) : connectionStatus === 'success' ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Connected
                </>
              ) : (
                <>Connect Gmail</>
              )}
            </Button>
          </div>
        </Card>

        {/* IMAP Account Connection */}
        <Card className="p-6 shadow-md">
          <h3 className="text-xl font-medium mb-4">Connect IMAP Account</h3>
          <form onSubmit={handleConnectIMAP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <Input
                type="email"
                name="email"
                value={imapConfig.email}
                onChange={handleInputChange}
                required
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <Input
                type="password"
                name="password"
                value={imapConfig.password}
                onChange={handleInputChange}
                required
                placeholder="Your email password or app password"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">IMAP Server</label>
                <Input
                  type="text"
                  name="imapHost"
                  value={imapConfig.imapHost}
                  onChange={handleInputChange}
                  required
                  placeholder="imap.example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">IMAP Port</label>
                <Input
                  type="number"
                  name="imapPort"
                  value={imapConfig.imapPort}
                  onChange={handleInputChange}
                  required
                  placeholder="993"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">SMTP Server</label>
                <Input
                  type="text"
                  name="smtpHost"
                  value={imapConfig.smtpHost}
                  onChange={handleInputChange}
                  required
                  placeholder="smtp.example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SMTP Port</label>
                <Input
                  type="number"
                  name="smtpPort"
                  value={imapConfig.smtpPort}
                  onChange={handleInputChange}
                  required
                  placeholder="587"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="useSSL"
                name="useSSL"
                checked={imapConfig.useSSL}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <label htmlFor="useSSL" className="ml-2 block text-sm">
                Use SSL/TLS
              </label>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <span className="mr-2">Connecting...</span>
                  <svg className="animate-spin h-5 w-5 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </>
              ) : (
                <>Connect IMAP</>
              )}
            </Button>
          </form>
        </Card>
      </div>

      {/* Common Email Providers Help Section */}
      <div className="mt-8">
        <h3 className="text-xl font-medium mb-4">Common Email Providers</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="p-4 shadow-md">
            <h4 className="font-bold">Gmail</h4>
            <p className="text-sm text-gray-600 mb-2">IMAP: imap.gmail.com (993)</p>
            <p className="text-sm text-gray-600">SMTP: smtp.gmail.com (587)</p>
            <p className="text-sm mt-2 text-gray-500">Note: You may need to enable "Less secure app access" or use App Passwords.</p>
          </Card>
          <Card className="p-4 shadow-md">
            <h4 className="font-bold">Outlook/Hotmail</h4>
            <p className="text-sm text-gray-600 mb-2">IMAP: outlook.office365.com (993)</p>
            <p className="text-sm text-gray-600">SMTP: smtp.office365.com (587)</p>
          </Card>
          <Card className="p-4 shadow-md">
            <h4 className="font-bold">Yahoo Mail</h4>
            <p className="text-sm text-gray-600 mb-2">IMAP: imap.mail.yahoo.com (993)</p>
            <p className="text-sm text-gray-600">SMTP: smtp.mail.yahoo.com (587)</p>
            <p className="text-sm mt-2 text-gray-500">Note: You need to generate an app password.</p>
          </Card>
        </div>
      </div>
    </div>
  );
} 