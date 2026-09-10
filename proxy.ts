import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Statik dosyalar ve /_next disi tum yollar
  matcher: '/((?!api|_next|_vercel|.*\\..*).*)'
};
