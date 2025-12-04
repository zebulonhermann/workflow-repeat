# Customization Guide: Adapting This Demo for a New Customer

This guide will help you adapt this Vercel AI Gateway and Workflows demo for a new customer and use case while preserving all technical patterns, code organization, and functionality demonstrations.

## Overview

This project demonstrates:
- **Vercel AI Gateway**: Model routing, cost optimization, and observability
- **Vercel Workflows**: Long-running, durable workflows with human-in-the-loop approvals
- **AI SDK 6**: ToolLoopAgent with dynamic model selection and runtime configuration
- **Persona-based access control**: Role-based permissions and guardrails
- **Model routing strategies**: Cheap models for simple tasks, premium models for complex reasoning

## Before You Begin

### Required Information

Before starting customization, gather:

1. **Customer Name**: The name of the customer/company (e.g., "Newfront" → "YourCustomer")
2. **Use Case**: What workflow/problem are you solving? (e.g., "Contract Management", "Insurance Renewals")
3. **Domain Context**: Industry, terminology, and business processes
4. **Personas/Roles**: Who are the users and what can they do? (e.g., requester, manager, legal)
5. **Workflow Steps**: What are the key steps in the process? (e.g., draft → review → approve → archive)
6. **Key Features to Showcase**: What AI Gateway/Workflows features should be highlighted?

### Optional: Use Case Details

If you have a specific use case in mind, provide:
- **Workflow description**: Step-by-step process flow
- **Tools/actions needed**: What operations should the agent perform?
- **Approval checkpoints**: Where do humans need to approve?
- **Model routing strategy**: Which tasks use cheap vs premium models?
- **KPIs/metrics**: What metrics should the dashboard show?

---

## Step-by-Step Customization Process

### Step 1: Replace Customer Name Throughout the Codebase

The current customer is **"newfront"** (case-sensitive). You need to replace it with your customer name in:

#### 1.1 Directory Structure

**Create new customer directories:**
\`\`\`bash
# Workflows
workflows/{customer}/{workflow-name}/

# API Routes
app/api/chat/{customer}/
app/api/workflows/{customer}/
app/api/mocks/{customer}/

# Pages
app/{customer}/

# Components
components/{customer}/
\`\`\`

**Example:** If customer is "acme", create:
- `workflows/acme/contract-management/`
- `app/api/chat/acme/`
- `app/acme/contracts/`
- `components/acme/contract-chatbot.tsx`

#### 1.2 File Contents

Search and replace `newfront` → `{customer}` in:
- Import paths
- API route paths
- Component names
- Workflow references
- Database queries (if customer-specific)

**Files to update:**
- `next.config.ts` - Redirect destination
- All files in `workflows/{customer}/`
- All files in `app/api/chat/{customer}/`
- All files in `app/api/workflows/{customer}/`
- All files in `app/{customer}/`
- All files in `components/{customer}/`

---

### Step 2: Customize Workflow Content

#### 2.1 Workflow Structure (`workflows/{customer}/{workflow-name}/`)

**Files to modify:**

1. **`workflow.ts`** - Main orchestration
   - Update workflow function name and description
   - Modify workflow steps to match your use case
   - Update step names and logic
   - Adjust approval checkpoints and timeouts
   - Update error handling and retry logic

2. **`steps.ts`** - Durable workflow steps
   - Define input/output types for your workflow
   - Update step function names and implementations
   - Modify API calls to match your domain
   - Update data structures (e.g., contract → your entity)

3. **`hooks.ts`** - Human-in-the-loop approvals
   - Update hook names (e.g., `contractApprovalHook` → `{entity}ApprovalHook`)
   - Modify approval token format
   - Update approval request logic

4. **`agent/{workflow-name}-agent.ts`** - Main agent
   - **CRITICAL**: Update the system prompt with your customer's context
   - Replace domain terminology (e.g., "contract" → your entity)
   - Update persona descriptions and permissions
   - Modify tool definitions to match your workflow
   - Update model routing strategy if needed
   - Keep `ToolLoopAgent` structure intact

5. **`agent/subagents/`** - Specialized agents (if applicable)
   - Update agent names and purposes
   - Modify system prompts for your domain
   - Update tool definitions
   - Keep the subagent pattern (if using)

#### 2.2 System Prompt Template

The system prompt in your main agent should include:

\`\`\`typescript
const baseSystemPrompt = `You are an AI assistant for {CustomerName}, {customer description}.

**Your role:** {What the agent does}

**{CustomerName}'s {Domain} Context:**
- Target users: {List personas and their roles}
- Key {entities}: {List types}
- {Domain-specific categories}: {List}
- Products/Services: {List}

**Core Capabilities:**
- **{Feature 1}:** {Description}
- **{Feature 2}:** {Description}
- **Model Routing:** {Strategy}
- **{Feature 3}:** {Description}

