import type {SpecUnit} from './measurement/divergence';
import type {
  Confidence,
  LocalizedText,
  Measurement,
  SpecKey
} from './schema';
import type {Locale} from '@/i18n/routing';

/**
 * Birim alan adinin icinde tasiniyor, ayri alan yok — bu yuzden cevrilmez
 * ve tek yerde duruyor. Tabloda, hero'daki celiski satirinda ve paylasim
 * gorselinde ayni birim yazar.
 */
export const SPEC_UNITS: Record<SpecKey, SpecUnit> = {
  length_m: 'm',
  diameter_mm: 'mm',
  mass_kg: 'kg',
  range_km: 'km',
  cep_m: 'm',
  warhead_weight_kg: 'kg'
};

/** Guven siralamasi — dusuk sayi daha guvenilir. */
const CONFIDENCE_ORDER: Record<Confidence, number> = {
  official: 0,
  press: 1,
  estimate: 2
};

/**
 * Celisen degerler arasindan gosterime girecek olani secer.
 * Celiskiyi gizlemez — SpecTable digerlerini de yazar, siluet gibi tek deger
 * alabilen yerler icin en guvenilir olan gerekir.
 */
export function primary(list: readonly Measurement[]): Measurement {
  return [...list].sort(
    (a, b) => CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence]
  )[0];
}

export function text(value: LocalizedText, locale: Locale): string {
  return value[locale];
}

/** TR'de ondalik virgul, binlik nokta; EN'de tersi. Intl hallediyor. */
export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/** "> 280" veya "4,3 – 5,2" — operator degerin onunde, araliklar en-dash ile. */
export function formatValue(
  measurement: Pick<
    Measurement,
    'value' | 'operator' | 'upper_value' | 'upper_operator'
  >,
  locale: Locale
): string {
  const lower = formatNumber(measurement.value, locale);

  if (measurement.upper_value !== undefined) {
    const upper = formatNumber(measurement.upper_value, locale);
    const lowerOp = measurement.operator ? `${measurement.operator} ` : '';
    const upperOp = measurement.upper_operator ? `${measurement.upper_operator} ` : '';
    return `${lowerOp}${lower} – ${upperOp}${upper}`;
  }

  return measurement.operator
    ? `${measurement.operator} ${lower}`
    : lower;
}

/**
 * Dogrulama tarihi. UTC sabit — sunucu ve tarayici ayni gunu yazsin.
 */
export function formatDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: 'UTC'
  }).format(new Date(iso));
}

/**
 * Takvim tarihi. Hassasiyet veriden gelir: gun bilinmiyorsa ay,
 * ay da bilinmiyorsa yil yazilir — olmayan kesinlik uydurulmaz.
 */
export function formatEventDate(date: string, locale: Locale): string {
  const [year, month, day] = date.split('-');

  if (day) {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeZone: 'UTC'
    }).format(new Date(date));
  }

  if (month) {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      timeZone: 'UTC'
    }).format(new Date(`${date}-01`));
  }

  return year;
}
