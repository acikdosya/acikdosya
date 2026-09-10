/**
 * Sitenin mutlak adresi — metadata ve hreflang icin gerekli.
 * Deploy ortaminda NEXT_PUBLIC_SITE_URL ile ezilir.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

/**
 * Duzeltme ve iletisim adresi. Kanal yayimda: info@acikdosya.org.
 *
 * Varsayilan burada duruyor ki adres yerelde de, derleme argumani
 * gecilmeyen bir imajda da gorunsun. NEXT_PUBLIC_CONTACT_EMAIL ile ezilir.
 *
 * ?? degil || kullaniliyor: build arg gecilmediginde degisken bos DIZE
 * olarak geliyor, ?? bos dizeyi yakalamaz ve hakkinda sayfasi adresi
 * kaybederdi. Uydurma adres yazilmaz (CLAUDE.md §5.7) — buradaki adres
 * gercek ve yayimlanmis olandir.
 */
export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'info@acikdosya.org';

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

/**
 * Olcum — kendi sunucumuzdaki Umami.
 *
 * Kimlik derleme zamaninda gomulur; verilmezse tarayici script'i hic
 * basilmaz. Yerelde ve derleme argumani gecilmemis imajda olcum kapalidir,
 * kapatmak icin ayri bir bayrak yok.
 */
export const ANALYTICS_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_ID || '';

/**
 * Script ve olay ucu kendi origin'imizden gecer. next.config.ts bu yolu
 * konteyner agindaki Umami'ye yeniden yaziyor; ziyaretcinin tarayicisi
 * disariya tek bir istek yapmaz.
 */
export const ANALYTICS_BASE_PATH = '/veri';

export const ANALYTICS_SCRIPT_URL = `${ANALYTICS_BASE_PATH}/script.js`;

/**
 * Umami olay ucunu data-host-url'e ekledigi "/api/send" ile kurar. Yol
 * onekimiz oldugu icin mutlak adres veriyoruz: script kendi src'sinden
 * turetseydi /veri oneki dusup istek 404 olurdu.
 */
export const ANALYTICS_HOST_URL = new URL(
  ANALYTICS_BASE_PATH,
  SITE_URL
).toString();
