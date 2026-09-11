import {useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/routing';
import {EVENTS, sourceHost} from '@/lib/analytics';
import {formatDate, formatRevisionValue} from '@/lib/format';
import {
  attributeKeys,
  specKeys,
  type AttributeKey,
  type Revision,
  type SpecKey,
  type System
} from '@/lib/schema';
import styles from './RevisionLog.module.css';

type Props = {
  system: System;
  locale: Locale;
};

/**
 * Duzeltme gecmisi — yayimlanmis bir degeri neden degistirdigimizin defteri.
 *
 * Timeline'dan ayri duruyor ve ondan daha sade: orada sistemin kendi tarihi
 * anlatilir, burada dosyanin tarihi. Guven rozeti yok — bir duzeltme olcum
 * degil, kayit. Rozet koymak uc durumlu gorsel dili sulandirirdi (§4).
 *
 * Eski ve yeni deger <del> ve <ins> ile isaretleniyor: ekran okuyucu
 * "silindi / eklendi" diye okur, gorsel okur ustu cizili degeri gorur.
 * Ok isareti yalnizca susleme, aria-hidden.
 */
export function RevisionLog({system, locale}: Props) {
  const t = useTranslations('RevisionLog');
  const tSpec = useTranslations('Specs');
  const tAttribute = useTranslations('Attributes');

  const revisions = system.revisions ?? [];
  if (revisions.length === 0) return null;

  /* En yeni ustte: duzeltme defteri son degisiklikten okunur. */
  const entries = [...revisions].sort((a, b) => b.date.localeCompare(a.date));

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

  /**
   * Kaldirma kaydinin etiketi ceviri paketinden gelir; bicimlendirme
   * katmani bir dize uydurmaz (lib/format.ts formatRevisionValue).
   */
  const valueText = (value: Revision['from']) =>
    formatRevisionValue(value, locale) ?? t('removed');

  return (
    <ol className={styles.list}>
      {entries.map((revision, index) => (
        <li
          className={styles.item}
          key={`${revision.date}-${revision.field}-${index}`}
        >
          <time className={styles.date} dateTime={revision.date}>
            {formatDate(revision.date, locale)}
          </time>

          <div className={styles.content}>
            <p className={styles.change}>
              <span className={styles.field}>{fieldLabel(revision.field)}</span>
              <span className={styles.values}>
                <del className={styles.from}>
                  <span className={styles.srOnly}>{t('from')} </span>
                  {valueText(revision.from)}
                </del>
                <span aria-hidden className={styles.arrow}>
                  {'→'}
                </span>
                <ins className={styles.to}>
                  <span className={styles.srOnly}>{t('to')} </span>
                  {valueText(revision.to)}
                </ins>
              </span>
            </p>

            <p className={styles.reason}>{revision.reason[locale]}</p>

            {revision.source ? (
              <span className={styles.source}>
                {revision.source_url ? (
                  <a
                    href={revision.source_url}
                    rel="nofollow noopener"
                    data-track-event={EVENTS.source}
                    data-track-kaynak={sourceHost(revision.source_url)}
                    data-track-yer="duzeltme"
                  >
                    {revision.source[locale]}
                  </a>
                ) : (
                  revision.source[locale]
                )}
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
