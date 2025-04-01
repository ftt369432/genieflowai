import React, { useState, useEffect, useCallback } from 'react';
import { 
  EmailProcessorSettings, 
  EmailProcessingResult,
  createEmailProcessor
} from '../../services/integration';
import { EmailService } from '../../services/email/EmailService';
import { taskService } from '../../services/tasks/taskService';
import { calendarService } from '../../services/calendar/calendarService';

// Create an instance of the email service if not exported directly
const emailService = new EmailService();

// Mock email hook for this example
const useEmail = () => {
  return {
    accounts: [{ id: 'default-account', name: 'Default Account' }],
    selectedAccount: { id: 'default-account', name: 'Default Account' }
  };
};

const styles = `
  .email-processor-card {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    background: white;
  }
  
  .card-header {
    padding: 16px;
    background: #f5f5f5;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .card-header h2 {
    margin: 0;
    font-size: 1.5rem;
  }
  
  .card-header p {
    margin: 8px 0 0;
    color: #666;
  }
  
  .card-content {
    padding: 16px;
  }
  
  .error-alert {
    background: #ffebee;
    color: #c62828;
    padding: 12px;
    border-radius: 4px;
    margin-bottom: 16px;
  }
  
  .settings-form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .setting-control {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }
  
  .divider {
    margin: 24px 0;
    border: none;
    border-top: 1px solid #e0e0e0;
  }
  
  .action-buttons {
    margin-bottom: 16px;
  }
  
  .button-group {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .primary-button {
    background: #1976d2;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .primary-button:hover {
    background: #1565c0;
  }
  
  .primary-button:disabled {
    background: #bdbdbd;
    cursor: not-allowed;
  }
  
  .secondary-button {
    background: white;
    color: #1976d2;
    border: 1px solid #1976d2;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .secondary-button:hover {
    background: #f5f5f5;
  }
  
  .secondary-button.danger {
    color: #d32f2f;
    border-color: #d32f2f;
  }
  
  .secondary-button.danger:hover {
    background: #ffebee;
  }
  
  .secondary-button:disabled {
    color: #bdbdbd;
    border-color: #bdbdbd;
    cursor: not-allowed;
  }
  
  .results-container {
    max-height: 300px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .result-card {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 12px;
  }
  
  .result-card h4 {
    margin: 0 0 8px;
    font-size: 1rem;
  }
  
  .result-chips {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .info-chip, .success-chip, .warning-chip, .secondary-chip, .error-chip {
    padding: 4px 8px;
    border-radius: 16px;
    font-size: 0.75rem;
  }
  
  .info-chip {
    background: #e3f2fd;
    color: #1976d2;
  }
  
  .success-chip {
    background: #e8f5e9;
    color: #2e7d32;
  }
  
  .warning-chip {
    background: #fff8e1;
    color: #f57c00;
  }
  
  .secondary-chip {
    background: #f3e5f5;
    color: #7b1fa2;
  }
  
  .error-chip {
    background: #ffebee;
    color: #c62828;
  }
`;

/**
 * Component for managing and displaying automated email processing
 */
