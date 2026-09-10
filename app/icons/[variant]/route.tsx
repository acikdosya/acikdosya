import {ImageResponse} from 'next/og';
import {BrandSymbol} from '@/lib/og';
import {PALETTE} from '@/lib/tokens';

/**
 * Uygulama ikonlari — CLAUDE.md §10.
 *
 * Kendi rota adresleri var cunku manifest.webmanifest sabit bir adres
 * bekliyor; app/icon.tsx'in urettigi adresler surum karmasi tasiyor.
 *
 *   192, 512  magaza ve ana ekran ikonu, sembol tuvalin %60'i
 *   maskable  Android adaptive on katmani. 108 dp tuvalde sembol 46 dp,
 *             yani %42,6 — her maske biciminde 66 dp guvenli alanin
 *             icinde kalir. Zemin tuvali doldurur, maske kirpar.
 */
const VARIANTS = {
  '192': {size: 192, ratio: 0.6},
  '512': {size: 512, ratio: 0.6},
  maskable: {size: 512, ratio: 46 / 108}
} as const;

type Variant = keyof typeof VARIANTS;

export const dynamic = 'force-static';

export function generateStaticParams() {
  return Object.keys(VARIANTS).map((variant) => ({variant}));
}

export async function GET(
  _request: Request,
  {params}: {params: Promise<{variant: string}>}
) {
  const {variant} = await params;
  const config = VARIANTS[variant as Variant];
  if (!config) return new Response('Not found', {status: 404});

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
        <BrandSymbol size={config.size * config.ratio} />
      </div>
    ),
    {width: config.size, height: config.size}
  );
}
