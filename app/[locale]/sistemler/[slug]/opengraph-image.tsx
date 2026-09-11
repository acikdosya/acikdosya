import {ImageResponse} from 'next/og';
import {getTranslations} from 'next-intl/server';
import type {Locale} from '@/i18n/routing';
import {getSystem, getSystemSlugs} from '@/lib/content';
import {formatValue, primary, SPEC_UNITS} from '@/lib/format';
import {
  type AircraftDimensions,
  type MissileDimensions,
  selectMeasurements,
  systemKind
} from '@/lib/geometry/measurements';
import {
  aircraftDataUri,
  BrandLockupImage,
  MeasureRailImage,
  OgBadge,
  OG_FONT_FAMILY,
  OG_SIZE,
  loadOgFonts,
  silhouetteDataUri
} from '@/lib/og';
import {partsForSystem} from '@/lib/geometry/parts-for';
import {PALETTE} from '@/lib/tokens';

/**
 * Sistem dosyasinin paylasim gorseli: ad, olcekli siluet, guven rozeti.
 *
 * Siluet sayfadaki cizimle ayni geometri fonksiyonlarindan uretilir; olcu
 * verisi degisince gorsel de degisir. Hedef veya sehir dili yok — §5.
 */
export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = 'Açık Dosya';

/*
 * Siluetin genisligi. 1200x630 tuvalde ad, kunye ve olcu satiri icin yer
 * kaldiktan sonra kalan yukseklige gore secildi; buyutulurse alttaki
 * rozet satiri disari tasar.
 */
const SILHOUETTE_WIDTH = 620;

export function generateStaticParams() {
  return getSystemSlugs().map((slug) => ({slug}));
}

export default async function OpengraphImage({
  params
}: {
  params: Promise<{locale: string; slug: string}>;
}) {
  const {locale, slug} = await params;
  const system = getSystem(slug);
  const lang = locale as Locale;

  const [fonts, tCategory, tConfidence, tSpec] = await Promise.all([
    loadOgFonts(),
    getTranslations({locale, namespace: 'Categories'}),
    getTranslations({locale, namespace: 'Confidence'}),
    getTranslations({locale, namespace: 'Specs'})
  ]);

  if (!system) {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
            background: PALETTE.ground,
            fontFamily: OG_FONT_FAMILY
          }}
        >
          <BrandLockupImage size={72} />
        </div>
      ),
      {...size, fonts}
    );
  }

  const kind = systemKind(system);
  const selections = selectMeasurements(system);

  let silhouette;
  if (kind === 'missile') {
    const items = selections
      .filter((selection) => selection.dimensions.kind === 'missile')
      .map((selection) => {
        const dims = selection.dimensions as MissileDimensions;
        return {
          id: selection.group.id,
          label: selection.group.label,
          lengthM: dims.lengthM,
          diameterMm: dims.diameterMm,
          // Sayfadaki semayla ayni parca listesi, ayni izdusum.
          parts: partsForSystem(system.slug, selection.dimensions)
        };
      });
    silhouette = silhouetteDataUri(items);
  } else {
    const items = selections
      .filter((selection) => selection.dimensions.kind === 'aircraft')
      .map((selection) => {
        const dims = selection.dimensions as AircraftDimensions;
        return {
          id: selection.group.id,
          label: selection.group.label,
          lengthM: dims.lengthM,
          wingspanM: dims.wingspanM,
          heightM: dims.heightM,
          parts: partsForSystem(system.slug, selection.dimensions)
        };
      });
    silhouette = aircraftDataUri(items);
  }

  /*
   * Rozet, cizimin dayandigi olcunun rozeti. Fuzede cizilen sey uzunluk
   * ekseninde bir siluet; ucakta kanat acikligi ekseninde bir zarf. Bu
   * yuzden alan tura gore secilir — altta uzunluk yazip kanat acikligi
   * cizmek, makineye ve okuyucuya ayri sey soylemek olurdu (§5.8).
   */
  const dimensionKey = kind === 'missile' ? 'length_m' : 'wingspan_m';
  const dimensionList = [
    ...(system.specs?.[dimensionKey] ?? []),
    ...system.variants.flatMap((variant) => variant.specs[dimensionKey] ?? [])
  ];
  const dimensionValue =
    dimensionList.length > 0 ? primary(dimensionList) : undefined;

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
          padding: '56px 72px',
          fontFamily: OG_FONT_FAMILY
        }}
      >
        <MeasureRailImage height={OG_SIZE.height} />

        <div style={{display: 'flex', paddingLeft: 96}}>
          <BrandLockupImage size={44} />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            paddingLeft: 96
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 96,
              fontWeight: 600,
              letterSpacing: '-0.035em',
              lineHeight: 1,
              color: PALETTE.ink
            }}
          >
            {system.name[lang]}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              color: PALETTE.ink2,
              letterSpacing: '0.02em'
            }}
          >
            {tCategory(system.category)} · {system.manufacturer.name}
          </div>
        </div>

        {silhouette ? (
          <div style={{display: 'flex', paddingLeft: 96}}>
            <img
              src={silhouette.src}
              width={SILHOUETTE_WIDTH}
              height={(SILHOUETTE_WIDTH / silhouette.width) * silhouette.height}
              alt=""
            />
          </div>
        ) : null}

        {dimensionValue ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              paddingLeft: 96,
              fontSize: 30,
              color: PALETTE.ink
            }}
          >
            <div style={{display: 'flex', color: PALETTE.ink2}}>
              {tSpec(dimensionKey)}
            </div>
            <div style={{display: 'flex'}}>
              {formatValue(dimensionValue, lang)} {SPEC_UNITS[dimensionKey]}
            </div>
            <OgBadge
              confidence={dimensionValue.confidence}
              label={tConfidence(dimensionValue.confidence)}
              size={22}
              width={130}
            />
          </div>
        ) : null}
      </div>
    ),
    {...size, fonts}
  );
}
