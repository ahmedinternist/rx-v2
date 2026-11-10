import styles from './prescription.module.css';

export default function PrescriptionNotFound() {
  return <div className={styles.page}><main className={styles.recovery}>
    <h1>Prescription unavailable</h1>
    <p>This prescription link is unavailable. Check the complete link or ask your prescriber for a new one.</p>
    <p lang="ar" dir="rtl">رابط الوصفة غير متاح. تأكد من الرابط الكامل أو اطلب رابطاً جديداً من الطبيب.</p>
  </main></div>;
}
