import type {Locale} from '@/i18n/routing';
import {formatDate, formatValue, SPEC_UNITS} from '../format';
import type {Confidence} from '../schema';
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
import type {ChainRow, SourceChain} from './source-chain';
import {templateKey} from './templates';

/**
 * Kaynak zinciri karti.
 *
 * Tasarimin omurgasi korundu, YONU ters cevrildi: soldaki satirlar bu
 * dosyadaki degerler, sagdaki kutu hepsinin dayandigi tek belge. Gerekce
 * lib/cards/source-chain.ts icinde — semada bir kaydi baska bir yayina
 * baglayan alan yok ve olmayan bir bag uydurulmaz (§5.7).
 *
 * Okuyucunun gordugu sey ayni: bir kaynak duserse ne kadarinin dustugu.
 */

/** Bir kolona sigan en fazla satir — tasarimin 4'luk izgarasi. */
const COLUMN_ROWS = 4;
/** Iddia metni icin ayrilan sabit yukseklik: iki satir. */
const HEADING_HEIGHT = {yatay: 100, dikey: 140} as const;
/** Satirlar arasi bosluk. */
const ROW_GAP = 10;
/** Dikeyde omurga seridi ve belge kutusunun yuksekligi. */
const SPINE_HEIGHT = 78;
const ORIGIN_HEIGHT = 200;
/** Dikeyde bir satirin en fazla yuksekligi — tek satirlik metin. */
const MAX_ROW_HEIGHT = 110;

/**
 * Satirlari kolonlara ESIT dagitir.
 *
 * Dorderli doldurmak bes kayitta 4 + 1 verir ve tek basina kalan satir
 * kolonu boydan boya kaplardi. Esit dagitim 3 + 2 verir; kutu yuksekligi
 * zaten sabit oldugu icin kisa kolon asagida biter, esnemez.
 */
function spread(rows: readonly ChainRow[], max: number): ChainRow[][] {
  const count = Math.ceil(rows.length / max);
  const perColumn = Math.ceil(rows.length / count);

  const columns: ChainRow[][] = [];
  for (let index = 0; index < rows.length; index += perColumn) {
    columns.push(rows.slice(index, index + perColumn));
  }
  return columns;
}

