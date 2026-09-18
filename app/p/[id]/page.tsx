import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function PharmacistPage({ params }: PageProps) {
  // Support both Next.js 14 and Next.js 15 resolution
  const resolvedParams = params && typeof (params as any).then === 'function' 
    ? await (params as Promise<{ id: string }>) 
    : (params as { id: string });
    
  const id = resolvedParams?.id;

  if (!id) {
    notFound();
  }

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    throw new Error('Missing Redis environment variables');
  }

  const res = await fetch(`${redisUrl}/get/rx:${id}`, {
    headers: { Authorization: `Bearer ${redisToken}` },
    cache: 'no-store',
  });

  const { result } = await res.json();

  if (!result) {
    notFound();
  }

  let raw: any = {};
  try {
    raw = typeof result === 'string' ? JSON.parse(result) : result;
  } catch {
    raw = {};
  }

  // Safe string helper to avoid React runtime crashes
  const toText = (val: any, fallback = ''): string => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      return val.text || val.value || val.instructions || val.name || JSON.stringify(val);
    }
    return String(val);
  };

  // Header & Patient Info fallbacks
  const doctor = toText(raw?.doctor || raw?.doctorName || raw?.prescriber, 'Prescribing Physician');
  const license = toText(raw?.registrationId || raw?.regId || raw?.license || raw?.doctorRegId || raw?.syndicateId, 'MD-Verified');
  const clinic = toText(raw?.clinic || raw?.clinicName, 'Clinic Record');
  const phone = toText(raw?.phone || raw?.doctorPhone, '');

  const patient = toText(raw?.patient || raw?.patientName || raw?.name, 'Patient');
  const ageRaw = raw?.age || raw?.patientAge;
  const age = ageRaw ? `${toText(ageRaw)} Years` : 'N/A';
  const date = toText(raw?.date || raw?.issueDate || raw?.createdAt, 'Active Record');

  // List normalization
  const rawList = Array.isArray(raw?.medications)
    ? raw.medications
    : Array.isArray(raw?.drugs)
    ? raw.drugs
    : Array.isArray(raw?.items)
    ? raw.items
    : [];

  const medications = rawList.map((item: any) => {
    if (typeof item === 'string') {
      return {
        name: item,
        dosage: '',
        instructions: 'As directed by physician',
        duration: '',
        quantity: '',
      };
    }

    const name = toText(
      item?.name ||
      item?.drugName ||
      item?.tradeName ||
      item?.genericName ||
      item?.drug ||
      item?.medicine ||
      item?.item ||
      item?.title,
      'Prescribed Item'
    );

    const dosage = toText(
      item?.dosage ||
      item?.dose ||
      item?.strength ||
      item?.form ||
      item?.concentration,
      ''
    );

    const instructions = toText(
      item?.instructions ||
      item?.sig ||
      item?.directions ||
      item?.frequency ||
      item?.frequencyText ||
      item?.regimen ||
      item?.instruction,
      'As directed by physician'
    );

    const duration = toText(
      item?.duration ||
      item?.period ||
      item?.treatmentDays ||
      item?.days,
      ''
    );

    const quantity = toText(
      item?.quantity ||
      item?.qty ||
      item?.count ||
      item?.totalQuantity ||
      item?.packSize,
      ''
    );

    return { name, dosage, instructions, duration, quantity };
  });

  return (
    <div style={{ backgroundColor: '#94a3b8', minHeight: '100vh', display: 'flex', justifyContent: 'center', margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column', minHeight: '100vh', borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1' }}>
        
        {/* Top Blue Banner */}
        <header style={{ width: '100%', backgroundColor: '#1d4ed8', color: '#ffffff', padding: '0.9rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontFamily: '"Times New Roman", Georgia, serif', fontSize: '1.5rem', fontWeight: 700, color: '#93c5fd' }}>&#8478;</span>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Electronic Prescription</h1>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#22c55e', color: '#ffffff' }}>
            Active • Valid
          </span>
        </header>

        <main style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingBottom: '2rem', boxSizing: 'border-box' }}>
          
          {/* Prescriber Information Card */}
          <section style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ backgroundColor: '#e2e8f0', padding: '0.5rem 0.85rem', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #cbd5e1' }}>
              Prescriber Information
            </div>
            <div style={{ padding: '0.75rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                <strong style={{ color: '#475569', marginRight: '4px' }}>Doctor:</strong> {doctor}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                <strong style={{ color: '#475569', marginRight: '4px' }}>License:</strong> {license}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                <strong style={{ color: '#475569', marginRight: '4px' }}>Clinic:</strong> {clinic}
              </div>
              {phone ? (
                <div style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                  <strong style={{ color: '#475569', marginRight: '4px' }}>Phone:</strong> {phone}
                </div>
              ) : null}
              <div style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                <strong style={{ color: '#475569', marginRight: '4px' }}>Rx Token:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1d4ed8' }}>{id}</span>
              </div>
            </div>
          </section>

          {/* Patient Details Card */}
          <section style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ backgroundColor: '#e2e8f0', padding: '0.5rem 0.85rem', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', borderBottom: '1px solid #cbd5e1' }}>
              Patient Details
            </div>
            <div style={{ padding: '0.75rem 0.85rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                <strong style={{ color: '#475569', marginRight: '4px' }}>Name:</strong> {patient}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                <strong style={{ color: '#475569', marginRight: '4px' }}>Age:</strong> {age}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#0f172a' }}>
                <strong style={{ color: '#475569', marginRight: '4px' }}>Date:</strong> {date}
              </div>
            </div>
          </section>

          {/* Prescribed Medications Section */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {medications.length > 0 ? (
              medications.map((med: any, index: number) => (
                <article key={index} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                    {med.name}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem' }}>
                    <span style={{ color: '#0f172a' }}>
                      <strong style={{ color: '#475569', marginRight: '4px' }}>Dosage:</strong> {med.dosage || 'Standard'}
                    </span>
                    {med.quantity ? (
                      <span style={{ backgroundColor: '#dcfce7', color: '#14532d', fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '9999px' }}>
                        {med.quantity}
                      </span>
                    ) : null}
                  </div>

                  <div style={{ backgroundColor: '#f0fdf4', borderLeft: '3px solid #86efac', borderRadius: '0 8px 8px 0', padding: '0.6rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>Instructions</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#14532d', lineHeight: 1.35 }}>{med.instructions}</span>
                  </div>

                  {(med.duration || med.quantity) ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem', fontWeight: 600, color: '#0f172a' }}>
                      <span style={{ color: '#475569' }}>Duration / Qty</span>
                      <span>{med.duration || 'As directed'} {med.quantity ? `/ Qty ${med.quantity}` : ''}</span>
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '1rem', textAlign: 'center', color: '#64748b' }}>
                No active medications listed in this record.
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
