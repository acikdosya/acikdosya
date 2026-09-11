import {getTranslations} from 'next-intl/server';
import {
  parseFormat,
  parseRevisionIndex,
  parseSystem
} from '@/lib/cards/params';
import {
  cardDomain,
  cardLocale,
  cardNotFound,
  renderCard,
  type Translator
} from '@/lib/cards/render';
import {revisionCard} from '@/lib/cards/revision';
import {RevisionCardImage} from '@/lib/cards/revision-card';

/**
 * Duzeltme kaydi karti — rota katmani.
 *
 * Burada yalnizca sorgu cozumu, dil secimi ve yanit var; cizimin kendisi
 * lib/cards/revision-card.tsx icinde. Ayirmanin sebebi sinanabilirlik:
 * rota govdesi next-intl istek baglami olmadan cagrilamaz, gorunum
 * cagrilabilir (lib/cards/cards.test.ts).
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

  const index = parseRevisionIndex(system, query.get('kayit'));
  if (index === undefined) return cardNotFound();

  const card = revisionCard(system, index);
  if (!card) return cardNotFound();

  const [t, tSpec, tAttribute, tLog] = await Promise.all([
    getTranslations({locale, namespace: 'Card'}),
    getTranslations({locale, namespace: 'Specs'}),
    getTranslations({locale, namespace: 'Attributes'}),
    getTranslations({locale, namespace: 'RevisionLog'})
  ]);

  return renderCard(
    format,
    <RevisionCardImage
      card={card}
      format={format}
      locale={locale}
      domain={cardDomain()}
      t={t as Translator}
      tSpec={tSpec as Translator}
      tAttribute={tAttribute as Translator}
      tLog={tLog as Translator}
    />
  );
}
