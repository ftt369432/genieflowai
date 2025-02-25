import express from 'express';
import { saveTrainingData } from '../services/trainingDataService';

const router = express.Router();

router.post('/train', async (req, res) => {
    const { agentId, trainingData } = req.body;
    try {
        await saveTrainingData(agentId, trainingData);
        res.status(200).send({ message: 'Training data saved successfully.' });
    } catch (error) {
        res.status(500).send({ error: 'Failed to save training data.' });
    }
});

export default router; 