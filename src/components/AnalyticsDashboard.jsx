import React from 'react';
import { useAgentStore } from '../../store/agentStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import AIChat from './AIChat';

const AnalyticsDashboard = () => {
    const { agents } = useAgentStore();

    return (
        <div>
            <h2>Analytics Dashboard</h2>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
            </ResponsiveContainer>
            {/* Display metrics and performance data */}
            {agents.map(agent => (
                <div key={agent.id}>
                    <h3>{agent.name}</h3>
                    <p>Task Completion Rate: {agent.performanceMetrics.taskCompletionRate}%</p>
                    <p>Average Response Time: {agent.performanceMetrics.responseTime}ms</p>
                    <p>Feedback: {agent.performanceMetrics.feedback.join(', ')}</p>
                    <p>Training Data: {agent.trainingData.length} entries</p>
                </div>
            ))}
            <AIChat />
        </div>
    );
};

export default AnalyticsDashboard; 