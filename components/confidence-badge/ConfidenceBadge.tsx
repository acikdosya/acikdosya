import {useTranslations} from 'next-intl';
import type {Confidence} from '@/lib/schema';
import styles from './ConfidenceBadge.module.css';

export function ConfidenceBadge({confidence}: {confidence: Confidence}) {
  const t = useTranslations('Confidence');

  return (
    <span className={`${styles.badge} ${styles[confidence]}`}>
      {t(confidence)}
    </span>
  );
}

/** Ayni alanda celisen degerler oldugunu soyler. */
export function ConflictBadge() {
  const t = useTranslations('Confidence');

  return <span className={`${styles.badge} ${styles.conflict}`}>{t('conflict')}</span>;
}
