import express from 'express';
import serverless from 'serverless-http';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { v4 as uuidv4 } from 'uuid';

// Initialize environment variables
dotenv.config();

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app
const app = express();
app.use(express.json());

// In-memory storage for email accounts (replace with database in production)
const emailAccounts = [];

// CORS middleware for multiple frontend origins
app.use((req, res, next) => {
  const allowedOrigins = [
    'http://localhost:5173', 
    'http://localhost:5174',
    'http://localhost:3001', 
    'https://genieflowai.netlify.app'
  ];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Google OAuth2 configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

console.log('Email function initialized');
console.log('OAuth2 client configured with:');
console.log('- Redirect URI:', process.env.GOOGLE_REDIRECT_URI);

/**
 * Generate Google OAuth URL
 */
app.get('/api/email/google/auth-url', (req, res) => {
  const scopes = [
    'https://mail.google.com/',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });

  console.log('Generated Google auth URL:', url);
  res.json({ url });
});

/**
 * Handle Google OAuth callback
 */
app.get('/api/email/google/callback', handleGoogleOAuthCallback);

/**
 * Handle Google OAuth callback - alternative path for direct redirects
 */
app.get('/api/email/connect/success', handleGoogleOAuthCallback);

/**
 * Handler function for Google OAuth callbacks
 */
async function handleGoogleOAuthCallback(req, res) {
  const { code } = req.query;
  
  console.log('Google OAuth callback received with code');
  
  try {
    console.log('Exchanging code for tokens...');
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Get user info to identify the Gmail account
    console.log('Getting user info...');
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    console.log('User authenticated:', userInfo.data.email);
    
    const accountId = uuidv4();
    const newAccount = {
      id: accountId,
      userId: req.user?.id || 'anonymous', // Replace with actual user ID
      email: userInfo.data.email,
      name: userInfo.data.name,
      provider: 'gmail',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      connected: true,
      lastSynced: new Date(),
      createdAt: new Date()
    };
    
    emailAccounts.push(newAccount);
    console.log('Added new email account:', userInfo.data.email);
    
    // Get the origin from the request if available, otherwise use default
    const origin = req.headers.origin || process.env.FRONTEND_URL;
    // Support any port in 3000-3003 range as well as existing ports
    const frontendUrl = origin && (
      origin.includes('3000') || 
      origin.includes('3001') || 
      origin.includes('3002') || 
      origin.includes('3003') || 
      origin.includes('5173') || 
      origin.includes('5174') || 
      origin.includes('5175') || 
      origin.includes('5195') ||
      origin.includes('genieflowai.netlify.app')
    ) 
      ? origin 
      : process.env.FRONTEND_URL;
    
    console.log('Redirecting to:', `${frontendUrl}/email/connect/success?accountId=${accountId}`);
    
    // If we're already at the success page, don't redirect again
    if (req.path === '/api/email/connect/success') {
      res.json({ accountId, email: userInfo.data.email });
    } else {
      // Redirect to frontend success page
      res.redirect(`${frontendUrl}/email/connect/success?accountId=${accountId}`);
    }
  } catch (error) {
    console.error('Google OAuth error:', error);
    // Get the origin from the request if available, otherwise use default
    const origin = req.headers.origin || process.env.FRONTEND_URL;
    // Support any port in 3000-3003 range as well as existing ports
    const frontendUrl = origin && (
      origin.includes('3000') || 
      origin.includes('3001') || 
      origin.includes('3002') || 
      origin.includes('3003') || 
      origin.includes('5173') || 
      origin.includes('5174') || 
      origin.includes('5175') || 
      origin.includes('5195') ||
      origin.includes('genieflowai.netlify.app')
    ) 
      ? origin 
      : process.env.FRONTEND_URL;
    
    console.log('Redirecting to error page:', `${frontendUrl}/email/connect/error`);
    res.redirect(`${frontendUrl}/email/connect/error?message=${encodeURIComponent(error.message)}`);
  }
}

/**
 * Get user's email accounts
 */
app.get('/api/email/accounts', (req, res) => {
  const userId = req.user?.id || 'anonymous'; // Replace with actual user authentication
  const userAccounts = emailAccounts.filter(account => account.userId === userId);
  
  // Don't send sensitive data to client
  const safeAccounts = userAccounts.map(account => {
    const { credentials, ...safeAccount } = account;
    return safeAccount;
  });
  
  res.json({ accounts: safeAccounts });
});

/**
 * Get email folders
 */
app.get('/api/email/:accountId/folders', async (req, res) => {
  const { accountId } = req.params;
  const account = emailAccounts.find(acc => acc.id === accountId);
  
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  
  try {
    if (account.provider === 'gmail') {
      // Handle Gmail using Google API
      oauth2Client.setCredentials({
        access_token: account.accessToken,
        refresh_token: account.refreshToken
      });
      
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const response = await gmail.users.labels.list({ userId: 'me' });
      
      const folders = response.data.labels.map(label => ({
        id: label.id,
        name: label.name,
        type: label.type,
        totalMessages: 0,
        unreadMessages: 0
      }));
      
      res.json({ folders });
    } else {
      res.status(400).json({ error: 'Unsupported email provider' });
    }
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get messages from a folder
 */
app.get('/api/email/:accountId/messages', async (req, res) => {
  const { accountId } = req.params;
  const { folderId, limit = 20, offset = 0 } = req.query;
  
  const account = emailAccounts.find(acc => acc.id === accountId);
  
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  
  if (!folderId) {
    return res.status(400).json({ error: 'Folder ID is required' });
  }
  
  try {
    let messages = [];
    
    if (account.provider === 'gmail') {
      // Handle Gmail using Google API
      oauth2Client.setCredentials({
        access_token: account.accessToken,
        refresh_token: account.refreshToken
      });
      
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      // Get messages list
      const messageList = await gmail.users.messages.list({
        userId: 'me',
        labelIds: [folderId],
        maxResults: parseInt(limit),
        pageToken: offset ? String(offset) : undefined
      });
      
      // Get full message details
      const messagePromises = messageList.data.messages.map(async (msg) => {
        const message = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full'
        });
        
        // Parse Gmail message to common format
        const headers = message.data.payload.headers;
        const getHeader = (name) => {
          const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
          return header ? header.value : '';
        };
        
        return {
          id: message.data.id,
          threadId: message.data.threadId,
          labelIds: message.data.labelIds || [],
          snippet: message.data.snippet,
          historyId: message.data.historyId,
          internalDate: message.data.internalDate,
          subject: getHeader('subject'),
          from: getHeader('from'),
          to: getHeader('to'),
          date: getHeader('date'),
          read: !message.data.labelIds.includes('UNREAD'),
          starred: message.data.labelIds.includes('STARRED'),
          body: message.data.payload.body.data 
            ? Buffer.from(message.data.payload.body.data, 'base64').toString('utf8')
            : ''
        };
      });
      
      messages = await Promise.all(messagePromises);
    } else {
      return res.status(400).json({ error: 'Unsupported email provider' });
    }
    
    res.json({ 
      messages,
      nextPageToken: messages.length === parseInt(limit) ? String(parseInt(offset) + parseInt(limit)) : null
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Send an email
 */
app.post('/api/email/:accountId/send', async (req, res) => {
  const { accountId } = req.params;
  const { to, subject, body, cc, bcc, attachments } = req.body;
  
  const account = emailAccounts.find(acc => acc.id === accountId);
  
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  
  try {
    if (account.provider === 'gmail') {
      // Handle Gmail using Google API
      oauth2Client.setCredentials({
        access_token: account.accessToken,
        refresh_token: account.refreshToken
      });
      
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      // Create the email content
      const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
      const messageParts = [
        `From: ${account.name} <${account.email}>`,
        `To: ${to}`,
        `Subject: ${utf8Subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        'Content-Transfer-Encoding: 7bit',
        '',
        body,
      ];
      const message = messageParts.join('\n');
      
      // The body needs to be base64url encoded
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      
      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });
      
      res.json({ 
        success: true,
        messageId: result.data.id
      });
    } else {
      res.status(400).json({ error: 'Unsupported email provider' });
    }
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Remove an email account
 */
app.delete('/api/email/accounts/:accountId', (req, res) => {
  const { accountId } = req.params;
  const accountIndex = emailAccounts.findIndex(acc => acc.id === accountId);
  
  if (accountIndex === -1) {
    return res.status(404).json({ error: 'Account not found' });
  }
  
  // Remove the account
  emailAccounts.splice(accountIndex, 1);
  
  res.json({ success: true });
});

// Export the serverless handler
export const handler = serverless(app); 