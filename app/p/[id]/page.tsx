import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PharmacistPage({ params }: PageProps) {
  const { id } = await params;

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

  const toText = (val: any, fallback = ''): string => {
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      return val.text || val.value || val.instructions || val.name || JSON.stringify(val);
    }
    return String(val);
  };

  const doctor = typeof raw?.doctor === 'object' && raw.doctor !== null
    ? [toText(raw.doctor.name), toText(raw.doctor.specialty)].filter(Boolean).join(' · ') || 'Not provided'
    : toText(raw?.doctor || raw?.doctorName || raw?.prescriber, 'Not provided');
  const license = toText(raw?.registrationId || raw?.regId || raw?.license || raw?.doctorRegId || raw?.syndicateId || raw?.doctor?.license_no, 'Not provided');
  const phone = toText(raw?.phone || raw?.doctorPhone || raw?.clinic?.phone).trim();
  
  const rawPhoneDigits = phone.replace(/[^0-9+]/g, '');
  const cleanPhoneForDial = /^\+?[0-9]{7,15}$/.test(rawPhoneDigits) ? rawPhoneDigits : '';
  
  const latitudeText = toText(raw?.latitude).trim();
  const longitudeText = toText(raw?.longitude).trim();
  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);
  const mapsUrl = latitudeText && longitudeText && Number.isFinite(latitude) && Number.isFinite(longitude)
    && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
    ? `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}` : '';

  const patient = toText(raw?.patient || raw?.patientName || raw?.name, 'Patient');
  const ageRaw = raw?.age ?? raw?.patientAge ?? raw?.patient?.age;
  const ageText = toText(ageRaw).trim();
  const age = ageText ? `${ageText} Years` : 'Not provided';
  const date = toText(raw?.date || raw?.issueDate || raw?.createdAt, 'Not provided');

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
        title: item,
        subtitle: '',
        dosage: '',
        instructions: 'Not provided',
        duration: '',
        quantity: '',
      };
    }

    // Extract trade/commercial brand name
    const tradeName = toText(
      item?.tradeName ||
      item?.brand_name ||
      item?.brandName ||
      item?.commercialName ||
      item?.brand ||
      item?.name ||
      item?.drugName ||
      item?.drug ||
      item?.medicine ||
      item?.title,
      ''
    );

    // Extract generic molecule / scientific name
    const genericName = toText(
      item?.genericName ||
      item?.generic_name ||
      item?.scientificName ||
      item?.molecule ||
      item?.activeIngredient ||
      item?.generic,
      ''
    );

    // Fallback: If tradeName wasn't explicitly supplied, promote genericName
    const displayTitle = tradeName || genericName || 'Prescribed Item';
    const displaySub = tradeName && genericName && tradeName.toLowerCase() !== genericName.toLowerCase() 
      ? genericName 
      : '';

    const dosage = toText(item?.dosage || item?.dose || item?.strength || item?.form || item?.concentration, '');
    const explicitInstructions = toText(item?.instructions || item?.sig || item?.directions).trim();
    const instructions = explicitInstructions || [toText(item?.frequency || item?.regimen).trim(), toText(item?.notes).trim()].filter(Boolean).join(' · ') || 'Not provided';
    const duration = toText(item?.duration || item?.period || item?.treatmentDays || item?.days, '');
    const quantity = toText(item?.quantity || item?.qty || item?.count || item?.totalQuantity, '');

    return { 
      title: displayTitle, 
      subtitle: displaySub, 
      dosage, 
      instructions, 
      duration, 
      quantity 
    };
  });

  return (
    <div style={{ backgroundColor: '#94a3b8', minHeight: '100vh', display: 'flex', justifyContent: 'center', margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '440px', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column', minHeight: '100vh', borderLeft: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1' }}>
        
        {/* Top Blue Banner */}
        <header style={{ width: '100%', backgroundColor: '#1d4ed8', color: '#ffffff', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)', boxSizing: 'border-box' }}>
          
          {/* Left Title Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontFamily: '"Times New Roman", Georgia, serif', fontSize: '1.45rem', fontWeight: 700, color: '#93c5fd', lineHeight: 1 }}>&#8478;</span>
            <h1 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, letterSpacing: '0.01em' }}>Electronic Prescription</h1>
          </div>

          {/* Right Action Icons Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Phone Call Icon */}
            {cleanPhoneForDial ? <a 
              href={`tel:${cleanPhoneForDial}`} 
              title={`Call Clinic: ${phone}`} 
              aria-label="Call Clinic Phone"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.18)', color: '#ffffff', textDecoration: 'none', border: '1px solid rgba(255, 255, 255, 0.3)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </a> : null}

            {/* Google Maps Pin Icon */}
            {mapsUrl ? <a 
              href={mapsUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              title="Open Clinic Location on Google Maps" 
              aria-label="Open Clinic Location on Google Maps"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.18)', color: '#ffffff', textDecoration: 'none', border: '1px solid rgba(255, 255, 255, 0.3)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </a> : null}

            {/* Active Status Chip */}
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.6rem', borderRadius: '9999px', fontSize: '0.725rem', fontWeight: 700, backgroundColor: '#22c55e', color: '#ffffff' }}>
              Active
            </span>
          </div>
        </header>

        <main style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', paddingBottom: '2rem', boxSizing: 'border-box' }}>
          
          {/* Prescriber Information Card (Without Rx Token) */}
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
                <strong style={{ color: '#475569', marginRight: '4px' }}>Phone:</strong> {phone || 'Not provided'}
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
                  
                  {/* Drug Identity: Trade Name + Optional Scientific/Generic Subtitle */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                      {med.title}
                    </div>
                    {med.subtitle ? (
                      <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#64748b' }}>
                        {med.subtitle}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem' }}>
                    <span style={{ color: '#0f172a' }}>
                      <strong style={{ color: '#475569', marginRight: '4px' }}>Dosage:</strong> {med.dosage || 'Not provided'}
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
                      <span>{med.duration || 'Not provided'} {med.quantity ? `/ Qty ${med.quantity}` : ''}</span>
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
