import React, { useState, useEffect } from 'react';
import { emailService } from '../../services/email';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Input } from '../ui/Input';
import { Spinner } from '../ui/Spinner';
import { useEmail } from '../../contexts/EmailContext';
import { useNavigate } from 'react-router-dom';

export function EmailServiceDirect() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [accountCount, setAccountCount] = useState(0);
  const { accounts } = useEmail();
  const navigate = useNavigate();

  useEffect(() => {
    // Update account count when the accounts array changes
    setAccountCount(accounts.length);
  }, [accounts]);

  const handleConnectGmail = async () => {
    setStatus('loading');
    setErrorMessage(null);
    
    try {
      await emailService.addGoogleAccount();
      setStatus('success');
      setTimeout(() => {
        navigate('/email');
      }, 1500);
    } catch (error) {
      console.error('Failed to connect Gmail:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to connect Google account');
      setStatus('error');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Email Service</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Service Status:</span>
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            Active
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span>Connected Accounts:</span>
          <span>{accountCount}</span>
        </div>
        
        {status === 'error' && errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {errorMessage}
          </div>
        )}
        
        {status === 'success' && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
            Account connected successfully! Redirecting to inbox...
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end space-x-3">
        <Button
          onClick={() => navigate('/email')}
          variant="outline"
          disabled={accountCount === 0}
        >
          Open Inbox
        </Button>
        
        <Button 
          onClick={handleConnectGmail}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Connecting...
            </>
          ) : (
            'Connect Gmail'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
} 