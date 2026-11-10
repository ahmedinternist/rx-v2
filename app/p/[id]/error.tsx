'use client';

import styles from './prescription.module.css';

export default function PrescriptionError({ reset }: { reset: () => void }) {
  return <div className={styles.page}><main className={styles.recovery}>
    <h1>Unable to load prescription</h1>
    <p>Check your connection and try again. If the problem continues, contact your prescriber.</p>
    <p lang="ar" dir="rtl">تعذر تحميل الوصفة. تحقق من الاتصال وحاول مجدداً. إذا استمرت المشكلة، تواصل مع الطبيب.</p>
    <button type="button" className={styles.retry} onClick={reset}>Try again / <span lang="ar" dir="rtl">حاول مجدداً</span></button>
  </main></div>;
}
