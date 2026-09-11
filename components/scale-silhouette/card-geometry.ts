import type {Part} from '@/lib/geometry/parts';
import {
  projectBounds,
  projectParts,
  transformPath,
  type ViewAxis
} from '@/lib/geometry/project2d';
import {HUMAN_HEIGHT_M} from './geometry';

/**
 * Paylasim kartindaki olcek karsilastirmasi — TEK carpan, karisik sinif.
 *
 * Sayfadaki iki yerlesimden (geometry.ts fuze, aircraft-geometry.ts ucak)
 * ayri duruyor cunku cozdugu sorun farkli: onlar tek sinifin varyantlarini
 * dizer, burasi fuze ile IHA'yi AYNI cetvele koyar. Ortak olan izdusum
 * ilkelleri; ucu de lib/geometry/project2d'yi okur, yani kart ile sayfa
 * ayni parca listesinden ayni dis hatti alir.
 *
 * BASKIN OLCU SORUNU. Fuzede uzun kenar uzunluktur, IHA'da kanat
 * acikligidir: AKINCI 12,3 m boyunda ama 20 m acikliktadir. Satir basina
 * "uzunluk" cizmek IHA'yi oldugundan kucuk gosterirdi. Cozum bir kural
 * degil, gorunus secimi: fuze YAN gorunusten, ucak UST gorunusten cizilir
 * ve ust gorunus 90° cevrilerek serilir. Boylece her satirin genis kenari
 * kendi baskin olcusudur ve ikisi de ayni metre carpanini paylasir.
 * Cevirme bicim iddiasi tasimaz — hangi kenarin ne oldugunu satirin
 * etiketi soyler.
 */

export type ScaleCardItem = {
  id: string;
  /** Fuze 'side', ucak 'top'. */
  view: ViewAxis;
  /** Ust gorunusu dik sermek icin ekran eksenlerini takas et. */
  swap?: boolean;
  /** Urun tanimindan gelen parca listesi. Yoksa kesikli zarf cizilir. */
  parts?: readonly Part[];
  /** Yatay uzanim, metre — zarf icin ve parca listesi yokken olcek icin. */
  spanM: number;
  /** Dikey uzanim, metre. */
  depthM: number;
};

export type ScaleCardDrawing = {
  /** SVG veri URI'si. */
  src: string;
  /** Cizim kutusu, piksel — paylasilan carpandan turer. */
  width: number;
  height: number;
};

export type ScaleCardRow = ScaleCardDrawing & {
  id: string;
  /** Dis hat cizildi mi. Yanlissa cizilen sey bir sinir kutusudur. */
  outlined: boolean;
};

export type ScaleCardRuler = {
  /** Cetvelin adim araligi, metre. */
  stepM: number;
  /** Kac adim cizildi. */
  steps: number;
  /** Adim etiketleri, soldan saga. Son etiket birimi tasir. */
  labels: number[];
} & ScaleCardDrawing;

export type ScaleCardLayout = {
  /** Piksel / metre — butun satirlar, insan figuru ve cetvel icin ayni. */
  scale: number;
  rows: ScaleCardRow[];
  human: ScaleCardDrawing;
  ruler: ScaleCardRuler;
};

export type ScaleCardBox = {
  /** Cizime ayrilan genislik, piksel. */
  width: number;
  /** Butun satirlarin ve cetvelin sigacagi yukseklik, piksel. */
  height: number;
  /** Iki satir arasi bosluk, piksel. */
  rowGap: number;
  /**
   * Bir satirin en az yuksekligi, piksel. Fuzenin yan gorunusu birkac
   * piksel kalinliginda kalabilir; satirin solundaki ad ve rozet o
   * yuksekligi zaten istiyor.
   */
  minRow: number;
  /** Cetvelin ustunde birakilan bosluk, piksel. */
  rulerGap: number;
  /** Cetvel cizgisinin yuksekligi, piksel. */
  rulerHeight: number;
};

/** Cetvel adimlari: 1-2-5 dizisi, okunur sayilar. */
const STEPS = [1, 2, 5, 10, 20, 50, 100];
/** Cizgi kalinligi — sayfadaki siluetle ayni. */
const STROKE = 2;
/** Kesikli zarfin deseni. */
const DASH = '6 7';
/** Cizimin viewBox'inda birakilan pay — kontur kenara oturdugunda kirpilmasin. */
const PAD = STROKE;

