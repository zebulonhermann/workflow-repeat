/**
 * Contract Management Agent
 * 
 * This is the main AI agent that powers the contract management chatbot.
 * It uses AI SDK 6's ToolLoopAgent with dynamic model routing capabilities.
 * 
 * Key Features:
 * - Dynamic model selection based on task complexity
 * - Runtime model selection (user can choose model in UI)
 * - Predetermined task complexity (developer-set based on tools/prompts)
 * - Persona-aware contract drafting with guardrails
 * 
 * Model Routing Strategy:
 * - Simple tasks (questions, explanations) → cheap models (gpt-4o-mini)
 * - Complex tasks (contract drafting, clause validation) → premium models (claude-sonnet-4.5)
 * 
 * The agent exposes a single tool: contractDraft, which triggers the full workflow.
 */

import { ToolLoopAgent } from 'ai'
import { z } from 'zod';
import { ContractDraftInput } from '../steps';
import { contractManagement as contractManagementWorkflow } from '../workflow';
import { tool } from 'ai';
import { start } from 'workflow/api';

/**
 * Contract Draft Tool
 * 
 * This tool allows the agent to initiate a contract drafting workflow.
 * It requires approval before execution (needsApproval: true).
 * 
 * When called, it:
 * 1. Validates the input (requester, contract type, parties, etc.)
 * 2. Starts the contractManagement workflow
 * 3. Returns a runId and contractId for tracking
 */
