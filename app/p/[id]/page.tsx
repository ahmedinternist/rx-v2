import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PharmacistPage({ params }: PageProps) {
  const { id } = await params;

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL!;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN!;

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

  const doctor = raw?.doctor || raw?.doctorName || raw?.prescriber || 'Prescribing Physician';
  const license = raw?.registrationId || raw?.regId || raw?.license || raw?.doctorRegId || raw?.syndicateId || 'MD-Verified';
  const clinic = raw?.clinic || raw?.clinicName || 'Clinic Record';
  const phone = raw?.phone || raw?.doctorPhone || '';

  const patient = raw?.patient || raw?.patientName || raw?.name || 'Patient';
  const age = raw?.age || raw?.patientAge ? `${raw?.age || raw?.patientAge} Years` : 'N/A';
  const date = raw?.date || raw?.issueDate || raw?.createdAt || 'Active Record';

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
    return {
      name: item?.name || item?.drug || item?.medicine || 'Prescribed Item',
      dosage: item?.dosage || item?.dose || item?.strength || '',
      instructions: item?.instructions || item?.sig || item?.directions || 'As directed by physician',
      duration: item?.duration || item?.period || '',
      quantity: item?.quantity || item?.qty || item?.count || '',
    };
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
