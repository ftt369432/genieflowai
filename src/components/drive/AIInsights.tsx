import React from 'react';
import { Brain, MessageSquare, Tag, TrendingUp } from 'lucide-react';
import type { DriveDocument } from '../../types/drive';

interface AIInsightsProps {
  document: DriveDocument;
}

export function AIInsights({ document }: AIInsightsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
        AI Insights
      </h2>

      <div className="space-y-6">
        <div>
          <h3 className="flex items-center text-sm font-medium text-gray-900 dark:text-white mb-2">
            <Brain size={16} className="mr-2" />
            Key Points
          </h3>
          <ul className="space-y-2">
            {document.insights.keyPoints.map((point, index) => (
              <li
                key={index}
                className="text-sm text-gray-600 dark:text-gray-300 flex items-start"
              >
                <span className="mr-2">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="flex items-center text-sm font-medium text-gray-900 dark:text-white mb-2">
            <Tag size={16} className="mr-2" />
            Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {document.insights.topics.map((topic, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3 className="flex items-center text-sm font-medium text-gray-900 dark:text-white mb-2">
            <MessageSquare size={16} className="mr-2" />
            Sentiment
          </h3>
          <div className="flex items-center">
            <span className={`px-2 py-1 text-xs rounded-full ${
              document.insights.sentiment === 'positive'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : document.insights.sentiment === 'negative'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
              {document.insights.sentiment.charAt(0).toUpperCase() + document.insights.sentiment.slice(1)}
            </span>
          </div>
        </div>

        <div>
          <h3 className="flex items-center text-sm font-medium text-gray-900 dark:text-white mb-2">
            <TrendingUp size={16} className="mr-2" />
            Entities
          </h3>
          <div className="space-y-2">
            {document.insights.entities.map((entity, index) => (
              <div
                key={index}
                className="text-sm text-gray-600 dark:text-gray-300"
              >
                {entity}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}