/**
 * Contract Management Workflow Hooks
 * 
 * Hooks are used to pause workflow execution and wait for human input.
 * They enable "human-in-the-loop" checkpoints in the workflow.
 * 
 * Each hook defines a schema that validates the approval response,
 * ensuring type safety and data validation.
 * 
 * Workflow Usage:
 * - contractApprovalHook: Used for legal team approval (required for all contracts)
 * - contractManagerReviewHook: Used for contract manager review (optional, for requester-initiated contracts)
 * - counterpartyReviewHook: Used for external counterparty review (separate workflow)
 */

import { defineHook } from "workflow";
import { z } from "zod";

/**
 * Legal Approval Hook
 * 
 * Used when legal team needs to approve a contract before it can proceed.
 * This is a REQUIRED checkpoint for all contracts.
 * 
 * Schema includes:
 * - approved: Whether legal approved the contract
 * - comment: Optional feedback from legal
 * - by: Email of the approver
 * - redlineSuggestions: Optional suggestions for contract changes
 */
export const contractApprovalHook = defineHook({
  schema: z.object({
    approved: z.boolean(),
    comment: z.string().optional(),
    by: z.string().email().optional(),
    redlineSuggestions: z.array(z.object({
      clause: z.string(),
      change: z.string(),
      reason: z.string(),
    })).optional(),
  }),
});

/**
 * Contract Manager Review Hook
 * 
 * Used when a contract manager needs to review a contract initiated by a requester.
 * This is an OPTIONAL checkpoint that only occurs for requester-initiated contracts.
 * 
 * Contract managers can:
 * - Approve the contract to proceed to legal
 * - Request edits with specific changes
 * - Decline the contract
 * 
 * Schema includes:
 * - approved: Whether manager approved the contract
 * - comment: Optional feedback
 * - by: Email of the reviewer
 * - edits: Optional array of requested edits with section, original, revised, and reason
 */
export const contractManagerReviewHook = defineHook({
  schema: z.object({
    approved: z.boolean(),
    comment: z.string().optional(),
    by: z.string().email().optional(),
    edits: z.array(z.object({
      section: z.string(),
      original: z.string(),
      revised: z.string(),
      reason: z.string(),
    })).optional(),
  }),
});

/**
 * Counterparty Review Hook
 * 
 * Used when the external counterparty needs to review the contract.
 * This is typically handled in a separate workflow after internal approvals.
 * 
 * Counterparties can:
 * - Approve the contract
 * - Request changes to specific clauses
 * - Decline the contract
 * 
 * Schema includes:
 * - approved: Whether counterparty approved
 * - comment: Optional feedback
 * - by: Email of the counterparty reviewer
 * - requestedChanges: Optional array of requested changes with clause, change, and reason
 */
export const counterpartyReviewHook = defineHook({
  schema: z.object({
    approved: z.boolean(),
    comment: z.string().optional(),
    by: z.string().email().optional(),
    requestedChanges: z.array(z.object({
      clause: z.string(),
      requestedChange: z.string(),
      reason: z.string(),
    })).optional(),
  }),
});
