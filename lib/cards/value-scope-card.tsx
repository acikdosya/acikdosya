import type {Locale} from '@/i18n/routing';
import {formatDate, formatValue} from '../format';
import {KIND_MESSAGE_KEY} from '../measurement/labels';
import type {Confidence, Measurement} from '../schema';
import {PALETTE} from '../tokens';
import {CardBadge, CardFrame, CARD_SCALE} from './frame';
import type {CardFormat} from './params';
import type {Translator} from './render';
import {templateKey} from './templates';
import type {ValueScopeCard} from './value-scope';

/**
 * Deger ve kapsami karti — CLAUDE.md §3.
 *
 * BASLIK DILI NOTRDUR: kart celiski iddia etmez, olcum kosulunun degerle
 * birlikte okunmasi gerektigini soyler. Durum adi elle yazilmaz, iraksama
 * hesabindan gelir ve hesap 'celiski' dedigi zaman kart da oyle yazar.
 * Bugunku veride ikisi de var — AKINCI uzunlugu celiski, TAYFUN menzili
 * farkli kapsam.
 */

/**
 * Kolon cercevesi guven durumunu YANSITIR ama tek tasiyici degildir:
 * desen kolonun icindeki rozette durur (§4).
 */
const COLUMN: Record<Confidence, {border: string; background: string}> = {
  official: {border: PALETTE.ink, background: PALETTE.ground},
  press: {border: PALETTE.rule, background: PALETTE.ground},
  estimate: {border: PALETTE.signal, background: 'rgba(179,19,27,0.09)'}
};

const VALUE_COLOR: Record<Confidence, string> = {
  official: PALETTE.ink,
  press: PALETTE.ink2,
  estimate: PALETTE.signal
};

export function ValueScopeCardImage({
  card,
  format,
  locale,
  domain,
  labels,
  t,
  tSpec,
  tDivergence
}: {
  card: ValueScopeCard;
  format: CardFormat;
  locale: Locale;
  domain: string;
  labels: Record<Confidence, string>;
  t: Translator;
  tSpec: Translator;
  tDivergence: Translator;
}) {
  const scale = CARD_SCALE[format];
  const vertical = format === 'dikey';

  const heading =
    card.scopeCount > 1
      ? t('scopeHeadingMany', {
          values: card.columns.length,
          scopes: card.scopeCount
        })
      : t('scopeHeadingOne', {values: card.columns.length});

  const scopeOf = (measurement: Measurement) =>
    measurement.scope
      ? tDivergence(`scope_${measurement.scope}`)
      : t('scopeUnstated');

  const column = (measurement: Measurement, index: number) => {
    const skin = COLUMN[measurement.confidence];
    const value = `${formatValue(measurement, locale)} ${card.unit}`;

    return (
      <div
        key={`${measurement.source.tr}-${index}`}
        style={{
          display: 'flex',
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          flexDirection: vertical ? 'row' : 'column',
          alignItems: vertical ? 'center' : 'stretch',
          gap: vertical ? 26 : 10,
          border: `1px solid ${skin.border}`,
          background: skin.background,
          padding: vertical ? '24px 26px' : 20
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: vertical ? 6 : 10,
            flex: 1,
            minWidth: 0,
            minHeight: 0
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: vertical ? 24 : 19,
              color:
                measurement.confidence === 'estimate'
                  ? PALETTE.signal
                  : PALETTE.ink2
            }}
          >
            {scopeOf(measurement)}
          </div>
          {vertical ? null : (
            <div
              style={{
                display: 'flex',
                fontSize: card.columns.length > 2 ? 56 : 64,
                fontWeight: 600,
                letterSpacing: '-0.03em',
                lineHeight: 1,
                color: VALUE_COLOR[measurement.confidence]
              }}
            >
              {value}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              fontSize: vertical ? 26 : 20,
              lineHeight: 1.35,
              color: VALUE_COLOR[measurement.confidence],
              lineClamp: 2
            }}
          >
            {measurement.context_note
              ? `${measurement.source[locale]} · ${measurement.context_note[locale]}`
              : measurement.source[locale]}
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: vertical ? 6 : 'auto',
              paddingTop: vertical ? 0 : 10
            }}
          >
            <CardBadge
              confidences={[measurement.confidence]}
              labels={labels}
              size={vertical ? 22 : 19}
            />
          </div>
        </div>
        {vertical ? (
          <div
            style={{
              display: 'flex',
              flex: 'none',
              fontSize: 72,
              fontWeight: 600,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              color: VALUE_COLOR[measurement.confidence]
            }}
          >
            {value}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <CardFrame
      format={format}
      title={t(templateKey('deger-kapsam'))}
      subject={`${card.system.name[locale]} · ${tSpec(card.key)}`}
      domain={domain}
      meta={[
        t('dataDate', {date: formatDate(card.verifiedAt, locale)}),
        ...(card.kind
          ? [
              t('computed', {
                state: tDivergence(`kind_${KIND_MESSAGE_KEY[card.kind]}`)
              })
            ]
          : [])
      ]}
      badge={
        <CardBadge
          confidences={card.confidences}
          labels={labels}
          size={scale.chip}
        />
      }
    >
      <div
        style={{
          display: 'flex',
          flex: 'none',
          height: vertical ? 200 : 96,
          overflow: 'hidden',
          fontSize: vertical ? 48 : 34,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          lineHeight: 1.24,
          lineClamp: vertical ? 4 : 2
        }}
      >
        {heading}
      </div>

      <div
        style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          flexDirection: vertical ? 'column' : 'row',
          gap: vertical ? 18 : 16
        }}
      >
        {card.columns.map(column)}
      </div>
    </CardFrame>
  );
}
