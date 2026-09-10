/**
 * Sitenin mutlak adresi — metadata ve hreflang icin gerekli.
 * Deploy ortaminda NEXT_PUBLIC_SITE_URL ile ezilir.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/**
 * Harita yapilandirmasi tek noktada. Simdilik MapLibre demo tile'lari;
 * kendi PMTiles'imiza gecerken sadece burasi degisecek.
 */
export const MAP_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ??
  'https://demotiles.maplibre.org/style.json';

/**
 * Altlik harita atfi. MapLibre demo tile'lari kendi TileJSON'unda bos
 * attribution gonderiyor, oysa veri Natural Earth ve OpenStreetMap kaynakli;
 * OSM verisi ODbL geregi atif ister. Bu yuzden atfi biz veriyoruz.
 * Kendi PMTiles'imiza gecerken bu metin de degisecek.
 */
export const MAP_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ??
  '<a href="https://github.com/maplibre/demotiles" rel="nofollow noopener">MapLibre demo tiles</a> · Natural Earth · © <a href="https://www.openstreetmap.org/copyright" rel="nofollow noopener">OpenStreetMap</a>';

/** Referans noktanin baslangic konumu — Anadolu'nun cografi ortasi. */
export const MAP_DEFAULT_CENTER: [number, number] = [35.2, 39.0];

export const MAP_DEFAULT_ZOOM = 4.1;
