import React, { useState, useEffect } from 'react';
import { EmailAccountConnect } from '../components/email/EmailAccountConnect';
import { useEmail } from '../contexts/EmailContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useSupabase } from '../providers/SupabaseProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/Select';
import { Label } from '../components/ui/Label';
import { Switch } from '../components/ui/Switch';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Separator } from '../components/ui/Separator';
import { toast } from 'sonner';

interface EmailAccountWithProvider extends Record<string, any> {
  id: string;
  email: string;
  provider?: 'google' | 'imap';
}

interface EmailPreferencesType {
  defaultSignatureId?: string;
  defaultReplySignatureId?: string;
  sendAndArchive: boolean;
  confirmBeforeSending: boolean;
  defaultFontFamily: string;
  defaultFontSize: number;
  defaultComposeFormat: 'plain' | 'rich';
  showSnippets: boolean;
  autoAdvance: 'newer' | 'older' | 'none';
  messageDisplay: 'default' | 'compact' | 'comfortable';
  inlineImages: boolean;
  starredPosition: 'left' | 'right';
  keyboard: { shortcuts: boolean };
  notifications: {
    desktop: boolean;
    sound: boolean;
    browserTab: boolean;
    priority: 'all' | 'important' | 'none';
  };
}

interface SignatureType {
  id: string;
  name: string;
  content: string;
  created: Date;
  lastModified: Date;
}

