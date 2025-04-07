import React, { useState, useEffect } from 'react';
import { useSupabase } from '../../providers/SupabaseProvider';
import { useEmail } from '../../contexts/EmailContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface EmailAccountConnectProps {
  onConnectionStart?: () => void;
  onConnectionSuccess?: () => void;
  onConnectionError?: (error: string) => void;
  isDialog?: boolean;
}

export function EmailAccountConnect({
  onConnectionStart,
  onConnectionSuccess,
  onConnectionError,
  isDialog = false
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
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);

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
      
      // After a brief delay to show the success message, navigate to the inbox if not in dialog mode
      if (!isDialog) {
        setTimeout(() => {
          navigate('/email');
        }, 1500);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect Google account';
      console.error('Google connection error:', err);
      setError(errorMessage);
      setConnectionStatus('error');
      onConnectionError?.(errorMessage);
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
      
      // After a brief delay to show the success message, navigate to the inbox if not in dialog mode
      if (!isDialog) {
        setTimeout(() => {
          navigate('/email');
        }, 1500);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect IMAP account';
      console.error('IMAP connection error:', err);
      setError(errorMessage);
      onConnectionError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate class names based on whether this is rendered in a dialog or not
  const containerClass = isDialog 
    ? "space-y-4" 
    : "container mx-auto py-8 px-4 max-w-4xl space-y-8";

  return (
    <div className={containerClass}>
      {!isDialog && (
        <div className="flex items-center mb-6">
          <Mail className="h-6 w-6 mr-2 text-primary" />
          <h1 className="text-2xl font-bold">Connect Email Account</h1>
        </div>
      )}

      {/* Status messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4 flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative mb-4 flex items-start">
          <CheckCircle2 className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      
      {/* Google Account Connection */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className={`p-4 shadow-sm ${isDialog ? '' : 'p-6'}`}>
          <h3 className={`${isDialog ? 'text-lg' : 'text-xl'} font-medium mb-2`}>Connect Gmail</h3>
          <p className="text-gray-600 mb-4 text-sm">
            Connect your Gmail account to access emails, labels, and send messages.
          </p>
          
          {connectionStatus === 'success' && connectedEmail && (
            <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4 flex items-start text-sm">
              <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Successfully connected!</p>
                <p className="mt-1">{connectedEmail}</p>
              </div>
            </div>
          )}
          
          <div className="mt-2">
            <Button 
              onClick={handleConnectGoogle}
              disabled={isLoading || connectionStatus === 'success'}
              className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 flex items-center justify-center"
              size={isDialog ? "sm" : "default"}
            >
              {isLoading && connectionStatus === 'connecting' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : connectionStatus === 'success' ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Connected
                </>
              ) : (
                <>Connect Gmail</>
              )}
            </Button>
          </div>
        </Card>

        {/* IMAP Account Connection */}
        <Card className={`${isDialog ? 'p-4' : 'p-6'} shadow-sm`}>
          <h3 className={`${isDialog ? 'text-lg' : 'text-xl'} font-medium mb-2`}>Connect IMAP Account</h3>
          <form onSubmit={handleConnectIMAP} className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">Email Address</label>
              <Input
                type="email"
                name="email"
                value={imapConfig.email}
                onChange={handleInputChange}
                required
                placeholder="your.email@example.com"
                className="h-8 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Password</label>
              <Input
                type="password"
                name="password"
                value={imapConfig.password}
                onChange={handleInputChange}
                required
                placeholder="Your email password or app password"
                className="h-8 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">IMAP Server</label>
                <Input
                  type="text"
                  name="imapHost"
                  value={imapConfig.imapHost}
                  onChange={handleInputChange}
                  required
                  placeholder="imap.example.com"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">IMAP Port</label>
                <Input
                  type="number"
                  name="imapPort"
                  value={imapConfig.imapPort}
                  onChange={handleInputChange}
                  required
                  placeholder="993"
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1">SMTP Server</label>
                <Input
                  type="text"
                  name="smtpHost"
                  value={imapConfig.smtpHost}
                  onChange={handleInputChange}
                  required
                  placeholder="smtp.example.com"
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">SMTP Port</label>
                <Input
                  type="number"
                  name="smtpPort"
                  value={imapConfig.smtpPort}
                  onChange={handleInputChange}
                  required
                  placeholder="587"
                  className="h-8 text-sm"
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
                className="h-3 w-3 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
              />
              <label htmlFor="useSSL" className="ml-2 block text-xs">
                Use SSL/TLS
              </label>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full"
              size={isDialog ? "sm" : "default"}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>Connect IMAP</>
              )}
            </Button>
          </form>
        </Card>
      </div>

      {/* Common Email Providers Help Section - only show if not in dialog mode */}
      {!isDialog && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Common Email Providers</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="p-3 shadow-sm">
              <h4 className="font-bold text-sm">Gmail</h4>
              <p className="text-xs text-gray-600 mb-1">IMAP: imap.gmail.com (993)</p>
              <p className="text-xs text-gray-600">SMTP: smtp.gmail.com (587)</p>
              <p className="text-xs mt-1 text-gray-500">Note: You may need to enable "Less secure app access" or use App Passwords.</p>
            </Card>
            <Card className="p-3 shadow-sm">
              <h4 className="font-bold text-sm">Outlook/Hotmail</h4>
              <p className="text-xs text-gray-600 mb-1">IMAP: outlook.office365.com (993)</p>
              <p className="text-xs text-gray-600">SMTP: smtp.office365.com (587)</p>
            </Card>
            <Card className="p-3 shadow-sm">
              <h4 className="font-bold text-sm">Yahoo Mail</h4>
              <p className="text-xs text-gray-600 mb-1">IMAP: imap.mail.yahoo.com (993)</p>
              <p className="text-xs text-gray-600">SMTP: smtp.mail.yahoo.com (587)</p>
              <p className="text-xs mt-1 text-gray-500">Note: You need to generate an app password.</p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
} 