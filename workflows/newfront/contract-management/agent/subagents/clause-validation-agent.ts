/**
 * Clause Validation Agent
 * 
 * This agent validates that contracts contain all required clauses for their type and jurisdiction.
 * It uses a ToolLoopAgent with tools to conditionally look up clause definitions and check jurisdiction rules.
 * 
 * Key Features:
 * - Agent analyzes contract and identifies which clauses to validate (not all)
 * - Conditional tool calls: agent decides which clauses to look up based on contract content
 * - Agent compares required clauses vs present clauses
 * - Agent checks for alternatives if required clauses are missing
 * - Uses structured output for reliable parsing
 * - Requires human approval for high-risk validations
 * 
 * Model: gpt-4o-mini (cheap model since validation is rule-based)
 * 
 * This is called as a durable step in the workflow.
 */

import { ToolLoopAgent, tool, stepCountIs, Output } from 'ai';
import { z } from 'zod';
import { defineHook, FatalError, fetch } from 'workflow';


const BASE = process.env.APP_BASE_URL ?? 'http://localhost:3000';
const CLAUSES = process.env.CLAUSES ?? `${BASE}/api/mocks/newfront/contracts/clauses`;

/**
 * Hook for Clause Validation Approval
 * 
 * Used when high-risk clause validation issues are detected.
 * Requires human (legal team) approval before proceeding.
 */
export const clauseValidationApprovalHook = defineHook({
  schema: z.object({
    approved: z.boolean(),
    comment: z.string().optional(),
    by: z.string().email().optional(),
  }),
});

/**
 * Create Clause Validation Agent
 * 
 * Creates a ToolLoopAgent configured for clause validation with two tools:
 * 1. lookupClause - Looks up clause definitions from the clause library
 * 2. checkJurisdictionRules - Verifies jurisdiction-specific requirements
 * 
 * The agent uses these tools to validate contracts and identify missing clauses.
 * 
 * @returns Configured ToolLoopAgent instance
 */
