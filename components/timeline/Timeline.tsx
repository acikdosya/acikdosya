import {ConfidenceBadge} from '@/components/confidence-badge/ConfidenceBadge';
import type {Locale} from '@/i18n/routing';
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
 */
export function Timeline({system, locale}: Props) {
  // ISO tarihler kismi de olsa dizgi olarak dogru siralanir.
  const events = [...system.timeline].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  if (events.length === 0) return null;

  return (
    <ol className={styles.list}>
      {events.map((event) => (
        <li className={styles.item} key={`${event.date}-${event.title.tr}`}>
          <time className={styles.date} dateTime={event.date}>
            {formatEventDate(event.date, locale)}
          </time>
          <div className={styles.content}>
            <h3 className={styles.title}>
              {event.title[locale]}
              <ConfidenceBadge confidence={event.confidence} />
            </h3>
            {event.body ? (
              <p className={styles.body}>{event.body[locale]}</p>
            ) : null}
            {event.source ? (
              <span className={styles.source}>
                {event.source_url ? (
                  <a href={event.source_url} rel="nofollow noopener">
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
