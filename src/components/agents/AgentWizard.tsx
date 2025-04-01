import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgentStore } from '../../store/agentStore';
import { useWorkflowStore } from '../../store/workflowStore';
import { useNotebookStore } from '../../store/notebookStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Switch } from '../ui/Switch';
import { Label } from '../ui/Label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Alert, AlertDescription } from '../ui/Alert';
import { 
  Wand2, 
  Plus, 
  Trash, 
  ArrowUp, 
  ArrowDown, 
  Save, 
  Play, 
  RotateCw, 
  Sparkles, 
  Settings, 
  ChevronRight, 
  Check,
  BookOpen,
  File,
  FileText,
  Workflow,
  Link
} from 'lucide-react';
import { AgentType, AgentCapability, AutonomyLevel, Agent } from '../../types/agent';
import { WorkflowStep } from '../../store/workflowStore';

interface ProjectOption {
  id: string;
  name: string;
}

// Sample project data - in a real app, this would come from a project store
const PROJECTS: ProjectOption[] = [
  { id: 'project-1', name: 'Marketing Website' },
  { id: 'project-2', name: 'Mobile App Development' },
  { id: 'project-3', name: 'Customer Portal' }
];

export function AgentWizard() {
  const navigate = useNavigate();
  const { agents } = useAgentStore();
  const { workflows, addWorkflow, generateWorkflowFromPrompt, isLoading: isWorkflowLoading } = useWorkflowStore();
  const { notebooks, createNotebook } = useNotebookStore();
  
  const [step, setStep] = useState(1);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState(agents[0]?.id || '');
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [currentEditingStep, setCurrentEditingStep] = useState<WorkflowStep | null>(null);
  const [workflow, setWorkflow] = useState<any>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [createNotebookOpen, setCreateNotebookOpen] = useState(false);
  const [notebookName, setNotebookName] = useState('');
  const [workflowSaved, setWorkflowSaved] = useState(false);
  
  const generateWorkflowFromPromptHandler = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const generatedWorkflow = await generateWorkflowFromPrompt(prompt);
      setWorkflow(generatedWorkflow);
      setStep(2);
      
      // Prefill notebook name based on workflow
      setNotebookName(generatedWorkflow.name);
    } catch (error) {
      console.error('Error generating workflow:', error);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSaveWorkflow = () => {
    if (!workflow) return;
    
    // Update workflow with project connection if selected
    if (selectedProjectId) {
      workflow.projectId = selectedProjectId;
    }
    
    // Save or update workflow in the store
    if (!workflowSaved) {
      // This would typically update the workflow in the store
      setWorkflowSaved(true);
    }
    
    // Show dialog to create associated notebook
    setCreateNotebookOpen(true);
  };
  
  const handleCreateNotebook = () => {
    if (!notebookName.trim()) return;
    
    // Create a new notebook associated with this workflow
    createNotebook({
      name: notebookName,
      description: `Documentation for the ${workflow.name} workflow`,
      projectId: selectedProjectId || undefined,
      icon: 'book',
      color: 'blue'
    });
    
    // Close dialog and navigate
    setCreateNotebookOpen(false);
    
    // Navigate back to agents page
    navigate('/agents');
  };
  
  const handleRunWorkflow = () => {
    if (!workflow) return;
    
    // Show a simple alert in this demo
    alert('Workflow execution started!');
    
    // In a real app, you would call the runWorkflow function
    // and handle state updates, loading indicators, etc.
  };
  
  const handleAddStep = () => {
    if (!workflow) return;
    
    const newStep: WorkflowStep = {
      id: crypto.randomUUID(),
      agentId: selectedAgentId,
      actionType: 'chat',
      name: 'New Step',
      description: 'Describe what this step does',
      input: '',
      inputType: 'static',
      outputMapping: `step${workflow.steps.length + 1}_output`
    };
    
    setWorkflow({
      ...workflow,
      steps: [...workflow.steps, newStep]
    });
  };
  
  const handleDeleteStep = (stepId: string) => {
    if (!workflow) return;
    
    setWorkflow({
      ...workflow,
      steps: workflow.steps.filter((step: WorkflowStep) => step.id !== stepId)
    });
  };
  
  const handleMoveStep = (stepId: string, direction: 'up' | 'down') => {
    if (!workflow) return;
    
    const stepIndex = workflow.steps.findIndex((step: WorkflowStep) => step.id === stepId);
    if (
      (direction === 'up' && stepIndex === 0) || 
      (direction === 'down' && stepIndex === workflow.steps.length - 1)
    ) {
      return;
    }
    
    const newSteps = [...workflow.steps];
    const targetIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
    [newSteps[stepIndex], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[stepIndex]];
    
    setWorkflow({
      ...workflow,
      steps: newSteps
    });
  };
  
  const handleEditStep = (step: WorkflowStep) => {
    setCurrentEditingStep(step);
  };
  
  const handleUpdateStep = (updatedStep: WorkflowStep) => {
    if (!workflow) return;
    
    setWorkflow({
      ...workflow,
      steps: workflow.steps.map((step: WorkflowStep) => 
        step.id === updatedStep.id ? updatedStep : step
      )
    });
    setCurrentEditingStep(null);
  };
  
  const getAgentById = (id: string) => {
    return agents.find(agent => agent.id === id);
  };
  
  const getAvailableActions = (agentId: string) => {
    const agent = getAgentById(agentId);
    if (!agent) return [];
    
    // Base actions that every agent has
    const baseActions = [
      { id: 'chat', name: 'Chat', description: 'Send a message to the agent' }
    ];
    
    // Capability-specific actions
    const capabilityActions: Record<string, {id: string, name: string, description: string}> = {
      'email-processing': {
        id: 'email',
        name: 'Process Email',
        description: 'Process and analyze emails'
      },
      'document-analysis': {
        id: 'analyze-document',
        name: 'Analyze Document',
        description: 'Extract information from documents'
      },
      'task-management': {
        id: 'create-task',
        name: 'Create Task',
        description: 'Create a new task'
      },
      'code-generation': {
        id: 'generate-code',
        name: 'Generate Code',
        description: 'Generate code based on requirements'
      },
      'data-analysis': {
        id: 'analyze-data',
        name: 'Analyze Data',
        description: 'Analyze data and generate insights'
      }
    };
    
    const additionalActions = agent.capabilities
      .filter(cap => capabilityActions[cap])
      .map(cap => capabilityActions[cap]);
    
    return [...baseActions, ...additionalActions];
  };
  
  const renderStepEditor = () => {
    if (!currentEditingStep) return null;
    
    const agent = getAgentById(currentEditingStep.agentId);
    const availableActions = getAvailableActions(currentEditingStep.agentId);
    
    return (
      <Card className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Edit Step</CardTitle>
          <CardDescription>Configure this workflow step</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="step-name">Step Name</Label>
            <Input 
              id="step-name" 
              value={currentEditingStep.name}
              onChange={(e) => setCurrentEditingStep({
                ...currentEditingStep,
                name: e.target.value
              })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="step-description">Description</Label>
            <Textarea 
              id="step-description" 
              value={currentEditingStep.description}
              onChange={(e) => setCurrentEditingStep({
                ...currentEditingStep,
                description: e.target.value
              })}
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="step-agent">Agent</Label>
            <select
              id="step-agent"
              className="w-full p-2 border rounded-md"
              value={currentEditingStep.agentId}
              onChange={(e) => setCurrentEditingStep({
                ...currentEditingStep,
                agentId: e.target.value
              })}
            >
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="step-action">Action</Label>
            <select
              id="step-action"
              className="w-full p-2 border rounded-md"
              value={currentEditingStep.actionType}
              onChange={(e) => setCurrentEditingStep({
                ...currentEditingStep,
                actionType: e.target.value
              })}
            >
              {availableActions.map((action) => (
                <option key={action.id} value={action.id}>
                  {action.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="step-input-type">Input Type</Label>
            <select
              id="step-input-type"
              className="w-full p-2 border rounded-md"
              value={currentEditingStep.inputType}
              onChange={(e) => setCurrentEditingStep({
                ...currentEditingStep,
                inputType: e.target.value as 'static' | 'dynamic' | 'previous'
              })}
            >
              <option value="static">Static (Fixed value)</option>
              <option value="dynamic">Dynamic (Runtime value)</option>
              <option value="previous">Previous Step Output</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="step-input">Input</Label>
            <Textarea 
              id="step-input" 
              value={currentEditingStep.input}
              onChange={(e) => setCurrentEditingStep({
                ...currentEditingStep,
                input: e.target.value
              })}
              rows={3}
              placeholder={
                currentEditingStep.inputType === 'static' 
                  ? 'Enter static input value' 
                  : currentEditingStep.inputType === 'dynamic' 
                    ? 'Use {input.field} for workflow inputs' 
                    : 'Use {steps.stepName.outputField} to reference previous step outputs'
              }
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="step-output-mapping">Output Variable Name</Label>
            <Input 
              id="step-output-mapping" 
              value={currentEditingStep.outputMapping}
              onChange={(e) => setCurrentEditingStep({
                ...currentEditingStep,
                outputMapping: e.target.value
              })}
              placeholder="Name to access this step's output in later steps"
            />
          </div>
          
          {isAdvancedMode && (
            <div className="space-y-2">
              <Label htmlFor="step-condition-type">Condition Type</Label>
              <select
                id="step-condition-type"
                className="w-full p-2 border rounded-md"
                value={currentEditingStep.condition?.type || 'always'}
                onChange={(e) => {
                  const type = e.target.value as 'always' | 'if' | 'if-else';
                  setCurrentEditingStep({
                    ...currentEditingStep,
                    condition: {
                      type,
                      expression: currentEditingStep.condition?.expression || ''
                    }
                  });
                }}
              >
                <option value="always">Always Run</option>
                <option value="if">Conditional (If)</option>
                <option value="if-else">Conditional (If-Else)</option>
              </select>
              
              {(currentEditingStep.condition?.type === 'if' || currentEditingStep.condition?.type === 'if-else') && (
                <div className="space-y-2 mt-2">
                  <Label htmlFor="step-condition">Condition Expression</Label>
                  <Textarea 
                    id="step-condition" 
                    value={currentEditingStep.condition?.expression || ''}
                    onChange={(e) => setCurrentEditingStep({
                      ...currentEditingStep,
                      condition: {
                        type: currentEditingStep.condition?.type || 'if',
                        expression: e.target.value
                      }
                    })}
                    placeholder="E.g., {steps.previous.success} === true"
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentEditingStep(null)}>
            Cancel
          </Button>
          <Button onClick={() => handleUpdateStep(currentEditingStep)}>
            <Check className="h-4 w-4 mr-2" />
            Save Step
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">AI Agent Workflow Wizard</h2>
          <p className="text-muted-foreground">
            Create multi-step agent workflows with ease
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch 
              checked={isAdvancedMode}
              onCheckedChange={setIsAdvancedMode}
            />
            <Label>Advanced Mode</Label>
          </div>
          {step > 1 && (
            <>
              <Button variant="outline" onClick={handleSaveWorkflow}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={handleRunWorkflow}>
                <Play className="h-4 w-4 mr-2" />
                Run Workflow
              </Button>
            </>
          )}
        </div>
      </div>
      
      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wand2 className="h-5 w-5 mr-2 text-purple-500" />
              Step 1: Define Your Workflow
            </CardTitle>
            <CardDescription>
              Describe what you want to automate and we'll generate a workflow for you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Describe the workflow you want to create in natural language. For example: 'Create a workflow that monitors my email for customer inquiries, extracts key information, and creates a task in my task manager.'"
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="resize-none"
            />
            
            <div className="flex flex-col space-y-2">
              <Label className="text-sm text-muted-foreground">Examples:</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-2"
                  onClick={() => setPrompt("Create a workflow that processes incoming emails, summarizes them, and creates tasks for any action items.")}
                >
                  <div className="text-left">
                    <div className="font-medium">Email Processing</div>
                    <div className="text-xs text-muted-foreground">Process emails and create tasks</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-2"
                  onClick={() => setPrompt("Build a workflow that scans my documents, extracts key information, and generates a summary report.")}
                >
                  <div className="text-left">
                    <div className="font-medium">Document Analysis</div>
                    <div className="text-xs text-muted-foreground">Extract and summarize document info</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-2"
                  onClick={() => setPrompt("Create a workflow that takes my meeting notes, extracts action items, assigns them to team members, and adds them to our project management tool.")}
                >
                  <div className="text-left">
                    <div className="font-medium">Meeting Follow-up</div>
                    <div className="text-xs text-muted-foreground">Process notes and assign tasks</div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start h-auto py-2"
                  onClick={() => setPrompt("Design a workflow that monitors social media for mentions of my product, analyzes sentiment, and alerts me to negative feedback that needs immediate attention.")}
                >
                  <div className="text-left">
                    <div className="font-medium">Social Media Monitoring</div>
                    <div className="text-xs text-muted-foreground">Track mentions and analyze sentiment</div>
                  </div>
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={generateWorkflowFromPromptHandler}
              disabled={!prompt.trim() || isGenerating}
            >
              {isGenerating ? (
                <>
                  <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating Workflow...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Workflow
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
                    {workflow?.name}
                  </CardTitle>
                  <CardDescription>
                    {workflow?.description}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="px-2 py-1">
                  {workflow?.status === 'active' ? (
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                      Active
                    </span>
                  ) : workflow?.status === 'running' ? (
                    <span className="flex items-center">
                      <RotateCw className="h-3 w-3 mr-1 animate-spin" />
                      Running
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-gray-300 rounded-full mr-1"></span>
                      Inactive
                    </span>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Trigger</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={workflow?.trigger}
                      onChange={(e) => setWorkflow({
                        ...workflow,
                        trigger: e.target.value
                      })}
                    >
                      <option value="manual">Manual (Run on demand)</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="event">Event-based</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Project (Optional)</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                    >
                      <option value="">None</option>
                      {PROJECTS.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {workflow?.trigger === 'scheduled' && (
                  <div className="space-y-2">
                    <Label>Schedule</Label>
                    <Input placeholder="Cron expression or frequency" />
                  </div>
                )}
                
                {workflow?.trigger === 'event' && (
                  <div className="space-y-2">
                    <Label>Event</Label>
                    <select
                      className="w-full p-2 border rounded-md"
                      defaultValue="email_received"
                    >
                      <option value="email_received">Email Received</option>
                      <option value="document_uploaded">Document Uploaded</option>
                      <option value="task_created">Task Created</option>
                      <option value="form_submitted">Form Submitted</option>
                    </select>
                  </div>
                )}
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-sm font-medium">Workflow Steps</Label>
                    <Button variant="outline" size="sm" onClick={handleAddStep}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Step
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {workflow?.steps.map((step: WorkflowStep, index: number) => {
                      const agent = getAgentById(step.agentId);
                      return (
                        <Card key={step.id} className="relative">
                          <CardContent className="p-4">
                            <div className="flex gap-3">
                              <div className="flex flex-col items-center mr-2">
                                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                                  {index + 1}
                                </div>
                                {index < workflow.steps.length - 1 && (
                                  <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                                )}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h3 className="font-medium">{step.name}</h3>
                                    <p className="text-sm text-muted-foreground">{step.description}</p>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleMoveStep(step.id, 'up')} disabled={index === 0}>
                                      <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleMoveStep(step.id, 'down')} disabled={index === workflow.steps.length - 1}>
                                      <ArrowDown className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleEditStep(step)}>
                                      <Settings className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteStep(step.id)}>
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground">Agent:</span>
                                    <div className="flex items-center gap-1">
                                      {agent ? agent.name : 'Unknown Agent'}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground">Action:</span>
                                    <div>
                                      {step.actionType}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-xs font-medium text-muted-foreground">Input Type:</span>
                                    <div>
                                      {step.inputType}
                                    </div>
                                  </div>
                                </div>
                                
                                {isAdvancedMode && (
                                  <div className="mt-2 text-xs">
                                    <div className="text-muted-foreground">Input: <code className="bg-gray-100 px-1 rounded">{step.input}</code></div>
                                    <div className="text-muted-foreground">Output as: <code className="bg-gray-100 px-1 rounded">{step.outputMapping}</code></div>
                                    {step.condition && step.condition.type !== 'always' && (
                                      <div className="text-muted-foreground">
                                        Condition: <code className="bg-gray-100 px-1 rounded">
                                          {step.condition.type}: {step.condition.expression}
                                        </code>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    
                    <Button 
                      variant="outline" 
                      className="w-full h-16 border-dashed mt-2" 
                      onClick={handleAddStep}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Step
                    </Button>
                  </div>
                </div>
                
                {selectedProjectId && (
                  <Alert>
                    <AlertDescription className="flex items-center space-x-2">
                      <Link className="h-4 w-4" />
                      <span>This workflow will be associated with the project: {PROJECTS.find(p => p.id === selectedProjectId)?.name}</span>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
          
          {renderStepEditor()}
        </div>
      )}
      
      {/* Create Notebook Dialog */}
      <Dialog open={createNotebookOpen} onOpenChange={setCreateNotebookOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Documentation Notebook</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-muted-foreground">
              Would you like to create a notebook to document this workflow? This will help your team understand how this workflow operates.
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="notebook-name">Notebook Name</Label>
              <Input
                id="notebook-name"
                value={notebookName}
                onChange={(e) => setNotebookName(e.target.value)}
                placeholder="Enter a name for your notebook"
              />
            </div>
            
            <div className="flex items-start space-x-2">
              <BookOpen className="h-8 w-8 text-blue-500 mt-1" />
              <div>
                <h4 className="font-medium">Documentation Notebook Benefits</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-1">
                  <li>Document your workflow steps</li>
                  <li>Add explanations for team members</li>
                  <li>Include troubleshooting guides</li>
                  <li>Link related resources</li>
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreateNotebookOpen(false);
              navigate('/agents');
            }}>
              Skip
            </Button>
            <Button onClick={handleCreateNotebook}>
              Create Notebook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 