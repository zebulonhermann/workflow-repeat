export async function POST(req: Request) {
  // In a real system, send an email/Slack. For demo, just log.
  const body = await req.json();
  console.log('Demo notify:', body);
  return Response.json({ ok: true });
}
