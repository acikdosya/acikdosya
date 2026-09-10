/**
 * Marka sembolunun geometrisi — CLAUDE.md §10.
 *
 * Sembol 100 birimlik kareye oturur; tum kenarlar izgaraya hizalidir, egri
 * ve aci yoktur. Ayrac (uc koyu blok) kaynak gostermenin isareti, icindeki
 * blok ayracin kapsadigi degerdir.
 *
 * React bileseni ve next/og ile uretilen ikonlar ayni diziyi okur: ikisi
 * ayrisirsa uygulama ikonu ile sayfadaki logo farkli sekiller olur.
 */
export type BrandRect = {x: number; y: number; width: number; height: number};

/** Ayrac. Tek renk varyantlarda da bu uc blok kalir. */
export const BRAND_BRACKET: readonly BrandRect[] = [
  {x: 10, y: 8, width: 22, height: 84},
  {x: 32, y: 8, width: 30, height: 20},
  {x: 32, y: 72, width: 30, height: 20}
];

/**
 * Ayracin kapsadigi deger. Kirmizi yalnizca buraya ayrilmistir; tek renk
 * varyantta kaybolunca anlam bozulmaz, ayrac tek basina da okunur.
 */
export const BRAND_VALUE: BrandRect = {x: 46, y: 40, width: 44, height: 20};

/** Govde eni. Bosluk payi ve sembol-yazi araliginin tabani — §10. */
export const BRAND_STEM = 22;

/** Bosluk payi: govde eni × 1, dort yonde. Sembol kutusu oranina cevrildi. */
export const BRAND_CLEAR_RATIO = BRAND_STEM / 100;

/** Sembol-yazi araligi: govde eni × 1,3. */
export const BRAND_GAP_RATIO = (BRAND_STEM * 1.3) / 100;

/** Kelime markasinin sembol kutusuna orani. */
export const BRAND_WORD_RATIO = 0.667;

/** §10 alt sinirlari. Bunun altinda parcalar bir pikselin altina duser. */
export const BRAND_MIN_MARK_PX = 16;
export const BRAND_MIN_LOCKUP_PX = 96;

/** Marka adi cevrilmez — TR ve EN sayfalarda ayni. */
export const BRAND_NAME = 'Açık Dosya';

/** Kelime markasi kilitte buyuk harfle dizilir; harf harf yazili, CSS
 * text-transform ile degil — Turkce buyuk harf kurallari tarayiciya
 * birakilmaz. */
export const BRAND_WORDMARK = 'AÇIK DOSYA';
