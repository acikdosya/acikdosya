import type {SpecUnit} from './measurement/divergence';
import type {
  Confidence,
  LocalizedText,
  Measurement,
  RevisionValue,
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
  warhead_weight_kg: 'kg',
  wingspan_m: 'm',
  height_m: 'm',
  mtow_kg: 'kg',
  payload_kg: 'kg',
  endurance_h: 'h',
  service_ceiling_ft: 'ft',
  operating_altitude_ft: 'ft',
  cruise_speed_ktas: 'ktas',
  max_speed_ktas: 'ktas',
  operational_range_km: 'km',
  intercept_range_km: 'km',
  intercept_altitude_km: 'km',
  azimuth_coverage_deg: 'deg',
  tracking_capacity: 'count',
  engagement_capacity: 'count',
  missile_control_capacity: 'count',
  launcher_capacity: 'count'
};

/**
 * Birimin BASILAN karsiligi.
 *
 * Token ile basilan bicim uzun sure ayni seydi, cunku hepsi simgeydi:
 * km, mm, kg, ft dilden bagimsiz. Bilesik sistemlerle birlikte iki
 * birimsiz buyukluk geldi ve ayrim gorunur oldu:
 *
 *   deg    Simgesi var: °. Token kisa kalsin diye 'deg' yazili, sayfada
 *          simge basilir — ikisi de dilden bagimsiz.
 *   count  Simgesi YOK. Bir kelime yazmak ("adet" / "pcs") ya Ingilizce
 *          sayfada Turkce birakirdi ya da birimin cevrilmedigi kurali
 *          bozardi. Cozum ucuncusu: sayim birimsiz basilir. Sayinin
 *          kendisi zaten sayimdir ve neyin sayildigini alan etiketi
 *          soyluyor ("Izleme kapasitesi 100").
 *
 * Tablo exhaustive: SpecUnit'e yeni bir deger eklenip buraya satir
 * yazilmazsa derleme duser.
 */
const UNIT_LABELS: Record<SpecUnit, string> = {
  m: 'm',
  mm: 'mm',
  km: 'km',
  kg: 'kg',
  ft: 'ft',
  h: 'h',
  ktas: 'ktas',
  count: '',
  deg: '°'
};

/** Birimin sayfada gorunen hali. Bos dize "birim basilmaz" demektir. */
export function unitLabel(unit: SpecUnit): string {
  return UNIT_LABELS[unit];
}

/**
 * Sayiya BITISIK yazilan simgeler.
 *
 * SI kurali birim simgesinden once bosluk ister, duzlem aci simgelerini
 * (° ′ ″) bunun disinda tutar: "360°", "12,3 m". Kural simgenin
 * sinifindan geliyor, keyfi bir uslup tercihi degil.
 */
const TIGHT_LABELS = new Set(['°']);

/**
 * Degeri birimiyle birlestirir.
 *
 * Birimsiz buyukluklerde bosluk da basilmaz — "100 " diye biten bir
 * hucre, eksik bir birim izlenimi verir.
 */
export function withUnit(value: string, unit: SpecUnit): string {
  const label = unitLabel(unit);
  if (!label) return value;
  return isTightUnit(unit) ? `${value}${label}` : `${value} ${label}`;
}

/**
 * Birim sayiya bitisik mi yazilir.
 *
 * Birimi ayri bir ogede cizen bileseneler icin: bosluk orada CSS'ten
 * geliyor, dizeden degil. Ayni kural iki yerde iki farkli sonuc
 * vermesin diye tek kaynak burasi.
 */
export function isTightUnit(unit: SpecUnit): boolean {
  return TIGHT_LABELS.has(unitLabel(unit));
}

/**
 * Gelistiren kuruluslarin okunabilir listesi.
 *
 * Dizi oldugu icin birlestirme DILE BAGLI: Turkce "A, B ve C",
 * Ingilizce "A, B and C". Intl.ListFormat bunu biliyor; elle " ve "
 * yazmak Ingilizce sayfada Turkce bir baglac birakirdi.
 *
 * Sira dosyadan gelir. Kod bir onem sirasi uydurmaz — is paketi
 * dagilimi kaynaklarda yok (CLAUDE.md §5.7).
 */
export function manufacturerNames(
  manufacturers: readonly {name: string}[],
  locale: Locale
): string {
  return new Intl.ListFormat(locale, {
    style: 'long',
    type: 'conjunction'
  }).format(manufacturers.map((item) => item.name));
}

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
 * Duzeltme kaydindaki eski/yeni deger — CLAUDE.md §3.
 *
 * Olcum kolu dile gore cizilir: Turkce ondalik virgul, Ingilizce nokta.
 * Onceki surumde from/to serbest metindi ve tek dilde yaziliyordu, yani
 * Ingilizce sayfada "12,2 m" duruyordu.
 *
 * 'removed' icin undefined doner ve etiketi CAGIRAN verir. Buradan bir
 * dize dondurmek, ceviriyi bicimlendirme katmanina tasimak olurdu;
 * "kayit yok" bir deger degil, degerin yoklugu.
 */
export function formatRevisionValue(
  value: RevisionValue,
  locale: Locale
): string | undefined {
  switch (value.kind) {
    case 'measurement':
      return `${formatValue(value, locale)} ${value.unit}`;
    case 'text':
      return value[locale];
    case 'removed':
      return undefined;
  }
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
