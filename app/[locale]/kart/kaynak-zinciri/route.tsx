import {getTranslations} from 'next-intl/server';
import {parseFormat, parseSystem} from '@/lib/cards/params';
import {
  cardDomain,
  cardLocale,
  cardNotFound,
  confidenceLabels,
  renderCard,
  type Translator
} from '@/lib/cards/render';
import {sourceChain} from '@/lib/cards/source-chain';
import {SourceChainCardImage} from '@/lib/cards/source-chain-card';

/**
 * Kaynak zinciri karti — rota katmani.
 *
 * Zincirin kendisi lib/cards/source-chain.ts icinde cikariliyor, cizim
 * lib/cards/source-chain-card.tsx icinde. Bilinmeyen bir kaynak kimligi
 * kart uretmez: varsayilan bir belgeye dusmek, kartin anlattigi seyi
 * degistirirdi.
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

  const system = parseSystem(query.get('sistem'));
  if (!system) return cardNotFound();

  const card = sourceChain(system, query.get('kaynak'));
  if (!card) return cardNotFound();

  const [t, tSpec, labels] = await Promise.all([
    getTranslations({locale, namespace: 'Card'}),
    getTranslations({locale, namespace: 'Specs'}),
    confidenceLabels(locale)
  ]);

  return renderCard(
    format,
    <SourceChainCardImage
      card={card}
      format={format}
      locale={locale}
      domain={cardDomain()}
      labels={labels}
      t={t as Translator}
      tSpec={tSpec as Translator}
    />
  );
}
