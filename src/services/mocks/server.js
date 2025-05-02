/**
 * Mock Google API Server
 * 
 * This server provides mock implementations of Google APIs for development purposes
 * It runs in a Docker container and responds to requests from the main application
 */

import express from 'express';
import cors from 'cors';
import GoogleApiMock from './GoogleApiMock';

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for all requests
app.use(cors());
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mock Google API server is running' });
});

// Mock Google OAuth endpoints
app.post('/auth/token', (req, res) => {
  res.json({
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_in: 3600,
    token_type: "Bearer"
  });
});

// Mock Gmail API endpoints
app.get('/gmail/v1/users/me/messages', (req, res) => {
  const maxResults = parseInt(req.query.maxResults || '10');
  const messages = GoogleApiMock.getMessages(maxResults)
    .map(msg => ({ id: msg.id, threadId: msg.threadId }));
  
  res.json({
    messages,
    nextPageToken: null,
    resultSizeEstimate: messages.length
  });
});

// Get a specific Gmail message
app.get('/gmail/v1/users/me/messages/:id', (req, res) => {
  const messageId = req.params.id;
  const allMessages = GoogleApiMock.getMessages(20);
  const message = allMessages.find(msg => msg.id === messageId) || allMessages[0];
  
  // Override the id to match the requested id
  message.id = messageId;
  
  res.json(message);
});

// Mock Calendar API endpoints
app.get('/calendar/v3/users/me/calendarList', (req, res) => {
  res.json(GoogleApiMock.getCalendarList());
});

// Get calendar events
app.get('/calendar/v3/calendars/:calendarId/events', (req, res) => {
  const maxResults = parseInt(req.query.maxResults || '10');
  const events = GoogleApiMock.getCalendarEvents(maxResults);
  
  res.json({
    kind: "calendar#events",
    etag: `"mock-etag-${Date.now()}"`,
    summary: req.params.calendarId === 'primary' ? 'Primary Calendar' : req.params.calendarId,
    updated: new Date().toISOString(),
    timeZone: "America/Los_Angeles",
    accessRole: "owner",
    items: events
  });
});

// User profile info
app.get('/oauth2/v2/userinfo', (req, res) => {
  res.json(GoogleApiMock.getUserProfile());
});

// Start the server
app.listen(port, () => {
  console.log(`Mock Google API server listening at http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log('- /health (GET)');
  console.log('- /auth/token (POST)');
  console.log('- /gmail/v1/users/me/messages (GET)');
  console.log('- /gmail/v1/users/me/messages/:id (GET)');
  console.log('- /calendar/v3/users/me/calendarList (GET)');
  console.log('- /calendar/v3/calendars/:calendarId/events (GET)');
  console.log('- /oauth2/v2/userinfo (GET)');
});