const contractDraftTool = tool({
    description: 'Draft a new contract from templates with guardrails, clause validation, and persona-based access control',
    inputSchema: z.object({
        requesterId: z.string(),
        requesterRole: z.enum(['requester', 'contract_manager', 'legal']),
        contractType: z.string().describe('Type of contract: NDA, MSA, SOW, etc.'),
        jurisdiction: z.string().describe('Jurisdiction code: US-CA, EU-GDPR, etc.'),
        product: z.string().describe('Product category: insurance, brokerage, etc.'),
        parties: z.object({
            party1: z.object({ name: z.string(), role: z.string() }),
            party2: z.object({ name: z.string(), role: z.string() }),
        }),
        keyTerms: z.object({
            amount: z.number().optional(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
            paymentTerms: z.string().optional(),
        }).optional(),
        requesterEmail: z.string().email(),
    }),
    execute: async (input: ContractDraftInput) => {
        // Log the tool execution
        console.log('[Contract Agent] Draft tool called', {
            requesterId: input.requesterId,
            role: input.requesterRole,
            contractType: input.contractType,
        });
        
        const run = await start(contractManagementWorkflow, [input]);
        return { runId: run.runId, contractId: `contract:${input.requesterId}:${Date.now()}` };
    },
    needsApproval: true,
});

/**
 * Call Options Schema for AI SDK 6
 * 
 * This schema defines the runtime inputs that can be passed to dynamically configure the agent.
 * These options are passed via the callOptions parameter when calling agent.generate() or agent.stream().
 * 
 * Key capability demonstrated:
 * - selectedModel: Enables runtime model selection (user-selectable in chat UI)
 * 
 * Note: Task complexity is determined automatically based on the tool being used and prompt content.
 */
const callOptionsSchema = z.object({
    selectedModel: z.string().optional(),
});

/**
 * Determine Task Complexity
 * 
 * This function analyzes the prompt and available tools to determine if the task is simple or complex.
 * This is PREDETERMINED logic set by the developer, not based on runtime user input.
 * 
 * Complexity Levels:
 * - Simple: Questions, explanations, definitions → use cheap models (gpt-4o-mini)
 * - Complex: Contract drafting, clause validation, redlining → use premium models (claude-sonnet-4.5)
 * 
 * The logic checks for keywords in the prompt to classify the task type.
 */
function determineTaskComplexity(prompt: string | Array<any> | undefined, tools: Record<string, any>): 'simple' | 'complex' {
    // If the contractDraft tool is available, this agent handles complex contract workflows
    if ('contractDraft' in tools) {
        if (prompt) {
            const promptText = typeof prompt === 'string' 
                ? prompt 
                : JSON.stringify(prompt);
            const lowerPrompt = promptText.toLowerCase();
            
            // Simple tasks: Questions and explanations about contracts
            // These don't require complex legal reasoning, so use cheap models
            if (
                lowerPrompt.includes('what is') ||
                lowerPrompt.includes('explain') ||
                lowerPrompt.includes('tell me about') ||
                lowerPrompt.includes('how does') ||
                lowerPrompt.includes('what are')
            ) {
                return 'simple';
            }
            
            // Complex tasks: Actual contract operations that require legal reasoning
            // These need premium models for better accuracy and compliance
            if (
                lowerPrompt.includes('draft') ||
                lowerPrompt.includes('create') ||
                lowerPrompt.includes('contract') ||
                lowerPrompt.includes('redline') ||
                lowerPrompt.includes('analyze') ||
                lowerPrompt.includes('review') ||
                lowerPrompt.includes('validate')
            ) {
                return 'complex';
            }
        }
        
        // Default: If contract drafting tool is available and prompt is unclear, assume complex
        return 'complex';
    }
    
    // No contract drafting tool = simple tasks
    return 'simple';
}

/**
 * Model Selection Strategy
 * 
 * This function determines which model to use based on task complexity.
 * The actual model selection happens in prepareCall, which considers:
 * 1. Runtime model selection (user selection in UI - highest priority)
 * 2. Task complexity (predetermined by developer - fallback)
 * 
 * Model Selection Priority:
 * 1. User-selected model (if provided in callOptions) - highest priority
 * 2. Task complexity-based selection (if no user selection) - fallback
 * 
 * This function is the fallback when no runtime selection is provided.
 */
function selectModel(taskComplexity: 'simple' | 'complex'): string {
    // Model switching based on predetermined task complexity
    if (taskComplexity === 'complex') {
        // Complex tasks: Use premium models for better legal reasoning and compliance
        return 'anthropic/claude-sonnet-4.5';
    } else {
        // Simple tasks: Use cheaper models for cost efficiency
        return 'openai/gpt-4o-mini';
    }
}

/**
 * Create Contract Management Agent
 * 
 * Creates a ToolLoopAgent configured for contract management with:
 * - Dynamic model switching based on task complexity
 * - Runtime model selection (user can choose in UI)
 * - Persona-aware contract drafting with guardrails
 * - Single tool: contractDraft (triggers full workflow)
 * 
 * This demonstrates AI SDK 6's callOptions feature which allows:
 * 1. Type-safe runtime configuration via callOptionsSchema
 * 2. Dynamic model selection via prepareCall
 * 3. Runtime model selection (user-selectable in chat UI)
 * 4. Predetermined task complexity based on tools/prompts (developer-set)
 * 
 * @param defaultModelId - Fallback model if no callOptions are provided (default: gpt-4o-mini)
 * @returns Configured ToolLoopAgent instance
 */
export function createContractAgent(defaultModelId: string = 'openai/gpt-4o-mini') {
    
    const baseSystemPrompt = `You are an AI contract management assistant for Newfront, an insurance brokerage and risk management platform.

**Your role:** Help teams draft, review, negotiate, and manage contracts with guardrails, clause validation, and persona-based access control.

**Newfront's Contract Management Context:**
- Target users: Requesters (draft only), Contract Managers (edit/negotiate), Legal (approve/publish)
- Key contract types: NDAs, MSAs, SOWs, Insurance agreements, Brokerage contracts
- Jurisdictions: US (state-specific), EU (GDPR), International
- Products: Insurance policies, Brokerage services, Risk management services

**Core Capabilities:**
- **Guarded Drafting:** Generate contracts from approved templates and clause libraries
- **Clause Validation:** Validate required clauses, check jurisdiction-specific requirements
- **Persona-Based Access:** Enforce role-based permissions (requester cannot approve, legal cannot draft)
- **Model Routing:** Use cheap models for extraction/structure, premium models for legal reasoning
- **Redline Assistance:** Generate diffs with reason codes, track changes between versions
- **Audit Trail:** Log all actions with persona, timestamp, model used, cost, latency
- **Workflow Orchestration:** Long-running flows with human-in-the-loop checkpoints

**Persona Permissions:**
- **Requester:** Can draft contracts, view status, cannot approve or publish
- **Contract Manager:** Can draft, edit, negotiate, review, cannot approve/publish
- **Legal:** Can approve, publish, review all contracts, cannot draft (must review)

**Your Approach:**
1. Ask clarifying questions to gather complete contract details (type, jurisdiction, parties, key terms)
2. Check persona permissions before allowing actions
3. Draft contracts from approved templates with required/optional clauses
4. Extract structured data (parties, dates, amounts) using cheap models
5. Validate clauses and check for missing required clauses
6. Route approvals to appropriate personas (manager → legal)
7. Generate redlines with reason codes for changes
8. Provide clear, actionable recommendations with expected impact
9. Log all actions for audit trail (persona, action, model, cost, latency)

**Demo Context:** 
This is a demonstration of AI SDK 6, Workflows, and AI Gateway capabilities. Showcase persona-based access control, model routing (cheap vs premium), guardrailed generation, clause validation, and comprehensive audit trails.

Be professional, legally-aware, and compliance-focused. Guide users through contract management with clarity and confidence. Always format responses in clean, readable markdown with action items where appropriate.`;

    const agent = new ToolLoopAgent({
        // Default model (used when no callOptions are provided)
        model: defaultModelId,
        
        // Define the schema for callOptions - enables type-safe runtime configuration
        callOptionsSchema,
        
        instructions: baseSystemPrompt,
        
        tools: {
            contractDraft: contractDraftTool,
        },
        
        /**
         * prepareCall: Dynamically Configure Agent Before Each Call
         * 
         * This function is called BEFORE each agent.generate() or agent.stream() call,
         * allowing you to modify the agent configuration based on runtime context.
         * 
         * What can be modified:
         * - model: Switch between cheap/expensive models based on task complexity
         * - instructions: Customize system prompts based on context
         * - temperature: Adjust creativity (higher for complex tasks)
         * - maxOutputTokens: Adjust response length limits
         * 
         * Model Selection Priority:
         * 1. Runtime model selection (options?.selectedModel) - user choice from UI
         * 2. Task complexity-based selection (determineTaskComplexity) - developer logic
         * 
         * This enables cost optimization: use cheap models for simple tasks, premium for complex ones.
         */
        prepareCall: ({ options, model, instructions, prompt, tools, ...settings }) => {
            // Step 1: Determine task complexity (predetermined by developer based on prompt/tools)
            const taskComplexity = determineTaskComplexity(prompt, tools || {});
            
            // Step 2: Select model (runtime selection takes priority, fallback to complexity-based)
            const selectedModel = options?.selectedModel || selectModel(taskComplexity);

            // Log model selection for observability and debugging
            console.log(`[Contract Agent] Model Selection`, {
                selectedModel,
                taskComplexity, // Predetermined by developer
                runtimeSelection: options?.selectedModel || 'auto',
            }, '\n\n');

            // Step 3: Enhance instructions with model information
            const newInstructions = `${instructions} \n\n You are using the ${selectedModel} model. For contract drafting and clause validation, inform the user about model selection and cost implications.`;

            // Step 4: Return configured agent settings
            return {
                ...settings,
                tools,
                prompt,
                model: selectedModel, // Use selected model
                instructions: newInstructions,
                // Adjust generation parameters based on task complexity
                // Complex tasks: higher temperature (more creative), more tokens (longer responses)
                // Simple tasks: lower temperature (more focused), fewer tokens (shorter responses)
                temperature: taskComplexity === 'complex' ? 0.7 : 0.3,
                maxOutputTokens: taskComplexity === 'complex' ? 4096 : 2048,
            };
        },
        
        providerOptions: {
            gateway: {
                order: ['bedrock', 'openai'],
                only: ['bedrock', 'openai'],
            }
        }
    })

    return agent;
}
