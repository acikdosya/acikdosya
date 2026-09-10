import {getPathname} from '@/i18n/navigation';
import type {Locale} from '@/i18n/routing';
import {SITE_URL} from './config';

/**
 * Rota adlari dile gore cevriliyor (/yontem karsisinda /en/method), bu
 * yuzden mutlak adres elle birlestirilmez — getPathname tek dogru kaynak.
 * Canonical, hreflang, OG adresi ve site haritasi ayni fonksiyondan gecer.
 */
type Href = Parameters<typeof getPathname>[0]['href'];

export function absoluteUrl(locale: Locale, href: Href): string {
  return new URL(getPathname({locale, href}), SITE_URL).toString();
}

/** Bir adresin her dildeki karsiligi — hreflang ve sitemap alternatifleri. */
export function localizedUrls(
  href: Href,
  locales: readonly Locale[]
): Record<string, string> {
  return Object.fromEntries(
    locales.map((locale) => [locale, absoluteUrl(locale, href)])
  );
}
