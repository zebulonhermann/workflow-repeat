/**
 * Contract Management Workflow Steps
 * 
 * This file defines all durable steps used in the contract management workflow.
 * Each step is a "durable step" that can be retried and persisted across workflow runs.
 * 
 * Workflow Flow Overview:
 * 1. draftContract - Generate contract from template
 * 2. extractStructuredData - Extract parties, dates, amounts (cheap model)
 * 3. validateClauses - Check required/optional clauses (cheap model)
 * 4. checkPolicyCompliance - Verify persona permissions
 * 5. generateRedline - Create diff document with changes
 * 6. sendApprovalRequest - Route to approvers (manager/legal)
 * 7. archiveContract - Store final contract
 */

import { FatalError, fetch } from 'workflow';
import { generateContractDraft as generateContractDraftAgent } from './agent/subagents/contract-generation-agent';
import { extractStructuredData as extractStructuredDataAgent } from './agent/subagents/extraction-agent';
import { validateClauses as validateClausesAgent } from './agent/subagents/clause-validation-agent';

/**
 * Input type for contract drafting workflow
 * Defines all required information to generate a contract
 */
export type ContractDraftInput = {
  requesterId: string;
  requesterRole: 'requester' | 'contract_manager' | 'legal';
  contractType: string; // e.g., "NDA", "MSA", "SOW"
  jurisdiction: string; // e.g., "US-CA", "EU-GDPR"
  product: string; // e.g., "insurance", "brokerage"
  parties: {
    party1: { name: string; role: string };
    party2: { name: string; role: string };
  };
  keyTerms?: {
    amount?: number;
    startDate?: string;
    endDate?: string;
    paymentTerms?: string;
  };
  requesterEmail: string;
};

/**
 * Result type returned from the contract management workflow
 * Contains the final contract, analysis results, and approval status
 */
export type ContractDraftResult = {
  contractId: string;
  draftVersion: number;
  contractText: string;
  structuredData: {
    parties: any;
    dates: any;
    amounts: any;
  };
  clauseCoverage: {
    required: string[];
    optional: string[];
    missing: string[];
  };
  policyViolations: Array<{
    action: string;
    reason: string;
  }>;
  auditLog: Array<{
    timestamp: string;
    persona: string;
    action: string;
    model?: string;
    cost?: number;
    latency?: number;
  }>;
  approval?: {
    approved: boolean;
    approvedBy?: string;
    comment?: string;
  };
  contractUrl?: string;
};

// Environment configuration for external service endpoints
const BASE = process.env.APP_BASE_URL ?? 'http://localhost:3000';
const TEMPLATES = process.env.TEMPLATES ?? `${BASE}/api/mocks/newfront/contracts/templates`;
const POLICIES = process.env.POLICIES ?? `${BASE}/api/mocks/newfront/contracts/policies`;
const NOTIFY = process.env.NOTIFY ?? `${BASE}/api/mocks/notify`;

/** ---------- Durable Steps ---------- */

/**
 * Step 1: Draft Contract from Template
 * 
 * Generates a contract document using an AI agent that:
 * - Looks up template structure for the contract type
 * - Generates a 1-page contract draft with user requirements
 * - Includes parties, key terms, and basic structure
 * 
 * The agent uses conditional tool calls to look up templates and generate
 * the contract. This is a draft - validation happens separately.
 */
export async function draftContract(input: {
  contractType: string;
  jurisdiction: string;
  product: string;
  parties: any;
  keyTerms?: any;
}) {
  "use step";
  return await generateContractDraftAgent(input);
}
draftContract.maxRetries = 3;

/**
 * Step 2: Extract Structured Data from Contract Text
 * 
 * Uses a cheap AI model (gpt-4o-mini) to extract structured information:
 * - Parties (names, roles, types)
 * - Dates (start, end, signature, effective, expiration)
 * - Monetary amounts (payments, fees, penalties, limits, budgets)
 * 
 * This step is optimized for cost - using a cheaper model since extraction
 * is a simpler task compared to legal reasoning.
 */
