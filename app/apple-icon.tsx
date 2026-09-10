import {ImageResponse} from 'next/og';
import {BrandSymbol} from '@/lib/og';
import {PALETTE} from '@/lib/tokens';

/**
 * iOS ana ekran ikonu. Apple kendi maskesini uyguladigi icin kose
 * yuvarlatma yok ve zemin seffaf birakilmiyor.
 * Sembol tuvalin %60'i, ortalanmis — §10.
 */
export const size = {width: 180, height: 180};
export const contentType = 'image/png';

export default async function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          background: PALETTE.paper
        }}
      >
        <BrandSymbol size={size.width * 0.6} />
      </div>
    ),
    size
  );
}
