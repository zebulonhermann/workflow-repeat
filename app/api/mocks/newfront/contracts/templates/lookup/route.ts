// app/api/mocks/newfront/contracts/templates/lookup/route.ts


/**
 * Template Lookup Endpoint
 * Returns template structure without generating full contract
 */
export async function POST(req: Request) {
  const { contractType, jurisdiction } = await req.json();
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Template structures (sections that should be included)
  const templateStructures: Record<string, {
    sections: string[];
    requiredClauses: string[];
    optionalClauses: string[];
  }> = {
    NDA: {
      sections: [
        'Parties and Effective Date',
        'Confidential Information Definition',
        'Term and Duration',
        'Obligations and Restrictions',
        'Return of Materials',
        'Signatures'
      ],
      requiredClauses: ['confidentiality', 'term', 'obligations', 'return_of_materials'],
      optionalClauses: ['non-compete', 'jurisdiction', 'dispute_resolution'],
    },
    MSA: {
      sections: [
        'Parties and Effective Date',
        'Services Description',
        'Compensation and Payment Terms',
        'Term and Termination',
        'Intellectual Property',
        'Limitation of Liability',
        'Signatures'
      ],
      requiredClauses: ['services', 'compensation', 'term_termination', 'intellectual_property', 'limitation_of_liability'],
      optionalClauses: ['warranties', 'indemnification', 'force_majeure', 'governing_law'],
    },
    SOW: {
      sections: [
        'Parties and Effective Date',
        'Scope of Work',
        'Deliverables',
        'Timeline and Milestones',
        'Compensation',
        'Acceptance Criteria',
        'Signatures'
      ],
      requiredClauses: ['scope_of_work', 'deliverables', 'timeline', 'compensation', 'acceptance_criteria'],
      optionalClauses: ['change_management', 'reporting', 'quality_assurance'],
    },
  };
  
  const structure = templateStructures[contractType] || templateStructures.NDA;
  
  return Response.json({
    contractType,
    jurisdiction,
    structure,
    description: `Template structure for ${contractType} contract${jurisdiction ? ` in ${jurisdiction}` : ''}`,
  });
}
