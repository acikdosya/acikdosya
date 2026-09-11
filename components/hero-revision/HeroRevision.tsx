import {useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/routing';
import {formatDate, formatRevisionValue} from '@/lib/format';
import {
  attributeKeys,
  specKeys,
  type AttributeKey,
  type Revision,
  type SpecKey
} from '@/lib/schema';
import styles from './HeroRevision.module.css';

/**
 * Hero'nun ikinci katmani: son duzeltme kaydi — lib/hero.ts.
 *
 * Iraksama yokken sayfanin soyleyebilecegi en guclu sey bu: yayimlanmis bir
 * sayiyi degistirdik ve nedenini yazdik. Uydurulmus bir ornek satir yerine
 * defterin kendisi duruyor.
 *
 * Sistem sayfasindaki RevisionLog ile ayni veriyi okur ama tek kayit gosterir
 * ve daha az yer kaplar. Guven rozeti YOK: bir duzeltme olcum degil, kayit.
 */
export function HeroRevision({
  revision,
  systemName,
  locale
}: {
  revision: Revision;
  systemName: string;
  locale: Locale;
}) {
  const t = useTranslations('Hero');
  const tRevision = useTranslations('RevisionLog');
  const tSpec = useTranslations('Specs');
  const tAttribute = useTranslations('Attributes');

  /** Bilinen alan anahtarlari cevrilir; serbest metin oldugu gibi kalir. */
  function fieldLabel(field: string): string {
    if ((specKeys as readonly string[]).includes(field)) {
      return tSpec(field as SpecKey);
    }
    if ((attributeKeys as readonly string[]).includes(field)) {
      return tAttribute(field as AttributeKey);
    }
    return field;
  }

  /** Kaldirma kaydinin etiketi ceviri paketinden gelir. */
  const valueText = (value: Revision['from']) =>
    formatRevisionValue(value, locale) ?? tRevision('removed');

  return (
    <figure className={styles.panel}>
      <figcaption className={styles.head}>
        <span className={styles.field}>
          {systemName} — {fieldLabel(revision.field).toLocaleLowerCase(locale)}
        </span>
        <time className={styles.date} dateTime={revision.date}>
          {formatDate(revision.date, locale)}
        </time>
      </figcaption>

      <div className={styles.change}>
        <span className={styles.slot}>
          <span className={styles.slotLabel}>{tRevision('from')}</span>
          <del className={styles.from}>{valueText(revision.from)}</del>
        </span>
        <span className={styles.lead} aria-hidden="true" />
        <span className={styles.slot}>
          <span className={styles.slotLabel}>{tRevision('to')}</span>
          <ins className={styles.to}>{valueText(revision.to)}</ins>
        </span>
      </div>

      <p className={styles.reason}>{revision.reason[locale]}</p>

      {revision.source ? (
        <p className={styles.source}>
          {revision.source_url ? (
            <a href={revision.source_url} rel="nofollow noopener">
              {revision.source[locale]}
            </a>
          ) : (
            revision.source[locale]
          )}
        </p>
      ) : null}

      <p className={styles.note}>{t('revisionNote')}</p>
    </figure>
  );
}
