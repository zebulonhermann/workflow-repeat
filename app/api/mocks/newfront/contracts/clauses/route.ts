// app/api/mocks/newfront/contracts/clauses/route.ts

export async function POST(req: Request) {
  const { contractText, contractType, jurisdiction, product } = await req.json();

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Define required and optional clauses by contract type and jurisdiction
  const clauseRequirements: Record<string, { required: string[]; optional: string[] }> = {
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
  const jurisdictionClauses: Record<string, string[]> = {
    'US-CA': ['california_privacy', 'california_employment'],
    'EU-GDPR': ['gdpr_compliance', 'data_processing', 'right_to_be_forgotten'],
    'US-NY': ['new_york_governing_law', 'new_york_venue'],
  };

  const requirements = clauseRequirements[contractType] || clauseRequirements.NDA;
  const jurisdictionSpecific = jurisdictionClauses[jurisdiction] || [];

  // Simple text matching to detect clauses (in production, use NLP)
  const detectedClauses: string[] = [];
  const missingClauses: string[] = [];

  requirements.required.forEach(clause => {
    const keywords: Record<string, string[]> = {
      confidentiality: ['confidential', 'proprietary', 'non-disclosure'],
      term: ['term', 'effective', 'duration', 'expires'],
      obligations: ['obligations', 'agree', 'shall not'],
      return_of_materials: ['return', 'destroy', 'materials'],
      services: ['services', 'provide', 'deliver'],
      compensation: ['payment', 'compensation', 'amount', 'fee'],
      term_termination: ['termination', 'terminate', 'end date'],
      intellectual_property: ['intellectual property', 'work product', 'ownership'],
      limitation_of_liability: ['liability', 'limited', 'damages'],
      scope_of_work: ['scope', 'work', 'services'],
      deliverables: ['deliverables', 'deliver'],
      timeline: ['timeline', 'schedule', 'deadline'],
      acceptance_criteria: ['acceptance', 'criteria', 'approval'],
    };

    const clauseKeywords = keywords[clause] || [clause];
    const found = clauseKeywords.some(keyword => 
      contractText.toLowerCase().includes(keyword.toLowerCase())
    );

    if (found) {
      detectedClauses.push(clause);
    } else {
      missingClauses.push(clause);
    }
  });

  return Response.json({
    required: requirements.required,
    optional: requirements.optional,
    detected: detectedClauses,
    missing: missingClauses,
    jurisdictionSpecific,
    coverage: {
      required: (detectedClauses.length / requirements.required.length) * 100,
      total: (detectedClauses.length / (requirements.required.length + requirements.optional.length)) * 100,
    },
  });
}