export default function EmailSettingsPage() {
  const { accounts, removeAccount, selectedAccountId, selectAccount } = useEmail();
  const { user } = useSupabase();
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("accounts");
  
  // Email preferences state
  const [preferences, setPreferences] = useState<EmailPreferencesType>({
    sendAndArchive: false,
    confirmBeforeSending: true,
    defaultFontFamily: 'Arial',
    defaultFontSize: 14,
    defaultComposeFormat: 'rich',
    showSnippets: true,
    autoAdvance: 'newer',
    messageDisplay: 'default',
    inlineImages: true,
    starredPosition: 'left',
    keyboard: { shortcuts: true },
    notifications: {
      desktop: true,
      sound: true,
      browserTab: true,
      priority: 'important'
    }
  });
  
  // Signatures state
  const [signatures, setSignatures] = useState<SignatureType[]>([
    {
      id: 'default-signature',
      name: 'Default Signature',
      content: 'Best regards,\n[Your Name]',
      created: new Date(),
      lastModified: new Date()
    }
  ]);
  const [currentSignature, setCurrentSignature] = useState<SignatureType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Load preferences from storage on component mount
  useEffect(() => {
    if (selectedAccountId) {
      // In a real app, this would fetch from API or storage
      const storedPreferences = localStorage.getItem(`email_preferences_${selectedAccountId}`);
      if (storedPreferences) {
        try {
          setPreferences(JSON.parse(storedPreferences));
        } catch (error) {
          console.error('Failed to parse stored preferences:', error);
        }
      }
      
      // Load signatures
      const storedSignatures = localStorage.getItem(`email_signatures_${selectedAccountId}`);
      if (storedSignatures) {
        try {
          setSignatures(JSON.parse(storedSignatures));
          
          // Set current default signature if exists
          const parsed = JSON.parse(storedSignatures) as SignatureType[];
          if (parsed.length > 0) {
            setCurrentSignature(parsed[0]);
          }
        } catch (error) {
          console.error('Failed to parse stored signatures:', error);
        }
      }
    }
  }, [selectedAccountId]);
  
  const handleConnectionStart = () => {
    setConnectionStatus('connecting');
    setErrorMessage(null);
  };
  
  const handleConnectionSuccess = () => {
    setConnectionStatus('success');
  };
  
  const handleConnectionError = (error: string) => {
    setConnectionStatus('error');
    setErrorMessage(error);
  };
  
  const handleRemoveAccount = async (accountId: string) => {
    if (window.confirm('Are you sure you want to remove this account? This action cannot be undone.')) {
      try {
        await removeAccount(accountId);
      } catch (error) {
        console.error('Error removing account:', error);
      }
    }
  };
  
  const handleAccountSelect = (accountId: string) => {
    selectAccount(accountId);
  };
  
  const savePreferences = () => {
    // In a real app, this would save to API
    localStorage.setItem(`email_preferences_${selectedAccountId}`, JSON.stringify(preferences));
    toast.success('Preferences saved successfully');
  };
  
  const createNewSignature = () => {
    const newSignature: SignatureType = {
      id: `sig-${Date.now()}`,
      name: 'New Signature',
      content: '',
      created: new Date(),
      lastModified: new Date()
    };
    
    setSignatures(prev => [...prev, newSignature]);
    setCurrentSignature(newSignature);
    setIsEditing(true);
  };
  
  const saveSignature = () => {
    if (!currentSignature) return;
    
    setSignatures(prev => 
      prev.map(sig => 
        sig.id === currentSignature.id 
          ? {...currentSignature, lastModified: new Date()} 
          : sig
      )
    );
    
    // Save to storage
    localStorage.setItem(`email_signatures_${selectedAccountId}`, JSON.stringify(
      signatures.map(sig => 
        sig.id === currentSignature.id 
          ? {...currentSignature, lastModified: new Date()} 
          : sig
      )
    ));
    
    setIsEditing(false);
    toast.success('Signature saved successfully');
  };
  
  const deleteSignature = (id: string) => {
    if (window.confirm('Are you sure you want to delete this signature?')) {
      const updatedSignatures = signatures.filter(sig => sig.id !== id);
      setSignatures(updatedSignatures);
      
      if (currentSignature?.id === id) {
        setCurrentSignature(updatedSignatures.length > 0 ? updatedSignatures[0] : null);
      }
      
      // Save to storage
      localStorage.setItem(`email_signatures_${selectedAccountId}`, JSON.stringify(updatedSignatures));
      toast.success('Signature deleted successfully');
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">You need to be logged in</h2>
        <p className="text-muted-foreground mb-4">Please log in to access email settings.</p>
      </div>
    );
  }
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Email Settings</h1>
      
      <Tabs defaultValue="accounts" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="signatures">Signatures</TabsTrigger>
        </TabsList>
        
        {/* Accounts Tab */}
        <TabsContent value="accounts" className="space-y-6">
          {/* Connected Accounts */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>
            
            {accounts.length === 0 ? (
              <p className="text-muted-foreground">No email accounts connected yet.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {accounts.map(account => {
                  // Type assertion to access potential provider property
                  const typedAccount = account as EmailAccountWithProvider;
                  return (
                    <Card key={typedAccount.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full ${selectedAccountId === typedAccount.id ? 'bg-green-500' : 'bg-gray-300'} mr-3`}></div>
                          <div>
                            <h3 className="font-medium">{typedAccount.email}</h3>
                            <p className="text-sm text-muted-foreground">
                              {typedAccount.provider === 'google' ? 'Google Account' : 'IMAP Account'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {selectedAccountId !== typedAccount.id && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleAccountSelect(typedAccount.id)}
                            >
                              Select
                            </Button>
                          )}
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleRemoveAccount(typedAccount.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Connect New Account */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Connect New Account</h2>
            
            <EmailAccountConnect
              onConnectionStart={handleConnectionStart}
              onConnectionSuccess={handleConnectionSuccess}
              onConnectionError={handleConnectionError}
            />
          </div>
        </TabsContent>
        
        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          {!selectedAccountId ? (
            <p className="text-center text-muted-foreground">Please select an account to manage preferences</p>
          ) : (
            <>
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Display Settings</h2>
                
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="defaultComposeFormat">Default compose format</Label>
                    <Select 
                      value={preferences.defaultComposeFormat}
                      onValueChange={(value: 'plain' | 'rich') => 
                        setPreferences({...preferences, defaultComposeFormat: value})
                      }
                    >
                      <SelectTrigger id="defaultComposeFormat">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plain">Plain text</SelectItem>
                        <SelectItem value="rich">Rich text (HTML)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="defaultFontFamily">Default font</Label>
                    <Select 
                      value={preferences.defaultFontFamily}
                      onValueChange={(value) => 
                        setPreferences({...preferences, defaultFontFamily: value})
                      }
                    >
                      <SelectTrigger id="defaultFontFamily">
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Courier New">Courier New</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="defaultFontSize">Font size</Label>
                    <Select 
                      value={preferences.defaultFontSize.toString()}
                      onValueChange={(value) => 
                        setPreferences({...preferences, defaultFontSize: parseInt(value)})
                      }
                    >
                      <SelectTrigger id="defaultFontSize">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10pt</SelectItem>
                        <SelectItem value="12">12pt</SelectItem>
                        <SelectItem value="14">14pt</SelectItem>
                        <SelectItem value="16">16pt</SelectItem>
                        <SelectItem value="18">18pt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="messageDisplay">Message display density</Label>
                    <Select 
                      value={preferences.messageDisplay}
                      onValueChange={(value: 'default' | 'compact' | 'comfortable') => 
                        setPreferences({...preferences, messageDisplay: value})
                      }
                    >
                      <SelectTrigger id="messageDisplay">
                        <SelectValue placeholder="Select density" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="comfortable">Comfortable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="showSnippets">Show message snippets</Label>
                      <div className="text-sm text-muted-foreground">
                        Display a preview of the message content in the inbox
                      </div>
                    </div>
                    <Switch
                      id="showSnippets"
                      checked={preferences.showSnippets}
                      onCheckedChange={(checked) => 
                        setPreferences({...preferences, showSnippets: checked})
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="inlineImages">Display inline images</Label>
                      <div className="text-sm text-muted-foreground">
                        Automatically display images in emails
                      </div>
                    </div>
                    <Switch
                      id="inlineImages"
                      checked={preferences.inlineImages}
                      onCheckedChange={(checked) => 
                        setPreferences({...preferences, inlineImages: checked})
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="keyboardShortcuts">Keyboard shortcuts</Label>
                      <div className="text-sm text-muted-foreground">
                        Enable keyboard shortcuts for common actions
                      </div>
                    </div>
                    <Switch
                      id="keyboardShortcuts"
                      checked={preferences.keyboard.shortcuts}
                      onCheckedChange={(checked) => 
                        setPreferences({
                          ...preferences, 
                          keyboard: { ...preferences.keyboard, shortcuts: checked }
                        })
                      }
                    />
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="desktopNotifications">Desktop notifications</Label>
                      <div className="text-sm text-muted-foreground">
                        Receive notifications for new emails
                      </div>
                    </div>
                    <Switch
                      id="desktopNotifications"
                      checked={preferences.notifications.desktop}
                      onCheckedChange={(checked) => 
                        setPreferences({
                          ...preferences, 
                          notifications: { ...preferences.notifications, desktop: checked }
                        })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="soundNotifications">Sound notifications</Label>
                      <div className="text-sm text-muted-foreground">
                        Play a sound when new emails arrive
                      </div>
                    </div>
                    <Switch
                      id="soundNotifications"
                      checked={preferences.notifications.sound}
                      onCheckedChange={(checked) => 
                        setPreferences({
                          ...preferences, 
                          notifications: { ...preferences.notifications, sound: checked }
                        })
                      }
                    />
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="notificationPriority">Notification priority</Label>
                    <Select 
                      value={preferences.notifications.priority}
                      onValueChange={(value: 'all' | 'important' | 'none') => 
                        setPreferences({
                          ...preferences, 
                          notifications: { ...preferences.notifications, priority: value }
                        })
                      }
                    >
                      <SelectTrigger id="notificationPriority">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All messages</SelectItem>
                        <SelectItem value="important">Important only</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
              
              <div className="flex justify-end">
                <Button onClick={savePreferences}>
                  Save Preferences
                </Button>
              </div>
            </>
          )}
        </TabsContent>
        
        {/* Signatures Tab */}
        <TabsContent value="signatures" className="space-y-6">
          {!selectedAccountId ? (
            <p className="text-center text-muted-foreground">Please select an account to manage signatures</p>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Email Signatures</h2>
                <Button onClick={createNewSignature}>
                  Add New Signature
                </Button>
              </div>
              
              <div className="grid md:grid-cols-5 gap-6">
                <div className="md:col-span-2">
                  <Card className="p-4 h-full">
                    <h3 className="font-medium mb-4">My Signatures</h3>
                    
                    {signatures.length === 0 ? (
                      <p className="text-muted-foreground">No signatures created yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {signatures.map(signature => (
                          <div 
                            key={signature.id}
                            className={`p-3 rounded-md cursor-pointer flex justify-between items-center ${
                              currentSignature?.id === signature.id ? 'bg-accent' : 'hover:bg-muted/50'
                            }`}
                            onClick={() => {
                              setCurrentSignature(signature);
                              setIsEditing(false);
                            }}
                          >
                            <span>{signature.name}</span>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSignature(signature.id);
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
                
                <div className="md:col-span-3">
                  <Card className="p-4 h-full">
                    {currentSignature ? (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{isEditing ? 'Edit Signature' : 'Signature Details'}</h3>
                          {!isEditing && (
                            <Button variant="outline" onClick={() => setIsEditing(true)}>
                              Edit
                            </Button>
                          )}
                        </div>
                        
                        {isEditing ? (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="signatureName">Signature Name</Label>
                              <Input
                                id="signatureName"
                                value={currentSignature.name}
                                onChange={(e) => setCurrentSignature({
                                  ...currentSignature,
                                  name: e.target.value
                                })}
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor="signatureContent">Signature Content</Label>
                              <Textarea
                                id="signatureContent"
                                value={currentSignature.content}
                                onChange={(e) => setCurrentSignature({
                                  ...currentSignature,
                                  content: e.target.value
                                })}
                                rows={8}
                              />
                            </div>
                            
                            <div className="pt-2 flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setIsEditing(false)}>
                                Cancel
                              </Button>
                              <Button onClick={saveSignature}>
                                Save Signature
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="p-4 border rounded-md whitespace-pre-line">
                              {currentSignature.content || <em className="text-muted-foreground">No content</em>}
                            </div>
                            
                            <div className="text-sm text-muted-foreground">
                              Last modified: {new Date(currentSignature.lastModified).toLocaleString()}
                            </div>
                            
                            <div className="pt-2">
                              <Button 
                                variant="outline"
                                onClick={() => {
                                  // Set as default signature
                                  setPreferences({
                                    ...preferences,
                                    defaultSignatureId: currentSignature.id
                                  });
                                  toast.success(`${currentSignature.name} set as default signature`);
                                  savePreferences();
                                }}
                              >
                                Set as Default
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-muted-foreground">Select a signature or create a new one</p>
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 