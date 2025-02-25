import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
const db = client.db('your_database_name');

export const saveTrainingData = async (agentId, trainingData) => {
    // Logic to save training data to the database
    await db.collection('trainingData').insertOne({ agentId, ...trainingData });
}; 