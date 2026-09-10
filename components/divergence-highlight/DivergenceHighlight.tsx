import {useTranslations} from 'next-intl';
import {ConfidenceBadge} from '@/components/confidence-badge/ConfidenceBadge';
import {
  DivergenceLabel,
  ScopeNote
} from '@/components/divergence-note/DivergenceNote';
import type {Locale} from '@/i18n/routing';
import {formatDate, formatValue, SPEC_UNITS} from '@/lib/format';
import type {Variant} from '@/lib/schema';
import type {Divergence} from '@/lib/stats';
import styles from './DivergenceHighlight.module.css';

/**
 * Ana sayfadaki iraksayan veri satiri.
 *
 * Icerik dosyasindan gelir, ornek degildir: hangi alanin gosterilecegini
 * lib/stats.ts secer — once durumun agirligi, sonra farkli deger adedi.
 * Sayilar elle yazilmaz — CLAUDE.md §5.7.
 *
 * Satirin basligi artik "celiski" demiyor. Uc durumdan hangisi hesaplandiysa
 * onu yaziyor: iki alt sinir celismez, farkli aciklamalardir.
 */
type Props = {
  divergence: Divergence;
  variants: readonly Variant[];
  locale: Locale;
};

export function DivergenceHighlight({divergence, variants, locale}: Props) {
  const t = useTranslations('Divergence');
  const tSpec = useTranslations('Specs');
  const unit = SPEC_UNITS[divergence.key];

  return (
    <figure className={styles.panel}>
      <figcaption className={styles.head}>
        <span className={styles.field}>
          {divergence.variantLabel} —{' '}
          {tSpec(divergence.key).toLocaleLowerCase(locale)}{' '}
          <DivergenceLabel kind={divergence.kind} />
        </span>
        <span className={styles.count}>
          {t('onRecord', {count: divergence.distinct})}
        </span>
      </figcaption>

      <ol className={styles.rows}>
        {divergence.measurements.map((measurement, index) => (
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
            <p className={styles.scope}>
              <ScopeNote measurement={measurement} variants={variants} />
            </p>
          </li>
        ))}
      </ol>

      <p className={styles.note}>{t('note')}</p>
    </figure>
  );
}
