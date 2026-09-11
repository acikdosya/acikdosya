import {getTranslations} from 'next-intl/server';
import {parseFormat, parseSystems} from '@/lib/cards/params';
import {
  cardDomain,
  cardLocale,
  cardNotFound,
  confidenceLabels,
  renderCard,
  type Translator
} from '@/lib/cards/render';
import {MAX_SYSTEMS, scaleCard} from '@/lib/cards/scale';
import {ScaleCardImage} from '@/lib/cards/scale-card';

/**
 * Olcek karsilastirmasi karti — rota katmani.
 *
 * Cizim ve yerlesim lib/cards/scale-card.tsx icinde; olcek carpani
 * components/scale-silhouette/card-geometry.ts icinde. Burasi yalnizca
 * hangi sistemlerin cizilecegini cozer.
 */

export async function GET(
  request: Request,
  {params}: {params: Promise<{locale: string}>}
) {
  const locale = cardLocale((await params).locale);
  if (!locale) return cardNotFound();

  const query = new URL(request.url).searchParams;

  const format = parseFormat(query.get('format'));
  if (!format) return cardNotFound();

  const systems = parseSystems(query.get('sistem'), MAX_SYSTEMS);
  if (!systems) return cardNotFound();

  const card = scaleCard(systems);
  if (!card) return cardNotFound();

  const [t, tSpec, tScale, labels] = await Promise.all([
    getTranslations({locale, namespace: 'Card'}),
    getTranslations({locale, namespace: 'Specs'}),
    getTranslations({locale, namespace: 'ScaleSilhouette'}),
    confidenceLabels(locale)
  ]);

  return renderCard(
    format,
    <ScaleCardImage
      card={card}
      format={format}
      locale={locale}
      domain={cardDomain()}
      labels={labels}
      t={t as Translator}
      tSpec={tSpec as Translator}
      tScale={tScale as Translator}
    />
  );
}
