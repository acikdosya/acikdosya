import type {Part} from '@/lib/geometry/parts';
import {
  projectBounds,
  projectParts,
  transformPath
} from '@/lib/geometry/project2d';

/**
 * Ucak boyut semasi — kaynakli uzunluk, kanat acikligi ve (varsa)
 * yukseklikten turetilir.
 *
 * KONTUR KOSULLU CIZILIR. Onceki surumde hic cizilmiyordu ve gerekcesi
 * suydu: uc toplam olcuden govde genisligi, kanat vechesi veya kuyruk
 * orani turetilemez, cizilecek her kontur sahip olmadigimiz bir bicim
 * iddiasi olurdu. Gerekce hala gecerli — ama artik uc olcuye ek olarak
 * KOKEN KAYDI TASIYAN bir oran tablosu var (lib/geometry/akinci.ts) ve
 * kontur ondan turuyor. Ret ortadan kalkmadi, kosullu hale geldi:
 * oran tablosu olmayan sistem yine yalniz zarf alir.
 *
 * Ust ve on gorunus, parca listesi varsa gercek dis hattir. On gorunus
 * ancak inis takimi modellendikten sonra dis hatta dondu: takim boyu
 * yayimlanan `height_m` degerinden turedigi icin modelin dikey uzanimi
 * artik tam olarak o deger. Takim modellenmeden once kontur, yukseklik
 * braketinin icinde kisa kalir ve yanlis okunurdu.
 *
 * Parca listesi olmayan sistemde iki gorunus de zarf kalir; kesikli
 * cerceve "burasi bir sinir, bir dis hat degil" der.
 *
 * Eksen dagilimi: X = kanat acikligi, Y = uzunluk / yukseklik. Genis olcu
 * tuvalin genis eksenine veriliyor ki cizim cerceveyi doldursun; kontur
 * cizildiginde de ayni yerlesim korunuyor, yani ust gorunus 90° cevrik
 * seriliyor. Cevirme bir bicim iddiasi tasimaz — hangi kenarin ne oldugunu
 * olcu cizgisinin etiketi soyler.
 *
 * Iki gorunus ve insan figuru TEK carpanla cizilir. Eksen basina ayri
 * olcek, karsilastirmayi yalan yapardi.
 */

export const HUMAN_HEIGHT_M = 1.8;

/** viewBox genisligi; yukseklik veriden hesaplanir. */
const VIEW_WIDTH = 700;
/** Solda insan figurune ayrilan sutun. */
const HUMAN_COLUMN = 76;
/** Sagda olcu etiketine ayrilan sutun — "yukseklik 4,1 m" sigar. */
const LABEL_COLUMN = 124;
/** Ustte grup adina ayrilan bosluk. */
const TOP_PADDING = 34;
/** Zemin cizgisinin altinda kalan etiket boslugu. */
const BOTTOM_PADDING = 24;
/** Ust gorunus zarfinin alabilecegi en buyuk yukseklik. */
const MAX_PLAN_HEIGHT = 320;
/** Zarf ile olcu cizgisi arasi. */
const DIM_GAP = 18;
/** Olcu etiketi satirinin yuksekligi. */
const DIM_LABEL = 22;
/** Iki grup arasi. */
const ROW_GAP = 34;
/** Olcu cizgisi uc isaretinin yarisi. */
const TICK = 4;
/** Paylasim gorselinde iki zarf arasi. */
const COMPACT_GAP = 12;

export type AircraftItem = {
  id: string;
  label: string;
  lengthM: number;
  wingspanM: number;
  heightM?: number;
  /** Urun tanimindan gelen parca listesi. Yoksa ust gorunus de zarf kalir. */
  parts?: readonly Part[];
};

/** Kesikli olcu zarfi — dis hat degil, sinir kutusu. */
export type Envelope = {
  x: number;
  y: number;
  width: number;
  height: number;
  path: string;
};

/** Olcu cizgisi: govde ve iki uc isareti tek path icinde. */
export type Dimension = {
  path: string;
  labelX: number;
  labelY: number;
  valueM: number;
};

