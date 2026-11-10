import LocalizedText from './localized-text';
import MedicationItem from './medication-item';
import styles from './prescription.module.css';
import { medicationIdentity, genericSubtitle, instructionSummary } from '../../lib/rx-presentation';
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
  const doctorParts = doctor.split(/\s*[·•]\s*/);
  const doctorName = doctorParts[0];
  const specialty = doctorParts.slice(1).join(' · ');
  const license = toText(raw?.registrationId || raw?.regId || raw?.license || raw?.doctorRegId || raw?.syndicateId || raw?.doctor?.license_no, 'Not provided');
  const clinicName = toText(raw?.clinicName || raw?.clinic?.name).trim() || 'Electronic Prescription';
  const phone = toText(raw?.phone || raw?.doctorPhone || raw?.clinic?.phone).trim();

  const rawPhoneDigits = phone.replace(/[^0-9+]/g, '');
  const cleanPhoneForDial = /^\+?[0-9]{7,15}$/.test(rawPhoneDigits) ? rawPhoneDigits : '';

  const websiteText = toText(raw?.website || raw?.clinicWebsite || raw?.clinic?.website).trim();
  let websiteUrl = '';
  if (websiteText) {
    try {
      const parsedWebsite = new URL(websiteText);
      if (parsedWebsite.protocol === 'https:' && parsedWebsite.hostname
          && !parsedWebsite.username && !parsedWebsite.password) {
        websiteUrl = parsedWebsite.toString();
      }
    } catch {
      websiteUrl = '';
    }
  }

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
  const age = ageText ? `${ageText} yrs` : 'Not provided';
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
        ...medicationIdentity(item, '', ''),
        subtitle: '',
        instructions: '',
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
    const manufacturer = toText(item?.manufacturer || item?.manufacturerName || item?.company || item?.companyName, '').trim();
    const duration = toText(item?.duration || item?.period || item?.treatmentDays || item?.days, '');
    const instructions = instructionSummary(
      toText(item?.frequency || item?.regimen),
      explicitInstructions,
      toText(item?.mealTiming || item?.meal_timing),
      toText(item?.notes),
      duration,
    );
    const quantity = toText(item?.quantity || item?.qty || item?.count || item?.totalQuantity, '');

    return {
      ...medicationIdentity(displayTitle, dosage, manufacturer),
      subtitle: genericSubtitle(displaySub),
      instructions,
      duration,
      quantity,
    };
  });

  return (
    <div className={styles.page}>
      <div className={styles.sheet}>
        <header className={styles.header}>
          <div className={styles.identity}>
            <span className={styles.rx} aria-hidden="true">&#8478;</span>
            <div className={styles.prescriber}>
              <h1 dir="auto">{doctor !== 'Not provided' ? doctorName : clinicName}{specialty ? <span className={styles.specialty}> • <bdi><LocalizedText text={specialty} /></bdi></span> : null}</h1>
              <div className={styles.headerDetails}>
                {license !== 'Not provided' ? <span dir="auto">License #{license}</span> : null}
                {license !== 'Not provided' && phone ? <span aria-hidden="true">•</span> : null}
                {phone ? <bdi>{phone}</bdi> : null}
              </div>
              {clinicName !== 'Electronic Prescription' && clinicName !== doctor ? <div className={styles.clinic} dir="auto">{clinicName}</div> : null}
            </div>
          </div>
          {/* Right Action Icons Group */}
          <div className={styles.actions}>
            {/* Phone Call Icon */}
            {cleanPhoneForDial ? <a
              href={`tel:${cleanPhoneForDial}`}
              aria-label="Call Clinic Phone"
              className={styles.action}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg><span>Call</span>
            </a> : null}

            {/* Google Maps Pin Icon */}
            {mapsUrl ? <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              aria-label="Open Clinic Location on Google Maps"
              className={styles.action}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg><span>Map</span>
            </a> : null}

            {/* Clinic Website Icon */}
            {websiteUrl ? <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              aria-label="Open Clinic Website"
              className={styles.action}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M2 12h20"></path>
                <path d="M12 2a15.3 15.3 0 0 1 0 20"></path>
                <path d="M12 2a15.3 15.3 0 0 0 0 20"></path>
              </svg><span>Web</span>
            </a> : null}
          </div>
        </header>

        <main className={styles.main}>
          <section className={styles.patient} aria-label="Patient details">
            <h2 dir="auto">{patient}</h2>
            <div className={styles.patientMeta}>
              {ageText ? <bdi>{age}</bdi> : null}
              {ageText && date !== 'Not provided' ? <span aria-hidden="true">•</span> : null}
              {date !== 'Not provided' ? <bdi>{date}</bdi> : null}
            </div>
          </section>
          <section className={styles.medications} aria-label="Medications">
            {medications.length > 0 ? <ol className={styles.list}>
              {medications.map((med: any, index: number) => <MedicationItem key={index} index={index}>
                  <div className={styles.drugHeading}>
                    <h3 dir="auto">{med.title.replace(/\s+(tab\.?)$/i, '')}{/\s+tab\.?$/i.test(med.title) ? <> <span className={styles.form}>{med.title.match(/tab\.?$/i)?.[0]}</span></> : null}</h3>
                    {med.dosage ? <bdi className={styles.dosage}>{med.dosage}</bdi> : null}
                    {med.manufacturer ? <span className={styles.manufacturer} dir="auto">{med.manufacturer}</span> : null}
                  </div>
                  {med.subtitle ? <p className={styles.generic} dir="auto">{med.subtitle}</p> : null}
                  {med.instructions ? <div className={styles.instructions} dir="ltr">
                    <span className={styles.instructionText} dir="auto"><LocalizedText text={med.instructions} /></span>
                  </div> : null}
                  {med.quantity ? <div className={styles.treatment}><span>Qty: <bdi>{med.quantity}</bdi></span></div> : null}
              </MedicationItem>)}
            </ol> : <p className={styles.empty}>No active medications listed in this record.</p>}
          </section>
        </main>
      </div>
    </div>
  );
}
