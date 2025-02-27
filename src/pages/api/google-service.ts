import { NextApiRequest, NextApiResponse } from 'next';
import { MockGoogleClient } from '../../services/google/MockGoogleClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = MockGoogleClient.getInstance();
    await client.initialize();

    const result = await client.request({
      path: req.body.path,
      method: req.body.method,
      params: req.body.params
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Google API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
} 