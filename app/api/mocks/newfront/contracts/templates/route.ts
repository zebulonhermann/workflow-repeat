// app/api/mocks/newfront/contracts/templates/route.ts

export async function POST(req: Request) {
  const { contractType, jurisdiction, product, parties, keyTerms } = await req.json();

  // Simulate template retrieval and contract generation
  await new Promise(resolve => setTimeout(resolve, 1000));

  const templates: Record<string, string> = {
    NDA: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into on ${keyTerms?.startDate || '[DATE]'} between ${parties.party1.name} ("${parties.party1.role}") and ${parties.party2.name} ("${parties.party2.role}").

1. CONFIDENTIAL INFORMATION
   The parties agree to maintain confidentiality of all proprietary information shared during the course of business.

2. TERM
   This Agreement shall remain in effect from ${keyTerms?.startDate || '[START DATE]'} until ${keyTerms?.endDate || '[END DATE]'}.

3. OBLIGATIONS
   Each party agrees not to disclose, reproduce, or use any confidential information for any purpose other than as expressly authorized.

4. RETURN OF MATERIALS
   Upon termination, all confidential materials shall be returned or destroyed.

IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.

${parties.party1.name}                    ${parties.party2.name}
___________________                    ___________________`,

    MSA: `MASTER SERVICES AGREEMENT

This Master Services Agreement ("Agreement") is entered into on ${keyTerms?.startDate || '[DATE]'} between ${parties.party1.name} ("${parties.party1.role}") and ${parties.party2.name} ("${parties.party2.role}").

1. SERVICES
   ${parties.party2.role} agrees to provide services as described in individual Statements of Work.

2. COMPENSATION
   Payment terms: ${keyTerms?.paymentTerms || 'Net 30'}.
   Total contract value: $${keyTerms?.amount?.toLocaleString() || '[AMOUNT]'}.

3. TERM AND TERMINATION
   This Agreement shall commence on ${keyTerms?.startDate || '[START DATE]'} and continue until ${keyTerms?.endDate || '[END DATE]'} unless terminated earlier.

4. INTELLECTUAL PROPERTY
   All work product shall be owned by ${parties.party1.role} upon payment.

5. LIMITATION OF LIABILITY
   Liability is limited to the total contract value.

${parties.party1.name}                    ${parties.party2.name}
___________________                    ___________________`,

    SOW: `STATEMENT OF WORK

This Statement of Work ("SOW") is entered into on ${keyTerms?.startDate || '[DATE]'} between ${parties.party1.name} ("${parties.party1.role}") and ${parties.party2.name} ("${parties.party2.role}").

1. SCOPE OF WORK
   ${parties.party2.role} will provide the following services: [DESCRIBE SERVICES]

2. DELIVERABLES
   [LIST DELIVERABLES]

3. TIMELINE
   Start Date: ${keyTerms?.startDate || '[START DATE]'}
   End Date: ${keyTerms?.endDate || '[END DATE]'}

4. COMPENSATION
   Total Amount: $${keyTerms?.amount?.toLocaleString() || '[AMOUNT]'}
   Payment Schedule: ${keyTerms?.paymentTerms || 'As milestones are completed'}

5. ACCEPTANCE CRITERIA
   [DEFINE ACCEPTANCE CRITERIA]

${parties.party1.name}                    ${parties.party2.name}
___________________                    ___________________`,
  };

  const contractText = templates[contractType] || templates.NDA;

  return Response.json({
    contractText,
    templateId: `${contractType}-${jurisdiction}-${Date.now()}`,
    generatedAt: new Date().toISOString(),
  });
}
