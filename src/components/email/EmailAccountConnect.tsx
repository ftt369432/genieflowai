import React, { useState } from 'react';
import { useSupabase } from '../../providers/SupabaseProvider';
import { useEmail } from '../../contexts/EmailContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

export function EmailAccountConnect() {
  const { user } = useSupabase();
  const emailContext = useEmail();
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
    
    try {
      await emailContext.addGoogleAccount();
      setSuccess('Google account connected successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to connect Google account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectIMAP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await emailContext.addIMAPAccount(imapConfig);
      setSuccess('IMAP account connected successfully!');
      
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
    } catch (err: any) {
      setError(err.message || 'Failed to connect IMAP account');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>Please log in to connect email accounts.</div>;
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Connect Email Account</h2>
      
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
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Google Account Connection */}
        <Card className="p-6">
          <h3 className="text-xl font-medium mb-4">Connect with Google</h3>
          <p className="text-gray-500 mb-4">
            Connect your Gmail account to access your emails directly.
          </p>
          <Button 
            onClick={handleConnectGoogle} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Connecting...' : 'Connect with Google'}
          </Button>
        </Card>
        
        {/* IMAP Account Connection */}
        <Card className="p-6">
          <h3 className="text-xl font-medium mb-4">Connect IMAP Account</h3>
          <form onSubmit={handleConnectIMAP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <Input
                name="email"
                type="email"
                value={imapConfig.email}
                onChange={handleInputChange}
                required
                placeholder="your.email@example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <Input
                name="password"
                type="password"
                value={imapConfig.password}
                onChange={handleInputChange}
                required
                placeholder="Your email password or app password"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">IMAP Server</label>
              <Input
                name="imapHost"
                type="text"
                value={imapConfig.imapHost}
                onChange={handleInputChange}
                required
                placeholder="imap.example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">IMAP Port</label>
              <Input
                name="imapPort"
                type="number"
                value={imapConfig.imapPort}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">SMTP Server</label>
              <Input
                name="smtpHost"
                type="text"
                value={imapConfig.smtpHost}
                onChange={handleInputChange}
                required
                placeholder="smtp.example.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">SMTP Port</label>
              <Input
                name="smtpPort"
                type="number"
                value={imapConfig.smtpPort}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="flex items-center">
              <input
                name="useSSL"
                type="checkbox"
                checked={imapConfig.useSSL}
                onChange={handleInputChange}
                className="mr-2"
              />
              <label className="text-sm font-medium">Use SSL</label>
            </div>
            
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Connecting...' : 'Connect IMAP Account'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
} 