/**
 * Sitenin mutlak adresi — metadata ve hreflang icin gerekli.
 * Deploy ortaminda NEXT_PUBLIC_SITE_URL ile ezilir.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/**
 * Duzeltme ve iletisim adresi.
 *
 * Tanimli degilse hakkinda sayfasi kanalin henuz yayimlanmadigini soyler —
 * uydurma bir adres yazilmaz (CLAUDE.md §5.7). Deploy ortaminda
 * NEXT_PUBLIC_CONTACT_EMAIL ile verilir.
 */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

/**
 * Harita yapilandirmasi tek noktada. Simdilik MapLibre demo tile'lari;
 * kendi PMTiles'imiza gecerken sadece burasi degisecek.
 */
export const MAP_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
  'https://demotiles.maplibre.org/style.json';

/**
 * Altlik harita kaynaklari. MapLibre demo tile'lari kendi TileJSON'unda bos
 * attribution gonderiyor, oysa veri Natural Earth ve OpenStreetMap kaynakli;
 * OSM verisi ODbL geregi atif ister. Bu yuzden atfi biz veriyoruz.
 *
 * Dizi olarak duruyor cunku atif iki yerde gorunuyor: haritanin kendi
 * kontrolunde ve sayfa altbilgisinde. Altbilgi gercek <a> ogeleri
 * uretebilsin diye HTML dizesi degil veri tutuluyor; dize asagida bu
 * diziden turetiliyor. Kendi PMTiles'imiza gecerken yalnizca burasi degisir.
 */
export const MAP_SOURCES: readonly {label: string; url?: string}[] = [
  {label: 'MapLibre demo tiles', url: 'https://github.com/maplibre/demotiles'},
  {label: 'Natural Earth'},
  {
    label: '© OpenStreetMap',
    url: 'https://www.openstreetmap.org/copyright'
  }
];

/** MapLibre attributionControl HTML bekliyor. */
export const MAP_ATTRIBUTION = MAP_SOURCES.map((source) =>
  source.url
    ? `<a href="${source.url}" rel="nofollow noopener">${source.label}</a>`
    : source.label
).join(' · ');

/** Referans noktanin baslangic konumu — Anadolu'nun cografi ortasi. */
export const MAP_DEFAULT_CENTER: [number, number] = [35.2, 39.0];

export const MAP_DEFAULT_ZOOM = 4.1;
