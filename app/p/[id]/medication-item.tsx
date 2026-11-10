'use client';

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import styles from './prescription.module.css';

type Detail = { label: string; value: string };

export default function MedicationItem({ index, name, details, children }: {
  index: number;
  name: string;
  details: Detail[];
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const row = useRef<HTMLLIElement>(null);
  const panelId = useId();

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
    <li ref={row} className={styles.medication} data-entered={entered} data-expanded={open}
      style={{ '--entrance-delay': `${Math.min(index, 5) * 0.08}s` } as CSSProperties}>
      <span className={styles.number} aria-hidden="true">{index + 1}</span>
      <article className={styles.medicationBody}>
        {children}
        {details.length ? <>
          <button type="button" className={styles.detailsToggle} aria-expanded={open} aria-controls={panelId}
            aria-label={`${open ? 'Hide' : 'Show'} prescription details for ${name}`} onClick={() => setOpen(value => !value)}>
            <span>{open ? 'Hide details' : 'Prescription details'}</span>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <div id={panelId} className={styles.drawer} data-open={open} aria-hidden={!open} inert={!open}>
            <div className={styles.drawerClip}>
              <dl className={styles.detailList}>
                {details.map(detail => <div key={detail.label}>
                  <dt>{detail.label}</dt><dd dir="auto">{detail.value}</dd>
                </div>)}
              </dl>
            </div>
          </div>
        </> : null}
      </article>
    </li>
  );
}
