import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanoid } from 'nanoid';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/Alert';
import { ScrollArea } from '../components/ui/ScrollArea';
import { useToast } from '../hooks/useToast';
import { useSwarmStore } from '../store/swarmStore';
import { useAgentStore } from '../store/agentStore';
import { LegalHearingInfo, LegalCaseInputResult, LegalSwarmTemplate } from '../types/legal';
import { processLegalText } from '../services/swarm/legalSwarmProcessor';

const SAMPLE_TEMPLATES: LegalSwarmTemplate[] = [
  {
    id: 'template-workers-comp',
    name: 'Workers Compensation Case',
    description: 'Template for handling workers compensation cases with medical evidence analysis and hearing preparation',
    caseType: 'workers-compensation',
    roles: [
      {
        role: 'Case Coordinator',
        requiredCapabilities: ['case-management', 'client-communication'],
        description: 'Manages the overall case workflow and coordinates between team members',
        responsibilities: ['Coordinate team members', 'Track deadlines', 'Manage client expectations']
      },
      {
        role: 'Medical Evidence Analyst',
        requiredCapabilities: ['medical-record-analysis'],
        description: 'Analyzes medical records and provides summaries of medical evidence',
        responsibilities: ['Review medical records', 'Summarize medical findings', 'Identify key medical evidence']
      },
      {
        role: 'Legal Researcher',
        requiredCapabilities: ['legal-research'],
        description: 'Conducts legal research specific to workers compensation law',
        responsibilities: ['Research relevant case law', 'Identify statutes and regulations', 'Prepare research summaries']
      },
      {
        role: 'Hearing Preparation Specialist',
        requiredCapabilities: ['hearing-preparation'],
        description: 'Prepares materials and strategy for hearings',
        responsibilities: ['Draft hearing briefs', 'Prepare witness outlines', 'Develop hearing strategy']
      }
    ],
    defaultInstructions: 'Analyze the case information, identify critical medical evidence, and prepare for the upcoming hearing.'
  },
  {
    id: 'template-personal-injury',
    name: 'Personal Injury Case',
    description: 'Template for personal injury cases focusing on settlement negotiations and evidence analysis',
    caseType: 'personal-injury',
    roles: [
      {
        role: 'Case Coordinator',
        requiredCapabilities: ['case-management', 'client-communication'],
        description: 'Manages the overall case workflow and coordinates between team members',
        responsibilities: ['Coordinate team members', 'Track deadlines', 'Manage client expectations']
      },
      {
        role: 'Settlement Negotiator',
        requiredCapabilities: ['settlement-negotiation'],
        description: 'Focuses on settlement strategy and negotiation',
        responsibilities: ['Develop settlement strategy', 'Draft demand letters', 'Analyze settlement offers']
      },
      {
        role: 'Medical Evidence Analyst',
        requiredCapabilities: ['medical-record-analysis'],
        description: 'Analyzes medical records and provides summaries of medical evidence',
        responsibilities: ['Review medical records', 'Summarize medical findings', 'Calculate damages based on injuries']
      },
      {
        role: 'Document Filing Manager',
        requiredCapabilities: ['document-filing'],
        description: 'Handles all document preparation and filing',
        responsibilities: ['Prepare court filings', 'Track filing deadlines', 'Maintain document organization']
      }
    ],
    defaultInstructions: 'Review medical records, calculate damages, and develop a comprehensive settlement strategy.'
  }
];

