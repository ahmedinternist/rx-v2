'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import styles from './prescription.module.css';

export default function MedicationItem({ index, children }: {
  index: number;
  children: ReactNode;
}) {
  const [entered, setEntered] = useState(false);
  const row = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!row.current || !('IntersectionObserver' in window)) {
      setEntered(true);
      return;
    }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setEntered(true);
        observer.disconnect();
      }
    }, { threshold: 0.05 });
    observer.observe(row.current);
    return () => observer.disconnect();
  }, []);

  return (
    <li ref={row} className={styles.medication} data-entered={entered}
      style={{ '--entrance-delay': `${Math.min(index, 5) * 0.08}s` } as CSSProperties}>
      <span className={styles.number} aria-hidden="true">{index + 1}</span>
      <article className={styles.medicationBody}>
        {children}
      </article>
    </li>
  );
}
