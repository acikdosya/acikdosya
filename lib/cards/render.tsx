import {ImageResponse} from 'next/og';
import {getTranslations} from 'next-intl/server';
import {hasLocale} from 'next-intl';
import {routing, type Locale} from '@/i18n/routing';
import {SITE_URL} from '../config';
import {loadOgFonts} from '../og';
import type {Confidence} from '../schema';
import {CARD_SIZE, type CardFormat} from './params';

/**
 * Kart rotalarinin ortak ucu.
 *
 * Dort rota da ayni seyi yapiyor: dili dogrula, sorguyu coz, veriyi
 * bul, cizdir. Bulunamayan her sey 404 — uydurma bir kart uretilmez ve
 * baska bir sisteme dusulmez (§5.7).
 */

export function cardNotFound(): Response {
  return new Response('Not found', {status: 404});
}

/**
 * Ceviri isleminin sade bicimi.
 *
 * Gorunum katmani (lib/cards/*-card.tsx) mesaj semasini bilmez, yalnizca
 * "anahtar ver, dize al" sozlesmesini bilir. Iki faydasi var: kart
 * govdeleri next-intl istek baglamina bagli kalmiyor ve testte gercek
 * JSX'i cizdirebiliyoruz (lib/cards/cards.test.ts).
 *
 * Neden onemli: satori bir stil degerini cozemedigine cizimi ORTASINDA
 * duser ve Next bunu "failed to pipe response" diye loglar — ne stil adi
 * ne satir numarasi. Gelistirmede yakalanmazsa yayinda bozuk bir gorsel
 * olarak kalir ve kimse hata gormez. Bu yuzden dort kart da testte
 * gercekten ciziliyor.
 */
export type Translator = (
  key: string,
  values?: Record<string, string | number>
) => string;

/** Rotanin dili; taninmayan dil kart uretmez. */
export function cardLocale(raw: string): Locale | undefined {
  return hasLocale(routing.locales, raw) ? raw : undefined;
}

/** Her kartin alt seridinde duran alan adi. */
export function cardDomain(): string {
  return new URL(SITE_URL).host;
}

export async function confidenceLabels(
  locale: Locale
): Promise<Record<Confidence, string>> {
  const t = await getTranslations({locale, namespace: 'Confidence'});
  return {
    official: t('official'),
    press: t('press'),
    estimate: t('estimate')
  };
}

export async function renderCard(
  format: CardFormat,
  element: React.ReactElement
): Promise<ImageResponse> {
  const fonts = await loadOgFonts();

  return new ImageResponse(element, {
    ...CARD_SIZE[format],
    fonts,
    /*
     * Icerik git'te versiyonlu ve derlemeyle birlikte degisiyor, yani
     * ayni adres imaj omru boyunca ayni gorseli uretir. Bir saatlik
     * onbellek kart rotalarina gelen her istegin yeniden cizim olmasini
     * engelliyor; imaj yenilendiginde surum degistigi icin sorun olmaz.
     */
    headers: {'cache-control': 'public, max-age=3600'}
  });
}
