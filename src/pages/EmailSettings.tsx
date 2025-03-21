import React from 'react';
import { EmailServiceDemo } from '../components/email/EmailServiceDemo';
import { EmailTest } from '../components/email/EmailTest';
import { EmailAccountConnect } from '../components/email/EmailAccountConnect';
import { Card } from '../components/ui/Card';
import { useSupabase } from '../providers/SupabaseProvider';

export default function EmailSettingsPage() {
  const { user } = useSupabase();
  
  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Email Settings</h1>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Connect Email Account Section */}
          <Card className="p-6">
            <EmailAccountConnect />
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Email Service Demo</h2>
            <EmailServiceDemo />
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Direct API Test</h2>
            <EmailTest />
          </Card>
        </div>
      </div>
    </div>
  );
} 