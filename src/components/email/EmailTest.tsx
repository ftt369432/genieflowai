import React, { useState } from 'react';
import { emailService } from '../../services/email';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { IMAPConfig } from '../../components/email/IMAPConfigForm';

export function EmailTest() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const testGmail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const account = await emailService.addGoogleAccount();
      setResult({
        operation: 'Add Gmail Account',
        success: true,
        account
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to connect Gmail:', err);
      setError('Failed to connect Gmail account');
      setLoading(false);
    }
  };
  
  const testOutlook = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const config: IMAPConfig = {
        email: 'test@outlook.com',
        password: 'test-password',
        imapHost: 'outlook.office365.com',
        imapPort: 993,
        imapSecure: true,
        smtpHost: 'smtp.office365.com',
        smtpPort: 587,
        smtpSecure: true,
        provider: 'outlook'
      };
      
      const account = await emailService.addIMAPAccount(config);
      setResult({
        operation: 'Add Outlook Account',
        success: true,
        account
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to connect Outlook:', err);
      setError('Failed to connect Outlook account');
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Service Direct Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Button onClick={testGmail} disabled={loading}>
                Test Gmail Connection
              </Button>
              
              <Button onClick={testOutlook} disabled={loading}>
                Test Outlook Connection
              </Button>
            </div>
            
            {loading && <p>Loading...</p>}
            
            {error && <p className="text-red-500">{error}</p>}
            
            {result && (
              <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded">
                <h3 className="font-medium mb-2">{result.operation} Result:</h3>
                <pre className="whitespace-pre-wrap overflow-auto max-h-64">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 