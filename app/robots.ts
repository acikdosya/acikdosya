import type {MetadataRoute} from 'next';
import {SITE_URL} from '@/lib/config';

/**
 * Bu dosya yokken /robots.txt kok seviyede karsiligi olmadigi icin
 * [locale] rotasina dusuyordu; dil degeri "robots.txt" olunca Intl
 * RangeError firlatiyor ve tarayici robotlarina 500 gidiyordu.
 *
 * Tarama kisitimiz yok: site zaten yayimlanmis kaynaklardan olusuyor ve
 * gorunur olmasini istiyoruz.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {userAgent: '*', allow: '/'},
    sitemap: new URL('/sitemap.xml', SITE_URL).toString()
  };
}
