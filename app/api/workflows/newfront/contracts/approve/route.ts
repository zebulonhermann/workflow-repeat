/**
 * Contract Approval API Route
 * 
 * API endpoint for legal team to approve contracts.
 * This resumes the workflow hook that was paused waiting for approval.
 * 
 * Request body:
 * - token: Approval token (identifies which workflow to resume)
 * - approved: Whether the contract is approved
 * - comment: Optional feedback from legal
 * - by: Email of the approver
 * - redlineSuggestions: Optional suggestions for contract changes
 * 
 * This endpoint is called from the approval UI page when legal submits their decision.
 */

import { RequestWithResponse } from 'workflow';
import { contractApprovalHook } from "@/workflows/newfront/contract-management/hooks";
import { clauseValidationApprovalHook } from "@/workflows/newfront/contract-management/agent/subagents/clause-validation-agent";

/**
 * POST Handler for Contract Approval
 * 
 * Resumes the appropriate hook in the workflow with the approval decision.
 * Supports both contractApprovalHook and clauseValidationApprovalHook based on token.
 */
export async function POST(req: RequestWithResponse) {
  const { token: rawToken, approved, comment, by, redlineSuggestions } = await req.json();
  if (typeof rawToken !== "string" || typeof approved !== "boolean") {
    return new Response("Bad Request", { status: 400 });
  }
  
  // Decode token if it was encoded with encodeURIComponent
  // Next.js automatically decodes URL params, but if passed in body, we need to decode
  let token = rawToken;
  try {
    // Try decoding - if it fails, use original (might not be encoded)
    token = decodeURIComponent(rawToken);
  } catch {
    // If decode fails, token wasn't encoded, use as-is
    token = rawToken;
  }
  
  // Clean the token - remove any trailing quotes, commas, or whitespace
  token = token.replace(/['",]+$/, '').trim();
  
  try {    
    console.log('[Contract Approval] Processing approval', {
      rawToken,
      token,
      by,
    });
    
    // Determine which hook to use based on token
    // clause-validation-approval tokens use clauseValidationApprovalHook
    // Other tokens use contractApprovalHook
    let result;
    if (token.includes('clause-validation-approval')) {
      console.log('[Contract Approval] Using clauseValidationApprovalHook');
      result = await clauseValidationApprovalHook.resume(token, { approved, comment, by });
    } else {
      console.log('[Contract Approval] Using contractApprovalHook');
      result = await contractApprovalHook.resume(token, { approved, comment, by, redlineSuggestions });
    }
    
    console.log('[Contract Approval] Hook result', { result });
    
    if (!result) {
      return Response.json(
        { 
          ok: false, 
          error: 'Hook not found',
          message: 'The approval hook was not found. The workflow may not have reached the approval point yet, or it may have already timed out.',
          token 
        },
        { status: 404 }
      );
    }
    
    return Response.json({ ok: true, runId: result?.runId });
  
  } catch (error) {
    console.error('[Contract Approval] Error', error);
    return req.respondWith(Response.json(
      { 
        ok: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        token 
      },
      { status: 500 }
    ))
  }
}
