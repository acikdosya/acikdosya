import {useTranslations} from 'next-intl';
import {ConfidenceBadge} from '@/components/confidence-badge/ConfidenceBadge';
import {ScopeNote} from '@/components/divergence-note/DivergenceNote';
import type {Locale} from '@/i18n/routing';
import {formatDate, formatValue, SPEC_UNITS} from '@/lib/format';
import type {Measurement, SpecKey, Variant} from '@/lib/schema';
import styles from './HeroProvenance.module.css';

/**
 * Hero'nun ucuncu katmani: tek bir degerin tam koken zinciri — lib/hero.ts.
 *
 * Ne iraksama ne duzeltme varsa gosterilecek sey kalmiyor gibi gorunur; oysa
 * kalir. Bu projenin iddiasi zaten tek bir sayiyi kaynagi, kapsami ve
 * dogrulama tarihiyle birlikte tutmak. Panel o zinciri ACIK ACIK dizer:
 * her halka kendi etiketiyle.
 *
 * Satir gercek dosyadan gelir, ornek degildir — CLAUDE.md §5.7.
 */
export function HeroProvenance({
  measurement,
  specKey,
  variant,
  variants,
  systemName,
  locale
}: {
  measurement: Measurement;
  specKey: SpecKey;
  variant: Variant;
  variants: readonly Variant[];
  systemName: string;
  locale: Locale;
}) {
  const t = useTranslations('Hero');
  const tSpec = useTranslations('Specs');

  return (
    <figure className={styles.panel}>
      <figcaption className={styles.head}>
        <span className={styles.field}>
          {systemName} — {tSpec(specKey).toLocaleLowerCase(locale)}
        </span>
        <span className={styles.variant}>{variant.label}</span>
      </figcaption>

      <dl className={styles.chain}>
        <div className={styles.link}>
          <dt>{t('chain_value')}</dt>
          <dd>
            <span className={styles.value}>
              {formatValue(measurement, locale)}
              <small>{SPEC_UNITS[specKey]}</small>
            </span>
          </dd>
        </div>

        <div className={styles.link}>
          <dt>{t('chain_confidence')}</dt>
          <dd className={styles.badge}>
            <ConfidenceBadge confidence={measurement.confidence} size="md" />
          </dd>
        </div>

        <div className={styles.link}>
          <dt>{t('chain_scope')}</dt>
          <dd>
            <ScopeNote measurement={measurement} variants={variants} />
          </dd>
        </div>

        <div className={styles.link}>
          <dt>{t('chain_source')}</dt>
          <dd>
            {measurement.source_url ? (
              <a href={measurement.source_url} rel="nofollow noopener">
                {measurement.source[locale]}
              </a>
            ) : (
              measurement.source[locale]
            )}
          </dd>
        </div>

        <div className={styles.link}>
          <dt>{t('chain_verified')}</dt>
          <dd>{formatDate(measurement.verified_at, locale)}</dd>
        </div>
      </dl>

      <p className={styles.note}>{t('provenanceNote')}</p>
    </figure>
  );
}
