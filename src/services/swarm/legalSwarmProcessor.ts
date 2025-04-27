/**
 * Legal Swarm Processor
 * 
 * Processes legal text data to extract structured information for use in the legal swarm system.
 */

import { LegalCaseInputResult, LegalHearingInfo } from '../../types/legal';

/**
 * Process legal text to extract structured information
 */
export async function processLegalText(text: string): Promise<LegalCaseInputResult> {
  // In a real implementation, this would use NLP or a specialized API
  // For now, we'll use basic pattern matching and mock data

  const detectedHearingInfo = detectHearingInformation(text);
  
  return {
    detectedLegalContent: true,
    contentType: 'hearing-notes',
    confidence: 85,
    extractedInfo: detectedHearingInfo,
    originalText: text
  };
}

/**
 * Detect hearing information from text
 */
function detectHearingInformation(text: string): LegalHearingInfo {
  // This is a simplified implementation that looks for patterns in the text
  
  // Names
  const applicantMatch = text.match(/(?:Applicant|Claimant|Plaintiff):?\s*([A-Z][a-z]+ [A-Z][a-z]+)/i);
  const respondentMatch = text.match(/(?:Respondent|Defendant|Employer):?\s*([A-Z][a-z]+ [A-Z][a-z]+|[A-Z][A-Z\s]+)/i);
  
  // Dates
  const hearingDateMatch = text.match(/(?:Hearing|Court) Date:?\s*([A-Z][a-z]+ \d{1,2},? \d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  
  // Case number
  const caseNumberMatch = text.match(/(?:Case|Claim|Docket) (?:No|Number|#):?\s*([A-Z0-9-]+)/i);
  
  // Hearing status
  const hearingStatusMatch = text.match(/(?:Status|Hearing Status):?\s*([A-Za-z ]+)/i);
  
  return {
    applicantName: applicantMatch ? applicantMatch[1] : 'Unknown Applicant',
    respondentName: respondentMatch ? respondentMatch[1] : 'Unknown Respondent',
    hearingDate: hearingDateMatch ? hearingDateMatch[1] : null,
    caseNumber: caseNumberMatch ? caseNumberMatch[1] : 'Unknown',
    hearingStatus: hearingStatusMatch ? hearingStatusMatch[1] : 'Pending',
    claimType: detectClaimType(text),
    keyIssues: detectKeyIssues(text),
    representationStatus: detectRepresentationStatus(text)
  };
}

/**
 * Detect the type of claim from text
 */
function detectClaimType(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('workers comp') || lowerText.includes("workers' compensation")) {
    return 'Workers Compensation';
  } else if (lowerText.includes('personal injury')) {
    return 'Personal Injury';
  } else if (lowerText.includes('medical malpractice')) {
    return 'Medical Malpractice';
  } else if (lowerText.includes('disability')) {
    return 'Disability';
  } else if (lowerText.includes('employment') || lowerText.includes('wrongful termination')) {
    return 'Employment';
  }
  
  return 'General';
}

/**
 * Detect key issues from text
 */
function detectKeyIssues(text: string): string[] {
  const issues: string[] = [];
  const lowerText = text.toLowerCase();
  
  // Look for common legal issues
  if (lowerText.includes('liability') || lowerText.includes('negligence')) {
    issues.push('Liability Dispute');
  }
  
  if (lowerText.includes('damages') || lowerText.includes('compensation amount')) {
    issues.push('Damages Calculation');
  }
  
  if (lowerText.includes('medical') || lowerText.includes('injury') || lowerText.includes('diagnosis')) {
    issues.push('Medical Evidence');
  }
  
  if (lowerText.includes('settlement') || lowerText.includes('offer')) {
    issues.push('Settlement Negotiation');
  }
  
  if (lowerText.includes('deadline') || lowerText.includes('statute of limitations')) {
    issues.push('Filing Deadlines');
  }
  
  // If no specific issues found, add a generic one
  if (issues.length === 0) {
    issues.push('Case Review Needed');
  }
  
  return issues;
}

/**
 * Detect representation status from text
 */
function detectRepresentationStatus(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('pro se') || lowerText.includes('unrepresented')) {
    return 'Unrepresented';
  } else if (lowerText.includes('attorney') || lowerText.includes('counsel') || lowerText.includes('represented by')) {
    return 'Represented';
  }
  
  return 'Unknown';
} 