export function createClauseValidationAgent() {
  return new ToolLoopAgent({
    model: 'openai/gpt-5-mini', // Cheap model for rule-based validation
    instructions: `You are a contract clause validation specialist. Your job is to validate that contracts contain all required clauses for their type and jurisdiction.

Your approach (use conditional tool calls based on what you find):
1. First, analyze the contract text to identify which clauses are present
2. Use checkJurisdictionRules to get the complete list of required clauses for this contract type and jurisdiction
3. Compare: required clauses vs clauses present in contract
4. For each missing required clause, use lookupClause to:
   - Verify the clause definition
   - Check if there's an alternative clause that might serve the same purpose
   - Determine if the missing clause is critical
5. For optional clauses, check if they should be considered based on the contract context

CRITICAL: After you have gathered the information you need from tools:
- STOP making tool calls immediately
- Generate structured JSON output matching this EXACT schema:
  {
    "required": ["array", "of", "required", "clause", "names"],
    "optional": ["array", "of", "optional", "clause", "names"],
    "missing": ["array", "of", "missing", "required", "clause", "names"],
    "present": ["array", "of", "clause", "names", "found", "in", "contract"],
    "issues": [
      {
        "clause": "clause name",
        "severity": "high" | "medium" | "low",
        "description": "description of the issue",
        "recommendation": "recommendation to fix"
      }
    ]
  }
- ALL fields are REQUIRED: required, optional, missing, present, issues
- issues array must contain objects with: clause (string), severity ("high"|"medium"|"low"), description (string), recommendation (string)
- Do NOT continue making tool calls after you have the information needed

IMPORTANT: Limit yourself to 3 issues for demo purposes.

Make conditional tool calls - only look up clauses that you need to validate. Once you have the information, STOP and return the structured JSON output.`,
    
    // Structured output specification - agent will generate structured data directly
    output: Output.object({
      schema: z.object({
        required: z.array(z.string()).describe('List of all required clauses for this contract type'),
        optional: z.array(z.string()).describe('List of optional clauses that should be considered'),
        missing: z.array(z.string()).describe('List of required clauses that are missing from the contract'),
        present: z.array(z.string()).describe('List of clauses that are present in the contract'),
        issues: z.array(z.object({
          clause: z.string(),
          severity: z.enum(['high', 'medium', 'low']),
          description: z.string(),
          recommendation: z.string(),
        })).describe('List of validation issues found')
        
      }),
    }),
    
    tools: {
      // Tool: Look up clause definitions from the clause library
      lookupClause: tool({
        description: 'Look up a clause definition from the clause library and return structured output',
        inputSchema: z.object({ 
          clauseName: z.string(),
          contractType: z.string(),
        }),
        outputSchema: z.object({
          clauseName: z.string(),
          contractType: z.string(),
          definition: z.object({
            name: z.string(),
            description: z.string(),
            required: z.boolean(),
            alternatives: z.array(z.string()).optional(),
          }),
        }).describe('Clause definition with name, description, required flag, and optional alternatives'),
        execute: async ({ clauseName, contractType }) => {// This is a durable step, can be retried
          const res = await fetch(`${CLAUSES}/lookup`, {
            method: 'POST',
            body: JSON.stringify({ clauseName, contractType }),
            headers: { 'content-type': 'application/json' },
          });
          if (!res.ok) {
            throw new Error(`Clause lookup API failed: ${res.status} ${res.statusText}`);
          }
          return await res.json();
        }
      }),
      
      // Tool: Check jurisdiction-specific requirements
      checkJurisdictionRules: tool({
        description: 'Check jurisdiction-specific clause requirements and return structured output',
        inputSchema: z.object({ 
          jurisdiction: z.string(),
          contractType: z.string(),
        }),
        outputSchema: z.object({
          jurisdiction: z.string(),
          contractType: z.string(),
          required: z.array(z.string()).describe('List of all required clauses for this contract type and jurisdiction'),
          optional: z.array(z.string()).describe('List of optional clauses that may be included'),
          jurisdictionSpecific: z.array(z.string()).describe('List of jurisdiction-specific clauses that are required'),
        }).describe('Jurisdiction-specific clause requirements including required, optional, and jurisdiction-specific clauses'),
        execute: async ({ jurisdiction, contractType }) => {// This is a durable step, can be retried
          const res = await fetch(`${CLAUSES}/jurisdiction`, {
            method: 'POST',
            body: JSON.stringify({ jurisdiction, contractType }),
            headers: { 'content-type': 'application/json' },
          });
          if (!res.ok) {
            throw new Error(`Jurisdiction check API failed: ${res.status} ${res.statusText}`);
          }
          return await res.json();
          }
      }),
    },
    stopWhen: stepCountIs(15),
    // Force agent to stop making tool calls after gathering information
    prepareStep: ({ steps, stepNumber }) => {
      // Count tool calls
      const toolCallCount = steps.filter(step => step.finishReason === 'tool-calls').length;
      
      // Check if we've called checkJurisdictionRules
      const hasJurisdictionRules = steps.some(step => {
        const toolCalls = step.content?.filter((part: any) => part.type === 'tool-call');
        return toolCalls?.some((call: any) => call.toolName === 'checkJurisdictionRules');
      });
      
      // Check how many lookupClause calls we've made
      const lookupClauseCount = steps.reduce((count, step) => {
        const toolCalls = step.content?.filter((part: any) => part.type === 'tool-call');
        const lookupCalls = toolCalls?.filter((call: any) => call.toolName === 'lookupClause').length || 0;
        return count + lookupCalls;
      }, 0);
      
      // After we have jurisdiction rules and have looked up a few clauses (max 3), force stop
      if (hasJurisdictionRules && (lookupClauseCount >= 3 || toolCallCount >= 5)) {
        return {
          toolChoice: 'none' as const, // Force agent to stop making tool calls and generate structured output
          system: `You have gathered all the information you need from tools. You MUST now generate structured JSON output matching this exact schema:
{
  "required": ["array", "of", "required", "clause", "names"],
  "optional": ["array", "of", "optional", "clause", "names"],
  "missing": ["array", "of", "missing", "required", "clause", "names"],
  "present": ["array", "of", "clause", "names", "found", "in", "contract"],
  "issues": [
    {
      "clause": "clause name",
      "severity": "high" | "medium" | "low",
      "description": "description of the issue",
      "recommendation": "recommendation to fix"
    }
  ]
}
ALL fields are REQUIRED. Generate the structured output now.`,
        };
      }
      
      return undefined; // Continue normally
    },
  });
}

