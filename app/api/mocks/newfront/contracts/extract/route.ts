// app/api/mocks/newfront/contracts/extract/route.ts

export async function POST(req: Request) {
  const { text } = await req.json();

  // Simulate cheap model extraction (faster)
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simple regex-based extraction (in production, use NLP model)
  const parties: Array<{ name: string; role: string }> = [];
  const dates: Array<{ type: string; value: string }> = [];
  const amounts: Array<{ type: string; value: number; currency: string }> = [];

  // Extract parties (look for patterns like "Party Name" ("Role"))
  const partyMatches = text.match(/([A-Z][a-zA-Z\s&]+)\s*\(["']([^"']+)["']\)/g);
  if (partyMatches) {
    partyMatches.forEach((match: string) => {
      const parts = match.match(/([A-Z][a-zA-Z\s&]+)\s*\(["']([^"']+)["']\)/);
      if (parts) {
        parties.push({ name: parts[1].trim(), role: parts[2] });
      }
    });
  }

  // Extract dates (look for date patterns)
  const datePatterns = [
    /\d{1,2}\/\d{1,2}\/\d{4}/g,
    /\d{4}-\d{2}-\d{2}/g,
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi,
  ];

  datePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach((match: string) => {
        dates.push({ type: 'date', value: match });
      });
    }
  });

  // Extract amounts (look for currency patterns)
  const amountPatterns = [
    /\$[\d,]+(?:\.\d{2})?/g,
    /USD\s*[\d,]+(?:\.\d{2})?/gi,
    /EUR\s*[\d,]+(?:\.\d{2})?/gi,
  ];

  amountPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach((match: string) => {
        const value = parseFloat(match.replace(/[^0-9.]/g, ''));
        const currency = match.includes('EUR') ? 'EUR' : 'USD';
        amounts.push({ type: 'amount', value, currency });
      });
    }
  });

  return Response.json({
    parties,
    dates,
    amounts,
    extractedAt: new Date().toISOString(),
  });
}
