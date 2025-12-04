// app/api/mocks/newfront/contracts/risks/playbook/route.ts
/**
 * Mock API endpoint for comparing contract terms to company playbook standards
 * 
 * Returns playbook comparison data showing how the contract deviates from
 * company standards and best practices.
 */

export async function POST(req: Request) {
  const { contractText, product } = await req.json();

  // Simulate playbook comparison processing time
  await new Promise(resolve => setTimeout(resolve, 1800));

  const deviations: Array<{
    clause: string;
    deviationType: 'missing' | 'non_standard' | 'below_threshold' | 'above_threshold';
    severity: 'high' | 'medium' | 'low';
    playbookStandard: string;
    contractValue: string;
    description: string;
    recommendation: string;
  }> = [];

  // Check for missing standard clauses
  if (!contractText.toLowerCase().includes('limitation of liability') || 
      contractText.toLowerCase().includes('unlimited liability')) {
    deviations.push({
      clause: 'Limitation of Liability',
      deviationType: 'non_standard',
      severity: 'high',
      playbookStandard: 'Liability limited to contract value or 12 months of fees, whichever is lower',
      contractValue: contractText.toLowerCase().includes('unlimited liability') 
        ? 'Unlimited liability (non-standard)' 
        : 'Missing limitation clause',
      description: 'Playbook requires explicit limitation of liability. Unlimited liability clauses are prohibited.',
      recommendation: 'Add limitation of liability clause per playbook standard: "Liability limited to contract value or 12 months of fees, whichever is lower."',
    });
  }

  // Check payment terms
  const paymentTermsMatch = contractText.match(/(\d+)\s*(day|days|week|weeks|month|months)\s*(payment|net|due)/i);
  if (paymentTermsMatch) {
    const days = parseInt(paymentTermsMatch[1]);
    const unit = paymentTermsMatch[2].toLowerCase();
    let totalDays = days;
    if (unit.includes('week')) totalDays = days * 7;
    if (unit.includes('month')) totalDays = days * 30;

    if (totalDays > 45) {
      deviations.push({
        clause: 'Payment Terms',
        deviationType: 'above_threshold',
        severity: 'medium',
        playbookStandard: 'Net 30-45 days maximum',
        contractValue: `Net ${totalDays} days`,
        description: `Payment terms exceed playbook standard of 30-45 days. Extended terms impact cash flow.`,
        recommendation: 'Reduce payment terms to Net 30-45 days per playbook standard, or require approval for extended terms.',
      });
    }
  } else if (!contractText.toLowerCase().includes('payment') && !contractText.toLowerCase().includes('due')) {
    deviations.push({
      clause: 'Payment Terms',
      deviationType: 'missing',
      severity: 'high',
      playbookStandard: 'Net 30-45 days maximum',
      contractValue: 'Missing payment terms',
      description: 'Playbook requires explicit payment terms. Missing payment terms create ambiguity.',
      recommendation: 'Add payment terms clause: "Payment due within 30 days of invoice date."',
    });
  }

  // Check termination clause
  if (!contractText.toLowerCase().includes('termination') || 
      !contractText.match(/termination.*\d+\s*(day|days)/i)) {
    deviations.push({
      clause: 'Termination',
      deviationType: 'missing',
      severity: 'high',
      playbookStandard: 'Either party may terminate with 30 days written notice',
      contractValue: contractText.toLowerCase().includes('termination') 
        ? 'Termination clause present but missing notice period' 
        : 'Missing termination clause',
      description: 'Playbook requires explicit termination clause with 30-day notice period.',
      recommendation: 'Add termination clause: "Either party may terminate this agreement with 30 days written notice."',
    });
  }

  // Check dispute resolution
  if (!contractText.toLowerCase().includes('dispute') && 
      !contractText.toLowerCase().includes('arbitration') &&
      !contractText.toLowerCase().includes('jurisdiction')) {
    deviations.push({
      clause: 'Dispute Resolution',
      deviationType: 'missing',
      severity: 'medium',
      playbookStandard: 'Disputes resolved through binding arbitration in [jurisdiction]',
      contractValue: 'Missing dispute resolution clause',
      description: 'Playbook requires dispute resolution clause to avoid costly litigation.',
      recommendation: 'Add dispute resolution clause: "All disputes shall be resolved through binding arbitration in [jurisdiction]."',
    });
  }

  // Product-specific playbook checks
  if (product === 'insurance') {
    if (!contractText.toLowerCase().includes('coverage') && 
        !contractText.toLowerCase().includes('policy')) {
      deviations.push({
        clause: 'Coverage Terms',
        deviationType: 'missing',
        severity: 'high',
        playbookStandard: 'Explicit coverage terms including scope, limits, and exclusions',
        contractValue: 'Missing coverage terms',
        description: 'Insurance contracts require explicit coverage terms per playbook.',
        recommendation: 'Add coverage terms section specifying scope of coverage, policy limits, and exclusions.',
      });
    }

    if (!contractText.toLowerCase().includes('premium') && 
        !contractText.toLowerCase().includes('payment')) {
      deviations.push({
        clause: 'Premium Payment',
        deviationType: 'missing',
        severity: 'medium',
        playbookStandard: 'Premium payment terms and schedule clearly defined',
        contractValue: 'Missing premium payment terms',
        description: 'Insurance contracts require clear premium payment terms.',
        recommendation: 'Add premium payment clause with payment schedule and terms.',
      });
    }
  }

  // Check indemnification
  if (contractText.toLowerCase().includes('indemnify') && 
      !contractText.toLowerCase().includes('mutual') &&
      !contractText.toLowerCase().includes('each party')) {
    deviations.push({
      clause: 'Indemnification',
      deviationType: 'non_standard',
      severity: 'medium',
      playbookStandard: 'Mutual indemnification for third-party claims',
      contractValue: 'One-way indemnification',
      description: 'Playbook requires mutual indemnification. One-way indemnification creates unfair risk distribution.',
      recommendation: 'Update to mutual indemnification: "Each party agrees to indemnify the other for third-party claims arising from their breach or negligence."',
    });
  }

  // Check intellectual property (for MSA/SOW contracts)
  // Detect if this is likely an MSA/SOW based on contract content
  const isMSAOrSOW = contractText.toLowerCase().includes('master services') ||
                      contractText.toLowerCase().includes('statement of work') ||
                      contractText.toLowerCase().includes('services agreement') ||
                      contractText.toLowerCase().includes('deliverables');
  
  if (isMSAOrSOW &&
      !contractText.toLowerCase().includes('intellectual property') &&
      !contractText.toLowerCase().includes('ip') &&
      !contractText.toLowerCase().includes('work product')) {
    deviations.push({
      clause: 'Intellectual Property',
      deviationType: 'missing',
      severity: 'high',
      playbookStandard: 'IP assignment clause for work product',
      contractValue: 'Missing IP assignment clause',
      description: 'MSA/SOW contracts require IP assignment clauses per playbook.',
      recommendation: 'Add IP assignment clause: "All work product and deliverables shall be owned by [client] upon payment."',
    });
  }

  // Check confidentiality (for NDA contracts)
  // Detect if this is likely an NDA based on contract content
  const isNDA = contractText.toLowerCase().includes('non-disclosure') ||
                contractText.toLowerCase().includes('nondisclosure') ||
                contractText.toLowerCase().includes('confidentiality agreement');
  
  if (isNDA && !contractText.toLowerCase().includes('confidential') &&
      !contractText.toLowerCase().includes('proprietary')) {
    deviations.push({
      clause: 'Confidentiality',
      deviationType: 'missing',
      severity: 'high',
      playbookStandard: 'Comprehensive confidentiality clause defining confidential information and obligations',
      contractValue: 'Missing or insufficient confidentiality clause',
      description: 'NDA contracts require explicit confidentiality clauses per playbook.',
      recommendation: 'Add comprehensive confidentiality clause defining what constitutes confidential information and parties\' obligations.',
    });
  }

  // Check governing law
  if (!contractText.toLowerCase().includes('governing law') &&
      !contractText.toLowerCase().includes('jurisdiction')) {
    deviations.push({
      clause: 'Governing Law',
      deviationType: 'missing',
      severity: 'low',
      playbookStandard: 'Governing law clause specifying jurisdiction',
      contractValue: 'Missing governing law clause',
      description: 'Playbook recommends including governing law clause for clarity.',
      recommendation: 'Add governing law clause: "This agreement shall be governed by the laws of [jurisdiction]."',
    });
  }

  return Response.json({
    deviations,
    summary: {
      totalDeviations: deviations.length,
      highSeverityCount: deviations.filter(d => d.severity === 'high').length,
      mediumSeverityCount: deviations.filter(d => d.severity === 'medium').length,
      lowSeverityCount: deviations.filter(d => d.severity === 'low').length,
      complianceScore: Math.max(0, 100 - (deviations.length * 10) - (deviations.filter(d => d.severity === 'high').length * 20)),
    },
    playbookVersion: '2024.1',
    lastUpdated: '2024-01-15',
    analysis: `Contract comparison to playbook standards found ${deviations.length} deviations. ${deviations.filter(d => d.severity === 'high').length} high-severity deviations require immediate attention. Compliance score: ${Math.max(0, 100 - (deviations.length * 10) - (deviations.filter(d => d.severity === 'high').length * 20))}/100.`,
    recommendations: deviations.map(d => ({
      priority: d.severity === 'high' ? 'urgent' : d.severity === 'medium' ? 'important' : 'optional',
      clause: d.clause,
      action: d.recommendation,
    })),
  });
}
