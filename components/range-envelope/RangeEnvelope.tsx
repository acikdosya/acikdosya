'use client';

import dynamic from 'next/dynamic';
import {useEffect, useRef, useState} from 'react';
import type {Locale} from '@/i18n/routing';
import type {RangeCopy} from './copy';
import styles from './RangeEnvelope.module.css';
import type {Ring} from './rings';

/*
 * Cevrilmis metinler prop olarak geliyor, useTranslations ile degil.
 * Harita istemci tarafinda calisir; orada ceviri kullanmak next-intl'in
 * mesaj bicimlendiricisini ilk yuke sokuyordu — CLAUDE.md §6.
 * Ayni desen ModelSection'da da var.
 */
const Map = dynamic(() => import('./RangeEnvelopeMap'), {ssr: false});

/**
 * MapLibre paketi ~280 KB. Dinamik import tek basina yetmiyor: bilesen
 * mount olur olmaz chunk inerdi. Bu yuzden harita ancak bolum goruntuye
 * yaklasinca yuklenir — CLAUDE.md §6.
 */
export function RangeEnvelope({
  rings,
  locale,
  copy
}: {
  rings: Ring[];
  locale: Locale;
  copy: RangeCopy;
}) {
  const anchor = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = anchor.current;
    if (!element || inView) return;

    // Destek yoksa haritayi gizlemektense hemen yukle.
    if (typeof IntersectionObserver === 'undefined') {
      const timer = setTimeout(() => setInView(true), 0);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      {rootMargin: '300px'}
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [inView]);

  return (
    <div ref={anchor}>
      {inView ? (
        <Map rings={rings} locale={locale} copy={copy} />
      ) : (
        /* Iskelet ve harita ayni yukseklikte: chunk inerken sayfa kaymaz. */
        <div className={`${styles.map} ${styles.placeholder}`}>
          {copy.loading}
        </div>
      )}
    </div>
  );
}