const AutomatedEmailProcessor: React.FC = () => {
  const { accounts, selectedAccount } = useEmail();
  const [settings, setSettings] = useState<EmailProcessorSettings | null>(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<EmailProcessingResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(15);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Initialize the email processor
  const emailProcessor = React.useMemo(() => {
    return createEmailProcessor(emailService, taskService, calendarService);
  }, []);

  // Load settings when component mounts
  useEffect(() => {
    try {
      const processorSettings = emailProcessor.getSettings();
      setSettings(processorSettings);
    } catch (err) {
      setError('Failed to load processor settings');
      console.error('Error loading settings:', err);
    }
  }, [emailProcessor]);

  // Handle setting changes
  const handleSettingChange = (key: keyof EmailProcessorSettings) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!settings) return;
    
    const newSettings = {
      ...settings,
      [key]: event.target.checked
    };
    
    setSettings(newSettings);
    emailProcessor.saveSettings(newSettings);
  };

  // Process emails
  const handleProcessEmails = useCallback(async () => {
    if (!selectedAccount) {
      setError('No email account selected');
      return;
    }
    
    setError(null);
    setProcessing(true);
    
    try {
      const processingResults = await emailProcessor.processNewEmails(selectedAccount.id);
      setResults(processingResults);
    } catch (err) {
      setError(`Error processing emails: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Error processing emails:', err);
    } finally {
      setProcessing(false);
    }
  }, [emailProcessor, selectedAccount]);

  // Handle scheduling
  const handleToggleScheduling = useCallback(() => {
    if (isScheduled && intervalId) {
      emailProcessor.stopScheduledProcessing(intervalId);
      setIntervalId(null);
      setIsScheduled(false);
    } else if (selectedAccount) {
      const id = emailProcessor.scheduleRegularProcessing(selectedAccount.id, intervalMinutes);
      setIntervalId(id);
      setIsScheduled(true);
    }
  }, [emailProcessor, selectedAccount, isScheduled, intervalId, intervalMinutes]);

  // Cancel scheduling when component unmounts
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  if (!settings) {
    return <div>Loading settings...</div>;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="email-processor-card">
        <div className="card-header">
          <h2>Automated Email Processing</h2>
          <p>Configure how GenieFlow processes your emails</p>
        </div>
        <div className="card-content">
          {error && <div className="error-alert">{error}</div>}
          
          <h3>Settings</h3>
          <div className="settings-form">
            <label className="setting-control">
              <input 
                type="checkbox" 
                checked={settings.autoAnalyzeEmails} 
                onChange={handleSettingChange('autoAnalyzeEmails')} 
              />
              Automatically analyze email content
            </label>
            <label className="setting-control">
              <input 
                type="checkbox" 
                checked={settings.autoCreateTasks} 
                onChange={handleSettingChange('autoCreateTasks')} 
              />
              Create tasks from action items in emails
            </label>
            <label className="setting-control">
              <input 
                type="checkbox" 
                checked={settings.autoCreateEvents} 
                onChange={handleSettingChange('autoCreateEvents')} 
              />
              Create calendar events from meeting details
            </label>
            <label className="setting-control">
              <input 
                type="checkbox" 
                checked={settings.autoReplyToEmails} 
                onChange={handleSettingChange('autoReplyToEmails')} 
              />
              Suggest replies for emails requiring responses
            </label>
            <label className="setting-control">
              <input 
                type="checkbox" 
                checked={settings.autoLabelsEnabled} 
                onChange={handleSettingChange('autoLabelsEnabled')} 
              />
              Automatically label emails based on content
            </label>
            <label className="setting-control">
              <input 
                type="checkbox" 
                checked={settings.processOnlyUnread} 
                onChange={handleSettingChange('processOnlyUnread')} 
              />
              Process only unread emails
            </label>
            <label className="setting-control">
              <input 
                type="checkbox" 
                checked={settings.processOnlyInbox} 
                onChange={handleSettingChange('processOnlyInbox')} 
              />
              Process only emails in Inbox folder
            </label>
          </div>
          
          <hr className="divider" />
          
          <div className="action-buttons">
            <h3>Process Emails</h3>
            <div className="button-group">
              <button 
                className="primary-button" 
                onClick={handleProcessEmails}
                disabled={processing || !selectedAccount}
              >
                {processing ? 'Processing...' : 'Process New Emails'}
              </button>
              
              <button 
                className={`secondary-button ${isScheduled ? 'danger' : ''}`}
                onClick={handleToggleScheduling}
                disabled={!selectedAccount}
              >
                {isScheduled ? 'Stop Auto-Processing' : 'Schedule Auto-Processing'}
              </button>
              
              {isScheduled && (
                <span className="success-chip">
                  Auto-processing every {intervalMinutes} minutes
                </span>
              )}
            </div>
          </div>
          
          {results.length > 0 && (
            <>
              <hr className="divider" />
              <h3>Recent Processing Results</h3>
              <div className="results-container">
                {results.map((result, index) => (
                  <div key={index} className="result-card">
                    <h4>{result.subject}</h4>
                    <div className="result-chips">
                      {result.analyzed && (
                        <span className="info-chip">Analyzed</span>
                      )}
                      {result.tasksCreated > 0 && (
                        <span className="success-chip">
                          {result.tasksCreated} Tasks Created
                        </span>
                      )}
                      {result.eventsCreated > 0 && (
                        <span className="success-chip">
                          Calendar Event Created
                        </span>
                      )}
                      {result.autoReplied && (
                        <span className="warning-chip">Reply Suggested</span>
                      )}
                      {result.labelsApplied.length > 0 && (
                        <span className="secondary-chip">
                          {result.labelsApplied.length} Labels Applied
                        </span>
                      )}
                      {result.error && (
                        <span className="error-chip">{result.error}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AutomatedEmailProcessor;
