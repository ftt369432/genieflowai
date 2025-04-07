import express from 'express';

const router = express.Router();

// Simplified version without the dependency on trainingDataService
router.post('/train', (req, res) => {
  res.json({ success: true, message: 'Training endpoint placeholder' });
});

router.get('/train/status', (req, res) => {
  res.json({ status: 'idle', message: 'No training in progress' });
});

export default router; 