const LegalSwarmPage: React.FC = () => {
  const [legalText, setLegalText] = useState('');
  const [processingText, setProcessingText] = useState(false);
  const [detectedInfo, setDetectedInfo] = useState<LegalHearingInfo | null>(null);
  const [detectionResult, setDetectionResult] = useState<LegalCaseInputResult | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<LegalSwarmTemplate | null>(null);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { createSwarm } = useSwarmStore();
  const { agents } = useAgentStore();

  const handleTextInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLegalText(e.target.value);
    setDetectedInfo(null);
    setDetectionResult(null);
    setSelectedTemplate(null);
  };

  const detectLegalContent = async () => {
    if (!legalText.trim()) {
      toast({
        title: 'Empty Text',
        description: 'Please enter legal text to analyze',
        variant: 'destructive'
      });
      return;
    }

    setProcessingText(true);
    try {
      // Process the legal text to detect content and extract information
      const result = await processLegalText(legalText);
      setDetectionResult(result);
      
      if (result.detectedLegalContent && result.extractedInfo) {
        setDetectedInfo(result.extractedInfo);
        
        // Find the most appropriate template based on the content
        if (result.contentType === 'hearing-notes') {
          // For demo purposes, just pick the first template
          // In a real app, we would match based on content analysis
          setSelectedTemplate(SAMPLE_TEMPLATES[0]);
        }
        
        toast({
          title: 'Legal Content Detected',
          description: `Detected ${result.contentType} with ${result.confidence?.toFixed(0)}% confidence`,
        });
      } else {
        toast({
          title: 'Analysis Complete',
          description: 'No specific legal content pattern detected',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Error analyzing legal text:', error);
      toast({
        title: 'Analysis Error',
        description: 'Failed to analyze the provided text',
        variant: 'destructive'
      });
    } finally {
      setProcessingText(false);
    }
  };

  const handleCreateSwarm = () => {
    if (!detectedInfo || !selectedTemplate) {
      toast({
        title: 'Missing Information',
        description: 'Please ensure case information is detected and a template is selected',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Assign the best agents to each role based on their capabilities
      const assignedAgents = selectedTemplate.roles.map(role => {
        // Filter agents by required capabilities
        const eligibleAgents = agents.filter(agent => 
          role.requiredCapabilities.every(capability => 
            agent.capabilities.includes(capability as string)
          )
        );
        
        // Sort by most matching capabilities (most specialized agent first)
        const sortedAgents = [...eligibleAgents].sort((a, b) => {
          const aMatch = a.capabilities.filter(cap => 
            role.requiredCapabilities.includes(cap as any)
          ).length;
          const bMatch = b.capabilities.filter(cap => 
            role.requiredCapabilities.includes(cap as any)
          ).length;
          return bMatch - aMatch;
        });
        
        return {
          role: role.role,
          agent: sortedAgents[0] || null // Best match or null if none found
        };
      });
      
      // Create a new swarm with the assigned agents
      const newSwarm = {
        id: nanoid(),
        name: `${detectedInfo.applicantName || 'Legal'} Case - ${new Date().toLocaleDateString()}`,
        description: `${selectedTemplate.description} - ${detectedInfo.hearingStatus || 'New case'}`,
        status: 'active',
        type: 'legal',
        template: selectedTemplate.id,
        agents: assignedAgents.map(assignment => ({
          id: assignment.agent?.id || nanoid(),
          role: assignment.role,
          agentId: assignment.agent?.id || null
        })),
        metadata: {
          legalCase: detectedInfo,
          caseType: selectedTemplate.caseType
        },
        tasks: [
          {
            id: nanoid(),
            title: 'Initial Case Analysis',
            description: 'Analyze case information and create summary',
            status: 'pending',
            assignedTo: assignedAgents[0]?.agent?.id || null
          },
          {
            id: nanoid(),
            title: 'Medical Evidence Review',
            description: 'Review and summarize medical evidence',
            status: 'pending',
            assignedTo: assignedAgents.find(a => a.role === 'Medical Evidence Analyst')?.agent?.id || null
          }
        ],
        createdAt: new Date()
      };
      
      createSwarm(newSwarm);
      
      toast({
        title: 'Swarm Created',
        description: `Successfully created "${newSwarm.name}" swarm with ${assignedAgents.filter(a => a.agent).length} agents`,
      });
      
      // Navigate to the new swarm
      navigate(`/swarm/${newSwarm.id}`);
      
    } catch (error) {
      console.error('Error creating legal swarm:', error);
      toast({
        title: 'Creation Error',
        description: 'Failed to create the legal swarm',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Legal Case Swarm Creator</h1>
        <p className="text-muted-foreground">
          Paste your legal case notes to automatically create a specialized agent swarm
        </p>
      </div>
      
      <Tabs defaultValue="input" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="input">Input Case</TabsTrigger>
          <TabsTrigger value="templates" disabled={!detectedInfo}>Templates</TabsTrigger>
          <TabsTrigger value="review" disabled={!selectedTemplate}>Review & Create</TabsTrigger>
        </TabsList>
        
        <TabsContent value="input">
          <Card>
            <CardHeader>
              <CardTitle>Legal Case Information</CardTitle>
              <CardDescription>
                Paste your hearing notes, case summary, or other legal text.
                The system will analyze the content and extract key information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                placeholder="Paste your legal text here..." 
                className="min-h-[300px]"
                value={legalText}
                onChange={handleTextInput}
              />
              
              {detectionResult && detectionResult.detectedLegalContent && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Detected Information</h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {detectedInfo?.applicantName && (
                      <div>
                        <span className="text-sm font-medium">Applicant:</span>
                        <p>{detectedInfo.applicantName}</p>
                      </div>
                    )}
                    
                    {detectedInfo?.hearingStatus && (
                      <div>
                        <span className="text-sm font-medium">Status:</span>
                        <p>
                          <Badge 
                            className={
                              detectedInfo.hearingStatus === 'scheduled' ? 'bg-blue-500' :
                              detectedInfo.hearingStatus === 'completed' ? 'bg-green-500' :
                              detectedInfo.hearingStatus === 'continued' ? 'bg-amber-500' :
                              'bg-red-500'
                            }
                          >
                            {detectedInfo.hearingStatus}
                          </Badge>
                        </p>
                      </div>
                    )}
                    
                    {detectedInfo?.judge && (
                      <div>
                        <span className="text-sm font-medium">Judge:</span>
                        <p>{detectedInfo.judge}</p>
                      </div>
                    )}
                    
                    {detectedInfo?.hearingDate && (
                      <div>
                        <span className="text-sm font-medium">Date:</span>
                        <p>{new Date(detectedInfo.hearingDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    
                    {detectedInfo?.medicalEvaluators && detectedInfo.medicalEvaluators.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-sm font-medium">Medical Evaluators:</span>
                        <p>{detectedInfo.medicalEvaluators.join(', ')}</p>
                      </div>
                    )}
                    
                    {detectedInfo?.actionItems && detectedInfo.actionItems.length > 0 && (
                      <div className="col-span-2 mt-2">
                        <span className="text-sm font-medium">Action Items:</span>
                        <ul className="list-disc pl-5 mt-1">
                          {detectedInfo.actionItems.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={detectLegalContent} 
                disabled={processingText || !legalText.trim()}
                className="mr-2"
              >
                {processingText ? 'Analyzing...' : 'Analyze Content'}
              </Button>
              
              {detectedInfo && (
                <Button variant="outline" onClick={() => setSelectedTemplate(SAMPLE_TEMPLATES[0])}>
                  Continue
                </Button>
              )}
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMPLE_TEMPLATES.map(template => (
              <Card 
                key={template.id} 
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  selectedTemplate?.id === template.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <CardHeader>
                  <CardTitle>{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <h4 className="font-medium mb-2">Roles</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.roles.map(role => (
                      <Badge key={role.role} variant="outline">
                        {role.role}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant={selectedTemplate?.id === template.id ? "default" : "outline"}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    {selectedTemplate?.id === template.id ? 'Selected' : 'Select'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="review">
          {selectedTemplate && detectedInfo && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Swarm Summary</CardTitle>
                  <CardDescription>Review the swarm configuration before creation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-lg">Case Information</h3>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <span className="text-sm font-medium">Applicant:</span>
                          <p>{detectedInfo.applicantName || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Status:</span>
                          <p>
                            {detectedInfo.hearingStatus ? (
                              <Badge>{detectedInfo.hearingStatus}</Badge>
                            ) : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg">Selected Template</h3>
                      <p className="text-sm">{selectedTemplate.name} - {selectedTemplate.description}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-lg">Roles & Assignments</h3>
                      <ScrollArea className="h-[200px] mt-2">
                        <div className="space-y-3">
                          {selectedTemplate.roles.map(role => {
                            // Find matching agent
                            const matchingAgents = agents.filter(agent => 
                              role.requiredCapabilities.every(capability => 
                                agent.capabilities.includes(capability as string)
                              )
                            );
                            
                            const bestMatch = matchingAgents.length ? matchingAgents[0] : null;
                            
                            return (
                              <div key={role.role} className="p-3 border rounded-md">
                                <div className="flex justify-between items-center">
                                  <h4 className="font-medium">{role.role}</h4>
                                  {bestMatch ? (
                                    <Badge variant="outline" className="bg-green-50">
                                      Assigned: {bestMatch.name}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-amber-50">
                                      No agent match
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {role.requiredCapabilities.map(cap => (
                                    <Badge key={cap} variant="secondary" className="text-xs">
                                      {cap}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={handleCreateSwarm} className="mr-2">
                    Create Legal Swarm
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
                    Back to Templates
                  </Button>
                </CardFooter>
              </Card>
              
              <Alert>
                <AlertTitle>About Automatic Assignment</AlertTitle>
                <AlertDescription>
                  Agents are automatically assigned to roles based on their capabilities.
                  The system finds the best match for each role by identifying agents
                  with the required capabilities.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LegalSwarmPage; 