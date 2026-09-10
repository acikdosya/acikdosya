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
  /*
   * NEXT_LOCALE cerezi yazilmaz.
   *
   * Ara katman varsayilan olarak dil tercihini cereze yaziyordu. Tespit
   * zaten kapali ve dil adresten belli, yani cerez hicbir ise yaramiyordu
   * ama yaziliyordu — hakkinda sayfasindaki "cerez kullanilmiyor"
   * cumlesini yanlis cikaracak tek sey oydu. Yayinda tarayicida gorulup
   * kapatildi.
   */
  localeCookie: false,
  pathnames: {
    '/': '/',
    '/sistemler/[slug]': {
      tr: '/sistemler/[slug]',
      en: '/systems/[slug]'
    },
    '/yontem': {
      tr: '/yontem',
      en: '/method'
    },
    '/hakkinda': {
      tr: '/hakkinda',
      en: '/about'
    }
  }
});

export type Pathnames = keyof typeof routing.pathnames;
