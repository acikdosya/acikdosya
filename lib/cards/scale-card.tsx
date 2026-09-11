import type {Locale} from '@/i18n/routing';
import {
  layoutScaleCard,
  type ScaleCardBox,
  type ScaleCardRow
} from '@/components/scale-silhouette/card-geometry';
import {HUMAN_HEIGHT_M} from '@/components/scale-silhouette/geometry';
import {formatDate, formatNumber, formatValue, SPEC_UNITS} from '../format';
import type {Confidence, SpecKey} from '../schema';
import {PALETTE} from '../tokens';
import {
  CardBadge,
  CardFrame,
  CARD_SCALE,
  FOOT_HEIGHT,
  HEAD_HEIGHT
} from './frame';
import {CARD_SIZE, type CardFormat} from './params';
import type {Translator} from './render';
import type {ScaleCard, ScaleRow} from './scale';
import {templateKey} from './templates';

/*
 * Bu dosya bir sayfa degil, PNG govdesi uretiyor: satori yalnizca <img>
 * okur ve next/image'in yaptigi is (boyutlandirma, tembel yukleme,
 * srcset) burada karsiliksiz.
 */
/* eslint-disable @next/next/no-img-element */

/**
 * Olcek karsilastirmasi karti — CLAUDE.md §9.
 *
 * Cizim sayfadaki semayla AYNI parca listesinden turer; iki katman
 * ayrisamaz. Kart olcekli bir teknik cizim DEGILDIR, bu yuzden ust
 * seritte "sematik" etiketi zorunlu durur.
 *
 * Satirlarin rengi dayandigi olcunun guven seviyesini yansitir; deseni
 * satirin rozeti tasir (§4).
 *
 * Iki bicim iki YERLESIM: yatayda etiket cizimin solunda, dikeyde
 * ustunde. Dikeyde de solda tutmak, zaten dar olan tuvalin ucte birini
 * yazi sutununa verip cizimi kuculturdu.
 */

const OUTLINE: Record<Confidence, string> = {
  official: PALETTE.ink,
  press: PALETTE.ink2,
  estimate: PALETTE.signal
};

/** Insan figurune ayrilan sutun — yatayda solda, dikeyde altta. */
const HUMAN_COLUMN = 96;
/** Yatayda satirin solundaki ad, olcu ve rozet sutunu. */
const LABEL_COLUMN = 270;
/** Etiket ile cizim arasi. */
const LABEL_GAP = 22;
/** Dikeyde cizimin ustundeki etiket blogu ve altindaki bosluk. */
const LABEL_BLOCK = 104;
const LABEL_BLOCK_GAP = 12;
/** Dikeyde alttaki insan figuru seridi: figur, etiket ve bosluk. */
const HUMAN_STRIP = 130;