function dataUri(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Bir satirin metre cinsinden kutusu. Parca listesi varsa izdusumun
 * gercek siniri, yoksa yayimlanmis iki olcu.
 */
function boxOf(item: ScaleCardItem): {spanM: number; depthM: number} {
  if (!item.parts) return {spanM: item.spanM, depthM: item.depthM};

  const bounds = projectBounds(item.parts, item.view);
  if (!bounds) return {spanM: item.spanM, depthM: item.depthM};

  const across = bounds.maxU - bounds.minU;
  const down = bounds.maxV - bounds.minV;
  return item.swap
    ? {spanM: down, depthM: across}
    : {spanM: across, depthM: down};
}

/**
 * Paylasilan carpan. Genislik en genis satira, yukseklik satirlarin
 * TOPLAMINA gore sinirlanir.
 *
 * Satirlar esit yuksekliğe BOLUNMEZ. Tasarimdaki 1fr'lik satirlar tek
 * sinifta dogru duruyor; fuze ile IHA ayni kartta oldugunda en dar
 * satir (fuzenin yan gorunusu, yarim metre) en genis satirla (IHA'nin
 * ust gorunusu, on iki metre) ayni yuksekligi alsaydi carpan altiya
 * bolunurdu ve iki cizim de kucuk kalirdi.
 *
 * En kucuk satir yuksekligi tuketimi dogrusal olmaktan cikariyor, bu
 * yuzden carpan ikili aramayla bulunuyor: tuketim carpanla birlikte
 * artan bir fonksiyon, yani arama tek cozume yakinsiyor.
 *
 * Insan figuru toplama EKLENMEZ, satirlarin yaninda duruyor — ama tek
 * basina da sigmali, yoksa ayni carpani paylastigi iddiasi bozulur.
 */
function fitScale(
  boxes: readonly {spanM: number; depthM: number}[],
  box: ScaleCardBox
): number {
  const widest = Math.max(...boxes.map((entry) => entry.spanM));
  const gaps = box.rowGap * Math.max(boxes.length - 1, 0);
  const available = box.height - box.rulerGap - box.rulerHeight - gaps;
  /*
   * Her cizim kendi viewBox'inda yarim cizgi kadar pay tasiyor (rowDrawing),
   * yani kutusu iki eksende de PAD*2 buyuyor. Pay hesaba katilmazsa uc
   * satirlik bir kart on iki piksel tasar ve tasma sessiz olur.
   */
  const byWidth = (box.width - PAD * 2) / widest;

  const used = (scale: number) =>
    Math.max(
      boxes.reduce(
        (total, entry) =>
          total + Math.max(entry.depthM * scale + PAD * 2, box.minRow),
        0
      ),
      HUMAN_HEIGHT_M * scale
    );

  if (used(byWidth) <= available) return byWidth;

  let low = 0;
  let high = byWidth;
  for (let step = 0; step < 24; step++) {
    const middle = (low + high) / 2;
    if (used(middle) <= available) low = middle;
    else high = middle;
  }

  return low;
}

/** Parca listesinin dis hatti, kendi kutusuna hizalanmis. */
function outlinePaths(
  item: ScaleCardItem,
  scale: number
): {body: string; fins: string} | undefined {
  if (!item.parts) return undefined;

  const bounds = projectBounds(item.parts, item.view);
  if (!bounds) return undefined;

  const outlines = projectParts(item.parts, item.view);
  const move = (path: string) =>
    transformPath(path, {
      scale,
      /*
       * Takas cizimden ONCE degil SONRA uygulaniyor (transformPath'in
       * kendi bayragi), bu yuzden kaydirma da takas edilmis eksende
       * hesaplanir: ekranin yatayi izdusumun v ekseni olur.
       */
      offsetU: -(item.swap ? bounds.minV : bounds.minU) * scale,
      offsetV: -(item.swap ? bounds.minU : bounds.minV) * scale,
      swap: item.swap
    });

  return {
    body: outlines
      .filter((outline) => outline.kind === 'body')
      .map((outline) => move(outline.path))
      .join(' '),
    fins: outlines
      .filter((outline) => outline.kind !== 'body')
      .map((outline) => move(outline.path))
      .join(' ')
  };
}

function rowDrawing(
  item: ScaleCardItem,
  scale: number,
  color: string
): ScaleCardRow {
  const {spanM, depthM} = boxOf(item);
  const width = Math.round(spanM * scale);
  const height = Math.round(depthM * scale);
  const drawn = outlinePaths(item, scale);

  const pad = PAD;
  const shapes = drawn
    ? `<path d="${drawn.body}" fill="none" stroke="${color}" stroke-width="${STROKE}" stroke-linejoin="round"/>` +
      `<path d="${drawn.fins}" fill="none" stroke="${color}" stroke-width="${STROKE}" stroke-linejoin="round"/>`
    : `<rect x="${STROKE / 2}" y="${STROKE / 2}" width="${width - STROKE}" ` +
      `height="${height - STROKE}" fill="none" stroke="${color}" ` +
      `stroke-width="${STROKE}" stroke-dasharray="${DASH}"/>`;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${
      width + pad * 2
    } ${height + pad * 2}">${shapes}</svg>`;

  return {
    id: item.id,
    outlined: drawn !== undefined,
    src: dataUri(svg),
    width: width + pad * 2,
    height: height + pad * 2
  };
}

/** 1,8 m insan figuru — satirlarla ayni carpanda, olcegin tanigi. */
function humanDrawing(scale: number, color: string): ScaleCardDrawing {
  const height = Math.round(HUMAN_HEIGHT_M * scale);
  const width = Math.max(Math.round(height * 0.26), 6);

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">` +
    `<rect x="0" y="0" width="${width}" height="${height}" fill="${color}"/></svg>`;

  return {src: dataUri(svg), width, height};
}

/**
 * Cetvel. Adim, cizime sigacak en buyuk 1-2-5 degeri; en az iki adim
 * cizilmeye calisilir ki cetvel bir olcek olsun, tek bir cizgi degil.
 */
function rulerDrawing(
  scale: number,
  box: ScaleCardBox,
  widestM: number,
  color: string
): ScaleCardRuler {
  /*
   * Cetvel cizim alanini degil, cizilen en genis sistemi olcer. Alani
   * olcseydi yukseklige takilan bir kartta cetvel en uzun sistemin cok
   * otesine uzanir ve karsilastirilan sey kaybolurdu.
   */
  const spanM = Math.min(box.width / scale, widestM * 1.1);
  const step =
    [...STEPS].reverse().find((candidate) => spanM / candidate >= 2) ?? STEPS[0];
  const steps = Math.max(Math.floor(spanM / step), 1);

  const width = Math.round(step * steps * scale);
  const height = box.rulerHeight;
  const ticks = Array.from({length: steps + 1}, (_, index) => {
    const x = Math.round(index * step * scale) + (index === steps ? -1 : 0);
    return `<rect x="${x}" y="0" width="1" height="${height}" fill="${color}"/>`;
  }).join('');

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">` +
    `<rect x="0" y="0" width="${width}" height="1" fill="${color}"/>${ticks}</svg>`;

  return {
    src: dataUri(svg),
    width,
    height,
    stepM: step,
    steps,
    labels: Array.from({length: steps + 1}, (_, index) => index * step)
  };
}

/**
 * Butun satirlari tek carpanda yerlestirir.
 *
 * Renk disaridan veriliyor: palet lib/tokens.ts'te duruyor ve bu modul
 * cizim geometrisidir, tema degil.
 */
export function layoutScaleCard(
  items: readonly ScaleCardItem[],
  box: ScaleCardBox,
  colors: {row: (index: number) => string; rule: string}
): ScaleCardLayout | undefined {
  if (items.length === 0) return undefined;

  const boxes = items.map(boxOf);
  if (!boxes.every((entry) => entry.spanM > 0 && entry.depthM > 0)) {
    return undefined;
  }

  const scale = fitScale(boxes, box);
  if (!(scale > 0) || !Number.isFinite(scale)) return undefined;

  return {
    scale,
    rows: items.map((item, index) => rowDrawing(item, scale, colors.row(index))),
    human: humanDrawing(scale, colors.rule),
    ruler: rulerDrawing(
      scale,
      box,
      Math.max(...boxes.map((entry) => entry.spanM)),
      colors.rule
    )
  };
}
