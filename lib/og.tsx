import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {
  BRAND_BRACKET,
  BRAND_VALUE,
  BRAND_WORDMARK,
  type BrandRect
} from './brand';
import type {Confidence} from './schema';
import {PALETTE} from './tokens';
import {
  compactAircraftEnvelopes,
  type AircraftItem
} from '@/components/scale-silhouette/aircraft-geometry';
import {
  layoutSilhouettes,
  type SilhouetteItem
} from '@/components/scale-silhouette/geometry';

/**
 * Paylasim gorselleri ve uygulama ikonlari — next/og.
 *
 * satori CSS degiskeni cozmez ve yalnizca ttf/otf/woff okur; bu yuzden
 * renkler lib/tokens.ts'ten, fontlar app/_fonts/og/ altindaki statik
 * surumlerden gelir (bkz. scripts/derive-og-font.py). Sayfayla ayni
 * palet, ayni tipografi.
 */

export const OG_SIZE = {width: 1200, height: 630} as const;

type OgFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600;
  style: 'normal';
};

/**
 * Iki aile: Archivo baslik, sayi ve arayuz; Source Serif 4 govde metni.
 * Sayfadaki ayrimin aynisi (CLAUDE.md §4). Serif, paylasim kartlarindaki
 * okunacak metinler icin geldi — duzeltme gerekcesi gibi.
 */
export const OG_SERIF_FAMILY = 'SourceSerif, SourceSerifExt';

let fontCache: OgFont[] | undefined;

async function readFont(file: string): Promise<ArrayBuffer> {
  const buffer = await readFile(join(process.cwd(), 'app', '_fonts', 'og', file));
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  ) as ArrayBuffer;
}

/**
 * latin ve latin-ext ayri font olarak veriliyor, birlestirilmiyor: satori
 * glif bulamadiginda listedeki sonrakine duser, tipki sayfadaki font
 * stack'i gibi. ğ ş İ ikinci dosyada.
 */
export async function loadOgFonts(): Promise<OgFont[]> {
  if (!fontCache) {
    const [latin, latinExt, serif, serifExt] = await Promise.all([
      readFont('archivo-600-latin.ttf'),
      readFont('archivo-600-latin-ext.ttf'),
      readFont('source-serif-400-latin.ttf'),
      readFont('source-serif-400-latin-ext.ttf')
    ]);

    fontCache = [
      {name: 'Archivo', data: latin, weight: 600, style: 'normal'},
      {name: 'ArchivoExt', data: latinExt, weight: 600, style: 'normal'},
      {name: 'SourceSerif', data: serif, weight: 400, style: 'normal'},
      {name: 'SourceSerifExt', data: serifExt, weight: 400, style: 'normal'}
    ];
  }

  return fontCache;
}

/** satori font-family listesini destekler; sira sayfadakiyle ayni. */
export const OG_FONT_FAMILY = 'Archivo, ArchivoExt';

/**
 * Sembol — CLAUDE.md §10. Dikdortgenler div olarak ciziliyor cunku satori'nin
 * SVG destegi kismi; geometri lib/brand.ts'ten geliyor, sayfadaki logoyla
 * ayni dosyadan.
 */
export function BrandSymbol({
  size,
  tone = 'full'
}: {
  size: number;
  tone?: 'full' | 'mono';
}) {
  const unit = size / 100;
  const bracketFill = PALETTE.ink;
  const valueFill = tone === 'mono' ? PALETTE.ink : PALETTE.signal;

  const block = (rect: BrandRect, fill: string, key: string) => (
    <div
      key={key}
      style={{
        position: 'absolute',
        left: rect.x * unit,
        top: rect.y * unit,
        width: rect.width * unit,
        height: rect.height * unit,
        background: fill
      }}
    />
  );

  return (
    <div style={{position: 'relative', display: 'flex', width: size, height: size}}>
      {BRAND_BRACKET.map((rect, index) =>
        block(rect, bracketFill, `bracket-${index}`)
      )}
      {block(BRAND_VALUE, valueFill, 'value')}
    </div>
  );
}

/** Sembol + kelime markasi. Olculer §10'daki oranlardan. */
export function BrandLockupImage({size}: {size: number}) {
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: size * 0.286}}>
      <BrandSymbol size={size} />
      <div
        style={{
          display: 'flex',
          fontFamily: OG_FONT_FAMILY,
          fontSize: size * 0.667,
          fontWeight: 600,
          letterSpacing: '-0.035em',
          color: PALETTE.ink
        }}
      >
        {BRAND_WORDMARK}
      </div>
    </div>
  );
}

/**
 * Olcekli siluet, veri URI'si olarak.
 *
 * satori inline SVG'yi kismi destekliyor, <img src="data:image/svg+xml">
 * ise tam calisiyor. Geometri sayfadaki siluetle ayni fonksiyonlardan
 * uretiliyor: olcu verisi degisince paylasim gorseli de degisir.
 * Etiket ve boyut cizgisi yok — o bilgi gorselin metin katmaninda.
 */
export function silhouetteDataUri(
  items: readonly SilhouetteItem[]
): {src: string; width: number; height: number} | undefined {
  const layout = layoutSilhouettes(items);
  if (!layout) return undefined;

  const shapes = layout.rows
    .map((row, index) => {
      const stroke = index === 0 ? PALETTE.ink : PALETTE.signal;
      return (
        `<path d="${row.body}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="${row.fins}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`
      );
    })
    .join('');

  /*
   * Sayfadaki cizimde insan figuru ve olcu etiketi icin ayrilan sutunlar
   * var; gorselde ikisi de cizilmiyor, o yuzden viewBox govdelere
   * kirpiliyor. Kirpilmazsa gorselin ucte biri bos kaliyor.
   */
  const margin = 6;
  const left = Math.min(...layout.rows.map((row) => row.dimension.x1)) - margin;
  const right = Math.max(...layout.rows.map((row) => row.dimension.x2)) + margin;
  const top = 14;
  const width = right - left;
  const height = layout.groundY - top;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left} ${top} ${width} ${height}">` +
    shapes +
    '</svg>';

  return {
    src: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    width,
    height
  };
}

