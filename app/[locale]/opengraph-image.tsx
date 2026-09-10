import {ImageResponse} from 'next/og';
import {getTranslations} from 'next-intl/server';
import {
  BrandLockupImage,
  MeasureRailImage,
  OgBadge,
  OG_FONT_FAMILY,
  OG_SIZE,
  loadOgFonts
} from '@/lib/og';
import {routing} from '@/i18n/routing';
import type {Confidence} from '@/lib/schema';
import {PALETTE} from '@/lib/tokens';

/**
 * Ana sayfanin ve metin sayfalarinin paylasim gorseli.
 *
 * Fotograf yok, sematik dil suruyor. Gorselin tasidigi tek iddia
 * yontem: uc guven durumu, rozetleriyle. Sayi gostermiyor, cunku
 * gosterecegi sayinin kaynagi da gorsele sigmaz.
 */
export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Açık Dosya';

const LEVELS: readonly Confidence[] = ['official', 'press', 'estimate'];

/* Iki dilin gorseli de build'de uretilsin — istek aninda uretilirse ilk
   paylasimda onbellek bos oluyor ve onizleme gec geliyor. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function OpengraphImage({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  const [fonts, t, tConfidence] = await Promise.all([
    loadOgFonts(),
    getTranslations({locale, namespace: 'Site'}),
    getTranslations({locale, namespace: 'Confidence'})
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          background: PALETTE.ground,
          padding: '64px 72px',
          fontFamily: OG_FONT_FAMILY
        }}
      >
        <MeasureRailImage height={OG_SIZE.height} />

        <div style={{display: 'flex', paddingLeft: 96}}>
          <BrandLockupImage size={56} />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 32,
            paddingLeft: 96
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 52,
              fontWeight: 600,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: PALETTE.ink,
              maxWidth: 900
            }}
          >
            {t('tagline')}
          </div>

          <div style={{display: 'flex', gap: 16}}>
            {LEVELS.map((level) => (
              <OgBadge
                key={level}
                confidence={level}
                label={tConfidence(level)}
                size={26}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    {...size, fonts}
  );
}
