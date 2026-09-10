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
 * Harita yapilandirmasi tek noktada.
 *
 * Stil kendi paketimizden geliyor: scripts/build-tiles.mjs public/tiles
 * altina PMTiles arsivini, stili, glifleri ve sprite'i yaziyor. Ziyaretcinin
 * tarayicisi harita icin disariya tek istek yapmaz — CLAUDE.md §6.
 *
 * Env degiskeni yerelde kacis yolu olarak duruyor: paketi henuz uretmemis
 * bir gelistirici NEXT_PUBLIC_MAP_STYLE_URL ile baska bir stile bakabilir.
 * Yayinda bos birakilir.
 */
export const MAP_STYLE_URL =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? '/tiles/style.json';

/**
 * Altlik harita kaynaklari — altbilgide gorunen liste.
 *
 * Haritanin kendi kontrolundeki atif buradan GELMEZ: o, stil dosyasindaki
 * kaynak tanimindan gelir (scripts/build-tiles.mjs). Atif boylece paketle
 * birlikte tasinir; stil nereye giderse ODbL yukumlulugu de oraya gider.
 * Buradaki liste ayni bilgiyi sayfanin altinda, gercek bag ogeleriyle verir.
 */
export const MAP_SOURCES: readonly {label: string; url?: string}[] = [
  {label: 'Protomaps', url: 'https://protomaps.com'},
  {
    label: '© OpenStreetMap katkıcıları',
    url: 'https://www.openstreetmap.org/copyright'
  }
];

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
