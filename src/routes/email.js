import express from 'express';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const router = express.Router();

// Google OAuth2 configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

console.log('Email routes initialized');
console.log('OAuth2 client configured with:');
console.log('- Redirect URI:', process.env.GOOGLE_REDIRECT_URI);

// In-memory storage for email accounts (replace with database in production)
const emailAccounts = [];

/**
 * Generate Google OAuth URL - This API route is used by the server-side flow
 * The front-end should use Supabase Auth for client-side OAuth flow
 */
router.get('/email/google/auth-url', (req, res) => {
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
router.get('/email/google/callback', handleGoogleOAuthCallback);

/**
 * Handle Google OAuth callback - alternative path for direct redirects
 */
router.get('/email/connect/success', handleGoogleOAuthCallback);

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
    
    // Check if this email already exists in accounts and update it instead
    const existingIndex = emailAccounts.findIndex(acc => acc.email === userInfo.data.email);
    if (existingIndex >= 0) {
      // Update existing account with new tokens
      emailAccounts[existingIndex] = {
        ...emailAccounts[existingIndex],
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        connected: true,
        lastSynced: new Date()
      };
      console.log('Updated existing email account:', userInfo.data.email);
    } else {
      // Add new account
      emailAccounts.push(newAccount);
      console.log('Added new email account:', userInfo.data.email);
    }
    
    // Store the tokens in cookies for frontend access
    // In production, use secure, httpOnly cookies and proper session management
    if (process.env.NODE_ENV !== 'production') {
      res.cookie('gmail_access_token', tokens.access_token, { maxAge: 3600000 });
      res.cookie('gmail_refresh_token', tokens.refresh_token, { maxAge: 86400000 * 30 });
      res.cookie('gmail_email', userInfo.data.email, { maxAge: 86400000 * 30 });
    }
    
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
      origin.includes('5195')
    ) 
      ? origin 
      : process.env.FRONTEND_URL;
    
    console.log('Redirecting to:', `${frontendUrl}/email/connect/success?accountId=${accountId}`);
    
    // If we're already at the success page, don't redirect again
    if (req.path === '/email/connect/success') {
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
      origin.includes('5195')
    ) 
      ? origin 
      : process.env.FRONTEND_URL;
    
    console.log('Redirecting to error page:', `${frontendUrl}/email/connect/error`);
    res.redirect(`${frontendUrl}/email/connect/error?message=${encodeURIComponent(error.message)}`);
  }
}

/**
 * Connect IMAP account
 */
