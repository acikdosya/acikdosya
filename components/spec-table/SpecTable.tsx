import {useTranslations} from 'next-intl';
import {
  ConfidenceBadge,
  ConflictBadge
} from '@/components/confidence-badge/ConfidenceBadge';
import type {Locale} from '@/i18n/routing';
import {formatDate, formatValue, hasConflict} from '@/lib/format';
import {
  attributeKeys,
  specKeys,
  type Attribute,
  type AttributeKey,
  type Measurement,
  type SpecKey,
  type System
} from '@/lib/schema';
import styles from './SpecTable.module.css';

/** Birim alan adinin icinde tasiniyor; cevrilmez. */
const UNITS: Record<SpecKey, string> = {
  length_m: 'm',
  diameter_mm: 'mm',
  mass_kg: 'kg',
  range_km: 'km',
  cep_m: 'm'
};

type Props = {
  system: System;
  locale: Locale;
};

function SourceLine({
  source,
  sourceUrl,
  verifiedAt,
  locale
}: {
  source: string;
  sourceUrl?: string;
  verifiedAt?: string;
  locale: Locale;
}) {
  return (
    <span className={styles.source}>
      {sourceUrl ? (
        <a href={sourceUrl} rel="nofollow noopener">
          {source}
        </a>
      ) : (
        source
      )}
      {verifiedAt ? (
        <>
          {' · '}
          <span className={styles.verified}>{formatDate(verifiedAt, locale)}</span>
        </>
      ) : null}
    </span>
  );
}

function MeasurementCell({
  list,
  unit,
  locale
}: {
  list: readonly Measurement[] | undefined;
  unit: string;
  locale: Locale;
}) {
  if (!list || list.length === 0) {
    return (
      <td>
        <span className={styles.empty}>—</span>
      </td>
    );
  }

  return (
    <td>
      {list.map((measurement, index) => (
        <span className={styles.entry} key={`${measurement.value}-${index}`}>
          <span className={styles.value}>
            {formatValue(measurement, locale)}
            <small>{unit}</small>
          </span>
          <ConfidenceBadge confidence={measurement.confidence} />
          <SourceLine
            source={measurement.source[locale]}
            sourceUrl={measurement.source_url}
            verifiedAt={measurement.verified_at}
            locale={locale}
          />
        </span>
      ))}
    </td>
  );
}

function AttributeCell({
  attribute,
  locale
}: {
  attribute: Attribute | undefined;
  locale: Locale;
}) {
  if (!attribute) {
    return (
      <td>
        <span className={styles.empty}>—</span>
      </td>
    );
  }

  return (
    <td>
      <span className={styles.attributeValue}>{attribute.value[locale]}</span>
      <ConfidenceBadge confidence={attribute.confidence} />
      {attribute.source ? (
        <SourceLine
          source={attribute.source[locale]}
          sourceUrl={attribute.source_url}
          verifiedAt={attribute.verified_at}
          locale={locale}
        />
      ) : null}
    </td>
  );
}

/**
 * Her sayi degeri, guven rozeti ve kaynagiyla birlikte gorunur.
 * Bir alanda birden fazla deger varsa hepsi ayni hucrede alt alta yazilir —
 * hangisinin dogru oldugunu secmek okuyucunun isi, bizim degil.
 */
export function SpecTable({system, locale}: Props) {
  const t = useTranslations('SpecTable');
  const tSpec = useTranslations('Specs');
  const tAttribute = useTranslations('Attributes');

  const usedSpecs = specKeys.filter((key: SpecKey) =>
    system.variants.some((variant) => variant.specs[key])
  );
  const usedAttributes = attributeKeys.filter((key: AttributeKey) =>
    system.variants.some((variant) => variant.attributes[key])
  );

  return (
    <div className={styles.scroller}>
      <table className={styles.table}>
        <caption>{t('caption')}</caption>
        <thead>
          <tr>
            <th scope="col" className={styles.field}>
              {t('field')}
            </th>
            {system.variants.map((variant) => (
              <th scope="col" key={variant.id}>
                {variant.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {usedSpecs.map((key) => {
            const conflict = system.variants.some((variant) =>
              hasConflict(variant.specs[key])
            );

            return (
              <tr key={key} className={conflict ? styles.conflictRow : undefined}>
                <th scope="row" className={styles.field}>
                  {tSpec(key)}{' '}
                  {conflict ? <ConflictBadge /> : null}
                </th>
                {system.variants.map((variant) => (
                  <MeasurementCell
                    key={variant.id}
                    list={variant.specs[key]}
                    unit={UNITS[key]}
                    locale={locale}
                  />
                ))}
              </tr>
            );
          })}

          {usedAttributes.map((key) => (
            <tr key={key}>
              <th scope="row" className={styles.field}>
                {tAttribute(key)}
              </th>
              {system.variants.map((variant) => (
                <AttributeCell
                  key={variant.id}
                  attribute={variant.attributes[key]}
                  locale={locale}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
