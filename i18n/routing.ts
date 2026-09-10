import {defineRouting} from 'next-intl/routing';

export const locales = ['tr', 'en'] as const;
export type Locale = (typeof locales)[number];

/**
 * TR varsayilan ve oneksiz: /sistemler/tayfun
 * EN onekli ve rota adi cevrili: /en/systems/tayfun
 */
export const routing = defineRouting({
  locales,
  defaultLocale: 'tr',
  localePrefix: 'as-needed',
  /* Kok adres her taraycida TR acilir; paylasilan link herkeste ayni gorunur. */
  localeDetection: false,
  pathnames: {
    '/': '/',
    '/sistemler/[slug]': {
      tr: '/sistemler/[slug]',
      en: '/systems/[slug]'
    }
  }
});

export type Pathnames = keyof typeof routing.pathnames;
