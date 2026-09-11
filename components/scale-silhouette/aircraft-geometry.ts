/**
 * Ucak boyut semasi — kaynakli uzunluk, kanat acikligi ve (varsa)
 * yukseklikten turetilir.
 *
 * Fotogerçekçi bir kontur uretilmez; gercek olan tek sey olcektir.
 * Govde kalinligi gibi kaynagi olmayan ayrintilar, sematik gorselin
 * okunabilirligini korumak icin kanat acikliginin sabit bir oraniyla
 * verilir ve bu durum aciklanir.
 */

export const HUMAN_HEIGHT_M = 1.8;

const VIEW_WIDTH = 700;
const HUMAN_COLUMN = 76;
const LABEL_COLUMN = 68;
const TOP_PADDING = 34;
const BOTTOM_PADDING = 24;
/** Govde kalinligi kanat acikliginin sabit orani; ayrinti degil, sema. */
const FUSELAGE_RATIO = 0.12;

export type AircraftItem = {
  id: string;
  label: string;
  lengthM: number;
  wingspanM: number;
  heightM?: number;
};

export type AircraftRow = {
  id: string;
  label: string;
  lengthM: number;
  wingspanM: number;
  /** Ust gorunus path'i: govde + kanatlar. */
  topView: string;
  /** Boyut cizgisi ve etiketi. */
  dimension: {x1: number; x2: number; y: number; labelX: number};
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

/**
 * Govde dikdortgeni + kanatlar. Kanatlar govde ortasindan cikar,
 * her iki yana wingspanM/2 uzanir.
 */
function topViewPath(
  x: number,
  cy: number,
  length: number,
  halfSpan: number,
  fuselageWidth: number
): string {
  const halfFuselage = fuselageWidth / 2;
  const wingY = cy;
  const noseX = x;
  const tailX = x + length;
  const centerX = x + length / 2;

  return [
    // Govde
    `M ${round(noseX)} ${round(cy - halfFuselage)}`,
    `L ${round(tailX)} ${round(cy - halfFuselage)}`,
    `L ${round(tailX)} ${round(cy + halfFuselage)}`,
    `L ${round(noseX)} ${round(cy + halfFuselage)}`,
    'Z',
    // Sol kanat
    `M ${round(centerX)} ${round(wingY)}`,
    `L ${round(centerX - halfSpan)} ${round(wingY)}`,
    // Sag kanat
    `M ${round(centerX)} ${round(wingY)}`,
    `L ${round(centerX + halfSpan)} ${round(wingY)}`
  ].join(' ');
}

/**
 * Tum ucaklari tek olcekte yerlestirir. Olcek, en uzun govdeye veya
 * en genis kanada gore secilmez; iki eksen ayni carpanla cizilir ki
 * boyut karsilastirmasi dogru olsun.
 */
export function layoutAircrafts(
  items: readonly AircraftItem[]
): AircraftLayout | undefined {
  if (items.length === 0) return undefined;

  const maxLength = Math.max(...items.map((item) => item.lengthM));
  if (!(maxLength > 0)) return undefined;

  const usableWidth = VIEW_WIDTH - HUMAN_COLUMN - LABEL_COLUMN;
  const scale = usableWidth / maxLength;
  const humanHeight = HUMAN_HEIGHT_M * scale;

  let cursor = TOP_PADDING;
  const rows: AircraftRow[] = items.map((item) => {
    const length = item.lengthM * scale;
    const halfSpan = (item.wingspanM * scale) / 2;
    const fuselageWidth = item.wingspanM * scale * FUSELAGE_RATIO;
    const rowHeight = Math.max(halfSpan * 2 + 34, 62);
    const cy = cursor + halfSpan + 6;
    cursor += rowHeight;

    const dimensionY = cy + halfSpan + 12;

    return {
      id: item.id,
      label: item.label,
      lengthM: item.lengthM,
      wingspanM: item.wingspanM,
      topView: topViewPath(
        HUMAN_COLUMN,
        cy,
        length,
        halfSpan,
        fuselageWidth
      ),
      dimension: {
        x1: HUMAN_COLUMN,
        x2: round(HUMAN_COLUMN + length),
        y: round(dimensionY),
        labelX: round(HUMAN_COLUMN + length + 8)
      },
      labelY: round(cy - halfSpan - 12)
    };
  });

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
