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
import {specGroups} from '@/lib/measurement/groups';
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

/**
 * Kaynak satiri: kim soyledi, hangi belgede, ne zaman baktik.
 *
 * Belge surumu kaynak adinin yaninda duruyor cunku ikisi birlikte bir
 * atiftir: "urun karti" tek basina hangi yilin karti oldugunu soylemez ve
 * ayni adres sessizce guncellenebilir.
 *
 * Erisim tarihi yalnizca dogrulama tarihinden FARKLIYSA yaziliyor. Ayni
 * gunse iki kez tarih basmak satiri agirlastirir ve okura yeni bir sey
 * soylemez; kayitta ikisi de duruyor.
 *
 * Belge ozeti kisaltilmis gorunuyor, tamami title'da. Kisaltma gizleme
 * degil: 64 basamak tablo hucresinde okunmaz, tam deger hem burada hem
 * icerik dosyasinda duruyor.
 */
function SourceLine({
  source,
  sourceUrl,
  documentVersion,
  accessedAt,
  archiveUrl,
  sha256,
  verifiedAt,
  locale
}: {
  source: string;
  sourceUrl?: string;
  documentVersion?: string;
  accessedAt?: string;
  archiveUrl?: string;
  sha256?: string;
  verifiedAt?: string;
  locale: Locale;
}) {
  const t = useTranslations('SpecTable');

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
      {documentVersion ? <>{', '}{documentVersion}</> : null}
      {verifiedAt ? (
        <>
          {' · '}
          <span className={styles.verified}>{formatDate(verifiedAt, locale)}</span>
        </>
      ) : null}
      {accessedAt && accessedAt !== verifiedAt ? (
        <>
          {' · '}
          <span className={styles.verified}>
            {t('accessed', {date: formatDate(accessedAt, locale)})}
          </span>
        </>
      ) : null}
      {archiveUrl ? (
        <>
          {' · '}
          <a
            href={archiveUrl}
            rel="nofollow noopener"
            data-track-event={EVENTS.source}
            data-track-kaynak={sourceHost(archiveUrl)}
            data-track-yer="arsiv"
          >
            {t('archive')}
          </a>
        </>
      ) : null}
      {sha256 ? (
        <>
          {' · '}
          <span className={styles.digest} title={sha256}>
            {t('digest', {value: sha256.slice(0, 12)})}
          </span>
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
            documentVersion={measurement.document_version?.[locale]}
            accessedAt={measurement.accessed_at}
            archiveUrl={measurement.archive_url}
            sha256={measurement.source_sha256}
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
          documentVersion={attribute.document_version?.[locale]}
          accessedAt={attribute.accessed_at}
          archiveUrl={attribute.archive_url}
          sha256={attribute.source_sha256}
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

  const groups = specGroups(system);
  const usedSpecs = specKeys.filter((key: SpecKey) =>
    groups.some((group) => group.specs[key])
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
            {groups.map((group) => (
              <th scope="col" key={group.id}>
                {group.kind === 'family' ? t('familyLabel') : group.label}
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
                {groups.map((group) => (
                  <MeasurementCell
                    key={group.id}
                    list={group.specs[key]}
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
              {groups.map((group) =>
                group.kind === 'family' ? (
                  <td key={group.id}>
                    <span data-state="absent">{'—'}</span>
                    <span className={styles.srOnly}>{t('absent')}</span>
                  </td>
                ) : null
              )}
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
