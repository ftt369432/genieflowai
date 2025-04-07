import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { useAssistantStore } from '../../store/assistantStore';
import { useKnowledgeBaseStore } from '../../store/knowledgeBaseStore';
import { AIFolder, AIModel } from '../../types/ai';
import { Card } from '../ui/Card';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export function CreateLegalAssistant() {
  const { addAssistant, assignFolderToAssistant } = useAssistantStore();
  const { addFolder, addDocument } = useKnowledgeBaseStore();
  const [isCreating, setIsCreating] = useState(false);
  const [status, setStatus] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const setupLegalAssistant = async () => {
    setIsCreating(true);
    setStatus('creating');
    setError(null);
    
    try {
      // Create the CA Workers' Comp folder structure
      setStatus('creating');
      
      // 1. Create main folder
      const mainFolder = await addFolder({
        id: `ca-workers-comp-${Date.now()}`,
        name: 'California Workers Compensation',
        parentId: null,
        documents: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // 2. Create subfolders
      const statutesFolder = await addFolder({
        id: `statutes-${Date.now()}`,
        name: 'Statutes & Regulations',
        parentId: mainFolder.id,
        documents: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const formsFolder = await addFolder({
        id: `forms-${Date.now()}`,
        name: 'Forms & Templates',
        parentId: mainFolder.id,
        documents: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      const casesFolder = await addFolder({
        id: `cases-${Date.now()}`,
        name: 'WCAB Decisions',
        parentId: mainFolder.id,
        documents: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // 3. Add sample documents
      
      // Sample statute
      await addDocument({
        id: `labor-code-3200-${Date.now()}`,
        content: `
        § 3200. The Legislature hereby declares its intent that the term "workmen's compensation" shall 
        include within its meaning provisions for the comfort, health, safety and general welfare of 
        any employee and his dependents and for indemnification for injuries suffered, or death 
        incurred by an employee in the course of his employment, irrespective of the fault of any 
        person. It is further declared to be the intent of the Legislature that the occupational safety 
        and health standards and orders within this state shall be at least as effective as standards 
        adopted or recognized by the United States pursuant to the provisions of the Occupational Safety 
        and Health Act of 1970 (Public Law 91-596).
        `,
        metadata: {
          source: 'upload',
          title: 'Labor Code Section 3200',
          author: 'California Legislature',
          date: new Date(),
          category: 'statute',
          tags: ['labor code', 'workers compensation', 'california']
        }
      });
      
      // Sample form
      await addDocument({
        id: `wcab-1-${Date.now()}`,
        content: `
        STATE OF CALIFORNIA
        WORKERS' COMPENSATION APPEALS BOARD
        
        APPLICATION FOR ADJUDICATION OF CLAIM
        
        Case No. _________________
        
        Venue choice is based upon (check one)
        [ ] County of residence of employee (Labor Code section 5501.5(a)(1) or (d).)
        [ ] County where injury occurred (Labor Code section 5501.5(a)(2) or (d).)
        [ ] County of principal place of business of employee's attorney (Labor Code section 5501.5(a)(3).)
        
        Select 3 letter office code for place/venue of hearing (From Document Cover Sheet)
        
        EMPLOYEE (completion of this section is required)
        First Name: 
        Last Name:
        Address:
        City:                       State:           Zip:
        `,
        metadata: {
          source: 'upload',
          title: 'WCAB Form 1 - Application for Adjudication of Claim',
          author: 'Workers Compensation Appeals Board',
          date: new Date(),
          category: 'form',
          tags: ['form', 'application', 'wcab']
        }
      });
      
      // Sample case decision
      await addDocument({
        id: `case-decision-${Date.now()}`,
        content: `
        WORKERS' COMPENSATION APPEALS BOARD
        STATE OF CALIFORNIA
        
        JOHN DOE, Applicant
        vs.
        XYZ COMPANY; ABC INSURANCE COMPANY, Defendants
        
        Case No. ADJ12345678
        
        OPINION AND DECISION AFTER RECONSIDERATION
        
        We previously granted reconsideration to further study the factual and legal issues presented. 
        Having completed our review, we now issue our Opinion and Decision After Reconsideration.
        
        Applicant claims injury to his back on January 1, 2020, while working as a warehouse worker for 
        defendant. The issue presented is whether the injury arose out of and in the course of employment.
        
        The workers' compensation administrative law judge (WCJ) found that applicant's injury did arise 
        out of and in the course of employment. The WCJ awarded applicant temporary disability benefits, 
        medical treatment, and attorney's fees.
        
        Defendant contends that applicant's injury occurred while he was on a lunch break and had left 
        the employer's premises, and thus did not arise out of and in the course of employment.
        `,
        metadata: {
          source: 'upload',
          title: 'Sample WCAB Decision',
          author: 'Workers Compensation Appeals Board',
          date: new Date(),
          category: 'case',
          tags: ['wcab', 'decision', 'arising out of employment']
        }
      });
      
      // 4. Create the Legal Assistant
      
      // Create a default AI model
      const defaultModel: AIModel = {
        id: 'default-model',
        name: 'Default Model',
        provider: 'openai',
        capabilities: ['text-generation', 'chat'],
        contextSize: 8192
      };
      
      // Create assistant
      const legalAssistant = addAssistant({
        name: 'California Workers\' Comp Assistant',
        description: 'Specialized assistant for California workers\' compensation law',
        systemPrompt: `You are a specialized legal assistant for California workers' compensation law. 
        You help attorneys and claimants understand the California workers' compensation system, 
        applicable laws, and procedures.
        
        When answering questions:
        - Focus on California-specific workers' compensation laws and regulations
        - Cite Labor Code sections when relevant
        - Explain legal concepts in clear, straightforward language
        - If discussing WCAB forms, explain their purpose and key components
        - When mentioning case decisions, explain their significance
        - Always clarify that you're providing legal information, not legal advice
        - If the answer might depend on specific facts not provided, note this
        
        Your goal is to be an informed, accurate resource for California workers' compensation matters.`,
        model: defaultModel,
        settings: {
          temperature: 0.5,
          maxTokens: 2000
        }
      });
      
      // Assign folders to the assistant
      assignFolderToAssistant(legalAssistant.id, mainFolder.id);
      assignFolderToAssistant(legalAssistant.id, statutesFolder.id);
      assignFolderToAssistant(legalAssistant.id, formsFolder.id);
      assignFolderToAssistant(legalAssistant.id, casesFolder.id);
      
      setStatus('success');
      
      // Navigate to the assistants page after a short delay
      setTimeout(() => {
        navigate('/assistants');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating legal assistant:', error);
      setStatus('error');
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Create California Workers' Compensation Assistant</h2>
      
      <p className="mb-4">
        This will create a specialized legal assistant with a folder structure and sample documents
        for California workers' compensation law. The assistant will be able to answer questions
        about statutes, forms, procedures, and case decisions.
      </p>
      
      <div className="space-y-4 my-6">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white">1</div>
          <span>Create folder structure for workers' compensation knowledge</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white">2</div>
          <span>Import sample statutes, forms, and case decisions</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white">3</div>
          <span>Configure specialized assistant with legal expertise</span>
        </div>
      </div>
      
      {status === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded p-4 flex items-start gap-3 mb-6">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-green-800">Successfully created legal assistant!</h3>
            <p className="text-green-700 mt-1">
              Your California Workers' Compensation assistant is ready. Redirecting to assistants page...
            </p>
          </div>
        </div>
      )}
      
      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded p-4 flex items-start gap-3 mb-6">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Error creating legal assistant</h3>
            <p className="text-red-700 mt-1">{error || 'An unknown error occurred'}</p>
          </div>
        </div>
      )}
      
      <Button 
        onClick={setupLegalAssistant} 
        disabled={isCreating || status === 'success'}
        className="w-full"
      >
        {isCreating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating Assistant...
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Assistant Created
          </>
        ) : (
          'Create Legal Assistant'
        )}
      </Button>
    </Card>
  );
} 