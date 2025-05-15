import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAgentStore } from './agentStore';

export interface WorkflowStep {
  id: string;
  agentId: string;
  actionType: string;
  name: string;
  description: string;
  input: string | Record<string, any>;
  inputType: 'static' | 'dynamic' | 'previous';
  outputMapping: string;
  condition?: {
    type: 'always' | 'if' | 'if-else';
    expression?: string;
  };
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: 'manual' | 'scheduled' | 'event';
  triggerConfig?: {
    schedule?: string;
    event?: string;
  };
  steps: WorkflowStep[];
  created: Date;
  lastRun?: Date;
  status: 'active' | 'inactive' | 'running';
}

export interface StepResult {
  stepId: string;
  output: any;
  status: 'completed' | 'failed';
  error?: string;
  startTime: Date;
  endTime: Date;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  stepResults: StepResult[];
  input?: any;
  output?: any;
  error?: string;
}

interface WorkflowState {
  workflows: Workflow[];
  runs: WorkflowRun[];
  isLoading: boolean;
  error: string | null;
  
  // CRUD operations
  addWorkflow: (workflow: Omit<Workflow, 'id' | 'created'>) => string;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  
  // Workflow execution
  runWorkflow: (workflowId: string, input?: any) => Promise<string>;
  saveStepResult: (runId: string, result: StepResult) => void;
  completeWorkflowRun: (runId: string, status: 'completed' | 'failed', output?: any, error?: string) => void;
  
  // AI-assisted workflow creation
  generateWorkflowFromPrompt: (prompt: string) => Promise<Workflow>;
}

// Sample workflow for testing
const sampleWorkflow: Workflow = {
  id: '1',
  name: 'Email Processing Workflow',
  description: 'Automate processing of incoming emails, summarizing content and creating tasks',
  trigger: 'manual',
  steps: [
    {
      id: '1',
      agentId: '1',
      actionType: 'email',
      name: 'Process Email',
      description: 'Extract key information from email',
      input: '{input.email}',
      inputType: 'dynamic',
      outputMapping: 'processedEmail'
    },
    {
      id: '2',
      agentId: '1',
      actionType: 'create-task',
      name: 'Create Task',
      description: 'Create a task based on email content',
      input: '{steps.processedEmail.action_items}',
      inputType: 'previous',
      outputMapping: 'task'
    }
  ],
  created: new Date(),
  status: 'active'
};

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      workflows: [sampleWorkflow],
      runs: [],
      isLoading: false,
      error: null,
      
      addWorkflow: (workflow) => {
        const id = crypto.randomUUID();
        set((state) => ({
          workflows: [...state.workflows, {
            ...workflow,
            id,
            created: new Date()
          }]
        }));
        return id;
      },
      
      updateWorkflow: (id, updates) => {
        set((state) => ({
          workflows: state.workflows.map(workflow => 
            workflow.id === id ? { ...workflow, ...updates } : workflow
          )
        }));
      },
      
      deleteWorkflow: (id) => {
        set((state) => ({
          workflows: state.workflows.filter(workflow => workflow.id !== id)
        }));
      },
      
      runWorkflow: async (workflowId, input) => {
        const workflow = get().workflows.find(w => w.id === workflowId);
        if (!workflow) {
          throw new Error(`Workflow with ID ${workflowId} not found`);
        }
        
        const runId = crypto.randomUUID();
        const run: WorkflowRun = {
          id: runId,
          workflowId,
          status: 'running',
          startTime: new Date(),
          stepResults: [],
          input
        };
        
        set((state) => ({
          runs: [...state.runs, run]
        }));
        
        // Update workflow status
        set((state) => ({
          workflows: state.workflows.map(w => 
            w.id === workflowId ? { ...w, status: 'running' } : w
          )
        }));
        
        // In a real implementation, this would spawn a background process
        // or use a queue to execute steps in order
        try {
          // Execute workflow steps
          const agentStore = useAgentStore.getState();
          
          for (const step of workflow.steps) {
            const startTime = new Date();
            
            try {
              // Process input by replacing variables
              let processedInput = step.input;
              // ... (in a real implementation, we'd parse and replace variables here)
              
              // Execute the action
              const result = await agentStore.executeAction(
                step.agentId,
                step.actionType,
                { input: processedInput }
              );
              
              const stepResult: StepResult = {
                stepId: step.id,
                output: result,
                status: 'completed',
                startTime,
                endTime: new Date()
              };
              
              get().saveStepResult(runId, stepResult);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              
              const stepResult: StepResult = {
                stepId: step.id,
                output: null,
                status: 'failed',
                error: errorMessage,
                startTime,
                endTime: new Date()
              };
              
              get().saveStepResult(runId, stepResult);
              
              // Mark workflow as failed
              get().completeWorkflowRun(runId, 'failed', null, errorMessage);
              return runId;
            }
          }
          
          // Mark workflow as completed if all steps succeeded
          get().completeWorkflowRun(runId, 'completed', { success: true });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          get().completeWorkflowRun(runId, 'failed', null, errorMessage);
        }
        
        return runId;
      },
      
      saveStepResult: (runId, result) => {
        set((state) => ({
          runs: state.runs.map(run => {
            if (run.id === runId) {
              return {
                ...run,
                stepResults: [...run.stepResults, result]
              };
            }
            return run;
          })
        }));
      },
      
      completeWorkflowRun: (runId, status, output, error) => {
        set((state) => ({
          runs: state.runs.map(run => {
            if (run.id === runId) {
              const workflowId = run.workflowId;
              
              // Reset workflow status
              set((state) => ({
                workflows: state.workflows.map(w => 
                  w.id === workflowId ? { ...w, status: 'active', lastRun: new Date() } : w
                )
              }));
              
              return {
                ...run,
                status,
                endTime: new Date(),
                output,
                error
              };
            }
            return run;
          })
        }));
      },
      
      generateWorkflowFromPrompt: async (prompt) => {
        set({ isLoading: true, error: null });
        
        try {
          // In a real implementation, this would call an API that uses AI to generate a workflow
          // For demo purposes, we'll just return a modified sample workflow
          
          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const generatedWorkflow: Workflow = {
            ...sampleWorkflow,
            id: crypto.randomUUID(),
            name: prompt.split(' ').slice(0, 3).join(' ') + ' Workflow',
            description: prompt,
            created: new Date()
          };
          
          // Add workflow to store
          set((state) => ({
            workflows: [...state.workflows, generatedWorkflow],
            isLoading: false
          }));
          
          return generatedWorkflow;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error generating workflow';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      }
    }),
    {
      name: 'workflow-storage'
    }
  )
); 