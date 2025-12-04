// app/api/mocks/newfront/contracts/archive/route.ts

export async function POST(req: Request) {
  const { contractId, finalVersion, metadata } = await req.json();

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simulate archiving to in-region storage
  const archiveRecord = {
    contractId,
    archivedAt: new Date().toISOString(),
    version: finalVersion,
    metadata: {
      ...metadata,
      region: 'us-west-2', // In-region storage
      dataResidency: 'US',
      noTraining: true, // Explicit flag: no training on customer data
    },
    storageLocation: `s3://newfront-contracts/${contractId}/v1`,
  };

  console.log('[Contract Archive] Archived contract', {
    contractId,
    region: archiveRecord.metadata.region,
    dataResidency: archiveRecord.metadata.dataResidency,
  });

  return Response.json({
    ...archiveRecord,
    success: true,
  });
}
