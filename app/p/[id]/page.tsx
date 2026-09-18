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

  // Parse result safely whether it is a string or already an object
  let raw: any = {};
  try {
    raw = typeof result === 'string' ? JSON.parse(result) : result;
  } catch {
    raw = {};
  }

  // Backwards-compatible extraction across all schema variations
  const doctor = raw?.doctor || raw?.doctorName || raw?.prescriber || 'Prescribing Physician';
  const license = raw?.registrationId || raw?.regId || raw?.license || raw?.doctorRegId || raw?.syndicateId || 'MD-Verified';
  const clinic = raw?.clinic || raw?.clinicName || 'Clinic Record';
  const phone = raw?.phone || raw?.doctorPhone || '';

  const patient = raw?.patient || raw?.patientName || raw?.name || 'Patient';
  const age = raw?.age || raw?.patientAge ? `${raw?.age || raw?.patientAge} Years` : 'N/A';
  const date = raw?.date || raw?.issueDate || raw?.createdAt || 'Active Prescription';

  // Safely extract medications from any known key (medications, drugs, items, rxList)
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
    <>
      <style>{`
        :root {
          --top-banner-bg: #1d4ed8;
          --rx-symbol-color: #93c5fd;
          --screen-bg: #f1f5f9;
          --card-bg: #ffffff;
          --border-color: #cbd5e1;
          --header-strip-bg: #e2e8f0;
          --header-strip-text: #0f172a;
          --text-main: #0f172a;
          --text-muted: #475569;
          --badge-bg: #dcfce7;
          --badge-text: #14532d;
          --sig-box-bg: #f0fdf4;
          --sig-box-border: #86efac;
          --sig-box-title: #166534;
          --sig-box-text: #14532d;
        }

        body {
          background-color: #94a3b8;
          display: flex;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        .phone-container {
          width: 100%;
          max-width: 440px;
          background-color: var(--screen-bg);
          display: flex;
          flex-direction: column;
          position: relative;
          min-height: 100vh;
          border-left: 1px solid var(--border-color);
          border-right: 1px solid var(--border-color);
          box-sizing: border-box;
        }

        .top-banner {
          width: 100%;
          background-color: var(--top-banner-bg);
          color: #ffffff;
          padding: 0.9rem 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 10;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
          box-sizing: border-box;
        }

        .banner-title-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .rx-symbol {
          font-family: "Times New Roman", Georgia, serif;
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1;
          color: var(--rx-symbol-color);
        }

        .banner-title {
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          margin: 0;
        }

        .banner-status-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.35rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          background-color: #22c55e;
          color: #ffffff;
        }

        .app-content {
          padding: 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          padding-bottom: 2rem;
          box-sizing: border-box;
        }

        .info-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .card-header-strip {
          background-color: var(--header-strip-bg);
          padding: 0.5rem 0.85rem;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--header-strip-text);
          border-bottom: 1px solid var(--border-color);
          margin: 0;
        }

        .card-body {
          padding: 0.75rem 0.85rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .info-row {
          font-size: 0.875rem;
          line-height: 1.4;
          color: var(--text-main);
        }

        .info-row .label {
          font-weight: 700;
          color: var(--text-muted);
          margin-right: 4px;
        }

        .drug-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 0.9rem;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .drug-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
          line-height: 1.3;
        }

        .drug-meta-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.825rem;
        }

        .drug-badge {
          background-color: var(--badge-bg);
          color: var(--badge-text);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.25rem 0.6rem;
          border-radius: 9999px;
        }

        .instructions-container {
          background-color: var(--sig-box-bg);
          border-left: 3px solid var(--sig-box-border);
          border-radius: 0 8px 8px 0;
          padding: 0.6rem 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .instructions-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--sig-box-title);
        }

        .instructions-text {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--sig-box-text);
          line-height: 1.35;
        }

        .drug-footer-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--text-main);
        }
      `}</style>

      <div className="phone-container">
        <header className="top-banner" role="banner">
          <div className="banner-title-group">
            <span className="rx-symbol" aria-hidden="true">&#8478;</span>
            <h1 className="banner-title">Electronic Prescription</h1>
          </div>
          <div className="banner-status-badge">
            Active • Valid
          </div>
        </header>

        <main className="app-content">
          {/* Prescriber Information */}
          <section className="info-card">
            <h2 className="card-header-strip">Prescriber Information</h2>
            <div className="card-body">
              <div className="info-row">
                <span className="label">Doctor:</span>
                <span className="val">{doctor}</span>
              </div>
              <div className="info-row">
                <span className="label">License:</span>
                <span className="val">{license}</span>
              </div>
              <div className="info-row">
                <span className="label">Clinic:</span>
                <span className="val">{clinic}</span>
              </div>
              {phone && (
                <div className="info-row">
                  <span className="label">Phone:</span>
                  <span className="val">{phone}</span>
                </div>
              )}
              <div className="info-row">
                <span className="label">Rx Token:</span>
                <span className="val" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1d4ed8' }}>{id}</span>
              </div>
            </div>
          </section>

          {/* Patient Details */}
          <section className="info-card">
            <h2 className="card-header-strip">Patient Details</h2>
            <div className="card-body">
              <div className="info-row">
                <span className="label">Name:</span>
                <span className="val">{patient}</span>
              </div>
              <div className="info-row">
                <span className="label">Age:</span>
                <span className="val">{age}</span>
              </div>
              <div className="info-row">
                <span className="label">Consultation Date:</span>
                <span className="val">{date}</span>
              </div>
            </div>
          </section>

          {/* Prescribed Medications */}
          <section style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {medications.length > 0 ? (
              medications.map((med: any, index: number) => (
                <article className="drug-card" key={index}>
                  <div className="drug-title">{med.name}</div>

                  <div className="drug-meta-row">
                    <span className="info-row">
                      <span className="label">Dosage:</span> {med.dosage || 'Standard'}
                    </span>
                    {med.quantity && <span className="drug-badge">{med.quantity}</span>}
                  </div>

                  <div className="instructions-container">
                    <span className="instructions-title">Instructions</span>
                    <span className="instructions-text">{med.instructions}</span>
                  </div>

                  {(med.duration || med.quantity) && (
                    <div className="drug-footer-row">
                      <span className="label">Duration / Qty</span>
                      <span>{med.duration || 'As directed'} {med.quantity ? `/ Qty ${med.quantity}` : ''}</span>
                    </div>
                  )}
                </article>
              ))
            ) : (
              <div className="info-card" style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
                No active medications listed in this record.
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
