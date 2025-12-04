// app/api/mocks/newfront/contracts/risks/precedent/route.ts
/**
 * Mock API endpoint for checking contract precedents
 * 
 * Returns precedent analysis data from similar contracts in the database.
 * This helps the risk detection agent understand what risks have been
 * identified in similar contract types and jurisdictions.
 */

export async function POST(req: Request) {
  const { contractType, jurisdiction, keyTerms } = await req.json();

  // Simulate database lookup delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Generate precedent data based on contract type and jurisdiction
  const precedents: Array<{
    contractId: string;
    contractType: string;
    jurisdiction: string;
    riskLevel: 'high' | 'medium' | 'low';
    issuesFound: Array<{
      type: string;
      severity: 'high' | 'medium' | 'low';
      description: string;
      clause?: string;
    }>;
    similarTerms: string;
    recommendation: string;
  }> = [];

  // Precedent 1: Similar contract type and jurisdiction
  precedents.push({
    contractId: `precedent-${contractType}-001`,
    contractType,
    jurisdiction,
    riskLevel: 'high',
    issuesFound: [
      {
        type: 'risky_clause',
        severity: 'high',
        clause: 'Liability Limitation',
        description: 'Similar contracts in this jurisdiction have been challenged for unlimited liability clauses. Courts have ruled against such clauses in 3 recent cases.',
      },
      {
        type: 'missing_term',
        severity: 'medium',
        description: 'Similar contracts typically include explicit termination clauses with 30-day notice periods.',
      },
    ],
    similarTerms: keyTerms || 'Standard terms for this contract type',
    recommendation: 'Review liability limitations and ensure termination clauses are explicit with proper notice periods.',
  });

  // Precedent 2: Related contract with different jurisdiction
  if (jurisdiction?.startsWith('US-')) {
    precedents.push({
      contractId: `precedent-${contractType}-002`,
      contractType,
      jurisdiction: 'US-CA',
      riskLevel: 'medium',
      issuesFound: [
        {
          type: 'jurisdiction_conflict',
          severity: 'medium',
          description: 'California-specific requirements may apply. Similar contracts have been updated to include CA-specific clauses.',
        },
      ],
      similarTerms: 'California-specific terms',
      recommendation: 'Verify if California-specific clauses are required for this jurisdiction.',
    });
  }

  // Precedent 3: High-risk precedent for certain contract types
  if (contractType === 'MSA' || contractType === 'SOW') {
    precedents.push({
      contractId: `precedent-${contractType}-003`,
      contractType,
      jurisdiction,
      riskLevel: 'high',
      issuesFound: [
        {
          type: 'playbook_deviation',
          severity: 'high',
          description: 'Similar MSA/SOW contracts have been flagged for missing intellectual property assignment clauses.',
        },
        {
          type: 'risky_clause',
          severity: 'medium',
          clause: 'Payment Terms',
          description: 'Similar contracts with extended payment terms (>60 days) have led to cash flow issues.',
        },
      ],
      similarTerms: keyTerms || 'Standard MSA/SOW terms',
      recommendation: 'Ensure IP assignment clauses are present and payment terms are within company standards (30-45 days).',
    });
  }

  // Precedent 4: GDPR-specific precedent
  if (jurisdiction === 'EU-GDPR' || jurisdiction?.includes('EU')) {
    precedents.push({
      contractId: `precedent-${contractType}-004`,
      contractType,
      jurisdiction: 'EU-GDPR',
      riskLevel: 'high',
      issuesFound: [
        {
          type: 'jurisdiction_conflict',
          severity: 'high',
          description: 'GDPR compliance is mandatory. Similar contracts missing GDPR clauses have been rejected by legal.',
        },
        {
          type: 'missing_term',
          severity: 'high',
          description: 'Data processing agreements and right to be forgotten clauses are required for EU contracts.',
        },
      ],
      similarTerms: 'GDPR-compliant terms',
      recommendation: 'Include comprehensive GDPR compliance clauses including data processing terms, right to access, and right to be forgotten.',
    });
  }

  // Precedent 5: General precedent for any contract type
  precedents.push({
    contractId: `precedent-${contractType}-005`,
    contractType,
    jurisdiction,
    riskLevel: 'low',
    issuesFound: [
      {
        type: 'missing_term',
        severity: 'low',
        description: 'Some similar contracts include force majeure clauses, though not always required.',
      },
    ],
    similarTerms: 'Standard terms',
    recommendation: 'Consider adding force majeure clause for additional protection.',
  });

  return Response.json({
    precedents,
    summary: {
      totalPrecedents: precedents.length,
      highRiskCount: precedents.filter(p => p.riskLevel === 'high').length,
      mediumRiskCount: precedents.filter(p => p.riskLevel === 'medium').length,
      lowRiskCount: precedents.filter(p => p.riskLevel === 'low').length,
      commonIssues: [
        'Liability limitation clauses',
        'Termination and notice periods',
        'Jurisdiction-specific requirements',
        'Payment terms',
      ],
    },
    analysis: `Found ${precedents.length} similar contracts. ${precedents.filter(p => p.riskLevel === 'high').length} had high-risk issues that should be reviewed.`,
  });
}