**Persona Permissions:**
- **{Persona 1}:** {What they can do}
- **{Persona 2}:** {What they can do}

**Your Approach:**
1. {Step 1}
2. {Step 2}
...

**Demo Context:** 
This is a demonstration of AI SDK 6, Workflows, and AI Gateway capabilities. Showcase {key features to highlight}.

Be {tone/voice}. {Additional guidance}.`;
\`\`\`

---

### Step 3: Update API Routes

#### 3.1 Chat API Route (`app/api/chat/{customer}/{workflow}/route.ts`)

**What to change:**
- Import path to your agent: `@/workflows/{customer}/{workflow}/agent/{workflow}-agent`
- Agent creation function call
- Keep the streaming, message persistence, and validation logic

**What to preserve:**
- `createAgentUIStream` usage
- Message validation and persistence
- Model selection handling
- `onFinish` callback for saving messages

#### 3.2 Workflow API Routes (`app/api/workflows/{customer}/{workflow}/`)

**What to change:**
- Import path to your workflow
- Import path to your hooks
- Approval endpoint logic (if workflow-specific)
- Token format (if custom)

**What to preserve:**
- Hook creation and resume pattern
- Approval request handling
- Error handling

#### 3.3 Mock API Routes (`app/api/mocks/{customer}/`)

**What to change:**
- Mock data structure to match your domain
- Endpoint paths to match your workflow tools
- Response schemas

**What to preserve:**
- Mock API pattern (if using for demo)
- Response format consistency

---

### Step 4: Customize UI Components

#### 4.1 Main Page (`app/{customer}/{workflow}/page.tsx`)

**What to change:**
- Page title and description
- KPI cards (metrics relevant to your use case)
- Table columns and data (if showing entity list)
- Feature cards (highlight your workflow features)
- Navigation and branding

**KPI Examples to customize:**
- Time metrics (e.g., "Time to First Draft")
- Efficiency metrics (e.g., "Review Time Reduction")
- Cost metrics (e.g., "Cost per {Entity}")
- Quality metrics (e.g., "Auto-Resolved {Issues}")
- Latency metrics (e.g., "Avg Latency per Step")

#### 4.2 Chatbot Component (`components/{customer}/{workflow}-chatbot.tsx`)

**What to change:**
- Component name
- Persona definitions (`PERSONAS` array)
- Model selection options (if customizing)
- UI labels and terminology
- Chat API endpoint path

**What to preserve:**
- `useChat` hook usage
- Tool approval handling
- Message streaming
- Model selection UI
- Persona selection UI

#### 4.3 Chatbot Wrapper (`components/{customer}/{workflow}-chatbot-wrapper.tsx`)

**What to change:**
- Component name
- Chatbot component import
- Initial messages (if customizing)
- Chat ID generation (if customer-specific)

**What to preserve:**
- Wrapper pattern
- Chat initialization

---

### Step 5: Update Configuration

#### 5.1 Next.js Config (`next.config.ts`)

**What to change:**
- Default redirect destination: `/` → `/{customer}/{workflow}`

#### 5.2 Environment Variables (if needed)

**What to check:**
- `APP_BASE_URL` - Used in workflow approval URLs
- AI Gateway configuration (if customizing)
- Database connection (if customer-specific)

---

### Step 6: Preserve Technical Patterns

#### 6.1 ToolLoopAgent Pattern

**DO NOT CHANGE:**
- `ToolLoopAgent` class usage
- `callOptionsSchema` definition
- `prepareCall` function structure
- `providerOptions.gateway` configuration
- Tool definition with `needsApproval` pattern

**DO CUSTOMIZE:**
- System prompt content
- Tool names and descriptions
- Model selection logic (if different strategy)
- Task complexity determination (if different)

#### 6.2 Workflow Pattern

**DO NOT CHANGE:**
- `'use workflow'` directive
- `start()` function usage for workflows
- Hook creation pattern: `hook.create({ token })`
- Hook resume pattern: `hook.resume(token, data)`
- Approval timeout pattern with `Promise.race()`

**DO CUSTOMIZE:**
- Workflow function name
- Workflow steps and logic
- Input/output types
- Approval checkpoints

#### 6.3 AI Gateway Integration

**DO NOT CHANGE:**
- `gateway()` provider usage
- `providerOptions.gateway` configuration
- Model routing via `order` and `only` arrays

**DO CUSTOMIZE:**
- Model selection strategy (which models for which tasks)
- Gateway configuration (if customer-specific gateway)

#### 6.4 Message Persistence

**DO NOT CHANGE:**
- Database schema (unless adding customer-specific fields)
- Message conversion functions
- Chat persistence pattern

**DO CUSTOMIZE:**
- Chat ID format (if customer-specific)
- Message metadata (if adding custom fields)

---

## Example: Customization Checklist

Use this checklist to ensure you've covered everything:

### Customer Identity
- [ ] Replaced "newfront" with customer name in all directories
- [ ] Updated all import paths
- [ ] Updated all API route paths
- [ ] Updated component names
- [ ] Updated workflow references

### Workflow Content
- [ ] Updated workflow function name and description
- [ ] Modified workflow steps to match use case
- [ ] Updated input/output types
- [ ] Customized approval hooks
- [ ] Updated step implementations

### Agent Customization
- [ ] Rewrote system prompt with customer context
- [ ] Updated persona definitions and permissions
- [ ] Modified tool definitions
- [ ] Updated model routing strategy (if needed)
- [ ] Preserved ToolLoopAgent structure

### UI Customization
- [ ] Updated page title and description
- [ ] Customized KPI cards with relevant metrics
- [ ] Updated table/data display (if applicable)
- [ ] Modified feature cards
- [ ] Updated chatbot personas
- [ ] Changed terminology throughout UI

### Configuration
- [ ] Updated Next.js redirect
- [ ] Verified environment variables
- [ ] Checked API endpoint paths

### Testing
- [ ] Workflow starts correctly
- [ ] Agent responds with correct context
- [ ] Approvals work (human-in-the-loop)
- [ ] Model routing functions
- [ ] UI displays correctly
- [ ] Chat persistence works

---

## Quick Reference: File Locations

### Current Structure (Newfront Example)
\`\`\`
workflows/newfront/contract-management/
  ├── workflow.ts          # Main orchestration
  ├── steps.ts             # Durable steps
  ├── hooks.ts             # Approval hooks
  └── agent/
      ├── contract-agent.ts        # Main agent
      └── subagents/
          ├── clause-validation-agent.ts
          ├── contract-generation-agent.ts
          └── extraction-agent.ts

app/api/chat/newfront/contracts/route.ts
app/api/workflows/newfront/contracts/approve/route.ts
app/newfront/contracts/page.tsx
components/newfront/contract-chatbot.tsx
\`\`\`

### Your Structure (Replace "newfront" with your customer)
\`\`\`
workflows/{customer}/{workflow-name}/
  ├── workflow.ts
  ├── steps.ts
  ├── hooks.ts
  └── agent/
      ├── {workflow-name}-agent.ts
      └── subagents/ (if needed)

app/api/chat/{customer}/{workflow}/route.ts
app/api/workflows/{customer}/{workflow}/approve/route.ts
app/{customer}/{workflow}/page.tsx
components/{customer}/{workflow}-chatbot.tsx
\`\`\`

---

## Tips and Best Practices

1. **Start with the Agent**: The system prompt is the most important customization. Get this right first.

2. **Preserve Patterns**: Don't reinvent the wheel. The ToolLoopAgent, workflow hooks, and AI Gateway patterns are proven—keep them.

3. **Incremental Changes**: Make changes incrementally and test as you go. Start with customer name replacement, then workflow content, then UI.

4. **Model Routing Strategy**: Document your model routing strategy clearly:
   - Which tasks use cheap models? (extraction, validation, simple queries)
   - Which tasks use premium models? (complex reasoning, generation, analysis)

5. **Persona Design**: Clearly define what each persona can and cannot do. This is crucial for guardrails.

6. **Workflow Steps**: Map out your workflow steps before coding. Consider:
   - Where are approval checkpoints?
   - What steps can run in parallel?
   - What steps need sequential execution?
   - What are the error scenarios?

7. **Testing Workflows**: Test approval flows thoroughly—they're the most complex part.

8. **Documentation**: Update code comments to reflect your use case, not the original demo.

---

## Common Pitfalls to Avoid

1. **Don't remove ToolLoopAgent**: It's the core pattern for this demo.
2. **Don't remove AI Gateway integration**: It's a key feature being demonstrated.
3. **Don't remove workflow hooks**: They enable human-in-the-loop approvals.
4. **Don't change message persistence structure**: Unless you have a specific reason.
5. **Don't forget to update all references**: Use find/replace, but verify manually.
6. **Don't skip the system prompt**: It's the most important customization.

---

## Getting Help

If you encounter issues:

1. **Check the original code**: The Newfront example is a working reference.
2. **Verify imports**: Make sure all import paths are updated.
3. **Check API routes**: Ensure route paths match your directory structure.
4. **Review workflow hooks**: Approval flows are complex—trace through the code.
5. **Test incrementally**: Don't try to change everything at once.

---

## Final Notes

This demo is designed to showcase Vercel AI Gateway and Workflows capabilities. When customizing:

- **Keep the technical patterns** (ToolLoopAgent, workflows, hooks, AI Gateway)
- **Change the content** (prompts, terminology, workflows, UI)
- **Preserve the functionality** (model routing, approvals, persistence, streaming)

The goal is to show how these technologies work in a real-world scenario, adapted to your customer's domain and use case.

Good luck with your customization! 🚀