export function SourceChainCardImage({
  card,
  format,
  locale,
  domain,
  labels,
  t,
  tSpec
}: {
  card: SourceChain;
  format: CardFormat;
  locale: Locale;
  domain: string;
  labels: Record<Confidence, string>;
  t: Translator;
  tSpec: Translator;
}) {
  const scale = CARD_SCALE[format];
  const vertical = format === 'dikey';

  const columns = vertical ? [card.rows] : spread(card.rows, COLUMN_ROWS);

  /*
   * Kutu yuksekligi hesaplanir, esnetilmez: iki kolon farkli sayida
   * satir tasidiginda esneyen kutular iki farkli yukseklik uretirdi ve
   * izgara gorunumu dagilirdi.
   */
  const area =
    CARD_SIZE[format].height -
    HEAD_HEIGHT -
    FOOT_HEIGHT -
    scale.body.top -
    scale.body.bottom -
    HEADING_HEIGHT[format] -
    scale.body.gap -
    /* Dikeyde omurga ve belge kutusu satirlarin ALTINDA duruyor. */
    (vertical ? SPINE_HEIGHT + ORIGIN_HEIGHT : 0);
  const perColumn = Math.max(...columns.map((column) => column.length));
  const rowHeight = Math.min(
    Math.floor((area - ROW_GAP * (perColumn - 1)) / perColumn),
    vertical ? MAX_ROW_HEIGHT : Infinity
  );

  const entry = ({key, measurement}: ChainRow, index: number) => (
    <div
      key={`${key}-${index}`}
      style={{
        display: 'flex',
        height: rowHeight,
        flex: 'none',
        alignItems: 'center',
        minWidth: 0,
        border: `1px solid ${PALETTE.rule}`,
        background: PALETTE.ground,
        padding: `0 ${vertical ? 18 : 14}px`
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: vertical ? 26 : 21,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {`${tSpec(key)} ${formatValue(measurement, locale)} ${SPEC_UNITS[key]}`}
      </div>
    </div>
  );

  /*
   * Omurga: satirlardan kutuya giden yakinsama. Yatayda dikey bir
   * parantez ve yatay bir kirmizi cizgi, dikeyde 90° cevrilmis hali.
   * Sayac cizginin uzerinde durur — kac kaydin cizildigini kartin
   * kendisi soyler, "ve dahasi" demez.
   */
  const spine = (
    <div
      style={{
        display: 'flex',
        position: 'relative',
        width: vertical ? '100%' : 130,
        height: vertical ? SPINE_HEIGHT : 'auto',
        flex: 'none',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          ...(vertical
            ? {left: '14%', right: '14%', top: 0, height: 1}
            : {left: 0, top: '12%', bottom: '12%', width: 1}),
          background: PALETTE.rule
        }}
      />
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          ...(vertical
            ? {left: '50%', top: 0, bottom: 0, width: 1}
            : {left: 0, right: 0, top: '50%', height: 1}),
          background: PALETTE.signal
        }}
      />
      <div
        style={{
          display: 'flex',
          position: 'absolute',
          ...(vertical ? {top: 30} : {bottom: '52%'}),
          padding: '0 8px',
          background: PALETTE.paper,
          fontSize: vertical ? 22 : 18,
          color: PALETTE.ink2
        }}
      >
        {card.sampled
          ? t('chainSampled', {shown: card.rows.length, total: card.total})
          : t('chainCount', {count: card.total})}
      </div>
    </div>
  );

  const origin = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: vertical ? 14 : 12,
        width: vertical ? '100%' : 352,
        /*
         * Dikeyde kutunun yuksekligi sabit; satir yuksekligi hesabi onu
         * biliyor (area). Yatayda kutu sutun boyunca uzuyor, yani deger
         * verilmez — anahtar hic YAZILMAZ. satori'ye undefined bir stil
         * degeri gecmek cizimi ortasinda dusuruyor ve hata "failed to
         * pipe response" olarak gorunuyor, yani sebebi gostermiyor.
         */
        ...(vertical ? {height: ORIGIN_HEIGHT} : {}),
        flex: 'none',
        border: `1px solid ${PALETTE.ink}`,
        background: PALETTE.ground,
        padding: vertical ? 26 : 20
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: vertical ? 24 : 19,
          color: PALETTE.ink2
        }}
      >
        {t('chainOrigin')}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: vertical ? 34 : 27,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
          lineClamp: 3
        }}
      >
        {card.documentVersion
          ? `${card.source[locale]} — ${card.documentVersion[locale]}`
          : card.source[locale]}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: vertical ? 23 : 19,
          color: PALETTE.ink2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}
      >
        {card.sourceUrl ? t('chainLink') : t('chainNoLink')}
      </div>
    </div>
  );

  return (
    <CardFrame
      format={format}
      title={t(templateKey('kaynak-zinciri'))}
      subject={card.system.name[locale]}
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
      <div
        style={{
          display: 'flex',
          flex: 'none',
          height: HEADING_HEIGHT[format],
          overflow: 'hidden',
          fontSize: vertical ? 52 : 40,
          fontWeight: 600,
          letterSpacing: '-0.025em',
          lineHeight: 1.22,
          lineClamp: 2
        }}
      >
        {t('chainHeading', {count: card.total})}
      </div>

      <div
        style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          flexDirection: vertical ? 'column' : 'row'
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            justifyContent: 'center',
            gap: 14
          }}
        >
          {columns.map((column, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                flex: 1,
                minWidth: 0,
                flexDirection: 'column',
                gap: ROW_GAP
              }}
            >
              {column.map(entry)}
            </div>
          ))}
        </div>

        {spine}
        {origin}
      </div>
    </CardFrame>
  );
}
