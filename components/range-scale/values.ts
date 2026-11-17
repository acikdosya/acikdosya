import type {Locale} from '@/i18n/routing';
import {formatNumber, SPEC_UNITS, withUnit} from '@/lib/format';
import {convertValue} from '@/lib/measurement/divergence';
import type {SpecKey} from '@/lib/schema';

/**
 * Mesafe cetvelinin sayilari — cizimden ayri, saf fonksiyonlar.
 *
 * Cetvelin ekseni yer olcusu, kilometre. Gorev yaricapi ise kaynagin
 * biriminde, deniz mili cinsinden kayitli. Iki is birbirinden ayri
 * tutulur: cubuk boyu kilometreye cevrilir, okunan deger cevrilmez.
 * Okuyucunun gordugu sayi kaynakta yazan sayidir — 500 NM; 926 km
 * diye bir sayi sayfaya basilmaz (specs/range-envelope).
 */

/** Cetvele girecek alanlar, gosterim sirasiyla. */
export const RANGE_KEYS: readonly SpecKey[] = [
  'operational_range_km',
  'combat_radius_nm',
  'range_km'
];

/** Cubuk boyu icin kilometre. Carpan birim tablosundan gelir. */
export function scaleKm(key: SpecKey, value: number): number {
  return convertValue(value, SPEC_UNITS[key], 'km');
}

/** Cubugun yanindaki ve not satirindaki deger — kaynagin biriminde. */
export function valueLabel(
  key: SpecKey,
  value: string | number,
  locale: Locale
): string {
  const text = typeof value === 'number' ? formatNumber(value, locale) : value;
  return withUnit(text, SPEC_UNITS[key]);
}

/**
 * Altyazi, cetvelde HANGI alanlar varsa onlarin gerekcesini soyler.
 *
 * Genel altyazi "bu deger ureticinin kendi terimi" der; gorev yaricapi
 * ise bir yaricap beyani, halka cizilmemesinin sebebi baska — gorev
 * profili yazilmamis. Tek altyazi ikisinden birine yanlis gerekce
 * verirdi. Ikisi bir aradaysa iki gerekce de yazilir.
 */
export function captionKeys(
  keys: readonly SpecKey[]
): ('caption' | 'captionRadius')[] {
  const radius = keys.some((key) => key === 'combat_radius_nm');
  const other = keys.some((key) => key !== 'combat_radius_nm');
  return [
    ...(other ? (['caption'] as const) : []),
    ...(radius ? (['captionRadius'] as const) : [])
  ];
}
