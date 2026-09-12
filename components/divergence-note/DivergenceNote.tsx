import {useTranslations} from 'next-intl';
import type {DivergenceKind} from '@/lib/measurement/divergence';
import {KIND_MESSAGE_KEY} from '@/lib/measurement/labels';
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
      {t(`kind_${KIND_MESSAGE_KEY[kind]}`)}
    </span>
  );
}

/**
 * Tek bir degerin kapsami: NEYI olcuyor, nasil elde edildi, hangi varyanta
 * ait, ne zaman aciklandi. Dort alan da bosken "kapsam belirtilmemis"
 * yazar — bilinmeyen ile bilinip yazilmayan ayni gorunmemeli.
 *
 * Nesne ILK SIRADA. Bilesik bir dosyada ayni alanda hem fuzenin hem
 * sistemin kaydi bulunur ve ikisi de "resmi · beyan" gorunur; hangisinin
 * neyi olctugu yazilmazsa okuyucu iki ayri niceligi tek satir sanir.
 * Kiyas hesabi farki zaten biliyor (lib/measurement/divergence.ts), ama
 * bilip soylememek bu projede kaydin kendisini bozmakla ayni sey.
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

  if (measurement.object) parts.push(t(`object_${measurement.object}`));

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
