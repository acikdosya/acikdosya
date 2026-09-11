import type {Part} from '@/lib/geometry/parts';
import {projectParts, transformPath} from '@/lib/geometry/project2d';

/**
 * Siluet geometrisi. Saf fonksiyonlar — veri degisince gorsel degisir,
 * elle cizim yok (CLAUDE.md §3).
 *
 * Kontur artik ELLE CIZILMIYOR: parca listesi varsa siluet, uc boyutlu
 * modelle ayni listenin ortografik izdusumudur (specs/system-silhouette).
 * Iki katman tek kaynaktan turedigi icin ayrisamazlar.
 *
 * Parca listesi YOKSA kontur cizilmez. Onceki surumde her fuze, urune
 * ozel olmayan genel oranlarla (burun 0,22, kuyruk 0,14, kanatcik 2,1R)
 * ciziliyordu — yani dis profili olmayan bir sisteme varsayilan bir
 * bicim veriliyordu. CLAUDE.md §9'un yasakladigi sey tam olarak bu.
 * O durumda artik kesikli olcu zarfi cizilir: "burasi bir sinir, bir dis
 * hat degil".
 *
 * Gercek olan tek sey olcek — uzunluk, cap ve 1,8 m insan figuru ayni
 * carpanla cizilir.
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

export type SilhouetteItem = {
  id: string;
  label: string;
  lengthM: number;
  diameterMm: number;
  /** Urun tanimindan gelen parca listesi. Yoksa kontur cizilmez. */
  parts?: readonly Part[];
};

export type SilhouetteRow = {
  id: string;
  label: string;
  lengthM: number;
  /** Govde dis hatti. Parca listesi yoksa bos. */
  body: string;
  /** Govde disindaki yuzeyler. Parca listesi yoksa bos. */
  fins: string;
  /** Parca listesi yoksa cizilen kesikli olcu zarfi. */
  envelope?: string;
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
 * Kesikli olcu zarfi — dis hat DEGIL, sinir kutusu.
 *
 * Parca listesi olmayan sistem icin cizilir. Kenarlari ne anlama geldigini
 * olcu cizgisinin etiketi soyler; kutunun kendisi bicim iddiasi tasimaz.
 */
function envelopePath(
  x: number,
  cy: number,
  length: number,
  radius: number
): string {
  const top = cy - radius;
  const bottom = cy + radius;
  return [
    `M ${round(x)} ${round(top)}`,
    `H ${round(x + length)}`,
    `V ${round(bottom)}`,
    `H ${round(x)}`,
    'Z'
  ].join(' ');
}

/**
 * Parca listesinin yan gorunus izdusumu, cizim uzayina tasinmis.
 *
 * Govde ile geri kalan yuzeyler ayri yollarda toplanir; sayfa ikisini
 * ayni sinifla ama ayri path ogeleriyle ciziyor.
 */
function projectRow(
  parts: readonly Part[],
  x: number,
  cy: number,
  scale: number
): {body: string; fins: string} {
  const outlines = projectParts(parts, 'side');
  const move = (path: string) =>
    transformPath(path, {scale, offsetU: x, offsetV: cy});

  const body = outlines
    .filter((outline) => outline.kind === 'body')
    .map((outline) => move(outline.path))
    .join(' ');
  const fins = outlines
    .filter((outline) => outline.kind !== 'body')
    .map((outline) => move(outline.path))
    .join(' ');

  return {body, fins};
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
    /*
     * Dikey yer: parca listesi varsa gercek yanal uzanim, yoksa yalniz
     * govde yaricapi. Zarf govdeden genis degil, cunku zarf yalniz
     * yayimlanmis iki olcuyu tarif ediyor.
     */
    const reach = item.parts
      ? Math.max(
          ...item.parts.flatMap((part) =>
            part.kind === 'panel'
              ? [(part.stations.at(-1)?.span ?? 0) * scale]
              : [radius]
          )
        )
      : radius;
    // Yuzeyler, boyut cizgisi ve ustteki ad icin gereken dikey alan.
    const rowHeight = Math.max(reach * 2 + 34, 62);
    const cy = cursor + reach + 6;
    cursor += rowHeight;

    const dimensionY = cy + reach + 12;
    const drawn = item.parts
      ? projectRow(item.parts, HUMAN_COLUMN, cy, scale)
      : undefined;

    return {
      id: item.id,
      label: item.label,
      lengthM: item.lengthM,
      body: drawn?.body ?? '',
      fins: drawn?.fins ?? '',
      envelope: drawn
        ? undefined
        : envelopePath(HUMAN_COLUMN, cy, length, radius),
      dimension: {
        x1: HUMAN_COLUMN,
        x2: round(HUMAN_COLUMN + length),
        y: round(dimensionY),
        labelX: round(HUMAN_COLUMN + length + 8)
      },
      labelY: round(cy - reach - 12)
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
