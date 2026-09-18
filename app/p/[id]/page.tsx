import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PharmacistPage({ params }: PageProps) {
  const { id } = await params;

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL!;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN!;

  // Fetch directly from Redis REST API (GET rx:id)
  const res = await fetch(`${redisUrl}/get/rx:${id}`, {
    headers: { Authorization: `Bearer ${redisToken}` },
    cache: 'no-store',
  });

  const { result } = await res.json();

  if (!result) {
    notFound();
  }

  const prescription = typeof result === 'string' ? JSON.parse(result) : result;

  return (
    <div style={{ maxWidth: '680px', margin: '40px auto', padding: '24px', background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <header style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', color: '#0f172a' }}>Pharmacist Verification</h1>
        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>Rx ID: <strong>{id}</strong></p>
      </header>

      <section style={{ background: '#f1f5f9', padding: '16px', borderRadius: '6px' }}>
        <h2 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#475569', marginTop: 0 }}>Prescription Payload</h2>
        <pre style={{ margin: 0, fontSize: '13px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
          {JSON.stringify(prescription, null, 2)}
        </pre>
      </section>
    </div>
  );
}