/**
 * Ucak boyut semasi, veri URI'si olarak.
 *
 * Sayfadaki sema dikey duruyor — iki gorunus alt alta, insan figuru
 * yaninda. Paylasim gorselinin yeri genis ve alcak, o yuzden buraya grup
 * basina tek zarf giriyor (yukseklik verisi varsa on gorunus, yoksa ust
 * gorunus). Olcek yine sayfayi cizen fonksiyondan geliyor.
 *
 * Kontur burada da yok: cizilen sey olcunun siniri. Hangi kenarin ne
 * oldugunu gorselin metin katmani soyluyor.
 */
export function aircraftDataUri(
  items: readonly AircraftItem[]
): {src: string; width: number; height: number} | undefined {
  const compact = compactAircraftEnvelopes(items);
  if (!compact) return undefined;

  const margin = 6;
  /*
   * Parca listesi olan grup gercek dis hattiyla cizilir; olmayan grup
   * kesikli zarfla. Kesikli cerceve "bu bir sinir, bir dis hat degil"
   * demek; dis hat cizildiginde o isaret kalkmali.
   */
  const shapes = compact.rects
    .map((rect, index) => {
      const stroke = index === 0 ? PALETTE.ink2 : PALETTE.signal;
      const outline = compact.outlines[index];
      if (outline) {
        return (
          `<path d="${outline}" fill="none" stroke="${stroke}" ` +
          'stroke-width="2" stroke-linejoin="round"/>'
        );
      }
      return (
        `<path d="${rect.path}" fill="none" stroke="${stroke}" ` +
        'stroke-width="2" stroke-dasharray="6 7"/>'
      );
    })
    .join('');

  const width = compact.width + margin * 2;
  const height = compact.height + margin * 2;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-margin} ${-margin} ${width} ${height}">` +
    shapes +
    '</svg>';

  return {
    src: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
    width,
    height
  };
}

/**
 * Guven rozeti — CLAUDE.md §4.
 *
 * Cerceve CSS ile degil SVG zemin gorseli olarak ciziliyor: satori kesikli
 * cerceveyi duz ciziyor, o zaman resmi ile basin yalnizca RENKLE ayrisirdi.
 * Uc desen (duz / kesikli / duz + soft dolgu) burada tek yerden uretiliyor,
 * boylece sayfadaki rozetle ayni dili konusuyor.
 *
 * Kutu sabit olculu cunku satori metin genisligini bize soylemiyor; ucu
 * yan yana durdugunda esit genislik zaten lejant gibi okunuyor.
 */
function badgeFrame(
  confidence: Confidence,
  width: number,
  height: number
): string {
  const stroke =
    confidence === 'official'
      ? PALETTE.ink
      : confidence === 'press'
        ? PALETTE.ink2
        : PALETTE.signal;
  const fill =
    confidence === 'estimate' ? 'rgba(179,19,27,0.09)' : 'none';
  const dash = confidence === 'press' ? ' stroke-dasharray="6 4"' : '';

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<rect x="1" y="1" width="${width - 2}" height="${height - 2}" ` +
    `fill="${fill}" stroke="${stroke}" stroke-width="2"${dash}/></svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Metnin yaklasik genisligi.
 *
 * satori cizilen metnin genisligini bize soylemiyor ve rozet cercevesi
 * SVG zemin gorseli oldugu icin kutunun olcusu onceden bilinmeli. Carpan
 * olculerek secildi: Archivo 600'de karisik Turkce metin 48 px puntoda
 * karakter basina ~0,55 em yer kapliyor (lib/og-fonts.test.ts ayni metni
 * ciziyor). Yukari yuvarliyoruz — genis bir kutu bosluk birakir, dar bir
 * kutu metni keser.
 */
const AVERAGE_ADVANCE = 0.56;

export function badgeWidth(label: string, size: number, padding = 16): number {
  return Math.round(label.length * size * AVERAGE_ADVANCE) + padding * 2;
}

export function OgBadge({
  confidence,
  label,
  size = 24,
  width = badgeWidth(label, size)
}: {
  confidence: Confidence;
  label: string;
  size?: number;
  width?: number;
}) {
  const height = Math.round(size * 1.7);
  const color =
    confidence === 'official'
      ? PALETTE.ink
      : confidence === 'press'
        ? PALETTE.ink2
        : PALETTE.signal;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width,
        height,
        backgroundImage: `url("${badgeFrame(confidence, width, height)}")`,
        fontFamily: OG_FONT_FAMILY,
        fontSize: size,
        fontWeight: 600,
        letterSpacing: '0.05em',
        color
      }}
    >
      {label}
    </div>
  );
}

/** Olcu cetveli rayi — sayfanin imza motifi, gorselde de var. */
export function MeasureRailImage({height}: {height: number}) {
  const tick = 20;
  const count = Math.floor(height / tick);

  return (
    <div
      style={{
        position: 'absolute',
        left: 56,
        top: 0,
        bottom: 0,
        width: 26,
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${PALETTE.rule}`
      }}
    >
      {Array.from({length: count}, (_, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            height: tick,
            width: index % 5 === 0 ? 26 : 10,
            alignSelf: 'flex-end',
            borderTop: `1px solid ${
              index % 5 === 0 ? PALETTE.ink2 : PALETTE.rule
            }`
          }}
        />
      ))}
    </div>
  );
}