export function ScaleCardImage({
  card,
  format,
  locale,
  domain,
  labels,
  t,
  tSpec,
  tScale
}: {
  card: ScaleCard;
  format: CardFormat;
  locale: Locale;
  domain: string;
  labels: Record<Confidence, string>;
  t: Translator;
  tSpec: Translator;
  tScale: Translator;
}) {
  const scale = CARD_SCALE[format];
  const vertical = format === 'dikey';
  const size = CARD_SIZE[format];

  const body = {
    width: size.width - scale.pad * 2,
    height:
      size.height -
      HEAD_HEIGHT -
      FOOT_HEIGHT -
      scale.body.top -
      scale.body.bottom
  };

  /*
   * Cizime kalan kutu. Yatayda insan ve etiket sutunlari genislikten,
   * dikeyde etiket bloklari ve alttaki insan seridi yukseklikten
   * dusuluyor. Yerlesim bu kutuyu alir ve butun satirlarin paylastigi
   * metre carpanini kendisi bulur.
   */
  const box: ScaleCardBox = vertical
    ? {
        width: body.width,
        height:
          body.height -
          (LABEL_BLOCK + LABEL_BLOCK_GAP) * card.rows.length -
          HUMAN_STRIP,
        rowGap: 24,
        minRow: 24,
        rulerGap: 12,
        rulerHeight: 10
      }
    : {
        width: body.width - HUMAN_COLUMN - 28 - LABEL_COLUMN - LABEL_GAP,
        height: body.height,
        rowGap: 14,
        minRow: 96,
        rulerGap: 12,
        rulerHeight: 10
      };

  const layout = layoutScaleCard(
    card.rows.map((row) => row.item),
    box,
    {
      row: (index) => OUTLINE[card.rows[index].dominant.measurement.confidence],
      rule: PALETTE.ink2
    }
  );
  if (!layout) return null;

  const named = (key: SpecKey, value: string) =>
    `${tSpec(key)} ${value} ${SPEC_UNITS[key]}`;

  /** Ad, iki olcu ve rozet. Iki yerlesimde de ayni sira. */
  const labelBlock = (row: ScaleRow, drawing: ScaleCardRow) => {
    const {measurement} = row.dominant;

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          width: vertical ? '100%' : LABEL_COLUMN,
          flex: 'none',
          minWidth: 0
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: vertical ? 28 : 24,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {row.system.name[locale]}
        </div>
        {[
          named(row.dominant.key, formatValue(measurement, locale)),
          named(
            row.secondary.key,
            formatValue(row.secondary.measurement, locale)
          )
        ].map((line) => (
          <div
            key={line}
            style={{
              display: 'flex',
              fontSize: vertical ? 21 : 19,
              color: PALETTE.ink2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {line}
          </div>
        ))}
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <CardBadge
            confidences={[measurement.confidence]}
            labels={labels}
            size={17}
          />
          {/*
            Dis hat normal durum; isaretlenmesi gereken onun YOKLUGU.
            Parca listesi olmayan sistemde cizilen sey bir sinir
            kutusudur ve satir bunu soyler.
          */}
          {drawing.outlined ? null : (
            <div
              style={{
                display: 'flex',
                fontSize: 17,
                color: PALETTE.signal,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {t('envelope')}
            </div>
          )}
        </div>
      </div>
    );
  };

  const human = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 10,
        width: HUMAN_COLUMN,
        flex: 'none',
        ...(vertical
          ? {}
          : {paddingRight: 20, borderRight: `1px solid ${PALETTE.rule}`})
      }}
    >
      <img
        src={layout.human.src}
        width={layout.human.width}
        height={layout.human.height}
        alt=""
      />
      <div style={{display: 'flex', fontSize: 19, color: PALETTE.ink2}}>
        {tScale('humanLabel', {height: formatNumber(HUMAN_HEIGHT_M, locale)})}
      </div>
    </div>
  );

  /** Cetvel: cizgi ve altinda metre etiketleri, cizimle ayni hizada. */
  const ruler = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: layout.ruler.width
      }}
    >
      <img
        src={layout.ruler.src}
        width={layout.ruler.width}
        height={layout.ruler.height}
        alt=""
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: 6
        }}
      >
        {layout.ruler.labels.map((value, index) => (
          <div
            key={value}
            style={{display: 'flex', fontSize: 17, color: PALETTE.ink2}}
          >
            {index === layout.ruler.labels.length - 1
              ? tScale('lengthLabel', {value: formatNumber(value, locale)})
              : formatNumber(value, locale)}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <CardFrame
      format={format}
      title={t(templateKey('olcek'))}
      label={t('schematic')}
      domain={domain}
      meta={[t('dataDate', {date: formatDate(card.verifiedAt, locale)})]}
      badge={
        <CardBadge
          confidences={card.confidences}
          labels={labels}
          size={scale.chip}
        />
      }
    >
      {vertical ? (
        <div
          style={{
            display: 'flex',
            flex: 1,
            minHeight: 0,
            flexDirection: 'column',
            justifyContent: 'center',
            gap: box.rowGap
          }}
        >
          {card.rows.map((row, index) => (
            <div
              key={row.system.slug}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: LABEL_BLOCK_GAP
              }}
            >
              {labelBlock(row, layout.rows[index])}
              <img
                src={layout.rows[index].src}
                width={layout.rows[index].width}
                height={layout.rows[index].height}
                alt=""
              />
            </div>
          ))}

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 28,
              marginTop: box.rulerGap
            }}
          >
            {human}
            {ruler}
          </div>
        </div>
      ) : (
        <div style={{display: 'flex', flex: 1, minHeight: 0, gap: 28}}>
          {human}

          <div
            style={{
              display: 'flex',
              flex: 1,
              minWidth: 0,
              flexDirection: 'column',
              justifyContent: 'center',
              gap: box.rowGap
            }}
          >
            {card.rows.map((row, index) => (
              <div
                key={row.system.slug}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: LABEL_GAP,
                  height: Math.max(layout.rows[index].height, box.minRow)
                }}
              >
                {labelBlock(row, layout.rows[index])}
                <div style={{display: 'flex', flex: 1, minWidth: 0}}>
                  <img
                    src={layout.rows[index].src}
                    width={layout.rows[index].width}
                    height={layout.rows[index].height}
                    alt=""
                  />
                </div>
              </div>
            ))}

            <div
              style={{
                display: 'flex',
                marginTop: layout.ruler.height + box.rulerGap,
                paddingLeft: LABEL_COLUMN + LABEL_GAP
              }}
            >
              {ruler}
            </div>
          </div>
        </div>
      )}
    </CardFrame>
  );
}
