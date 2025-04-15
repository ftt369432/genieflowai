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

// Simplified version without the dependency on trainingDataService
app.post('/api/train', (req, res) => {
  res.json({ success: true, message: 'Training endpoint placeholder' });
});

app.get('/api/train/status', (req, res) => {
  res.json({ status: 'idle', message: 'No training in progress' });
});

// Export the serverless handler
export const handler = serverless(app); 