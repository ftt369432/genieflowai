import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Label } from '../ui/Label';
import { DatePicker } from '../ui/DatePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { X, Plus, CalendarClock, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { EmailPreferences } from '../../services/email/types';
import { useEmail } from '../../contexts/EmailContext';
import { toast } from 'sonner';

interface AutoReplySettingsProps {
  accountId: string;
  preferences?: EmailPreferences;
  onSave: (preferences: EmailPreferences) => Promise<void>;
}

export function AutoReplySettings({ accountId, preferences = {}, onSave }: AutoReplySettingsProps) {
  const [isEnabled, setIsEnabled] = useState<boolean>(preferences.autoReply?.enabled || false);
  const [message, setMessage] = useState<string>(preferences.autoReply?.message || '');
  const [startDate, setStartDate] = useState<Date | undefined>(preferences.autoReply?.startDate);
  const [endDate, setEndDate] = useState<Date | undefined>(preferences.autoReply?.endDate);
  const [frequency, setFrequency] = useState<'once' | 'daily' | 'always'>(
    preferences.autoReply?.frequency || 'once'
  );
  const [limitToContacts, setLimitToContacts] = useState<boolean>(
    preferences.autoReply?.limitToContacts || false
  );
  const [excludeDomains, setExcludeDomains] = useState<string[]>(
    preferences.autoReply?.excludeDomains || []
  );
  const [customSubject, setCustomSubject] = useState<string>(
    preferences.autoReply?.customSubject || 'Auto: Out of Office Reply'
  );
  const [includeOriginalMessage, setIncludeOriginalMessage] = useState<boolean>(
    preferences.autoReply?.includeOriginalMessage || true
  );
  const [newDomain, setNewDomain] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      const updatedPreferences: EmailPreferences = {
        ...preferences,
        autoReply: {
          enabled: isEnabled,
          message,
          startDate,
          endDate,
          frequency,
          limitToContacts,
          excludeDomains,
          customSubject,
          includeOriginalMessage
        }
      };
      
      await onSave(updatedPreferences);
      toast.success('Auto-reply settings saved successfully');
    } catch (error) {
      console.error('Failed to save auto-reply settings:', error);
      toast.error('Failed to save auto-reply settings');
    } finally {
      setIsSaving(false);
    }
  };

  const addExcludeDomain = () => {
    if (!newDomain) return;
    
    if (!newDomain.includes('.')) {
      toast.error('Please enter a valid domain');
      return;
    }
    
    if (excludeDomains.includes(newDomain)) {
      toast.error('Domain already in the list');
      return;
    }
    
    setExcludeDomains([...excludeDomains, newDomain]);
    setNewDomain('');
  };

  const removeExcludeDomain = (domain: string) => {
    setExcludeDomains(excludeDomains.filter(d => d !== domain));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-Reply Settings</CardTitle>
        <CardDescription>
          Configure automatic responses when you're away or unavailable
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Enable Auto-Reply */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="auto-reply-toggle" className="font-medium">
              Enable Auto-Reply
            </Label>
            <p className="text-sm text-gray-500">
              Automatically respond to incoming emails
            </p>
          </div>
          <Switch
            id="auto-reply-toggle"
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
          />
        </div>
        
        {isEnabled && (
          <>
            {/* Auto-Reply Message */}
            <div className="space-y-2">
              <Label htmlFor="auto-reply-message">Auto-Reply Message</Label>
              <Textarea
                id="auto-reply-message"
                placeholder="I'm currently out of office and will respond when I return..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
              />
            </div>
            
            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <div className="flex items-center">
                  <DatePicker
                    id="start-date"
                    selected={startDate}
                    onSelect={setStartDate}
                    placeholder="Start date"
                  />
                  <CalendarClock className="ml-2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <div className="flex items-center">
                  <DatePicker
                    id="end-date"
                    selected={endDate}
                    onSelect={setEndDate}
                    placeholder="End date"
                    minDate={startDate}
                  />
                  <CalendarClock className="ml-2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
            
            {/* Advanced Settings */}
            <div className="space-y-4">
              <h4 className="font-medium">Advanced Settings</h4>
              
              {/* Frequency */}
              <div className="space-y-2">
                <Label htmlFor="frequency">Reply Frequency</Label>
                <Select value={frequency} onValueChange={(value: any) => setFrequency(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once per sender</SelectItem>
                    <SelectItem value="daily">Once per day per sender</SelectItem>
                    <SelectItem value="always">Every email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Subject Line */}
              <div className="space-y-2">
                <Label htmlFor="subject-line">Subject Line</Label>
                <Input
                  id="subject-line"
                  placeholder="Auto: Out of Office Reply"
                  value={customSubject}
                  onChange={e => setCustomSubject(e.target.value)}
                />
              </div>
              
              {/* Limit to Contacts */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="limit-to-contacts" className="font-medium">
                    Only Reply to Contacts
                  </Label>
                  <p className="text-sm text-gray-500">
                    Only send auto-replies to people in your contacts
                  </p>
                </div>
                <Switch
                  id="limit-to-contacts"
                  checked={limitToContacts}
                  onCheckedChange={setLimitToContacts}
                />
              </div>
              
              {/* Include Original Message */}
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="include-original" className="font-medium">
                    Include Original Message
                  </Label>
                  <p className="text-sm text-gray-500">
                    Include the original message in your auto-reply
                  </p>
                </div>
                <Switch
                  id="include-original"
                  checked={includeOriginalMessage}
                  onCheckedChange={setIncludeOriginalMessage}
                />
              </div>
              
              {/* Excluded Domains */}
              <div className="space-y-2">
                <Label>Excluded Domains</Label>
                <p className="text-sm text-gray-500">
                  Don't send auto-replies to these domains
                </p>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {excludeDomains.map(domain => (
                    <div 
                      key={domain}
                      className="bg-gray-100 text-gray-800 text-sm rounded-full px-3 py-1 flex items-center"
                    >
                      {domain}
                      <button 
                        onClick={() => removeExcludeDomain(domain)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    placeholder="example.com"
                    value={newDomain}
                    onChange={e => setNewDomain(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addExcludeDomain} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardFooter>
    </Card>
  );
} 