import {useTranslations} from 'next-intl';
import {ConfidenceBadge} from '@/components/confidence-badge/ConfidenceBadge';
import {
  DivergenceLabel,
  ScopeNote
} from '@/components/divergence-note/DivergenceNote';
import {Link} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import {EVENTS, sourceHost} from '@/lib/analytics';
import {formatDate, formatValue, SPEC_UNITS} from '@/lib/format';
import {
  attributeKeys,
  specKeys,
  type Attribute,
  type AttributeKey,
  type Measurement,
  type SpecKey,
  type System,
  type Variant
} from '@/lib/schema';
import {specDivergence} from '@/lib/stats';
import styles from './SpecTable.module.css';

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
        /*
         * Olcum oznitelikleri: bu bilesen sunucuda ciziliyor ve oyle
         * kalmali. Tiklamayi Analytics bilesenindeki tek dinleyici
         * topluyor — lib/analytics.ts.
         */
        <a
          href={sourceUrl}
          rel="nofollow noopener"
          data-track-event={EVENTS.source}
          data-track-kaynak={sourceHost(sourceUrl)}
          data-track-yer="tablo"
        >
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

/**
 * Kapsam notu yalnizca alan iraksadiginda cizilir. Tek degerli bir satirda
 * "beyan" yazmak bilgi tasimaz, gurultu yapar; iraksayan satirda ise
 * degerlerin neden kiyaslanmadigini tam orada soyler.
 */
function MeasurementCell({
  list,
  unit,
  locale,
  variants,
  showScope
}: {
  list: readonly Measurement[] | undefined;
  unit: string;
  locale: Locale;
  variants: readonly Variant[];
  showScope: boolean;
}) {
  const t = useTranslations('SpecTable');

  if (!list || list.length === 0) {
    return (
      <td>
        <span data-state="absent">{'—'}</span>
        <span className={styles.srOnly}>{t('absent')}</span>
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
          {showScope ? (
            <ScopeNote measurement={measurement} variants={variants} />
          ) : null}
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
  const t = useTranslations('SpecTable');

  if (!attribute) {
    return (
      <td>
        <span data-state="absent">{'—'}</span>
        <span className={styles.srOnly}>{t('absent')}</span>
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
            /*
             * Iraksama hesaplanir, elle bayraklanmaz. Ayni alandaki iki
             * deger celismek zorunda degil: iki alt sinir (> 280 ve > 500)
             * ayni anda dogru olabilir — lib/measurement/divergence.ts.
             */
            const divergence = specDivergence(system, key);

            return (
              <tr
                key={key}
                className={
                  divergence?.kind === 'celiski'
                    ? styles.contradictionRow
                    : undefined
                }
              >
                <th scope="row" className={styles.field}>
                  {tSpec(key)}{' '}
                  {divergence ? (
                    <DivergenceLabel kind={divergence.kind} />
                  ) : null}
                </th>
                {system.variants.map((variant) => (
                  <MeasurementCell
                    key={variant.id}
                    list={variant.specs[key]}
                    unit={SPEC_UNITS[key]}
                    locale={locale}
                    variants={system.variants}
                    showScope={divergence !== undefined}
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

      {/* Rozetlerin ne anlama geldigi her tablodan bir tik uzakta. */}
      <p className={styles.methodLink}>
        <Link
          href="/yontem"
          data-track-event={EVENTS.method}
          data-track-yer="tablo"
        >
          {t('methodLink')}
        </Link>
      </p>
    </div>
  );
}
