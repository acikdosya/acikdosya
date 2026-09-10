import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {hasLocale, NextIntlClientProvider, useTranslations} from 'next-intl';
import {getTranslations, setRequestLocale} from 'next-intl/server';
import {MeasureRail} from '@/components/measure-rail/MeasureRail';
import {SiteFooter} from '@/components/site-footer/SiteFooter';
import {routing} from '@/i18n/routing';
import {fontVariables} from '../_fonts/fonts';
import '../globals.css';

type Props = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata({
  params
}: Omit<Props, 'children'>): Promise<Metadata> {
  const {locale} = await params;
  const t = await getTranslations({locale, namespace: 'Site'});

  return {
    title: {default: t('name'), template: `%s — ${t('name')}`},
    description: t('tagline')
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
          <div className="relative mx-auto max-w-[1180px] pr-6 pl-[calc(24px+var(--measure))]">
            <MeasureRail />
            <main id="content">{children}</main>
            <SiteFooter />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
