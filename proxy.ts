import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  /*
   * Statik dosyalar ve /_next disi tum yollar.
   *
   * Ikon rotalari (app/icon.tsx, app/apple-icon.tsx, app/icons/[variant])
   * disarida: bunlar yerellestirilmis rotalar degil, kok seviyesinde
   * duruyorlar. Ara katman onlari /tr/... altina yazmaya calisinca 404
   * doneriyorlardi.
   *
   * opengraph-image DISARIDA DEGIL: o gercekten yerellestirilmis bir rota
   * (app/[locale]/opengraph-image.tsx), yani /opengraph-image adresinin
   * calismasi ara katmanin onu /tr/... altina yazmasina bagli.
   */
  matcher: '/((?!api|_next|_vercel|icons?(?:/|$)|apple-icon(?:/|$)|.*\\..*).*)'
};
