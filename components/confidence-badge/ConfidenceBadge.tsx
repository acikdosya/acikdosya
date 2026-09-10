import {useTranslations} from 'next-intl';
import type {Confidence} from '@/lib/schema';
import styles from './ConfidenceBadge.module.css';

/**
 * Kucuk olcu tablo hucresi, harita lejanti ve 3B etiketi icindir.
 * Buyuk olcu rozetin kendisinin konu oldugu yerlerde kullanilir.
 */
type Size = 'sm' | 'md';

function classes(variant: string, size: Size): string {
  return [styles.badge, styles[variant], size === 'md' ? styles.md : '']
    .filter(Boolean)
    .join(' ');
}

/**
 * Sunum katmani: metni disaridan alir, ceviri baglamina bagli degildir.
 * Istemci bilesenleri (harita) bunu kullanir, boylece next-intl'in mesaj
 * bicimlendirici calisma zamani ilk yuke girmez — CLAUDE.md §6.
 */
export function Badge({
  confidence,
  label,
  size = 'sm'
}: {
  confidence: Confidence | 'conflict';
  label: string;
  size?: Size;
}) {
  return <span className={classes(confidence, size)}>{label}</span>;
}

/** Ceviriyi sunucuda cozer. */
export function ConfidenceBadge({
  confidence,
  size = 'sm'
}: {
  confidence: Confidence;
  size?: Size;
}) {
  const t = useTranslations('Confidence');

  return <Badge confidence={confidence} label={t(confidence)} size={size} />;
}

/** Ayni alanda celisen degerler oldugunu soyler. */
export function ConflictBadge({size = 'sm'}: {size?: Size}) {
  const t = useTranslations('Confidence');

  return <Badge confidence="conflict" label={t('conflict')} size={size} />;
}
