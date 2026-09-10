import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import {formatDate, formatNumber} from '@/lib/format';
import type {Confidence, System} from '@/lib/schema';
import {systemStats} from '@/lib/stats';
import styles from './SystemCard.module.css';

const ORDER: readonly Confidence[] = ['official', 'press', 'estimate'];

/**
 * Ana sayfadaki dosya girisi. Sayilar icerikten hesaplanir; hicbiri sabit
 * yazilmaz. Kayitta hic deger yoksa dagilim seridi de cizilmez — bos bir
 * serit veri varmis izlenimi verirdi.
 */
export function SystemCard({system, locale}: {system: System; locale: Locale}) {
  const t = useTranslations('SystemCard');
  const tCategory = useTranslations('Categories');
  const tConfidence = useTranslations('Confidence');

  const stats = systemStats(system);
  const parts = ORDER.filter((key) => stats.tally[key] > 0);

  return (
    <Link
      href={{pathname: '/sistemler/[slug]', params: {slug: system.slug}}}
      className={styles.card}
    >
      <div className={styles.main}>
        <div className={styles.title}>
          <span className={styles.name}>{system.name[locale]}</span>
          <span className={styles.category}>{tCategory(system.category)}</span>
        </div>

        {system.summary ? (
          <p className={styles.summary}>{system.summary[locale]}</p>
        ) : null}

        <span className={styles.counts}>
          {t('counts', {
            values: formatNumber(stats.values, locale),
            sources: formatNumber(stats.sources, locale)
          })}
          {stats.verifiedAt
            ? ` — ${t('updated', {date: formatDate(stats.verifiedAt, locale)})}`
            : null}
        </span>
      </div>

      {stats.entries > 0 ? (
        <div className={styles.side}>
          <span className={styles.sideLabel}>{t('distribution')}</span>

          <div className={styles.bar} aria-hidden="true">
            {parts.map((key) => (
              <span
                key={key}
                className={styles.segment}
                data-confidence={key}
                style={{width: `${(stats.tally[key] / stats.entries) * 100}%`}}
              />
            ))}
          </div>

          <span className={styles.counts}>
            {parts
              .map(
                (key) =>
                  `${formatNumber(stats.tally[key], locale)} ${tConfidence(key)}`
              )
              .join(' / ')}
          </span>

          <span className={styles.open}>{t('open')}</span>
        </div>
      ) : null}
    </Link>
  );
}
