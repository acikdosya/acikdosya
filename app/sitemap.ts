import type {MetadataRoute} from 'next';
import {routing} from '@/i18n/routing';
import {getSystem, getSystemSlugs} from '@/lib/content';
import {lastModified} from '@/lib/structured-data';
import {absoluteUrl, localizedUrls} from '@/lib/urls';

/**
 * Bu dosya yokken /sitemap.xml de robots.txt gibi [locale] rotasina
 * dusuyor ve 500 donuyordu. Ayrica rota adlari dile gore cevrildigi icin
 * (/yontem karsisinda /en/method) arama motorunun iki surumu ayni sayfa
 * saydigini varsayamayiz — alternates.languages bunu acikca soyler.
 */

/** Yerellestirilmis sabit sayfalar. Sistem dosyalari asagida ekleniyor. */
const PAGES = ['/', '/yontem', '/hakkinda'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = PAGES.map((pathname) => ({
    url: absoluteUrl(routing.defaultLocale, pathname),
    alternates: {languages: localizedUrls(pathname, routing.locales)}
  }));

  const systems: MetadataRoute.Sitemap = getSystemSlugs().flatMap((slug) => {
    const system = getSystem(slug);
    if (!system) return [];

    const href = {pathname: '/sistemler/[slug]', params: {slug}} as const;

    return [
      {
        url: absoluteUrl(routing.defaultLocale, href),
        lastModified: lastModified(system),
        alternates: {languages: localizedUrls(href, routing.locales)}
      }
    ];
  });

  return [...pages, ...systems];
}
