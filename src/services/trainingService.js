import axios from 'axios';

export const trainAgent = async (agentId, trainingData) => {
    // Logic to send training data to the AI provider or store it for future training
    const response = await axios.post('/api/train', {
        agentId,
        trainingData,
    });
    return response.data;
}; 