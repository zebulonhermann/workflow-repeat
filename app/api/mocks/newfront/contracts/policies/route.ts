// app/api/mocks/newfront/contracts/policies/route.ts

export async function POST(req: Request) {
  const { persona, action, contractId } = await req.json();

  await new Promise(resolve => setTimeout(resolve, 500));

  // Define persona-based policies
  const policies: Record<string, string[]> = {
    requester: ['draft', 'view', 'submit'],
    contract_manager: ['draft', 'edit', 'negotiate', 'review', 'view'],
    legal: ['approve', 'publish', 'review', 'view', 'redline'],
  };

  const allowedActions = policies[persona] || [];
  const allowed = allowedActions.includes(action);

  // Specific policy violations
  const violations: Record<string, string> = {
    'requester:approve': 'Requesters cannot approve contracts. Only legal team can approve.',
    'requester:publish': 'Requesters cannot publish contracts. Only legal team can publish.',
    'requester:sign': 'Requesters cannot sign contracts. Only authorized signatories can sign.',
    'legal:draft': 'Legal team should review contracts, not draft them. Requesters or contract managers should draft.',
    'contract_manager:approve': 'Contract managers cannot approve contracts. Only legal team can approve.',
    'contract_manager:publish': 'Contract managers cannot publish contracts. Only legal team can publish.',
  };

  const violationKey = `${persona}:${action}`;
  const reason = violations[violationKey];

  return Response.json({
    allowed,
    reason: allowed ? undefined : (reason || `${persona} cannot perform ${action}`),
    persona,
    action,
    allowedActions,
  });
}
