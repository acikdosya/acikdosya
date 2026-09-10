'use client';

import {useParams} from 'next/navigation';
import {useLocale} from 'next-intl';
import {Link, usePathname} from '@/i18n/navigation';
import {routing, type Locale} from '@/i18n/routing';

const LABELS: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English'
};

/**
 * Ayni sayfanin diger dildeki karsiligina goturur — rota adi da cevrilir,
 * /sistemler/tayfun ile /en/systems/tayfun ayni icerik.
 */
export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const params = useParams();
  const other = routing.locales.find((item) => item !== locale) ?? locale;

  return (
    <Link
      // @ts-expect-error -- params ile pathname'in uyumunu TS derleme aninda
      // dogrular; mevcut rota icin ikisi tanimi geregi eslesir.
      href={{pathname, params}}
      locale={other}
      lang={other}
      hrefLang={other}
      className="underline underline-offset-4 hover:text-ink"
    >
      {LABELS[other]}
    </Link>
  );
}
