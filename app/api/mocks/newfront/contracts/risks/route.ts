// app/api/mocks/newfront/contracts/risks/route.ts


export async function POST(req: Request) {
  const { contractText, jurisdiction, product } = await req.json();

  // Simulate premium model processing time
  await new Promise(resolve => setTimeout(resolve, 2000));

  const risks: Array<{
    type: 'risky_clause' | 'missing_term' | 'jurisdiction_conflict' | 'playbook_deviation';
    severity: 'high' | 'medium' | 'low';
    clause?: string;
    description: string;
    recommendation: string;
  }> = [];

  // Detect risky clauses
  if (contractText.toLowerCase().includes('unlimited liability') || 
      contractText.toLowerCase().includes('no limitation')) {
    risks.push({
      type: 'risky_clause',
      severity: 'high',
      clause: 'Unlimited Liability',
      description: 'Contract contains unlimited liability clause which exposes company to significant financial risk.',
      recommendation: 'Add limitation of liability clause limiting damages to contract value or a reasonable cap.',
    });
  }

  if (contractText.toLowerCase().includes('indemnify') && 
      !contractText.toLowerCase().includes('mutual')) {
    risks.push({
      type: 'risky_clause',
      severity: 'medium',
      clause: 'One-way Indemnification',
      description: 'Contract requires one-way indemnification without mutual protection.',
      recommendation: 'Consider mutual indemnification clause for fair risk distribution.',
    });
  }

  // Detect missing terms
  if (!contractText.toLowerCase().includes('termination') && 
      !contractText.toLowerCase().includes('term')) {
    risks.push({
      type: 'missing_term',
      severity: 'high',
      description: 'Contract lacks clear termination clause or term definition.',
      recommendation: 'Add explicit termination clause with notice period and conditions.',
    });
  }

  if (!contractText.toLowerCase().includes('dispute') && 
      !contractText.toLowerCase().includes('arbitration')) {
    risks.push({
      type: 'missing_term',
      severity: 'medium',
      description: 'Contract lacks dispute resolution mechanism.',
      recommendation: 'Add dispute resolution clause specifying arbitration or jurisdiction.',
    });
  }

  // Detect jurisdiction conflicts
  if (jurisdiction === 'EU-GDPR' && !contractText.toLowerCase().includes('gdpr')) {
    risks.push({
      type: 'jurisdiction_conflict',
      severity: 'high',
      description: 'EU-GDPR jurisdiction requires GDPR compliance clauses but none found.',
      recommendation: 'Add GDPR compliance clause including data processing terms and right to be forgotten.',
    });
  }

  if (jurisdiction?.startsWith('US-') && contractText.toLowerCase().includes('eu governing law')) {
    risks.push({
      type: 'jurisdiction_conflict',
      severity: 'medium',
      description: 'Jurisdiction mismatch: US jurisdiction but EU governing law specified.',
      recommendation: 'Update governing law clause to match specified jurisdiction.',
    });
  }

  // Detect playbook deviations
  if (product === 'insurance' && !contractText.toLowerCase().includes('coverage')) {
    risks.push({
      type: 'playbook_deviation',
      severity: 'medium',
      description: 'Insurance contract missing coverage terms required by playbook.',
      recommendation: 'Add coverage terms section specifying scope, limits, and exclusions.',
    });
  }

  return Response.json(risks);
}
