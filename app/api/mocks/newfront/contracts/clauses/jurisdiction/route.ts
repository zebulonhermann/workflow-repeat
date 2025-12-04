// app/api/mocks/newfront/contracts/clauses/jurisdiction/route.ts

/**
 * Jurisdiction Rules Endpoint
 * Returns jurisdiction-specific clause requirements
 */
export async function POST(req: Request) {
  const { jurisdiction, contractType } = await req.json();
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Base requirements by contract type
  const contractRequirements: Record<string, { required: string[]; optional: string[] }> = {
    NDA: {
      required: ['confidentiality', 'term', 'obligations', 'return_of_materials'],
      optional: ['non-compete', 'jurisdiction', 'dispute_resolution'],
    },
    MSA: {
      required: ['services', 'compensation', 'term_termination', 'intellectual_property', 'limitation_of_liability'],
      optional: ['warranties', 'indemnification', 'force_majeure', 'governing_law'],
    },
    SOW: {
      required: ['scope_of_work', 'deliverables', 'timeline', 'compensation', 'acceptance_criteria'],
      optional: ['change_management', 'reporting', 'quality_assurance'],
    },
  };
  
  // Jurisdiction-specific requirements
  const jurisdictionSpecific: Record<string, string[]> = {
    'US-CA': ['california_privacy', 'california_employment'],
    'EU-GDPR': ['gdpr_compliance', 'data_processing', 'right_to_be_forgotten'],
    'US-NY': ['new_york_governing_law', 'new_york_venue'],
  };
  
  const baseRequirements = contractRequirements[contractType] || contractRequirements.NDA;
  const jurisdictionClauses = jurisdictionSpecific[jurisdiction] || [];
  
  return Response.json({
    jurisdiction,
    contractType,
    required: [...baseRequirements.required, ...jurisdictionClauses],
    optional: baseRequirements.optional,
    jurisdictionSpecific: jurisdictionClauses,
  });
}
