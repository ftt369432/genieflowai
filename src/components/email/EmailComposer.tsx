import React, { useState, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
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
  X,
  Book,
  Loader2
} from 'lucide-react';
import { useEmail } from '../../contexts/EmailContext';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { EmailDraft } from '../../services/email/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { EmailKnowledgeBase } from './EmailKnowledgeBase';

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
  const [showKnowledgeBase, setShowKnowledgeBase] = useState(false);
  
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
  
  const handleInsertFromKnowledgeBase = (content: string) => {
    setBody(prev => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        // Get the current selection
        const range = selection.getRangeAt(0);
        // Check if the selection is within our editor
        const container = document.getElementById('email-body');
        if (container && container.contains(range.commonAncestorContainer)) {
          // Get positions
          const selectionStart = range.startOffset;
          const selectionEnd = range.endOffset;
          const textNode = range.startContainer;
          if (textNode.nodeType === Node.TEXT_NODE) {
            const text = textNode.textContent || '';
            const beforeSelection = text.substring(0, selectionStart);
            const afterSelection = text.substring(selectionEnd);
            return beforeSelection + content + afterSelection;
          }
        }
      }
      
      // Fallback: just append to the end
      return prev + '\n\n' + content;
    });
  };
  
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      modal={true}
    >
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            {getDialogDescription()}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-4">
          {/* Recipients */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="to">To</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCc(!showCc)}
                  className="text-xs text-blue-500 hover:underline"
                >
                  {showCc ? 'Hide Cc' : 'Cc'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBcc(!showBcc)}
                  className="text-xs text-blue-500 hover:underline"
                >
                  {showBcc ? 'Hide Bcc' : 'Bcc'}
                </button>
              </div>
            </div>
            <Input 
              id="to" 
              placeholder="recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          
          {/* Cc */}
          {showCc && (
            <div className="space-y-2">
              <Label htmlFor="cc">Cc</Label>
              <Input 
                id="cc" 
                placeholder="cc@example.com"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
              />
            </div>
          )}
          
          {/* Bcc */}
          {showBcc && (
            <div className="space-y-2">
              <Label htmlFor="bcc">Bcc</Label>
              <Input 
                id="bcc" 
                placeholder="bcc@example.com"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
              />
            </div>
          )}
          
          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input 
              id="subject" 
              placeholder="Email subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          
          {/* Body */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="body">Message</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowKnowledgeBase(!showKnowledgeBase)}
              >
                <Book className="h-4 w-4 mr-2" />
                {showKnowledgeBase ? 'Hide Knowledge Base' : 'Knowledge Base'}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {showKnowledgeBase && (
                <EmailKnowledgeBase onInsertContent={handleInsertFromKnowledgeBase} />
              )}
              
              <Textarea 
                id="email-body"
                placeholder="Write your message here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[200px]"
              />
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            {onSaveDraft && (
              <Button 
                variant="outline" 
                type="button" 
                onClick={handleSaveDraft}
                disabled={isSending}
              >
                Save Draft
              </Button>
            )}
            <Button 
              variant="ghost" 
              type="button" 
              onClick={onClose}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleSendEmail}
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : 'Send Email'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 