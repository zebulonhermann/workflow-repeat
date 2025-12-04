// app/api/mocks/newfront/contracts/clauses/lookup/route.ts

/**
 * Clause Lookup Endpoint
 * Returns clause definition for a specific clause name
 */
export async function POST(req: Request) {
  const { clauseName, contractType } = await req.json();
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Clause definitions
  const clauseDefinitions: Record<string, {
    name: string;
    description: string;
    required: boolean;
    alternatives?: string[];
  }> = {
    confidentiality: {
      name: 'Confidentiality',
      description: 'Defines what information is considered confidential and obligations to maintain confidentiality',
      required: true,
    },
    term: {
      name: 'Term',
      description: 'Defines the effective date and duration of the agreement',
      required: true,
    },
    obligations: {
      name: 'Obligations',
      description: 'Defines what each party agrees to do or not do',
      required: true,
    },
    return_of_materials: {
      name: 'Return of Materials',
      description: 'Requires return or destruction of confidential materials upon termination',
      required: true,
    },
    services: {
      name: 'Services',
      description: 'Describes the services to be provided',
      required: true,
    },
    compensation: {
      name: 'Compensation',
      description: 'Defines payment terms, amounts, and schedules',
      required: true,
    },
    term_termination: {
      name: 'Term and Termination',
      description: 'Defines contract duration and termination conditions',
      required: true,
    },
    intellectual_property: {
      name: 'Intellectual Property',
      description: 'Defines ownership of work product and intellectual property rights',
      required: true,
    },
    limitation_of_liability: {
      name: 'Limitation of Liability',
      description: 'Limits the liability of parties under the agreement',
      required: true,
    },
    scope_of_work: {
      name: 'Scope of Work',
      description: 'Defines the specific work to be performed',
      required: true,
    },
    deliverables: {
      name: 'Deliverables',
      description: 'Lists specific deliverables and acceptance criteria',
      required: true,
    },
    timeline: {
      name: 'Timeline',
      description: 'Defines project timeline, milestones, and deadlines',
      required: true,
    },
    acceptance_criteria: {
      name: 'Acceptance Criteria',
      description: 'Defines how deliverables will be accepted',
      required: true,
    },
    non_compete: {
      name: 'Non-Compete',
      description: 'Restricts parties from competing during or after the agreement',
      required: false,
    },
    jurisdiction: {
      name: 'Jurisdiction',
      description: 'Defines which jurisdiction\'s laws govern the agreement',
      required: false,
    },
    dispute_resolution: {
      name: 'Dispute Resolution',
      description: 'Defines how disputes will be resolved (arbitration, mediation, etc.)',
      required: false,
    },
    warranties: {
      name: 'Warranties',
      description: 'Defines warranties and representations made by parties',
      required: false,
    },
    indemnification: {
      name: 'Indemnification',
      description: 'Defines indemnification obligations between parties',
      required: false,
    },
    force_majeure: {
      name: 'Force Majeure',
      description: 'Defines circumstances that excuse performance',
      required: false,
    },
    governing_law: {
      name: 'Governing Law',
      description: 'Specifies which jurisdiction\'s laws govern the agreement',
      required: false,
    },
  };
  
  const clause = clauseDefinitions[clauseName] || {
    name: clauseName,
    description: 'Clause definition not found',
    required: false,
  };
  
  return Response.json({
    clauseName,
    contractType,
    definition: clause,
  });
}
