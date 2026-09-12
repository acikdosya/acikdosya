import {useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/routing';
import {EVENTS, sourceHost} from '@/lib/analytics';
import {formatEventDate} from '@/lib/format';
import {isSamePublisher, type System} from '@/lib/schema';
import styles from './OriginChain.module.css';

type Props = {
  system: System;
  locale: Locale;
};

/**
 * Koken zinciri — bir belge ve onu tasiyan yayinlar.
 *
 * Kaynak zinciri kartinin TERSI YONU. O kart "tek belge, ona dayanan N
 * deger" diyor; burada "tek belge, onu aktaran N yayin" var. Ikisi ayni
 * omurgayi iki yonde kuruyor ve ikisi de gercek bir olguyu anlatiyor.
 *
 * Bolumun isi cok sayida haberin cok sayida teyit SANILMASINI onlemek.
 * Alti yayincida gorunen bir sayi alti kez olculmus degil, bir kez
 * soylenmis ve alti kez aktarilmistir.
 *
 * Iki ayrim gorsel olarak tasiniyor:
 *  - Kokene dogrudan erisilemediyse yaziyor. Alintiladigimiz yayin
 *    kokenin yerine gecmez, kendisi de tekrarlardan biridir.
 *  - Ayni yayincinin kendi sonraki yazisi ayrica isaretleniyor; bagimsiz
 *    dolasim degil.
 *
 * Sayi listeden turer, kayitta sayac yoktur — ikisi ayrisamaz.
 */
export function OriginChain({system, locale}: Props) {
  const t = useTranslations('OriginChain');

  const origins = system.origins ?? [];
  if (origins.length === 0) return null;

  return (
    <div className={styles.wrap}>
      <p className={styles.intro}>{t('intro')}</p>

      <ol className={styles.list}>
        {origins.map((origin) => {
          const independent = origin.carried_by.filter(
            (item) => !isSamePublisher(origin, item)
          ).length;

          return (
            <li className={styles.item} key={origin.id}>
              <div className={styles.origin}>
                <h3 className={styles.document}>
                  {origin.url ? (
                    <a
                      href={origin.url}
                      rel="nofollow noopener"
                      data-track-event={EVENTS.source}
                      data-track-kaynak={sourceHost(origin.url)}
                      data-track-yer="koken"
                    >
                      {origin.document[locale]}
                    </a>
                  ) : (
                    origin.document[locale]
                  )}
                </h3>
                <p className={styles.meta}>
                  {origin.publisher}
                  {origin.date ? ` · ${formatEventDate(origin.date, locale)}` : ''}
                </p>
                {/*
                  Ozgun metne erisilemediginde bunu yazmak zorunlu: aksi
                  halde alintiladigimiz yayin koken sanilir.
                */}
                {origin.accessed ? null : (
                  <p className={styles.unread}>{t('notAccessed')}</p>
                )}
              </div>

              <div className={styles.carriers}>
                <p className={styles.count}>
                  {t('carriedBy', {count: origin.carried_by.length})}
                  {/*
                    Bagimsiz yayinci sayisi yalnizca toplamdan FARKLIYSA
                    yaziliyor. Hepsi bagimsizsa satiri tekrar etmek bilgi
                    tasimaz; farkliysa tasidigi bilgi tam da o fark.
                  */}
                  {independent !== origin.carried_by.length ? (
                    <span className={styles.independent}>
                      {t('independent', {count: independent})}
                    </span>
                  ) : null}
                </p>

                <ul className={styles.publications}>
                  {origin.carried_by.map((item, index) => (
                    <li
                      className={styles.publication}
                      key={`${item.publisher}-${item.url ?? index}`}
                      data-same-publisher={
                        isSamePublisher(origin, item) ? '' : undefined
                      }
                    >
                      <span className={styles.publisher}>
                        {item.url ? (
                          <a
                            href={item.url}
                            rel="nofollow noopener"
                            data-track-event={EVENTS.source}
                            data-track-kaynak={sourceHost(item.url)}
                            data-track-yer="koken-tekrar"
                          >
                            {item.publisher}
                          </a>
                        ) : (
                          item.publisher
                        )}
                      </span>
                      {item.date ? (
                        <span className={styles.publicationDate}>
                          {formatEventDate(item.date, locale)}
                        </span>
                      ) : null}
                      {isSamePublisher(origin, item) ? (
                        <span className={styles.sameMark}>
                          {t('samePublisher')}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>

      {/*
        Sayinin kapsami okuyucuya birlikte veriliyor. "Denetlenmis" ile
        "dunyadaki toplam" ayni sey degil ve ikincisi elimizde yok.
      */}
      <p className={styles.auditNote}>{t('auditNote')}</p>
    </div>
  );
}
