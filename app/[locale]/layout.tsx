import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {hasLocale, NextIntlClientProvider, useTranslations} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {Analytics} from '@/components/analytics/Analytics';
import {MeasureRail} from '@/components/measure-rail/MeasureRail';
import {SiteFooter} from '@/components/site-footer/SiteFooter';
import {SiteHeader} from '@/components/site-header/SiteHeader';
import {routing, type Locale} from '@/i18n/routing';
import {SITE_URL} from '@/lib/config';
import {ogImage} from '@/lib/urls';
import {fontVariables} from '../_fonts/fonts';
import '../globals.css';

type Props = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

/*
 * Uretilmeyen dil degeri hic cizilmez, dogrudan 404 olur.
 *
 * Kok seviyede karsiligi olmayan nokta iceren adresler (/robots.txt gibi)
 * ara katmanin desenine takilmadan bu rotaya dusuyor. Kontrol yerlesimde
 * duruyordu ama sayfa bileseni onunla ayni anda ciziliyor: gecersiz dil
 * Intl'e ulasip RangeError firlatiyor ve ziyaretci 404 yerine 500
 * goruyordu. Segment duzeyindeki bu satir cizimden once devreye girer.
 */
export const dynamicParams = false;

export async function generateMetadata({
  params
}: Omit<Props, 'children'>): Promise<Metadata> {
  const {locale} = await params;
  /* Ikinci savunma hatti; birincisi yukaridaki dynamicParams. */
  if (!hasLocale(routing.locales, locale)) notFound();

  const t = await getTranslations({locale, namespace: 'Site'});

  return {
    metadataBase: new URL(SITE_URL),
    title: {default: t('name'), template: `%s — ${t('name')}`},
    description: t('tagline'),
    /*
     * Gorsel adresi elle veriliyor: dosya sozlesmesinin urettigi /tr/...
     * adresi yonlendirmeye dusuyordu — lib/urls.ts. Sistem sayfasi kendi
     * gorseline kendisi isaret eder.
     */
    openGraph: {images: ogImage(locale as Locale)},
    /*
     * Twitter kendi gorselini opengraph-image'dan alir; burada yalnizca
     * kart tipini soyluyoruz ki gorsel kirpilmadan buyuk gosterilsin.
     */
    twitter: {card: 'summary_large_image'}
  };
}

function SkipLink() {
  const t = useTranslations('A11y');

  return (
    <a
      href="#content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-10 focus:bg-paper focus:px-3 focus:py-2 focus:text-sm"
    >
      {t('skipToContent')}
    </a>
  );
}

export default async function LocaleLayout({children, params}: Props) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  return (
    <html lang={locale} dir="ltr" className={fontVariables}>
      <body>
        <NextIntlClientProvider>
          <SkipLink />
          {/*
            Ray mutlak konumlu, bu yuzden sarmalayici relative. min-h-dvh ve
            dikey flex: kisa sayfalarda altbilgi ekranin altina oturur, ray
            da tam boy kalir.
          */}
          <div className="relative mx-auto flex min-h-dvh max-w-[var(--content-max)] flex-col pr-[var(--page-x)] pl-[calc(var(--page-x)+var(--rail-offset))]">
            <MeasureRail />
            <SiteHeader />
            <main id="content" className="flex-1">
              {children}
            </main>
            <SiteFooter />
          </div>
          <Analytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
