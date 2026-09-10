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
  }
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
