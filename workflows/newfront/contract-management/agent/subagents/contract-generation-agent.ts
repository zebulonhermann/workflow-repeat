/**
 * Contract Generation Agent
 * 
 * This agent generates a 1-page contract draft based on user requirements.
 * It uses a template lookup tool to get the basic structure, then generates
 * the contract content with user-provided information.
 * 
 * Key Features:
 * - Looks up template structure for contract type
 * - Generates contract with user requirements (parties, dates, amounts, etc.)
 * - Creates a simple 1-page contract (for demo purposes)
 * - Focuses on drafting, not validation (validation happens separately)
 * 
 * Model: gpt-4o-mini (cheap model for simple generation)
 * 
 * This is called as a durable step in the workflow.
 */

import { ToolLoopAgent, tool, stepCountIs } from 'ai';
import { z } from 'zod';
import { FatalError, fetch } from 'workflow';

const BASE = process.env.APP_BASE_URL ?? 'http://localhost:3000';
const TEMPLATES = process.env.TEMPLATES ?? `${BASE}/api/mocks/newfront/contracts/templates`;

/**
 * Create Contract Generation Agent
 * 
 * Creates a ToolLoopAgent configured for contract generation with one tool:
 * - lookupTemplate - Gets template structure for the contract type
 * 
 * The agent uses the template structure to generate a contract draft.
 * 
 * @returns Configured ToolLoopAgent instance
 */
export function createContractGenerationAgent() {
  return new ToolLoopAgent({
    model: 'openai/gpt-4o-mini', // Cheap model for simple generation
    instructions: `You are a contract drafting specialist. Your job is to generate a simple 1-page contract draft based on user requirements.

Your approach:
1. Use lookupTemplate to get the basic template structure for the contract type
2. Generate a contract that includes:
   - All parties and their roles
   - Key terms (amounts, dates, payment terms)
   - Basic structure from the template
   - Common clauses appropriate for the contract type
3. Keep it to 1 page - be concise but complete
4. Focus on creating a draft, not validating it (validation happens separately)
5. Return the contract draft.

Be clear, professional, and include all essential information.`,
    
    tools: {
      // Tool: Look up template structure for contract type
      lookupTemplate: tool({
        description: 'Look up the template structure for a specific contract type',
        inputSchema: z.object({ 
          contractType: z.string(),
          jurisdiction: z.string().optional(),
        }),
        execute: async ({ contractType, jurisdiction }) => {
          const res = await fetch(`${TEMPLATES}/lookup`, {
            method: 'POST',
            body: JSON.stringify({ contractType, jurisdiction }),
            headers: { 'content-type': 'application/json' },
          });
          if (!res.ok) throw new Error(`Template lookup failed: ${res.status}`);
          return res.json();
        }
      }),
    }
  });
}

/**
 * Generate Contract Draft
 * 
 * Main function that generates a contract draft using the contract generation agent.
 * 
 * Process:
 * 1. Creates a contract generation agent
 * 2. Generates contract using the agent's template lookup tool
 * 3. Returns the generated contract text
 * 
 * @param input - Contract generation requirements
 * @returns Generated contract text
 */
export async function generateContractDraft(input: {
  contractType: string;
  jurisdiction: string;
  product: string;
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
}) {
  
  const agent = createContractGenerationAgent();
  // Generate contract using the agent
  const result = await agent.generate({
    prompt: `Generate a 1-page ${input.contractType} contract for ${input.jurisdiction}.

Parties:
- ${input.parties.party1.name} (${input.parties.party1.role})
- ${input.parties.party2.name} (${input.parties.party2.role})

Key Terms:
${input.keyTerms?.amount ? `- Amount: $${input.keyTerms.amount.toLocaleString()}` : ''}
${input.keyTerms?.startDate ? `- Start Date: ${input.keyTerms.startDate}` : ''}
${input.keyTerms?.endDate ? `- End Date: ${input.keyTerms.endDate}` : ''}
${input.keyTerms?.paymentTerms ? `- Payment Terms: ${input.keyTerms.paymentTerms}` : ''}

Product: ${input.product}

Use your lookupTemplate tool to get the template structure, then generate a complete 1-page contract that includes all the above information. Keep it concise but professional.`
  });
  return {
    contractText: result.text,
    templateId: `${input.contractType}-${input.jurisdiction}-${Date.now()}`,
    generatedAt: new Date().toISOString(),
  };
}
