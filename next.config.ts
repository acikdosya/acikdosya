import createNextIntlPlugin from 'next-intl/plugin';
import type {NextConfig} from 'next';

/**
 * Olcum sunucusunun konteyner agindaki adresi. Tarayici bu adresi hic
 * gormez: /veri altindaki her istek burada, sunucu tarafinda vekillenir.
 *
 * Derleme zamaninda okunur (yeniden yazimlar rota manifestine gomulur),
 * yani degistirmek imajin yeniden derlenmesini ister.
 */
const ANALYTICS_ORIGIN =
  process.env.UMAMI_INTERNAL_URL ?? 'http://umami:3000';

const nextConfig: NextConfig = {
  /*
   * Docker imaji icin: .next/standalone altina kendi node_modules'unu
   * tasiyan bir sunucu cikar. Statik disa aktarim (output: 'export')
   * kullanilamaz — proxy.ts'teki next-intl ara katmani dil yonlendirmesini
   * istek aninda yapiyor, o da Node calisma zamani gerektiriyor.
   */
  output: 'standalone',

  /*
   * Olcum kendi origin'imizden gecer.
   *
   * Ucuncu taraf script'i yok: script.js de olay ucu de acikdosya.org
   * uzerinden servis edilir, ziyaretcinin IP adresi baska bir sunucuya
   * gitmez. Fontlari da tam bu gerekceyle self-host ediyoruz (CLAUDE.md §4).
   *
   * Umami konteyneri disariya port acmiyor; yalnizca uygulama konteyneri
   * onunla ayni docker aginda ve yalnizca bu yeniden yazim uzerinden
   * erisiyor. Yonetim arayuzu (127.0.0.1:3004) ssh tuneliyle aciliyor,
   * internete kapali.
   *
   * proxy.ts eslestiricisinden /veri disarida birakildi: ara katman onu
   * /tr/veri altina yazsaydi istek Umami'ye hic ulasmazdi.
   */
  async rewrites() {
    return [
      {
        source: '/veri/:path*',
        destination: `${ANALYTICS_ORIGIN}/:path*`
      }
    ];
  },

  /*
   * Harita paketinin onbellek omru.
   *
   * Arsiv adi yapi tarihini tasiyor (turkiye-20260910.pmtiles), yani
   * icerik degisince adres de degisiyor — immutable burada dogru bir
   * iddia. Stil dosyasinin adi sabit ve arsiv adini o gosteriyor, bu
   * yuzden kisa omurlu: yeni paket bir sonraki ziyarette devreye girsin.
   * Glif ve sprite commit'e sabitli ama adlari sabit, ortada bir hafta.
   *
   * Basliklar burada duruyor ki kenar vekile dokunmak gerekmesin
   * (CLAUDE.md §11). nginx veya Caddy onune ayni degerleri koymak
   * isteyen icin ornekler deploy/nginx/acikdosya.org.conf sonunda.
   */
  async headers() {
    return [
      {
        source: '/tiles/:file*.pmtiles',
        headers: [
          {key: 'Cache-Control', value: 'public, max-age=31536000, immutable'}
        ]
      },
      {
        source: '/tiles/style.json',
        headers: [{key: 'Cache-Control', value: 'public, max-age=300'}]
      },
      {
        source: '/tiles/fonts/:path*',
        headers: [{key: 'Cache-Control', value: 'public, max-age=604800'}]
      },
      {
        source: '/tiles/sprites/:path*',
        headers: [{key: 'Cache-Control', value: 'public, max-age=604800'}]
      }
    ];
  }
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
