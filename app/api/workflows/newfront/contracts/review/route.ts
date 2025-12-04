/**
 * Contract Manager Review API Route
 * 
 * API endpoint for contract managers to review contracts initiated by requesters.
 * This resumes the workflow hook that was paused waiting for manager review.
 * 
 * Request body:
 * - token: Review token (identifies which workflow to resume)
 * - approved: Whether the contract is approved
 * - comment: Optional feedback from manager
 * - by: Email of the reviewer
 * - edits: Optional array of requested edits
 * 
 * This endpoint is called from the review UI page when manager submits their decision.
 */

import { RequestWithResponse } from 'workflow';
import { contractManagerReviewHook } from "@/workflows/newfront/contract-management/hooks";

/**
 * POST Handler for Contract Manager Review
 * 
 * Resumes the contractManagerReviewHook in the workflow with the review decision.
 */
export async function POST(req: RequestWithResponse) {
  const { token: rawToken, approved, comment, by, edits } = await req.json();
  if (typeof rawToken !== "string" || typeof approved !== "boolean") {
    return new Response("Bad Request", { status: 400 });
  }
  
  // Clean the token
  const token = rawToken.replace(/['"]+$/, '').trim();
  
  try {    
    console.log('[Contract Review] Processing review', {
      token,
      approved,
      by,
      editCount: edits?.length || 0,
    });
    
    const result = await contractManagerReviewHook.resume(rawToken, { approved, comment, by, edits });
    console.log('[Contract Review] Hook result', { result });
    
    return Response.json({ ok: true, runId: result?.runId });
  
  } catch (error) {
    console.error('[Contract Review] Error', error);
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
