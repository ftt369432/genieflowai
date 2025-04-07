import React from 'react';
import { AgentWizard } from '../components/agents/AgentWizard';
import { Card, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '../components/ui/Breadcrumb';
import { Home, Wand2 } from 'lucide-react';

export function AgentWizardPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">
              <Home className="h-4 w-4 mr-1" />
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/ai">AI Hub</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="flex items-center">
              <Wand2 className="h-4 w-4 mr-1" />
              Workflow Wizard
            </span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="px-0">
          <CardTitle className="text-3xl font-bold">AI Workflow Wizard</CardTitle>
          <CardDescription className="text-lg">
            Create intelligent workflows by connecting AI agents to perform complex tasks
          </CardDescription>
        </CardHeader>
      </Card>
      
      <AgentWizard />
    </div>
  );
} 