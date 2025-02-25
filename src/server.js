import express from 'express';
import trainRoutes from './routes/train';
import feedbackRoutes from './routes/feedback';

const app = express();
app.use(express.json()); // Middleware to parse JSON requests

app.use('/api', trainRoutes); // Use the train routes
app.use('/api', feedbackRoutes); // Use the feedback routes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 