router.post('/email/connect', async (req, res) => {
  const { email, password, imapHost, imapPort, smtpHost, smtpPort, useSSL } = req.body;
  
  // Validate required fields
  if (!email || !password || !imapHost || !imapPort || !smtpHost || !smtpPort) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    // Test IMAP connection
    const imap = new Imap({
      user: email,
      password: password,
      host: imapHost,
      port: imapPort,
      tls: useSSL,
      tlsOptions: { rejectUnauthorized: false }
    });
    
    const connectPromise = new Promise((resolve, reject) => {
      imap.once('ready', () => {
        imap.end();
        resolve();
      });
      
      imap.once('error', (err) => {
        reject(new Error(`IMAP connection failed: ${err.message}`));
      });
      
      imap.connect();
    });
    
    await connectPromise;
    
    // Test SMTP connection
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: email,
        pass: password,
      },
    });
    
    await transporter.verify();
    
    // Store account info
    const accountId = uuidv4();
    const newAccount = {
      id: accountId,
      userId: req.user?.id || 'anonymous', // Replace with actual user ID
      email,
      provider: 'imap',
      imapConfig: {
        host: imapHost,
        port: imapPort,
        useSSL
      },
      smtpConfig: {
        host: smtpHost,
        port: smtpPort,
        useSSL
      },
      credentials: {
        password // Note: In production, encrypt this!
      },
      connected: true,
      lastSynced: new Date(),
      createdAt: new Date()
    };
    
    emailAccounts.push(newAccount);
    
    res.status(200).json({
      accountId,
      email,
      connected: true
    });
  } catch (error) {
    console.error('IMAP/SMTP connection error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get user's email accounts
 */
router.get('/email/accounts', (req, res) => {
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
router.get('/email/:accountId/folders', async (req, res) => {
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
    } else if (account.provider === 'imap') {
      // Handle IMAP
      const imap = new Imap({
        user: account.email,
        password: account.credentials.password,
        host: account.imapConfig.host,
        port: account.imapConfig.port,
        tls: account.imapConfig.useSSL,
        tlsOptions: { rejectUnauthorized: false }
      });
      
      const getFoldersPromise = new Promise((resolve, reject) => {
        imap.once('ready', () => {
          imap.getBoxes((err, boxes) => {
            imap.end();
            if (err) reject(err);
            else resolve(boxes);
          });
        });
        
        imap.once('error', (err) => {
          reject(new Error(`IMAP connection failed: ${err.message}`));
        });
        
        imap.connect();
      });
      
      const mailboxes = await getFoldersPromise;
      
      // Convert to folders array
      const folders = [];
      function processBoxes(boxesObj, path = '') {
        Object.entries(boxesObj).forEach(([name, box]) => {
          const folderPath = path ? `${path}/${name}` : name;
          folders.push({
            id: folderPath,
            name: name,
            path: folderPath,
            delimiter: box.delimiter,
            type: name.toLowerCase() === 'inbox' ? 'system' : 'custom',
            attributes: box.attribs || []
          });
          
          if (box.children) {
            processBoxes(box.children, folderPath);
          }
        });
      }
      
      processBoxes(mailboxes);
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
router.get('/email/:accountId/messages', async (req, res) => {
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
    } else if (account.provider === 'imap') {
      // Handle IMAP
      const imap = new Imap({
        user: account.email,
        password: account.credentials.password,
        host: account.imapConfig.host,
        port: account.imapConfig.port,
        tls: account.imapConfig.useSSL,
        tlsOptions: { rejectUnauthorized: false }
      });
      
      const getMessagesPromise = new Promise((resolve, reject) => {
        const messages = [];
        
        imap.once('ready', () => {
          imap.openBox(folderId, false, (err, box) => {
            if (err) {
              imap.end();
              return reject(err);
            }
            
            // Calculate which messages to fetch
            const total = box.messages.total;
            const from = Math.max(total - offset - parseInt(limit), 1);
            const to = Math.max(total - offset, 1);
            
            if (total === 0 || from > total) {
              imap.end();
              return resolve([]);
            }
            
            const f = imap.seq.fetch(`${from}:${to}`, {
              bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
              struct: true
            });
            
            f.on('message', (msg, seqno) => {
              const message = {
                id: seqno,
                from: '',
                to: '',
                subject: '',
                date: '',
                body: ''
              };
              
              msg.on('body', (stream, info) => {
                let buffer = '';
                stream.on('data', (chunk) => {
                  buffer += chunk.toString('utf8');
                });
                
                stream.once('end', () => {
                  if (info.which.includes('HEADER')) {
                    const parsed = Imap.parseHeader(buffer);
                    message.from = parsed.from ? parsed.from[0] : '';
                    message.to = parsed.to ? parsed.to[0] : '';
                    message.subject = parsed.subject ? parsed.subject[0] : '';
                    message.date = parsed.date ? parsed.date[0] : '';
                  } else {
                    message.body = buffer;
                  }
                });
              });
              
              msg.once('attributes', (attrs) => {
                message.flags = attrs.flags;
                message.read = attrs.flags.includes('\\Seen');
                message.starred = attrs.flags.includes('\\Flagged');
              });
              
              msg.once('end', () => {
                messages.push(message);
              });
            });
            
            f.once('error', (err) => {
              reject(err);
            });
            
            f.once('end', () => {
              imap.end();
              resolve(messages);
            });
          });
        });
        
        imap.once('error', (err) => {
          reject(new Error(`IMAP connection failed: ${err.message}`));
        });
        
        imap.connect();
      });
      
      messages = await getMessagesPromise;
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
router.post('/email/:accountId/send', async (req, res) => {
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
    } else if (account.provider === 'imap') {
      // Use SMTP for sending
      const transporter = nodemailer.createTransport({
        host: account.smtpConfig.host,
        port: account.smtpConfig.port,
        secure: account.smtpConfig.port === 465,
        auth: {
          user: account.email,
          pass: account.credentials.password,
        },
      });
      
      // Send mail with defined transport object
      const info = await transporter.sendMail({
        from: `"${account.name || 'User'}" <${account.email}>`,
        to,
        cc,
        bcc,
        subject,
        html: body,
        attachments: attachments || []
      });
      
      res.json({ 
        success: true,
        messageId: info.messageId
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
router.delete('/email/accounts/:accountId', (req, res) => {
  const { accountId } = req.params;
  const accountIndex = emailAccounts.findIndex(acc => acc.id === accountId);
  
  if (accountIndex === -1) {
    return res.status(404).json({ error: 'Account not found' });
  }
  
  // Remove the account
  emailAccounts.splice(accountIndex, 1);
  
  res.json({ success: true });
});

export default router; 