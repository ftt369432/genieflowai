import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

export const saveFeedback = async (agentId, response, feedback) => {
    await axios.post(`${apiUrl}/feedback`, { agentId, response, feedback });
};