export type AircraftRow = {
  id: string;
  label: string;
  /** Ust gorunus zarfi: kanat acikligi × uzunluk. */
  plan: Envelope;
  /**
   * Ust gorunus dis hatti — parca listesi varsa. Zarfin yerine cizilir;
   * zarf yine de yerlesim ve olcu cizgileri icin hesaplanir.
   */
  planOutline?: string;
  /** On gorunus zarfi: kanat acikligi × yukseklik. Yukseklik yoksa yok. */
  front?: Envelope;
  /**
   * On gorunus dis hatti — parca listesi varsa ve modelin dikey uzanimi
   * yayimlanan yukseklikle ortusuyorsa. Ortusmuyorsa cizilmez: kisa bir
   * kontur, yukseklik braketini yalanlar.
   */
  frontOutline?: string;
  /** Ust gorunusun dikey kenarinda. */
  length: Dimension;
  /** Iki gorunusun arasinda, yatay. */
  wingspan: Dimension;
  /** On gorunusun dikey kenarinda. Yukseklik verisi yoksa yok. */
  height?: Dimension;
  labelY: number;
};

export type AircraftLayout = {
  width: number;
  height: number;
  /** Metre basina viewBox birimi. */
  scale: number;
  groundY: number;
  human: {x: number; y: number; height: number; labelY: number};
  rows: AircraftRow[];
};

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function envelope(
  x: number,
  y: number,
  width: number,
  height: number
): Envelope {
  return {
    x: round(x),
    y: round(y),
    width: round(width),
    height: round(height),
    path: [
      `M ${round(x)} ${round(y)}`,
      `H ${round(x + width)}`,
      `V ${round(y + height)}`,
      `H ${round(x)}`,
      'Z'
    ].join(' ')
  };
}

/** Yatay olcu cizgisi ve iki ucundaki isaret. */
function horizontalDim(x1: number, x2: number, y: number): string {
  return [
    `M ${round(x1)} ${round(y - TICK)}`,
    `V ${round(y + TICK)}`,
    `M ${round(x1)} ${round(y)}`,
    `H ${round(x2)}`,
    `M ${round(x2)} ${round(y - TICK)}`,
    `V ${round(y + TICK)}`
  ].join(' ');
}

/** Dikey olcu cizgisi ve iki ucundaki isaret. */
function verticalDim(x: number, y1: number, y2: number): string {
  return [
    `M ${round(x - TICK)} ${round(y1)}`,
    `H ${round(x + TICK)}`,
    `M ${round(x)} ${round(y1)}`,
    `V ${round(y2)}`,
    `M ${round(x - TICK)} ${round(y2)}`,
    `H ${round(x + TICK)}`
  ].join(' ');
}

/**
 * Tum gruplari tek olcekte yerlestirir.
 *
 * Olcek hem kanat acikligina (yatay yer) hem uzunluga (dikey yer) bakar;
 * hangisi once sigmiyorsa carpani o belirler. Boylece kanat acikligi
 * uzunluktan buyuk sistemlerde de cizim tuvalin disina tasmaz.
 */
