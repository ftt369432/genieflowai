import React from 'react';
import TestStatus from '../components/TestStatus';

export default function Home() {
  return (
    <div>
      <div className="container mx-auto p-4 mt-8">
        <h2 className="text-2xl font-bold mb-4">System Status</h2>
        <TestStatus />
      </div>
    </div>
  );
} 