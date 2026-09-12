import {useTranslations} from 'next-intl';
import {ConfidenceBadge} from '@/components/confidence-badge/ConfidenceBadge';
import type {Locale} from '@/i18n/routing';
import {EVENTS, sourceHost} from '@/lib/analytics';
import {formatEventDate} from '@/lib/format';
import type {System} from '@/lib/schema';
import styles from './Timeline.module.css';

type Props = {
  system: System;
  locale: Locale;
};

/**
 * Program olaylari kronolojik sirada. Her olay kendi guven seviyesini tasir:
 * resmi duyuru ile basin haberi ayni satirda ayni agirlikta gorunmez.
 *
 * Tarih sutunundaki sayi her satirda ayni seyi olcmez. Cok kayitta olayin
 * kendi gunu bilinmiyor, yalnizca duyurunun gunu biliniyor; o satirlarda
 * sutunun altina ne oldugu yazilir. Ikisi de biliniyorsa sutunda olay
 * gunu durur, duyuru gunu icerikte ayri satirda gorunur — bir test
 * atisinin yapildigi gun ile duyuruldugu gun ayni sey degil.
 */
export function Timeline({system, locale}: Props) {
  const t = useTranslations('Timeline');
  // ISO tarihler kismi de olsa dizgi olarak dogru siralanir.
  const events = [...system.timeline].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  if (events.length === 0) return null;

  return (
    <ol className={styles.list}>
      {events.map((event) => (
        <li className={styles.item} key={`${event.date}-${event.title.tr}`}>
          <div className={styles.dateCell}>
            <time className={styles.date} dateTime={event.date}>
              {formatEventDate(event.date, locale)}
            </time>
            {event.date_kind === 'announcement' ? (
              <small className={styles.dateKind}>{t('announcementDate')}</small>
            ) : null}
          </div>
          <div className={styles.content}>
            <h3 className={styles.title}>
              {event.title[locale]}
              <ConfidenceBadge confidence={event.confidence} />
            </h3>
            {event.body ? (
              <p className={styles.body}>{event.body[locale]}</p>
            ) : null}
            {event.announced_at ? (
              <p className={styles.announced}>
                {t('announcedOn', {
                  date: formatEventDate(event.announced_at, locale)
                })}
              </p>
            ) : null}
            {event.source ? (
              <span className={styles.source}>
                {event.source_url ? (
                  <a
                    href={event.source_url}
                    rel="nofollow noopener"
                    data-track-event={EVENTS.source}
                    data-track-kaynak={sourceHost(event.source_url)}
                    data-track-yer="takvim"
                  >
                    {event.source[locale]}
                  </a>
                ) : (
                  event.source[locale]
                )}
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