/**
 * Validate Clauses
 * 
 * Main function that validates contract clauses using the clause validation agent.
 * 
 * Process:
 * 1. Creates a clause validation agent
 * 2. Agent analyzes contract and makes conditional tool calls
 * 3. Agent generates structured validation results
 * 4. Checks for high-risk issues (critical, missing required clauses, jurisdiction violations)
 * 5. If high-risk issues found, requires human approval via hook (with full context)
 * 6. Returns validation results (required, optional, missing clauses)
 * 
 * @param input - Contract details including text, type, jurisdiction, product, and ID
 * @returns Validation results with required, optional, and missing clauses
 */
export async function validateClauses(input: {
  contractText: string;
  contractType: string;
  jurisdiction: string;
  product: string;
  contractId: string;
}) {
  // NOTE: This function is called from within a step (validateClauses in steps.ts),
  // so "use step" would be a no-op here. The step function in steps.ts has "use step".
    
    const agent = createClauseValidationAgent();
    
    let agentResult;
    try {
      // Step 1: Agent analyzes contract and makes conditional tool calls
      agentResult = await agent.generate({
      prompt: `Validate the clauses in this ${input.contractType} contract for ${input.jurisdiction}.

Contract text:
${input.contractText}

Your task:
1. Analyze the contract to identify which clauses are present
2. Use checkJurisdictionRules to get required clauses for ${input.contractType} in ${input.jurisdiction}
3. Compare required vs present clauses
4. For missing clauses, use lookupClause to check definitions and alternatives (limit to 3 missing clauses)
5. Identify optional clauses that should be considered

CRITICAL: After gathering information from tools, you MUST:
- STOP making tool calls
- Generate structured JSON output matching this EXACT format:
  {
    "required": ["array", "of", "strings"],
    "optional": ["array", "of", "strings"],
    "missing": ["array", "of", "strings"],
    "present": ["array", "of", "strings"],
    "issues": [
      {
        "clause": "string",
        "severity": "high" | "medium" | "low",
        "description": "string",
        "recommendation": "string"
      }
    ]
  }
- ALL fields are REQUIRED. issues array must have objects with clause, severity, description, recommendation.
- Do NOT continue making tool calls after you have the information

IMPORTANT: Limit yourself to 3 issues for demo purposes. Once you have the information, STOP and return structured JSON output.`
      });
    } catch (error) {
      throw new FatalError(`validateClauses failed: agent.generate() threw error for contractId: ${input.contractId}. Error: ${error instanceof Error ? error.message : String(error)}`);
    }

    
    const validationResult = agentResult.output;

    // Return structured validation results
    // Note: Approval handling for high-risk issues is done in the workflow function,
    // not here, because hooks can only be created in workflow functions, not steps
    return {
      required: validationResult.required,
      optional: validationResult.optional,
      missing: validationResult.missing,
      present: validationResult.present,
      issues: validationResult.issues,
      // Include flag to indicate if approval is needed (for workflow to handle)
      needsApproval: validationResult.issues.some((i: { severity: string }) => i.severity === 'high') ||
                     validationResult.missing.length > 0,
    };

}
