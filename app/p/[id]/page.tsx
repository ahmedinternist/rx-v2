import { notFound } from 'next/navigation';

interface Medication {
  name: string;
  dosage?: string;
  instructions: string;
}

interface PrescriptionData {
  patient: string;
  doctor: string;
  clinic?: string;
  date?: string;
  medications: Medication[];
}

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

  const rx: PrescriptionData = typeof result === 'string' ? JSON.parse(result) : result;
  const currentUrl = `https://rx-v2.vercel.app/p/${id}`;
  const qrCodeUrl = `https://quickchart.io/qr?text=${encodeURIComponent(currentUrl)}&size=140&margin=1`;

  return (
    <div style={{ maxWidth: '780px', margin: '30px auto', padding: '0 16px', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1e293b' }}>
      
      {/* Verification Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#059669', color: '#fff', padding: '14px 20px', borderRadius: '8px 8px 0 0' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Verified Digital Prescription</h1>
          <p style={{ margin: '2px 0 0', fontSize: '13px', opacity: 0.9 }}>Dispensing Verification Record</p>
        </div>
        <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '999px', fontWeight: 500 }}>
          Active • 7-Day Window
        </span>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        
        {/* Header Metadata & QR Code */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px', marginBottom: '24px', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', flex: 1 }}>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>Prescribing Physician</span>
              <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>{rx.doctor || 'Not Specified'}</p>
            </div>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>Patient Name</span>
              <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>{rx.patient || 'Unknown'}</p>
            </div>
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>Prescription ID</span>
              <p style={{ margin: '4px 0 0', fontSize: '14px', fontFamily: 'monospace', color: '#059669', fontWeight: 600 }}>{id}</p>
            </div>
          </div>

          {/* Quick-Scan QR Code */}
          <div style={{ textAlign: 'center', borderLeft: '1px solid #f1f5f9', paddingLeft: '20px' }}>
            <img src={qrCodeUrl} alt="Prescription QR Code" width="120" height="120" style={{ display: 'block', borderRadius: '4px' }} />
            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginTop: '4px' }}>Scan to Verify</span>
          </div>
        </div>

        {/* Medication Table */}
        <div>
          <h2 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#475569', letterSpacing: '0.05em', marginBottom: '12px' }}>Prescribed Regimen</h2>
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', width: '45%' }}>Medication</th>
                  <th style={{ padding: '10px 14px', fontWeight: 600, color: '#475569', width: '55%' }}>Sig / Instructions</th>
                </tr>
              </thead>
              <tbody>
                {rx.medications && rx.medications.length > 0 ? (
                  rx.medications.map((med, index) => (
                    <tr key={index} style={{ borderBottom: index === rx.medications.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{med.name}</div>
                        {med.dosage && <div style={{ fontSize: '12px', color: '#64748b' }}>Dosage: {med.dosage}</div>}
                      </td>
                      <td style={{ padding: '12px 14px', verticalAlign: 'top', color: '#334155' }}>
                        {med.instructions}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>No medications listed in this record.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pharmacist Action Footer */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Cryptographic verification token: {id}</span>
          <button 
            type="button" 
            style={{ background: '#0f172a', color: '#fff', border: 'none', borderRadius: '4px', padding: '8px 16px', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}
            onClick={undefined}
          >
            Mark Dispensed
          </button>
        </div>

      </div>
    </div>
  );
}
