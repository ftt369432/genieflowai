import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { GoogleAPIClient } from '../services/google/GoogleAPIClient';
import debugLog from '../utils/debug-log';

const TestStatus: React.FC = () => {
  const [status, setStatus] = useState<{
    googleAuth: string;
    supabaseTeams: string;
    errors: string[];
    logs: any[];
  }>({
    googleAuth: 'Checking...',
    supabaseTeams: 'Checking...',
    errors: [],
    logs: []
  });

  useEffect(() => {
    const checkStatus = async () => {
      const errors: string[] = [];
      let googleAuthStatus = 'Checking...';
      let teamsStatus = 'Checking...';

      debugLog.log('Starting status check');

      // Check Google API authentication
      try {
        debugLog.log('Initializing Google API client');
        const googleClient = GoogleAPIClient.getInstance();
        await googleClient.initialize();
        const isSignedIn = googleClient.isSignedIn();
        debugLog.log(`Google client initialized, isSignedIn: ${isSignedIn}`);
        
        googleAuthStatus = isSignedIn 
          ? 'Authenticated ✅' 
          : 'Not authenticated ❌';
      } catch (error) {
        console.error('Google API error:', error);
        debugLog.log('Google API error', error);
        googleAuthStatus = 'Error ❌';
        errors.push(`Google API error: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Check Supabase teams
      try {
        debugLog.log('Checking Supabase teams table');
        const { data, error } = await supabase
          .from('teams')
          .select('id, name')
          .limit(5);
        
        if (error) {
          debugLog.log('Supabase teams query error', error);
          throw error;
        }
        
        debugLog.log(`Teams query successful, found ${data?.length || 0} teams`, data);
        teamsStatus = `Success ✅ - Found ${data?.length || 0} teams`;
        
        // Also try team_members to check for the previous infinite recursion issue
        debugLog.log('Checking team_members table');
        const { data: members, error: membersError } = await supabase
          .from('team_members')
          .select('id, team_id, user_id')
          .limit(5);
          
        if (membersError) {
          debugLog.log('Team members query error', membersError);
          throw membersError;
        }
        
        debugLog.log(`Team members query successful, found ${members?.length || 0} members`, members);
        teamsStatus += ` and ${members?.length || 0} team members`;
      } catch (error) {
        console.error('Supabase teams error:', error);
        debugLog.log('Supabase teams error', error);
        teamsStatus = 'Error ❌';
        errors.push(`Supabase teams error: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Get logs
      const logs = debugLog.getLogs();
      
      setStatus({
        googleAuth: googleAuthStatus,
        supabaseTeams: teamsStatus,
        errors,
        logs
      });
    };

    checkStatus();
  }, []);

  const refreshStatus = () => {
    window.location.reload();
  };

  const clearAllLogs = () => {
    debugLog.clearLogs();
    setStatus(prev => ({ ...prev, logs: [] }));
  };

  return (
    <div className="p-4 border rounded-lg shadow-md bg-white dark:bg-gray-800">
      <h2 className="text-xl font-bold mb-4">System Status</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Google API Authentication:</h3>
          <p className={status.googleAuth.includes('✅') ? 'text-green-500' : 'text-red-500'}>
            {status.googleAuth}
          </p>
        </div>
        
        <div>
          <h3 className="font-semibold">Supabase Teams:</h3>
          <p className={status.supabaseTeams.includes('✅') ? 'text-green-500' : 'text-red-500'}>
            {status.supabaseTeams}
          </p>
        </div>
        
        {status.errors.length > 0 && (
          <div>
            <h3 className="font-semibold text-red-500">Errors:</h3>
            <ul className="list-disc pl-5 text-red-500">
              {status.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex space-x-2">
          <button 
            onClick={refreshStatus}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh Status
          </button>
          <button 
            onClick={clearAllLogs}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear Logs
          </button>
        </div>
        
        <div>
          <h3 className="font-semibold mt-6">Debug Logs:</h3>
          <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded h-40 overflow-y-auto text-xs">
            {status.logs.length === 0 ? (
              <p className="text-gray-500">No logs available</p>
            ) : (
              <pre>
                {status.logs.map((log, index) => (
                  <div key={index} className="mb-2 border-b pb-1">
                    <div className="text-gray-500">{log.timestamp}</div>
                    <div className="font-medium">{log.message}</div>
                    {log.data && <div className="text-blue-600 dark:text-blue-400">{log.data}</div>}
                  </div>
                ))}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestStatus; 