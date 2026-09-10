import type {MetadataRoute} from 'next';
import {PALETTE} from '@/lib/tokens';

/**
 * Web uygulama bildirimi. Ikonlar app/icons/[variant] rotasindan gelir:
 * o adresler sabit, app/icon.tsx'in urettigi adresler surum karmasi tasir.
 *
 * Ad cevrilmez — marka adi TR ve EN'de ayni (§10). Bildirim tek dosya
 * oldugu icin zaten tek dil tasiyabilirdi.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Açık Dosya',
    short_name: 'Açık Dosya',
    description:
      'Türk savunma sanayii sistemlerinin kaynaklı teknik dosyaları.',
    start_url: '/',
    display: 'standalone',
    background_color: PALETTE.ground,
    theme_color: PALETTE.ground,
    icons: [
      {src: '/icons/192', sizes: '192x192', type: 'image/png', purpose: 'any'},
      {src: '/icons/512', sizes: '512x512', type: 'image/png', purpose: 'any'},
      {
        src: '/icons/maskable',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ]
  };
}
