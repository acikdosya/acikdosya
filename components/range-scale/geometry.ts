import {EARTH_RADIUS_KM} from '@/lib/geo';

/**
 * Mesafe cetveli geometrisi — menzil zarfinin haritasiz karsiligi.
 *
 * Neden halka degil: menzil halkasi bir YARICAP iddiasidir, "buradan
 * her yone su kadar" der. Fuzede `range_km` tek yon erisimdir, daire
 * dogru okunur. Ucaktaki `operational_range_km` ureticinin kendi terimi
 * ve gorev yaricapi olarak yorumlanmadi (content/systems/akinci.json);
 * daire cizmek bizim koymadigimiz bir anlami koyardi.
 *
 * Ikinci sebep pratik: harita paketi Turkiye ve cevresini kapsiyor
 * (CLAUDE.md §11). Alti bin kilometrelik bir halka hicbir zoom
 * seviyesinde o cerceveye girmez; okuyucu bos harita gorurdu.
 *
 * Cetvelin referansi yer olcusudur, YER ADI DEGILDIR. Menzil baglaminda
 * sehir veya ulke adi gecmez (CLAUDE.md §5.1) — "su kadar uzaktaki su
 * yer" demek, tam olarak kacindigimiz cumledir.
 */

/** Ekvatordan kutba, buyuk daire boyunca. Kendi yaricapimizdan turer. */
export const QUARTER_MERIDIAN_KM = (Math.PI / 2) * EARTH_RADIUS_KM;

/** viewBox genisligi; yukseklik veriden hesaplanir. */
const VIEW_WIDTH = 700;
/** Solda cubugun basladigi yer. */
const LEFT = 8;
/** Sagda deger etiketine ayrilan sutun. */
const RIGHT = 104;
/** Ustte ilk grup adina ayrilan bosluk. */
const TOP = 26;
/** Cubuk kalinligi. */
const BAR_HEIGHT = 12;
/** Iki grup arasi. */
const ROW_GAP = 44;
/** Cubuklarla eksen arasi. */
const AXIS_GAP = 26;
/** Eksen etiketi satiri. */
const AXIS_LABEL = 20;
/** Olcu cizgisi uc isaretinin yarisi. */
const TICK = 4;
/** Eksen bolme araligi, km. */
const STEP_KM = 2000;

export type ScaleItem = {
  id: string;
  /** Grup adi — aile duzeyi ya da varyant. */
  label: string;
  /** Alan adi: "Operasyonel menzil" gibi. */
  fieldLabel: string;
  km: number;
};

export type ScaleBar = {
  id: string;
  label: string;
  fieldLabel: string;
  km: number;
  /** Cubugun sol ve sag ucu. */
  x1: number;
  x2: number;
  y: number;
  height: number;
  labelY: number;
  /** Deger metninin sol kenari. */
  valueX: number;
  valueY: number;
};

export type ScaleTick = {km: number; x: number};

export type ScaleLayout = {
  width: number;
  height: number;
  /** Piksel basina kilometre degil, tersi: km basina viewBox birimi. */
  scale: number;
  axisY: number;
  axisX1: number;
  axisX2: number;
  ticks: ScaleTick[];
  /** Yer olcusu isareti; cetvele sigmazsa yok. */
  reference?: {km: number; x: number};
  bars: ScaleBar[];
};

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Cetveli yerlestirir.
 *
 * Ust sinir, olculen en buyuk deger ile ceyrek meridyenden hangisi
 * buyukse ona gore secilir: boylece okuyucu sayiyi her zaman bir yer
 * olcusune gore gorur, deger yer olcusunu asarsa da cetvel tasmaz.
 */
export function layoutRangeScale(
  items: readonly ScaleItem[]
): ScaleLayout | undefined {
  if (items.length === 0) return undefined;

  const maxValue = Math.max(...items.map((item) => item.km));
  if (!(maxValue > 0)) return undefined;

  const span = Math.max(maxValue, QUARTER_MERIDIAN_KM) * 1.04;
  const usableWidth = VIEW_WIDTH - LEFT - RIGHT;
  const scale = usableWidth / span;
  const x = (km: number) => round(LEFT + km * scale);

  let cursor = TOP;
  const bars: ScaleBar[] = items.map((item) => {
    const y = cursor;
    cursor += ROW_GAP;

    return {
      id: item.id,
      label: item.label,
      fieldLabel: item.fieldLabel,
      km: item.km,
      x1: LEFT,
      x2: x(item.km),
      y,
      height: BAR_HEIGHT,
      labelY: round(y - 8),
      valueX: round(x(item.km) + 10),
      valueY: round(y + BAR_HEIGHT - 2)
    };
  });

  const axisY = round(cursor - ROW_GAP + BAR_HEIGHT + AXIS_GAP);

  const ticks: ScaleTick[] = [];
  for (let km = 0; km <= span; km += STEP_KM) {
    ticks.push({km, x: x(km)});
  }

  const reference =
    QUARTER_MERIDIAN_KM <= span
      ? {km: QUARTER_MERIDIAN_KM, x: x(QUARTER_MERIDIAN_KM)}
      : undefined;

  return {
    width: VIEW_WIDTH,
    height: round(axisY + AXIS_LABEL + 12),
    scale: round(scale * 1000) / 1000,
    axisY,
    axisX1: LEFT,
    axisX2: x(span),
    ticks,
    reference,
    bars
  };
}

/** Eksen cizgisi ve bolme isaretleri tek path icinde. */
export function axisPath(layout: ScaleLayout): string {
  const parts = [
    `M ${layout.axisX1} ${layout.axisY}`,
    `H ${layout.axisX2}`
  ];

  for (const tick of layout.ticks) {
    parts.push(`M ${tick.x} ${layout.axisY}`, `V ${layout.axisY + TICK}`);
  }

  return parts.join(' ');
}
