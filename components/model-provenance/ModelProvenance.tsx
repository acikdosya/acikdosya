import {useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/routing';
import {selectMeasurements} from '@/lib/geometry/measurements';
import type {AnyProduct} from '@/lib/geometry/product';
import {productFor} from '@/lib/geometry/registry';
import type {Ratio, RatioBasis} from '@/lib/geometry/ratio';
import type {System} from '@/lib/schema';
import styles from './ModelProvenance.module.css';

/**
 * Bicim kaydi — CLAUDE.md §3'un modele uygulanmis hali.
 *
 * Sayfadaki her sayi guven seviyesiyle sunuluyor. Modelin bicimini
 * belirleyen oranlar bugune kadar hicbir sey soylemiyordu; model,
 * verinin kendisi kadar yetkili gorunuyor ama kokenini gizliyordu.
 *
 * KOKEN GUVEN DEGILDIR. §4 ucuncu bir guven rozeti varyantini
 * yasakliyor; bu yuzden burada rozet CERCEVESI kullanilmaz. Uc durum
 * alt cizgi DESENIYLE ayrisir (duz / kesik / noktali), boylece renk
 * korlugu ve siyah beyaz ciktida da okunur.
 *
 * VARYANT BASINA. Bir ailenin varyantlari ayri bicim tanimi tasiyabilir
 * (specs/variant-geometry) ve o zaman oranlari da ayridir. Ayni tanimi
 * paylasan varyantlar tek blokta toplanir — ayni tabloyu iki kez yazmak
 * okuyucuya iki ayri kayit varmis gibi gorunurdu.
 */

const ORDER: RatioBasis[] = ['measured', 'reading', 'chosen'];

export function ModelProvenance({
  system,
  locale
}: {
  system: System;
  locale: Locale;
}) {
  const t = useTranslations('ModelProvenance');
  const tTable = useTranslations('SpecTable');

  /*
   * Yalnizca modeli cizilen gruplar. Bicimi olmayan bir grup icin koken
   * kaydi yazmak, olmayan bir modelin kaynagini gostermek olurdu.
   */
  const blocks = new Map<string, {label: string; product: AnyProduct}>();
  for (const selection of selectMeasurements(system)) {
    if (!selection.canModel) continue;
    const match = productFor(system.slug, selection.group.id);
    if (!match) continue;
    const label =
      selection.group.kind === 'family'
        ? tTable('familyLabel')
        : selection.group.label;
    const existing = blocks.get(match.key);
    if (existing) {
      // Ayni tanimi paylasan varyantlar tek baslikta birlesir.
      existing.label = `${existing.label}, ${label}`;
      continue;
    }
    blocks.set(match.key, {label, product: match.product});
  }

  if (blocks.size === 0) return null;

  return (
    <div className={styles.wrap}>
      <p className={styles.intro}>{t('intro')}</p>
      {[...blocks.entries()].map(([key, block]) => (
        <ProvenanceBlock
          key={key}
          label={blocks.size > 1 ? block.label : undefined}
          product={block.product}
          locale={locale}
        />
      ))}
    </div>
  );
}

/** Tek bir bicim taniminin oran listesi. */
function ProvenanceBlock({
  label,
  product,
  locale
}: {
  label?: string;
  product: AnyProduct;
  locale: Locale;
}) {
  const t = useTranslations('ModelProvenance');
  const labels = useTranslations('RatioLabels');

  const entries = Object.entries(product.ratios) as Array<[string, Ratio]>;
  if (entries.length === 0) return null;

  const counts = {measured: 0, reading: 0, chosen: 0};
  for (const [, ratio] of entries) counts[ratio.basis]++;

  // Once olculmus, sonra okuma, sonra secilmis — okuyucu once en saglami gorsun.
  const sorted = [...entries].sort(
    ([, a], [, b]) => ORDER.indexOf(a.basis) - ORDER.indexOf(b.basis)
  );

  return (
    <div className={styles.block}>
      {label ? <h4 className={styles.blockLabel}>{label}</h4> : null}
      <p className={styles.summary}>
        {t('summary', {
          measured: counts.measured,
          reading: counts.reading,
          chosen: counts.chosen
        })}
      </p>

      <dl className={styles.list}>
        {sorted.map(([key, ratio]) => (
          <div key={key} className={styles.row}>
            <dt className={styles.term}>
              <span className={styles.name}>{labels(key)}</span>
              <span
                className={styles.basis}
                data-basis={ratio.basis}
                title={t(`${ratio.basis}Hint`)}
              >
                {t(ratio.basis)}
              </span>
            </dt>
            <dd className={styles.detail}>
              <p className={styles.note}>{ratio.note[locale]}</p>
              {ratio.basis !== 'chosen' ? (
                <p className={styles.source}>
                  <a
                    className={styles.link}
                    href={ratio.source_url}
                    rel="noreferrer nofollow"
                    target="_blank"
                  >
                    {t('sourceLabel')}
                  </a>
                  <span className={styles.seen}>
                    {t('seenLabel')}: {ratio.seen_at}
                  </span>
                </p>
              ) : null}
              {ratio.basis === 'measured' ? (
                <p className={styles.check}>
                  <span className={styles.checkLabel}>{t('checkLabel')}:</span>{' '}
                  {ratio.projection_check[locale]}
                </p>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
