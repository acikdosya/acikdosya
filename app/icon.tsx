import {ImageResponse} from 'next/og';
import {BrandSymbol} from '@/lib/og';
import {PALETTE} from '@/lib/tokens';

/**
 * Tarayici sekmesi ikonu — CLAUDE.md §10.
 *
 * 16 ve 32 px, TEK RENK. Bu olcude kirmizi deger blogu uc piksele
 * dusuyor ve renk bilgi tasimayi birakiyor; §10 favicon icin tek renk
 * ve ince detay yok diyor. Tam renkli sembol 192 px ve ustunde
 * (app/icons/[variant]) kullaniliyor.
 *
 * Zemin --paper: seffaf birakilirsa koyu temali sekme cubugunda sembol
 * kayboluyor.
 */
export function generateImageMetadata() {
  return [
    {id: '16', size: {width: 16, height: 16}, contentType: 'image/png'},
    {id: '32', size: {width: 32, height: 32}, contentType: 'image/png'}
  ];
}

export default async function Icon({id}: {id: Promise<string>}) {
  const size = Number(await id);

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          background: PALETTE.paper
        }}
      >
        <BrandSymbol size={size} tone="mono" />
      </div>
    ),
    {width: size, height: size}
  );
}
