import express from 'express';

const router = express.Router();

// Simplified feedback endpoint
router.post('/feedback', (req, res) => {
  const { feedback } = req.body;
  console.log('Received feedback:', feedback);
  res.json({ success: true, message: 'Feedback received' });
});

export default router; 