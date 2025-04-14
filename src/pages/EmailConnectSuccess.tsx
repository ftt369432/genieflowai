import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EmailService } from '../services/email';

const EmailConnectSuccess = () => {
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('accountId');
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadAccount = async () => {
      try {
        if (!accountId) {
          console.error('Account ID is missing in URL params');
          setError('Account ID is missing. This may be due to an incomplete authentication flow.');
          setLoading(false);
          return;
        }
        
        const emailService = new EmailService();
        const accounts = await emailService.getAccounts();
        
        if (!accounts || accounts.length === 0) {
          console.error('No email accounts found');
          setError('No email accounts were found. Please try connecting again.');
          setLoading(false);
          return;
        }
        
        console.log('Available accounts:', accounts);
        const account = accounts.find(acc => acc.id === accountId);
        
        if (!account) {
          console.error(`Account not found with ID: ${accountId}`);
          setError(`Email account with ID ${accountId} was not found.`);
          setLoading(false);
          return;
        }
        
        setEmail(account.email);
        setLoading(false);
        
        // Redirect to email page after 3 seconds
        setTimeout(() => {
          navigate('/email');
        }, 3000);
      } catch (error: any) {
        console.error('Error loading account:', error);
        setError(error.message || 'An unknown error occurred while connecting your email');
        setLoading(false);
      }
    };
    
    loadAccount();
  }, [accountId, navigate]);

  const handleTryAgain = () => {
    navigate('/email');
  };
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold mb-2">Email Connection Failed</h1>
            
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {error}
            </p>
            
            <button
              onClick={handleTryAgain}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 max-w-md w-full">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold mb-2">Email Connected Successfully!</h1>
          
          {loading ? (
            <p className="text-gray-500 dark:text-gray-400 mb-4">Loading account details...</p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Your email account <span className="font-medium">{email}</span> has been connected successfully.
            </p>
          )}
          
          <p className="text-sm text-gray-400 dark:text-gray-500">
            You will be redirected to your email inbox in a few seconds...
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailConnectSuccess; 