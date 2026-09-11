import {getTranslations} from 'next-intl/server';
import {
  parseFormat,
  parseGroup,
  parseSpecKey,
  parseSystem
} from '@/lib/cards/params';
import {
  cardDomain,
  cardLocale,
  cardNotFound,
  confidenceLabels,
  renderCard,
  type Translator
} from '@/lib/cards/render';
import {valueScope} from '@/lib/cards/value-scope';
import {ValueScopeCardImage} from '@/lib/cards/value-scope-card';

/**
 * Deger ve kapsami karti — rota katmani.
 *
 * Cizim lib/cards/value-scope-card.tsx icinde; burasi sorguyu cozer ve
 * veriyi bulur. Durum adi hesaptan gelir, elle etiketlenmez — karar
 * lib/cards/value-scope.ts icinde.
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

  const key = parseSpecKey(query.get('alan'));
  if (!key) return cardNotFound();

  const group = parseGroup(system, query.get('varyant'), key);
  if (!group) return cardNotFound();

  const card = valueScope(system, group, key);
  if (!card) return cardNotFound();

  const [t, tSpec, tDivergence, labels] = await Promise.all([
    getTranslations({locale, namespace: 'Card'}),
    getTranslations({locale, namespace: 'Specs'}),
    getTranslations({locale, namespace: 'Divergence'}),
    confidenceLabels(locale)
  ]);

  return renderCard(
    format,
    <ValueScopeCardImage
      card={card}
      format={format}
      locale={locale}
      domain={cardDomain()}
      labels={labels}
      t={t as Translator}
      tSpec={tSpec as Translator}
      tDivergence={tDivergence as Translator}
    />
  );
}
