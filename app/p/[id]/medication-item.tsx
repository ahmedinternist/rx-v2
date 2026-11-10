'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import styles from './prescription.module.css';

export default function MedicationItem({ index, children }: {
  index: number;
  children: ReactNode;
}) {
  const [entered, setEntered] = useState(false);
  const [touched, setTouched] = useState(false);
  const row = useRef<HTMLLIElement>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (feedbackTimer.current !== null) clearTimeout(feedbackTimer.current);
  }, []);

  const clearFeedback = () => {
    if (feedbackTimer.current !== null) clearTimeout(feedbackTimer.current);
    setTouched(false);
  };

  const touchFeedback = () => {
    if (feedbackTimer.current !== null) clearTimeout(feedbackTimer.current);
    setTouched(true);
    // Brief feedback only: tapping a medicine does not open or change anything.
    feedbackTimer.current = setTimeout(() => setTouched(false), 650);
  };

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
    <li ref={row} className={styles.medication} data-entered={entered} data-touched={touched}
      onPointerDown={touchFeedback} onPointerUp={touchFeedback} onPointerCancel={clearFeedback}
      onPointerLeave={event => { if (event.pointerType === 'mouse') clearFeedback(); }}
      style={{ '--entrance-delay': `${Math.min(index, 5) * 0.08}s` } as CSSProperties}>
      <span className={styles.number} aria-hidden="true">{index + 1}</span>
      <article className={styles.medicationBody}>
        {children}
      </article>
    </li>
  );
}
