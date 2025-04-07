import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Import route modules
// Dynamically import routes
const trainRoutes = await import('./routes/train.js').then(m => m.default);
const feedbackRoutes = await import('./routes/feedback.js').then(m => m.default);
const emailRoutes = await import('./routes/email.js').then(m => m.default);

console.log('Starting server...');
console.log('Environment variables:');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Configured' : 'Missing');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Configured' : 'Missing');
console.log('GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI);
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);

const app = express();
app.use(express.json()); // Middleware to parse JSON requests

app.use('/api', trainRoutes); // Use the train routes
app.use('/api', feedbackRoutes); // Use the feedback routes
app.use('/api', emailRoutes); // Use the email routes

// Add CORS middleware for multiple frontend origins
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5195', 'http://localhost:5196'];
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

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API endpoint: http://localhost:${PORT}/api`);
    console.log(`Google auth URL endpoint: http://localhost:${PORT}/api/email/google/auth-url`);
}); 