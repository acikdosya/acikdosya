/**
 * Siluet geometrisi. Saf fonksiyonlar — veri degisince gorsel degisir,
 * elle cizim yok (CLAUDE.md §3).
 *
 * Teknik cizim degil: govde, burun ve kanatcik oranlari sematiktir.
 * Gercek olan tek sey olcek — uzunluk, cap ve 1,8 m insan figuru
 * ayni carpanla cizilir.
 */

export const HUMAN_HEIGHT_M = 1.8;

/** viewBox genisligi; yukseklik veriden hesaplanir. */
const VIEW_WIDTH = 700;
/** Solda insan figurune ayrilan sutun. */
const HUMAN_COLUMN = 76;
/** Sagda "10 m" etiketine ayrilan sutun. */
const LABEL_COLUMN = 68;
/** Ustte varyant adina ayrilan bosluk. */
const TOP_PADDING = 34;
/** Zemin cizgisinin altinda kalan etiket boslugu. */
const BOTTOM_PADDING = 24;
/** Kanatciklarin govde disina tastigi oran (yaricapin kati). */
const FIN_SPAN = 2.1;

export type SilhouetteItem = {
  id: string;
  label: string;
  lengthM: number;
  diameterMm: number;
};

export type SilhouetteRow = {
  id: string;
  label: string;
  lengthM: number;
  /** Govde dis hatti. */
  body: string;
  /** Kuyruk kanatciklari. */
  fins: string;
  /** Boyut cizgisi ve etiketi. */
  dimension: {x1: number; x2: number; y: number; labelX: number};
  labelY: number;
};

export type SilhouetteLayout = {
  width: number;
  height: number;
  /** Metre basina viewBox birimi. */
  scale: number;
  groundY: number;
  human: {x: number; y: number; height: number; labelY: number};
  rows: SilhouetteRow[];
};

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Govde: yuvarlak burun, duz govde, hafif genisleyen kuyruk.
 * x sol uc, cy govde ekseni, radius yaricap.
 */
export function bodyPath(
  x: number,
  cy: number,
  length: number,
  radius: number
): string {
  const nose = length * 0.22;
  const tail = length * 0.14;
  const r = radius;

  return [
    `M ${round(x)} ${round(cy)}`,
    `C ${round(x + nose * 0.4)} ${round(cy - r * 0.75)} ${round(x + nose * 0.8)} ${round(cy - r)} ${round(x + nose)} ${round(cy - r)}`,
    `L ${round(x + length - tail)} ${round(cy - r)}`,
    `L ${round(x + length)} ${round(cy - r * 1.05)}`,
    `L ${round(x + length)} ${round(cy + r * 1.05)}`,
    `L ${round(x + length - tail)} ${round(cy + r)}`,
    `L ${round(x + nose)} ${round(cy + r)}`,
    `C ${round(x + nose * 0.8)} ${round(cy + r)} ${round(x + nose * 0.4)} ${round(cy + r * 0.75)} ${round(x)} ${round(cy)}`,
    'Z'
  ].join(' ');
}

export function finPath(
  x: number,
  cy: number,
  length: number,
  radius: number
): string {
  const tail = length * 0.14;
  const base = x + length - tail;
  const tip = x + length;
  const span = radius * FIN_SPAN;

  return [
    `M ${round(base)} ${round(cy - radius)}`,
    `L ${round(tip)} ${round(cy - span)}`,
    `L ${round(tip)} ${round(cy - radius)}`,
    'Z',
    `M ${round(base)} ${round(cy + radius)}`,
    `L ${round(tip)} ${round(cy + span)}`,
    `L ${round(tip)} ${round(cy + radius)}`,
    'Z'
  ].join(' ');
}

/**
 * Tum varyantlari tek olcekte yerlestirir. Olcek en uzun varyanta gore
 * secilir, boylece veri degisince cizim kendini yeniden boyutlandirir.
 */
export function layoutSilhouettes(
  items: readonly SilhouetteItem[]
): SilhouetteLayout | undefined {
  if (items.length === 0) return undefined;

  const maxLength = Math.max(...items.map((item) => item.lengthM));
  if (!(maxLength > 0)) return undefined;

  const usableWidth = VIEW_WIDTH - HUMAN_COLUMN - LABEL_COLUMN;
  const scale = usableWidth / maxLength;
  const humanHeight = HUMAN_HEIGHT_M * scale;

  let cursor = TOP_PADDING;
  const rows: SilhouetteRow[] = items.map((item) => {
    const length = item.lengthM * scale;
    const radius = ((item.diameterMm / 1000) * scale) / 2;
    const finReach = radius * FIN_SPAN;
    // Kanatciklar, boyut cizgisi ve ustteki ad icin gereken dikey alan.
    const rowHeight = Math.max(finReach * 2 + 34, 62);
    const cy = cursor + finReach + 6;
    cursor += rowHeight;

    const dimensionY = cy + finReach + 12;

    return {
      id: item.id,
      label: item.label,
      lengthM: item.lengthM,
      body: bodyPath(HUMAN_COLUMN, cy, length, radius),
      fins: finPath(HUMAN_COLUMN, cy, length, radius),
      dimension: {
        x1: HUMAN_COLUMN,
        x2: round(HUMAN_COLUMN + length),
        y: round(dimensionY),
        labelX: round(HUMAN_COLUMN + length + 8)
      },
      labelY: round(cy - finReach - 12)
    };
  });

  // Son boyut cizgisi ile zemin cizgisi birbirine yapismasin.
  const groundY = round(Math.max(cursor + 10, TOP_PADDING + humanHeight));

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
