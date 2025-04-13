import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Spinner } from '../components/ui/Spinner';
import emailService from '../services/email/emailService';
import { GoogleAPIClient } from '../services/google/GoogleAPIClient';
import googleAuthService from '../services/auth/googleAuth';
import { EmailMessage } from '../services/email/emailService';

export function EmailTestPage() {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleToken, setGoogleToken] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);

  // Initialize email service
  useEffect(() => {
    const initialize = async () => {
      try {
        await emailService.initialize();
        setIsInitialized(true);
      } catch (err) {
        console.error('Error initializing email service:', err);
        setError('Failed to initialize email service');
      }
    };
    
    initialize();
  }, []);

  // Function to check if user is signed in
  const checkSignIn = () => {
    const isSignedIn = googleAuthService.isSignedIn();
    return isSignedIn;
  };

  // Function to get access token
  const getAccessToken = () => {
    const googleClient = GoogleAPIClient.getInstance();
    const token = googleClient.getAccessToken();
    setGoogleToken(token || 'No token available');
  };

  // Function to fetch emails
  const fetchEmails = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await emailService.getEmails({
        maxResults: 10,
        labelIds: ['INBOX']
      });
      
      setEmails(response.messages);
      console.log('Emails fetched:', response.messages);
    } catch (err) {
      console.error('Error fetching emails:', err);
      setError('Failed to fetch emails: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Function to view a single email
  const viewEmail = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const email = await emailService.getEmail(id);
      setSelectedEmail(email);
    } catch (err) {
      console.error('Error fetching email:', err);
      setError('Failed to fetch email: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Function to manually set API token
  const setApiToken = (token: string) => {
    const googleClient = GoogleAPIClient.getInstance();
    googleClient.setAccessToken(token);
    googleClient.setUseMockData(false);
    alert('Token set successfully. Try fetching emails now.');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Email Connection Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Connection Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Email Service Initialized:</span>
                <span className={isInitialized ? "text-green-500" : "text-red-500"}>
                  {isInitialized ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Google Signed In:</span>
                <span className={checkSignIn() ? "text-green-500" : "text-red-500"}>
                  {checkSignIn() ? "Yes" : "No"}
                </span>
              </div>
              <Button onClick={getAccessToken} variant="outline" className="w-full">
                Check Google Token
              </Button>
              {googleToken && (
                <div className="pt-2">
                  <div className="text-sm font-medium mb-1">Current Token:</div>
                  <code className="bg-gray-100 dark:bg-gray-800 p-2 rounded block text-xs overflow-x-auto">
                    {googleToken}
                  </code>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Manual Token Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                If you have a Google API token, you can manually set it here:
              </p>
              <Textarea 
                id="token" 
                placeholder="Paste your Google API token here..." 
                className="h-24"
              />
              <Button onClick={() => {
                const token = (document.getElementById('token') as HTMLTextAreaElement)?.value;
                if (token) {
                  setApiToken(token);
                }
              }} className="w-full">
                Set Token
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Get Emails</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button onClick={fetchEmails} disabled={loading}>
              {loading ? <Spinner className="mr-2" /> : null}
              Fetch Emails
            </Button>
            
            {error && (
              <div className="p-3 bg-red-100 text-red-800 rounded-md">
                {error}
              </div>
            )}
            
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      From
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {emails.length > 0 ? (
                    emails.map(email => (
                      <tr key={email.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {email.from}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {email.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(email.date).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button variant="ghost" size="sm" onClick={() => viewEmail(email.id)}>
                            View
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        {loading ? 'Loading emails...' : 'No emails found. Try fetching emails.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {selectedEmail && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedEmail.subject}</CardTitle>
            <div className="text-sm text-muted-foreground mt-1">
              From: {selectedEmail.from}
            </div>
            <div className="text-sm text-muted-foreground">
              Date: {new Date(selectedEmail.date).toLocaleString()}
            </div>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-800">
              <div dangerouslySetInnerHTML={{ __html: selectedEmail.body }} />
            </div>
            <Button variant="outline" className="mt-4" onClick={() => setSelectedEmail(null)}>
              Close
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default EmailTestPage; 