/**
 * Counterparty Review API Route
 * 
 * API endpoint for external counterparties to review contracts.
 * This resumes the workflow hook that was paused waiting for counterparty review.
 * 
 * Request body:
 * - token: Review token (identifies which workflow to resume)
 * - approved: Whether the contract is approved
 * - comment: Optional feedback from counterparty
 * - by: Email of the counterparty reviewer
 * - requestedChanges: Optional array of requested changes
 * 
 * This endpoint is called from the review UI page when counterparty submits their decision.
 * Note: Counterparty review is typically handled in a separate workflow.
 */

import { RequestWithResponse } from 'workflow';
import { counterpartyReviewHook } from "@/workflows/newfront/contract-management/hooks";

/**
 * POST Handler for Counterparty Review
 * 
 * Resumes the counterpartyReviewHook in the workflow with the review decision.
 */
export async function POST(req: RequestWithResponse) {
  const { token: rawToken, approved, comment, by, requestedChanges } = await req.json();
  if (typeof rawToken !== "string" || typeof approved !== "boolean") {
    return new Response("Bad Request", { status: 400 });
  }
  
  // Clean the token
  const token = rawToken.replace(/['"]+$/, '').trim();
  
  try {    
    console.log('[Counterparty Review] Processing review', {
      token,
      approved,
      by,
      requestedChangesCount: requestedChanges?.length || 0,
    });
    
    const result = await counterpartyReviewHook.resume(rawToken, { approved, comment, by, requestedChanges });
    console.log('[Counterparty Review] Hook result', { result });
    
    return Response.json({ ok: true, runId: result?.runId });
  
  } catch (error) {
    console.error('[Counterparty Review] Error', error);
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
