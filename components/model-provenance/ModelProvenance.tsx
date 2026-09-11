import {useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/routing';
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
  const labels = useTranslations('RatioLabels');

  const product = productFor(system.slug);
  // Urun tanimi yoksa model de yok; bos bir bolum acilmaz.
  if (!product) return null;

  const entries = Object.entries(product.ratios) as Array<[string, Ratio]>;
  if (entries.length === 0) return null;

  const counts = {measured: 0, reading: 0, chosen: 0};
  for (const [, ratio] of entries) counts[ratio.basis]++;

  // Once olculmus, sonra okuma, sonra secilmis — okuyucu once en saglami gorsun.
  const sorted = [...entries].sort(
    ([, a], [, b]) => ORDER.indexOf(a.basis) - ORDER.indexOf(b.basis)
  );

  return (
    <div className={styles.wrap}>
      <p className={styles.intro}>{t('intro')}</p>
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
