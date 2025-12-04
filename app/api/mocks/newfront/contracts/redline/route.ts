// app/api/mocks/newfront/contracts/redline/route.ts
 
export async function POST(req: Request) {
  const { originalText, revisedText, reasonCodes } = await req.json();

  await new Promise(resolve => setTimeout(resolve, 1500));

  // Simple diff generation (in production, use proper diff library)
  const changes: Array<{
    section: string;
    original: string;
    revised: string;
    reason: string;
    type: 'added' | 'deleted' | 'modified';
  }> = [];

  // For demo, generate mock changes
  if (originalText !== revisedText) {
    changes.push({
      section: 'Section 1',
      original: originalText.substring(0, 100) || '[Original text]',
      revised: revisedText.substring(0, 100) || '[Revised text]',
      reason: reasonCodes?.[0] || 'Contract manager requested changes',
      type: 'modified',
    });
  }

  return Response.json({
    changes,
    changeCount: changes.length,
    generatedAt: new Date().toISOString(),
    diffUrl: `/newfront/contracts/redline/${Date.now()}`,
  });
}
