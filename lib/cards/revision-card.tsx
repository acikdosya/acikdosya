import type {Locale} from '@/i18n/routing';
import {formatDate, formatRevisionValue} from '../format';
import {OG_SERIF_FAMILY} from '../og';
import {PALETTE} from '../tokens';
import {CardFrame, CardLabel, CARD_SCALE} from './frame';
import type {CardFormat} from './params';
import type {Translator} from './render';
import type {Revision} from '../schema';
import {revisionField, type RevisionCard} from './revision';
import {templateKey} from './templates';

/**
 * Duzeltme kaydi karti — CLAUDE.md §3.
 *
 * Ton sakin: ne ozur ne zafer. Iki deger esit agirlikta durur, eskisi
 * ustu cizili. Guven rozeti YOK; duzeltme kaydi bir olcum degildir, alt
 * seritte onun yerine cercevesiz bir etiket durur.
 */
export function RevisionCardImage({
  card,
  format,
  locale,
  domain,
  t,
  tSpec,
  tAttribute,
  tLog
}: {
  card: RevisionCard;
  format: CardFormat;
  locale: Locale;
  domain: string;
  t: Translator;
  tSpec: Translator;
  tAttribute: Translator;
  tLog: Translator;
}) {
  const {revision} = card;
  const field = revisionField(revision.field);
  const fieldLabel =
    field.kind === 'spec'
      ? tSpec(field.key)
      : field.kind === 'attribute'
        ? tAttribute(field.key)
        : field.value;

  const scale = CARD_SCALE[format];
  const vertical = format === 'dikey';
  const label = vertical ? 24 : 19;
  const value = vertical ? 52 : 44;
  const reason = vertical ? 30 : 25;

  /**
   * Kaldirma kaydinin etiketi ceviri paketinden gelir; bicimlendirme
   * katmani bir dize uydurmaz (lib/format.ts formatRevisionValue).
   */
  const valueText = (value: Revision['from']) =>
    formatRevisionValue(value, locale) ?? tLog('removed');

  const row = (key: string, caption: string, text: string, struck: boolean) => (
    <div
      key={key}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        border: `1px solid ${PALETTE.rule}`,
        background: PALETTE.ground,
        padding: vertical ? '22px 24px' : '18px 20px'
      }}
    >
      <div
        style={{
          display: 'flex',
          width: vertical ? 130 : 104,
          flex: 'none',
          fontSize: label,
          color: PALETTE.ink2
        }}
      >
        {caption}
      </div>
      <div
        style={{
          display: 'flex',
          flex: 1,
          minWidth: 0,
          fontSize: value,
          fontWeight: 600,
          letterSpacing: '-0.03em',
          color: struck ? PALETTE.ink2 : PALETTE.ink,
          textDecoration: struck ? 'line-through' : 'none',
          lineHeight: 1.15,
          /*
           * Deger iki satira kadar sarar, sonra kirpilir. Tek satirda
           * kirpmak "> 280 km (resmi) ve > 500 km (basin)" gibi bir
           * kaydin yarisini goturuyordu; kartin konusu tam olarak o
           * kayit.
           */
          lineClamp: 2
        }}
      >
        {text}
      </div>
    </div>
  );

  return (
    <CardFrame
      format={format}
      title={t(templateKey('duzeltme'))}
      subject={`${card.system.name[locale]} · ${fieldLabel}`}
      domain={domain}
      meta={[
        t('correctionDate', {date: formatDate(revision.date, locale)}),
        t('revisionCount', {count: card.total})
      ]}
      badge={<CardLabel label={t('recordLabel')} size={scale.chip} />}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: vertical ? 'column' : 'row',
          flex: 1,
          minHeight: 0,
          gap: 28
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            width: vertical ? '100%' : 560,
            flex: 'none'
          }}
        >
          {row('from', tLog('from'), valueText(revision.from), true)}
          {row('to', tLog('to'), valueText(revision.to), false)}
          <div
            style={{
              display: 'flex',
              gap: 20,
              borderTop: `1px solid ${PALETTE.rule}`,
              paddingTop: 14
            }}
          >
            <div
              style={{
                display: 'flex',
                width: vertical ? 130 : 104,
                flex: 'none',
                fontSize: label,
                color: PALETTE.ink2
              }}
            >
              {t('field')}
            </div>
            <div style={{display: 'flex', fontSize: vertical ? 26 : 22}}>
              {fieldLabel}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            gap: 12,
            borderLeft: vertical ? 'none' : `1px solid ${PALETTE.rule}`,
            borderTop: vertical ? `1px solid ${PALETTE.rule}` : 'none',
            paddingLeft: vertical ? 0 : 28,
            paddingTop: vertical ? 24 : 0
          }}
        >
          <div style={{display: 'flex', fontSize: label, color: PALETTE.ink2}}>
            {t('reason')}
          </div>
          {/*
            Gerekce govde metnidir, bu yuzden serif — sayfadaki ayrimin
            aynisi (§4). Alan sonunda kirpilir, punto kucultulerek
            sigdirilmaz.
          */}
          <div
            style={{
              display: 'flex',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
              fontFamily: OG_SERIF_FAMILY,
              fontWeight: 400,
              fontSize: reason,
              lineHeight: 1.5
            }}
          >
            {revision.reason[locale]}
          </div>
          {revision.source ? (
            <div
              style={{
                display: 'flex',
                gap: 10,
                fontSize: label,
                color: PALETTE.ink2,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              <div style={{display: 'flex'}}>{t('source')}</div>
              <div style={{display: 'flex', color: PALETTE.ink}}>
                {revision.source[locale]}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </CardFrame>
  );
}
