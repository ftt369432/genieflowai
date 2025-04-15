import express from 'express';
import serverless from 'serverless-http';

const app = express();
app.use(express.json());

// CORS middleware
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

// Simplified feedback endpoint
app.post('/api/feedback', (req, res) => {
  const { feedback } = req.body;
  console.log('Received feedback:', feedback);
  res.json({ success: true, message: 'Feedback received' });
});

// Export the serverless handler
export const handler = serverless(app); 