'use client';

import {useParams} from 'next/navigation';
import {Link, usePathname} from '@/i18n/navigation';
import {routing, type Locale} from '@/i18n/routing';
import styles from './LocaleSwitcher.module.css';

/**
 * Ayni sayfanin diger dildeki karsiligina goturur — rota adi da cevrilir,
 * /sistemler/tayfun ile /en/systems/tayfun ayni icerik.
 *
 * Kisa kod gorunur (TR / EN), tam ad erisilebilir adda durur: iki harflik
 * bir bagin nereye gittigi ekran okuyucuda anlasilmaz.
 *
 * Etiketler prop olarak geliyor, useTranslations ile degil. Bu bilesen her
 * sayfada var; istemci tarafinda ceviri kullanmasi next-intl'in mesaj
 * bicimlendiricisini ilk yuke sokuyordu — CLAUDE.md §6.
 */
export function LocaleSwitcher({
  locale,
  labels
}: {
  locale: Locale;
  labels: Record<Locale, string>;
}) {
  const pathname = usePathname();
  const params = useParams();

  return (
    <div className={styles.group}>
      {routing.locales.map((item) =>
        item === locale ? (
          <span key={item} className={styles.current} aria-current="true">
            {item.toUpperCase()}
          </span>
        ) : (
          <Link
            key={item}
            // @ts-expect-error -- params ile pathname'in uyumunu TS derleme
            // aninda dogrular; mevcut rota icin ikisi tanimi geregi eslesir.
            href={{pathname, params}}
            locale={item}
            lang={item}
            hrefLang={item}
            aria-label={labels[item]}
            className={styles.link}
          >
            {item.toUpperCase()}
          </Link>
        )
      )}
    </div>
  );
}
