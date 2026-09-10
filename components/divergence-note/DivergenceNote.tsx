import {useTranslations} from 'next-intl';
import type {DivergenceKind} from '@/lib/measurement/divergence';
import type {Measurement, Variant} from '@/lib/schema';
import styles from './DivergenceNote.module.css';

/**
 * Iraksama isareti — CLAUDE.md §3.
 *
 * Guven ve iraksama FARKLI EKSENLER, bu yuzden gorsel olarak yarismazlar:
 *  guven      deger duzeyinde, cerceveli rozet (ConfidenceBadge)
 *  iraksama   satir duzeyinde, cercevesiz kucuk metin
 *
 * Iraksamayi da rozet yapmak, hucredeki her degerin yanina ikinci bir
 * cerceve koyar ve okuyucu hangisinin neyi soyledigini ayirt edemez.
 */

const KIND_KEY: Record<DivergenceKind, string> = {
  celiski: 'kind_celiski',
  'farkli-aciklama': 'kind_farkliAciklama',
  'farkli-kapsam': 'kind_farkliKapsam',
  belirsiz: 'kind_belirsiz'
};

/**
 * Satirin durumu. Dort durum once metinle ayrisir; celiski ayrica satirin
 * kendisini isaretler (SpecTable). 'farkli-kapsam' ve 'belirsiz' zemin
 * vurgusu ALMAZ: ikisi de alarm degil, kiyasin yapilamadigi bilgisidir.
 * Sebebini her degerin altina inen ScopeNote soyler — "kapsam
 * belirtilmemis" ya da ayrisan alanin kendisi.
 */
export function DivergenceLabel({kind}: {kind: DivergenceKind}) {
  const t = useTranslations('Divergence');

  return (
    <span className={styles.label} data-divergence={kind}>
      {t(KIND_KEY[kind])}
    </span>
  );
}

/**
 * Tek bir degerin kapsami: nasil elde edildi, hangi varyanta ait, ne zaman
 * aciklandi. Uc alan da bosken "kapsam belirtilmemis" yazar — bilinmeyen
 * ile bilinip yazilmayan ayni gorunmemeli.
 *
 * Tarihten yalnizca yil aliniyor: kaynak bazen yalnizca yil veriyor ve
 * satirda tasinan bilgi "hangi donemin aciklamasi" sorusunun cevabi.
 */
export function ScopeNote({
  measurement,
  variants
}: {
  measurement: Measurement;
  variants: readonly Variant[];
}) {
  const t = useTranslations('Divergence');
  const parts: string[] = [];

  if (measurement.scope) parts.push(t(`scope_${measurement.scope}`));

  if (measurement.variant_id) {
    const variant = variants.find((item) => item.id === measurement.variant_id);
    if (variant) parts.push(variant.label);
  }

  if (measurement.stated_at) {
    parts.push(t('statedAt', {year: measurement.stated_at.slice(0, 4)}));
  }

  return (
    <span
      className={styles.scope}
      data-state={parts.length === 0 ? 'absent' : undefined}
    >
      {parts.length > 0 ? parts.join(' · ') : t('unknownScope')}
    </span>
  );
}
