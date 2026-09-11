import {getPathname} from '@/i18n/navigation';
import {routing, type Locale} from '@/i18n/routing';
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

/**
 * Bir adresin her dildeki karsiligi — hreflang ve sitemap alternatifleri.
 *
 * x-default de veriliyor: hangi dilin sunulacagini bilemeyen arama motoru
 * icin varsayilan adres. TR'yi gosteriyor, cunku kok adres her tarayicida
 * TR aciliyor (i18n/routing.ts, localeDetection: false) — x-default'un
 * baska bir dili gostermesi arama motoruna yanlis soz vermek olurdu.
 */
export function localizedUrls(
  href: Href,
  locales: readonly Locale[]
): Record<string, string> {
  return {
    ...Object.fromEntries(
      locales.map((locale) => [locale, absoluteUrl(locale, href)])
    ),
    'x-default': absoluteUrl(routing.defaultLocale, href)
  };
}

/**
 * Bir sayfanin kanonik adresi ve dil karsiliklari — Metadata.alternates
 * icin hazir. Uc sabit sayfa ve sistem sayfasi ayni yerden gecsin diye
 * burada: alternates yazmayi unutmak, iki dilin ayri sayfa sayilmasi
 * demek.
 */
export function alternates(locale: Locale, href: Href) {
  return {
    canonical: absoluteUrl(locale, href),
    languages: localizedUrls(href, routing.locales)
  };
}

/**
 * Paylasim gorselinin adresi.
 *
 * Next bu adresi dosya sozlesmesindeki [locale] segmentiyle kuruyor:
 * /tr/sistemler/<slug>/opengraph-image. Bizim TR rotalarimiz oneksiz
 * (localePrefix: 'as-needed'), o adres 307 ile oneksize donuyor.
 * Yonlendirmeyi izlemeyen paylasim istemcisi gorseli hic gostermez, bu
 * yuzden adresi dogrudan dogru yaziyoruz.
 *
 * Yol CEVRILMEZ: gorsel rotasi dosya sozlesmesinden gelir, next-intl'in
 * pathnames haritasindan degil. Ingilizce sistem sayfasinin gorseli
 * /en/sistemler/<slug>/opengraph-image adresinde durur — sayfanin kendisi
 * /en/systems/<slug> olsa bile.
 *
 * Bedeli: Next'in ekledigi icerik ozeti (?hash) dusuyor, yani gorsel
 * degisince adres degismiyor. Paylasim istemcileri onbelleklerini zaten
 * kendi takvimlerine gore tazeliyor; dogru adres bundan onemli.
 */
export const CARD_TEMPLATES = [
  'kaynak-zinciri',
  'deger-kapsam',
  'olcek',
  'duzeltme'
] as const;
export type CardTemplate = (typeof CARD_TEMPLATES)[number];

/**
 * Paylasim kartinin adresi.
 *
 * Gorsel rotasi gibi CEVRILMEZ ve elle birlestirilmez. Ingilizce kart
 * /en/kart/olcek adresinde durur — sablon adi bir dosya yolu, bir
 * icerik degil. Cevrilseydi next-intl'in pathnames haritasina girmesi
 * gerekirdi; girmedigi icin cevrilmis bir yol 404 olurdu.
 *
 * TR onek ALMAZ: localePrefix 'as-needed' oldugu icin /tr/kart/... 307
 * ile oneksize doner ve yonlendirmeyi izlemeyen bir paylasim istemcisi
 * gorseli hic gostermez. ogImage ile ayni gerekce.
 */
export function cardUrl(
  locale: Locale,
  template: CardTemplate,
  params: Record<string, string>
): string {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
  const url = new URL(`${prefix}/kart/${template}`, SITE_URL);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

export function ogImage(locale: Locale, segment = '') {
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;

  return [
    {
      url: new URL(
        `${prefix}${segment}/opengraph-image`,
        SITE_URL
      ).toString(),
      width: 1200,
      height: 630,
      type: 'image/png'
    }
  ];
}
