import React, { useState, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Link, 
  Paperclip, 
  Trash2, 
  Send,
  Sparkles,
  X
} from 'lucide-react';
import { useEmail } from '../../contexts/EmailContext';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { EmailDraft } from '../../services/email/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

interface EmailComposerProps {
  isOpen: boolean;
  onClose: () => void;
  replyTo?: {
    messageId: string;
    subject: string;
    to: string;
    body: string;
  };
  forwardFrom?: {
    messageId: string;
    subject: string;
    body: string;
  };
  draft?: EmailDraft;
  onSend?: (draft: EmailDraft) => void;
  onSaveDraft?: (draft: EmailDraft) => void;
}

export function EmailComposer({
  isOpen,
  onClose,
  replyTo,
  forwardFrom,
  draft,
  onSend,
  onSaveDraft
}: EmailComposerProps) {
  const { selectedAccountId, accounts } = useEmail();
  
  // Find the current account email address
  const accountEmail = accounts.find(acc => acc.id === selectedAccountId)?.email || '';
  
  // Initialize state with draft, reply or forward data if provided
  const [to, setTo] = useState<string>(
    replyTo ? replyTo.to : (draft?.to || []).join(', ') || ''
  );
  const [cc, setCc] = useState<string>((draft?.cc || []).join(', ') || '');
  const [bcc, setBcc] = useState<string>((draft?.bcc || []).join(', ') || '');
  const [subject, setSubject] = useState<string>(
    replyTo 
      ? `Re: ${replyTo.subject}` 
      : forwardFrom 
        ? `Fwd: ${forwardFrom.subject}`
        : draft?.subject || ''
  );
  
  // Start with reply/forward content if applicable
  const initialBody = replyTo 
    ? `\n\n-------- Original Message --------\nFrom: ${replyTo.to}\n\n${replyTo.body}`
    : forwardFrom
      ? `\n\n-------- Forwarded Message --------\n\n${forwardFrom.body}`
      : draft?.body || '';
  
  const [body, setBody] = useState<string>(initialBody);
  const [htmlMode, setHtmlMode] = useState<boolean>(true);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState<boolean>(false);
  const [showCc, setShowCc] = useState<boolean>(!!cc);
  const [showBcc, setShowBcc] = useState<boolean>(!!bcc);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Handle formatting actions
  const applyFormatting = (format: string) => {
    if (!bodyTextareaRef.current) return;
    
    const textarea = bodyTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end);
    
    let formattedText = '';
    let cursorAdjustment = 0;
    
    switch (format) {
      case 'bold':
        formattedText = `<strong>${selectedText}</strong>`;
        cursorAdjustment = 17; // Length of opening and closing tags
        break;
      case 'italic':
        formattedText = `<em>${selectedText}</em>`;
        cursorAdjustment = 9;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        cursorAdjustment = 7;
        break;
      case 'bullet-list':
        formattedText = `<ul>\n  <li>${selectedText}</li>\n</ul>`;
        cursorAdjustment = 14;
        break;
      case 'ordered-list':
        formattedText = `<ol>\n  <li>${selectedText}</li>\n</ol>`;
        cursorAdjustment = 14;
        break;
      case 'align-left':
        formattedText = `<div style="text-align: left;">${selectedText}</div>`;
        cursorAdjustment = 36;
        break;
      case 'align-center':
        formattedText = `<div style="text-align: center;">${selectedText}</div>`;
        cursorAdjustment = 38;
        break;
      case 'align-right':
        formattedText = `<div style="text-align: right;">${selectedText}</div>`;
        cursorAdjustment = 37;
        break;
      case 'link':
        const url = prompt('Enter URL:', 'https://');
        if (url) {
          formattedText = `<a href="${url}">${selectedText || url}</a>`;
          cursorAdjustment = 15 + url.length;
        } else {
          return;
        }
        break;
      default:
        return;
    }
    
    const newText = body.substring(0, start) + formattedText + body.substring(end);
    setBody(newText);
    
    // Set cursor position after the formatting is applied
    setTimeout(() => {
      textarea.focus();
      const newPosition = end + cursorAdjustment;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };
  
  // Handle file uploads
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    // Simulate file upload processing
    setTimeout(() => {
      setAttachments(prev => [...prev, ...Array.from(files)]);
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 1000);
  };
  
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  // Handle sending email
  const handleSendEmail = () => {
    // Basic validation
    if (!to.trim()) {
      toast.error('Please specify at least one recipient');
      return;
    }
    
    if (!subject.trim()) {
      const confirm = window.confirm('Send email without subject?');
      if (!confirm) return;
    }
    
    setIsSending(true);
    
    // Create email draft object
    const emailDraft: EmailDraft = {
      id: draft?.id || uuidv4(),
      accountId: selectedAccountId || 'default-account',
      to: to.split(',').map(email => email.trim()),
      subject: subject.trim(),
      body: body,
      lastModified: new Date()
    };
    
    if (cc.trim()) {
      emailDraft.cc = cc.split(',').map(email => email.trim());
    }
    
    if (bcc.trim()) {
      emailDraft.bcc = bcc.split(',').map(email => email.trim());
    }
    
    if (replyTo?.messageId) {
      emailDraft.inReplyTo = replyTo.messageId;
    }
    
    // Simulate email sending
    setTimeout(() => {
      setIsSending(false);
      if (onSend) {
        onSend(emailDraft);
      }
      toast.success('Email sent successfully');
      onClose();
    }, 1500);
  };
  
  // Save draft
  const handleSaveDraft = () => {
    const emailDraft: EmailDraft = {
      id: draft?.id || uuidv4(),
      accountId: selectedAccountId || 'default-account',
      to: to.split(',').map(email => email.trim()),
      subject: subject.trim(),
      body: body,
      lastModified: new Date()
    };
    
    if (cc.trim()) {
      emailDraft.cc = cc.split(',').map(email => email.trim());
    }
    
    if (bcc.trim()) {
      emailDraft.bcc = bcc.split(',').map(email => email.trim());
    }
    
    if (onSaveDraft) {
      onSaveDraft(emailDraft);
    }
    
    toast.success('Draft saved');
  };
  
  // Generate AI suggestion
  const generateAiSuggestion = () => {
    setIsGeneratingSuggestion(true);
    
    // Simulate AI processing
    setTimeout(() => {
      const context = subject + " " + (body.substring(0, 100));
      let suggestion = '';
      
      if (context.toLowerCase().includes('meeting')) {
        suggestion = "I'm available to meet on Tuesday or Wednesday afternoon. Let me know what works best for your schedule.";
      } else if (context.toLowerCase().includes('proposal')) {
        suggestion = "Thank you for considering our proposal. I've attached additional information that might help address your questions.";
      } else if (context.toLowerCase().includes('question')) {
        suggestion = "That's a great question. Based on our previous discussions, I believe the best approach would be to...";
      } else {
        suggestion = "Thank you for your email. I'll review this information and get back to you shortly with my thoughts.";
      }
      
      setAiSuggestion(suggestion);
      setIsGeneratingSuggestion(false);
    }, 1500);
  };
  
  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    setBody(prev => prev + "\n\n" + aiSuggestion);
    setAiSuggestion(null);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-2">
          {/* Email header fields */}
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="w-16 text-sm">From:</span>
              <Input value={accountEmail} readOnly className="bg-muted/50" />
            </div>
            
            <div className="flex items-center">
              <span className="w-16 text-sm">To:</span>
              <div className="flex-1">
                <Input 
                  value={to} 
                  onChange={e => setTo(e.target.value)} 
                  placeholder="Recipients (comma separated)"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-end text-sm">
              <button 
                onClick={() => setShowCc(!showCc)} 
                className="text-muted-foreground hover:text-foreground mr-3"
              >
                {showCc ? 'Hide Cc' : 'Show Cc'}
              </button>
              <button 
                onClick={() => setShowBcc(!showBcc)} 
                className="text-muted-foreground hover:text-foreground"
              >
                {showBcc ? 'Hide Bcc' : 'Show Bcc'}
              </button>
            </div>
            
            {showCc && (
              <div className="flex items-center">
                <span className="w-16 text-sm">Cc:</span>
                <Input 
                  value={cc} 
                  onChange={e => setCc(e.target.value)} 
                  placeholder="Cc recipients (comma separated)"
                />
              </div>
            )}
            
            {showBcc && (
              <div className="flex items-center">
                <span className="w-16 text-sm">Bcc:</span>
                <Input 
                  value={bcc} 
                  onChange={e => setBcc(e.target.value)} 
                  placeholder="Bcc recipients (comma separated)"
                />
              </div>
            )}
            
            <div className="flex items-center">
              <span className="w-16 text-sm">Subject:</span>
              <Input 
                value={subject} 
                onChange={e => setSubject(e.target.value)} 
                placeholder="Subject"
              />
            </div>
            
            <div className="h-px bg-border my-2"></div>
            
            {/* Formatting toolbar */}
            <div className="flex items-center flex-wrap gap-1 p-1 bg-muted/40 rounded-md">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => applyFormatting('bold')}
                className="h-8 w-8 p-0"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => applyFormatting('italic')}
                className="h-8 w-8 p-0"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => applyFormatting('underline')}
                className="h-8 w-8 p-0"
              >
                <Underline className="h-4 w-4" />
              </Button>
              <span className="mx-1 h-6 w-px bg-border"></span>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => applyFormatting('bullet-list')}
                className="h-8 w-8 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => applyFormatting('ordered-list')}
                className="h-8 w-8 p-0"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
              <span className="mx-1 h-6 w-px bg-border"></span>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => applyFormatting('align-left')}
                className="h-8 w-8 p-0"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => applyFormatting('align-center')}
                className="h-8 w-8 p-0"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => applyFormatting('align-right')}
                className="h-8 w-8 p-0"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
              <span className="mx-1 h-6 w-px bg-border"></span>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={() => applyFormatting('link')}
                className="h-8 w-8 p-0"
              >
                <Link className="h-4 w-4" />
              </Button>
              <div className="flex-1"></div>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => setHtmlMode(!htmlMode)}
                className="text-xs"
              >
                {htmlMode ? 'Plain Text' : 'HTML'}
              </Button>
            </div>
            
            {/* Email body */}
            <Textarea 
              ref={bodyTextareaRef}
              value={body} 
              onChange={e => setBody(e.target.value)} 
              placeholder="Write your message here..."
              className="min-h-[200px] font-sans"
            />
            
            {/* AI suggestion */}
            {aiSuggestion && (
              <Card className="p-3 bg-primary/5 border-primary/20">
                <div className="flex items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <Sparkles className="h-4 w-4 text-primary mr-2" />
                      <span className="text-sm font-medium">AI Suggestion</span>
                    </div>
                    <p className="text-sm">{aiSuggestion}</p>
                  </div>
                  <div className="flex items-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setAiSuggestion(null)}
                      className="h-8 w-8 p-0 mr-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={applyAiSuggestion}
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Attachments section */}
            {(attachments.length > 0 || isUploading) && (
              <div className="border rounded-md p-3 mt-4">
                <h3 className="text-sm font-medium mb-2">Attachments</h3>
                {isUploading && (
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <Spinner className="h-4 w-4 mr-2" />
                    Uploading...
                  </div>
                )}
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                      <div className="flex items-center">
                        <Paperclip className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[300px]">{file.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {(file.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              multiple 
            />
          </div>
        </div>
        
        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleFileSelect}
              disabled={isUploading}
            >
              <Paperclip className="h-4 w-4 mr-2" />
              Attach
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={generateAiSuggestion}
              disabled={isGeneratingSuggestion}
              className="ml-2"
            >
              {isGeneratingSuggestion ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  AI Suggest
                </>
              )}
            </Button>
          </div>
          <div>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleSaveDraft} 
              className="mr-2"
            >
              Save Draft
            </Button>
            <Button 
              type="button"
              onClick={handleSendEmail}
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 