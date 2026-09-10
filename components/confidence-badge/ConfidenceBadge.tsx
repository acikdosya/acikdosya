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

/*
 * Iraksama rozeti burada YOK. Guven deger duzeyinde, iraksama satir
 * duzeyinde durur ve cercevesizdir — components/divergence-note.
 * Ikisini ayni gorsel dile sokmak, hangi cercevenin neyi soyledigini
 * belirsizlestirirdi.
 */

/**
 * Sunum katmani: metni disaridan alir, ceviri baglamina bagli degildir.
 * Istemci bilesenleri (harita) bunu kullanir, boylece next-intl'in mesaj
 * bicimlendirici calisma zamani ilk yuke girmez — CLAUDE.md §6.
 */
export function Badge({
  confidence,
  label,
  hint,
  size = 'sm'
}: {
  confidence: Confidence;
  label: string;
  /** Rozetin ne soyleyip ne soylemedigi — ustune gelince gorunur. */
  hint?: string;
  size?: Size;
}) {
  return (
    <span className={classes(confidence, size)} title={hint}>
      {label}
    </span>
  );
}

/**
 * Ceviriyi sunucuda cozer.
 *
 * Resmi rozet bir uyari tasir: rozet aciklamanin KIMDEN geldigini soyler,
 * bilginin bagimsiz olarak dogrulandigini soylemez. Ayni cumle yontem
 * sayfasinda ve guven seviyeleri kartinda da yazili — ipucu goremeyen
 * okuyucu icin.
 */
export function ConfidenceBadge({
  confidence,
  size = 'sm'
}: {
  confidence: Confidence;
  size?: Size;
}) {
  const t = useTranslations('Confidence');

  return (
    <Badge
      confidence={confidence}
      label={t(confidence)}
      hint={confidence === 'official' ? t('officialCaveat') : undefined}
      size={size}
    />
  );
}
