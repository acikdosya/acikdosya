import {useTranslations} from 'next-intl';
import {ConfidenceBadge} from '@/components/confidence-badge/ConfidenceBadge';
import type {Locale} from '@/i18n/routing';
import {formatDate, formatValue, SPEC_UNITS} from '@/lib/format';
import type {Conflict} from '@/lib/stats';
import styles from './ConflictHighlight.module.css';

/**
 * Ana sayfadaki celisen veri satiri.
 *
 * Icerik dosyasindan gelir, ornek degildir: hangi alanin gosterilecegini
 * lib/stats.ts en cok farkli degere sahip alani secerek belirler. Sayilar
 * elle yazilmaz — CLAUDE.md §5.7.
 */
type Props = {
  conflict: Conflict;
  locale: Locale;
};

export function ConflictHighlight({conflict, locale}: Props) {
  const t = useTranslations('Conflict');
  const tSpec = useTranslations('Specs');
  const unit = SPEC_UNITS[conflict.key];

  return (
    <figure className={styles.panel}>
      <figcaption className={styles.head}>
        <span className={styles.field}>
          {conflict.variantLabel} — {tSpec(conflict.key).toLocaleLowerCase(locale)}
        </span>
        <span className={styles.count}>
          {t('onRecord', {count: conflict.distinct})}
        </span>
      </figcaption>

      <ol className={styles.rows}>
        {conflict.measurements.map((measurement, index) => (
          <li className={styles.row} key={`${measurement.value}-${index}`}>
            <span className={styles.value} data-confidence={measurement.confidence}>
              {formatValue(measurement, locale)}
              <small>{unit}</small>
            </span>
            <span className={styles.lead} aria-hidden="true" />
            <span className={styles.badge}>
              <ConfidenceBadge confidence={measurement.confidence} size="md" />
            </span>
            <p className={styles.source}>
              {measurement.source_url ? (
                <a href={measurement.source_url} rel="nofollow noopener">
                  {measurement.source[locale]}
                </a>
              ) : (
                measurement.source[locale]
              )}
              {' · '}
              {formatDate(measurement.verified_at, locale)}
            </p>
          </li>
        ))}
      </ol>

      <p className={styles.note}>{t('note')}</p>
    </figure>
  );
}
