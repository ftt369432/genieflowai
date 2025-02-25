import express from 'express';
import { saveFeedback } from '../services/feedbackService';

const router = express.Router();

router.post('/feedback', async (req, res) => {
    const { agentId, response, feedback } = req.body;
    try {
        await saveFeedback(agentId, response, feedback);
        res.status(200).send({ message: 'Feedback saved successfully.' });
    } catch (error) {
        console.error('Error saving feedback:', error); // Log the error
        res.status(500).send({ error: 'Failed to save feedback.' });
    }
});

export default router; 