export async function extractStructuredData(contractText: string) {
  "use step";
  return await extractStructuredDataAgent(contractText);
}
extractStructuredData.maxRetries = 5;

/**
 * Step 3: Validate Contract Clauses
 * 
 * Checks that the contract contains all required clauses for:
 * - Contract type (NDA requires different clauses than MSA)
 * - Jurisdiction (US-CA has different requirements than EU-GDPR)
 * - Product category (insurance contracts need specific clauses)
 * 
 * Uses a clause validation agent that:
 * - Looks up clause definitions from a clause library
 * - Checks jurisdiction-specific requirements
 * - Identifies missing required clauses
 * - Flags optional clauses that should be considered
 * 
 * May require human approval if high-risk issues are detected.
 */
export async function validateClauses(input: {
  contractText: string;
  contractType: string;
  jurisdiction: string;
  product: string;
  contractId: string;
}) {
  "use step";
  
  try {
    const result = await validateClausesAgent(input);
    
    // Validate result at step level
    if (result === undefined || result === null) {
      throw new FatalError(`validateClauses step failed: Agent returned undefined/null for contractId: ${input.contractId}`);
    }
    if (!result.required || !Array.isArray(result.required)) {
      throw new FatalError(`validateClauses step failed: Agent returned invalid result structure. Missing 'required' array. Result: ${JSON.stringify({ hasResult: !!result, resultKeys: result ? Object.keys(result) : [] })}`);
    }
    
    return result;
  } catch (error) {
    // Re-throw FatalErrors as-is
    if (error instanceof FatalError) {
      throw error;
    }
    // Wrap other errors as FatalError with context
    throw new FatalError(`validateClauses step failed for contractId: ${input.contractId}. Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}
validateClauses.maxRetries = 3;

/**
 * Step 4: Check Policy Compliance
 * 
 * Verifies that the requested action is allowed for the given persona:
 * - requester: Can draft contracts, cannot approve
 * - contract_manager: Can draft, edit, negotiate, cannot approve/publish
 * - legal: Can approve, publish, review, cannot draft
 * 
 * This enforces persona-based access control throughout the workflow.
 * Throws a FatalError if the action is not allowed (403 status).
 */
export async function checkPolicyCompliance(input: {
  persona: string;
  action: string;
  contractId?: string;
}) {
  "use step";
  await new Promise(resolve => setTimeout(resolve, 1000));
  const res = await fetch(`${POLICIES}`, {
    method: 'POST',
    body: JSON.stringify(input),
    headers: { 'content-type': 'application/json' },
  });
  
  if (res.status === 403) throw new FatalError(`Policy violation: ${input.persona} cannot ${input.action}`);
  if (!res.ok) throw new Error(`checkPolicyCompliance failed: ${res.status}`);
  
  return res.json();
}
checkPolicyCompliance.maxRetries = 3;

/**
 * Step 5: Generate Redline Document
 * 
 * Creates a diff document showing changes between:
 * - Original contract text
 * - Revised contract text (after edits)
 * 
 * Includes reason codes for each change, which helps track:
 * - Why changes were made
 * - Who requested the change
 * - What clause was modified
 * 
 * This is useful for contract negotiation and version control.
 */
export async function generateRedline(input: {
  originalText: string;
  revisedText: string;
  reasonCodes?: string[];
}) {
  "use step";
  await new Promise(resolve => setTimeout(resolve, 2500));
  const res = await fetch(`${BASE}/api/mocks/newfront/contracts/redline`, {
    method: 'POST',
    body: JSON.stringify(input),
    headers: { 'content-type': 'application/json' },
  });
  
  if (!res.ok) throw new Error(`generateRedline failed: ${res.status}`);
  
  return res.json();
}
generateRedline.maxRetries = 3;

/**
 * Step 6: Send Approval Request
 * 
 * Routes approval requests to the appropriate approver:
 * - Contract Manager: Reviews contracts from requesters
 * - Legal: Must approve all contracts before publication
 * - Counterparty: External party review (separate workflow)
 * 
 * Creates a unique approval token and sends an email with:
 * - Approval URL (links to approval page)
 * - Contract details
 * - Analysis results (clauses, structured data)
 * 
 * The approval is handled via workflow hooks that pause execution
 * until the approver responds.
 */
export async function sendApprovalRequest(
  token: string,
  approverEmail: string,
  approverRole: string,
  requestDetails: any
) {
  "use step";
  
  const approvalUrl = `${BASE}/newfront/contracts/approve?token=${encodeURIComponent(token)}`;
  
  await sendApprovalEmail(approverEmail, approvalUrl, approverRole, requestDetails);
}

/**
 * Helper Step: Send Approval Email
 * 
 * Sends an email notification to the approver with FULL CONTEXT:
 * - Full contract text (so human can review everything, not just agent findings)
 * - Agent analysis results (clause validation)
 * - Structured data (parties, dates, amounts)
 * - All references and context
 * 
 * This ensures humans can catch what agents might have missed.
 * 
 * This is a separate step to allow for retry logic if email delivery fails.
 */
export async function sendApprovalEmail(
  email: string,
  url: string,
  role: string,
  details: any
) {
  
  // Build comprehensive email body with FULL CONTEXT
  const emailBody = `Contract Approval Required - ${role} Review

Contract ID: ${details.contractId || 'N/A'}
Contract Type: ${details.contractType || 'N/A'}

=== FULL CONTRACT TEXT ===
${details.draft || details.contractText || 'Contract text not available'}

${details.structuredData ? `=== STRUCTURED DATA ===
Parties: ${JSON.stringify(details.structuredData.parties || [], null, 2)}
Dates: ${JSON.stringify(details.structuredData.dates || [], null, 2)}
Amounts: ${JSON.stringify(details.structuredData.amounts || [], null, 2)}
` : ''}

${details.clauseValidation ? `=== CLAUSE VALIDATION RESULTS ===
${details.clauseValidation.validationText || 'No validation text'}
Required Clauses: ${(details.clauseValidation.required || []).join(', ') || 'None'}
Missing Clauses: ${(details.clauseValidation.missing || []).join(', ') || 'None'}
Present Clauses: ${(details.clauseValidation.present || []).join(', ') || 'None'}
Optional Clauses: ${(details.clauseValidation.optional || []).join(', ') || 'None'}
${details.clauseValidation.issues ? `Issues: ${JSON.stringify(details.clauseValidation.issues, null, 2)}` : ''}
` : ''}

${details.legalApproval ? `=== PREVIOUS APPROVALS ===
Legal Approval: ${JSON.stringify(details.legalApproval, null, 2)}
` : ''}

Please review the FULL contract above, not just the agent's findings. You may identify additional issues the agents missed.

Approval URL: ${url}`;

  await fetch(`${NOTIFY}/email`, {
    method: 'POST',
    body: JSON.stringify({
      to: email,
      subject: `Contract Approval Required - ${role} Review - Newfront - ${details.contractId || ''}`,
      body: emailBody,
      url,
      details: { ...details, role },
    }),
    headers: { 'content-type': 'application/json' },
  });
}

/**
 * Step 7: Archive Contract
 * 
 * Stores the final approved contract with:
 * - Contract ID and version
 * - Final contract text
 * - Complete metadata (type, jurisdiction, product, analysis results)
 * - Approval history (who approved, when, comments)
 * 
 * This creates a permanent record for audit and compliance purposes.
 */
export async function archiveContract(input: {
  contractId: string;
  finalVersion: string;
  metadata: any;
}) {
  "use step";
  await new Promise(resolve => setTimeout(resolve, 1500));
  const res = await fetch(`${BASE}/api/mocks/newfront/contracts/archive`, {
    method: 'POST',
    body: JSON.stringify(input),
    headers: { 'content-type': 'application/json' },
  });
  
  if (!res.ok) throw new Error(`archiveContract failed: ${res.status}`);
  
  return res.json();
}
archiveContract.maxRetries = 3;