export function layoutAircrafts(
  items: readonly AircraftItem[]
): AircraftLayout | undefined {
  if (items.length === 0) return undefined;

  const maxSpan = Math.max(...items.map((item) => item.wingspanM));
  const maxLength = Math.max(...items.map((item) => item.lengthM));
  if (!(maxSpan > 0) || !(maxLength > 0)) return undefined;

  const usableWidth = VIEW_WIDTH - HUMAN_COLUMN - LABEL_COLUMN;
  const scale = Math.min(usableWidth / maxSpan, MAX_PLAN_HEIGHT / maxLength);
  const humanHeight = HUMAN_HEIGHT_M * scale;

  let cursor = TOP_PADDING;
  /** Son on gorunusun alt kenari — zemin cizgisi oraya oturur. */
  let baseline: number | undefined;

  const rows: AircraftRow[] = items.map((item) => {
    const width = item.wingspanM * scale;
    const right = HUMAN_COLUMN + width;
    const dimX = right + DIM_GAP;

    const planHeight = item.lengthM * scale;
    const planTop = cursor;
    const planBottom = planTop + planHeight;

    const spanY = planBottom + DIM_GAP;
    cursor = spanY + DIM_LABEL;

    let front: Envelope | undefined;
    let frontOutline: string | undefined;
    let height: Dimension | undefined;

    if (item.heightM !== undefined && item.heightM > 0) {
      const frontHeight = item.heightM * scale;
      const frontTop = cursor;
      const frontBottom = frontTop + frontHeight;

      front = envelope(HUMAN_COLUMN, frontTop, width, frontHeight);

      /*
       * On gorunus dis hatti, ancak modelin dikey uzanimi yayimlanan
       * yukseklikle ortusuyorsa cizilir. Inis takimi modellenmemis bir
       * modelde kontur braketten kisa kalir ve okuyucu ikisinden
       * hangisinin dogru oldugunu bilemez.
       */
      const flat = item.parts ? projectBounds(item.parts, 'front') : undefined;
      if (flat && Math.abs(flat.maxV - flat.minV - item.heightM) < 0.02) {
        frontOutline = projectParts(item.parts!, 'front')
          .map((outline) =>
            transformPath(outline.path, {
              scale,
              offsetU: HUMAN_COLUMN + width / 2,
              offsetV: frontTop - flat.minV * scale
            })
          )
          .join(' ');
      }
      height = {
        path: verticalDim(dimX, frontTop, frontBottom),
        labelX: round(dimX + 8),
        labelY: round(frontTop + frontHeight / 2 + 4),
        valueM: item.heightM
      };

      baseline = frontBottom;
      cursor = frontBottom + ROW_GAP;
    } else {
      cursor += ROW_GAP;
    }

    /*
     * Ust gorunus izdusumu: uzunluk sayfada DIKEY seriliyor, izdusum ise
     * uzunlugu yatay veriyor; `swap` ekran eksenlerini takas eder. Takas
     * bir bicim iddiasi tasimaz, yalnizca yerlesimdir.
     */
    const planOutline = item.parts
      ? projectParts(item.parts, 'top')
          .map((outline) =>
            transformPath(outline.path, {
              scale,
              offsetU: HUMAN_COLUMN + width / 2,
              offsetV: planTop,
              swap: true
            })
          )
          .join(' ')
      : undefined;

    return {
      id: item.id,
      label: item.label,
      plan: envelope(HUMAN_COLUMN, planTop, width, planHeight),
      planOutline,
      frontOutline,
      front,
      length: {
        path: verticalDim(dimX, planTop, planBottom),
        labelX: round(dimX + 8),
        labelY: round(planTop + planHeight / 2 + 4),
        valueM: item.lengthM
      },
      wingspan: {
        path: horizontalDim(HUMAN_COLUMN, right, spanY),
        labelX: round(HUMAN_COLUMN + width / 2),
        labelY: round(spanY + DIM_LABEL - 7),
        valueM: item.wingspanM
      },
      height,
      labelY: round(planTop - 12)
    };
  });

  const groundY = round(
    Math.max(baseline ?? cursor, TOP_PADDING + humanHeight)
  );

  return {
    width: VIEW_WIDTH,
    height: round(groundY + BOTTOM_PADDING),
    scale: round(scale),
    groundY,
    human: {
      x: 24,
      y: round(groundY - humanHeight),
      height: round(humanHeight),
      labelY: round(groundY + 16)
    },
    rows
  };
}

/**
 * Paylasim gorseli icin sikistirilmis zarf kumesi.
 *
 * Sayfadaki sema dikey: iki gorunus alt alta, olcu cizgileri ve insan
 * figuru yaninda. Paylasim gorseli genis ve alcak bir seride oturuyor,
 * oraya grup basina tek zarf giriyor — yukseklik verisi varsa on gorunus
 * (genis ve alcak), yoksa ust gorunus. Olcek sayfadaki semayi ureten
 * fonksiyondan geliyor, boylece iki cikti ayni carpani paylasir.
 */
export function compactAircraftEnvelopes(
  items: readonly AircraftItem[]
): {
  width: number;
  height: number;
  rects: Envelope[];
  /** Parca listesi olan gruplarin ust gorunus dis hatti; yoksa undefined. */
  outlines: Array<string | undefined>;
} | undefined {
  const layout = layoutAircrafts(items);
  if (!layout) return undefined;

  let cursor = 0;
  const rects: Envelope[] = [];
  const outlines: Array<string | undefined> = [];

  for (const item of items) {
    const width = item.wingspanM * layout.scale;
    /*
     * Serit gorselde grup basina TEK cizim var. Parca listesi varsa ust
     * gorunus dis hatti cizilir; yoksa zarf. Serit genis ve alcak
     * oldugu icin ust gorunus 90° cevrilmeden, uzunluk yatay serilir.
     */
    const outline = item.parts
      ? projectParts(item.parts, 'top')
          .map((part) =>
            transformPath(part.path, {
              scale: layout.scale,
              offsetU: 0,
              offsetV: cursor + (item.wingspanM * layout.scale) / 2
            })
          )
          .join(' ')
      : undefined;

    const rect = envelope(
      0,
      cursor,
      outline ? item.lengthM * layout.scale : width,
      (outline ? item.wingspanM : (item.heightM ?? item.lengthM)) * layout.scale
    );

    rects.push(rect);
    outlines.push(outline);
    cursor += rect.height + COMPACT_GAP;
  }

  return {
    width: Math.max(...rects.map((rect) => rect.width)),
    height: round(cursor - COMPACT_GAP),
    rects,
    outlines
  };
}
