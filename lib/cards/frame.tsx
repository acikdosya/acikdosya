import {BrandSymbol, badgeWidth, OG_FONT_FAMILY, OgBadge} from '../og';
import type {Confidence} from '../schema';
import {PALETTE} from '../tokens';
import {CARD_SIZE, type CardFormat} from './params';

/**
 * Paylasim kartinin kabugu — CLAUDE.md §4 ve §5.
 *
 * Ust ve alt serit ICERIKTEN BAGIMSIZDIR. Degisken icerik yalnizca
 * ortadaki alani kullanir ve tasarsa kendi icinde kirpilir; seritleri
 * itemez. Gerekcesi kartin dolasim bicimi: gorsel ekran goruntusu olarak
 * baglamindan kopar, bu yuzden alan adi, verinin tarihi ve kaynak turu
 * her karta sabit yerde girer. Tarih gorselin icinde degilse, alti ay
 * sonra duzeltilmis bir rakam guncel veri olarak bize atfedilir.
 *
 * ROZET ILE ETIKET AYRI SEYLER. Uc guven durumu (resmi / basin / tahmin)
 * cercevenin DESENIYLE ayrisir ve dorduncu bir varyanti yoktur. "Sematik"
 * ya da "duzeltme kaydi" gibi etiketler guven durumu DEGILDIR, bu yuzden
 * cerceve dilini hic kullanmazlar: onlerinde kisa bir cizgi olan, altini
 * cizmeyen, cercevesiz bir yazi olarak dururlar. Tasarim dosyasinda ikisi
 * de cerceveli cizilmisti; §4 bu noktada mockup'i gecersiz kilar.
 */

type Scale = {
  /** Serit ici yatay bosluk. */
  pad: number;
  /** Sablon adi. */
  title: number;
  /** Sag ust: sistem ve alan. */
  subject: number;
  /** Alt seritteki alan adi. */
  domain: number;
  /** Alt seritteki tarih ve sayac. */
  meta: number;
  /** Rozet ve etiket. */
  chip: number;
  /** Govde kenar bosluklari. */
  body: {top: number; bottom: number; gap: number};
};

/** Serit yukseklikleri iki bicimde de ayni — tasarimin sabiti. */
export const HEAD_HEIGHT = 84;
export const FOOT_HEIGHT = 96;

export const CARD_SCALE: Record<CardFormat, Scale> = {
  yatay: {
    pad: 48,
    title: 26,
    subject: 24,
    domain: 24,
    meta: 22,
    chip: 22,
    body: {top: 34, bottom: 30, gap: 26}
  },
  dikey: {
    pad: 44,
    title: 26,
    subject: 23,
    domain: 24,
    meta: 22,
    chip: 22,
    body: {top: 44, bottom: 40, gap: 34}
  }
};

/** Guven siralamasi — birlesik rozetin deseni en zayif olandan gelir. */
const CONFIDENCE_ORDER: Confidence[] = ['official', 'press', 'estimate'];

/**
 * Kartta birden fazla kaynak turu varsa rozet birlesik yazilir.
 * Cerceve deseni EN ZAYIF durumdan gelir: kart en zayif kaydi kadar
 * saglamdir. Uydurma bir dorduncu durum uretilmez.
 */
export function weakest(confidences: readonly Confidence[]): Confidence {
  return (
    [...CONFIDENCE_ORDER]
      .reverse()
      .find((confidence) => confidences.includes(confidence)) ?? 'official'
  );
}

export function CardBadge({
  confidences,
  labels,
  size
}: {
  confidences: readonly Confidence[];
  /** Guven adlari, ceviri paketinden. */
  labels: Record<Confidence, string>;
  size: number;
}) {
  const present = CONFIDENCE_ORDER.filter((confidence) =>
    confidences.includes(confidence)
  );
  const label = present.map((confidence) => labels[confidence]).join(' + ');

  return (
    <OgBadge
      confidence={weakest(present)}
      label={label}
      size={size}
      width={badgeWidth(label, size)}
    />
  );
}

/**
 * Cercevesiz etiket — "sematik", "duzeltme kaydi".
 *
 * Guven rozetiyle karistirilamasin diye cercevesi yok; onundeki kisa
 * cizgi onu bir basliga, bir duruma degil, bir nota benzetir.
 */
export function CardLabel({label, size}: {label: string; size: number}) {
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: Math.round(size * 0.5)}}>
      <div
        style={{
          display: 'flex',
          width: Math.round(size * 1.1),
          height: 1,
          background: PALETTE.ink2
        }}
      />
      <div style={{display: 'flex', fontSize: size, color: PALETTE.ink2}}>
        {label}
      </div>
    </div>
  );
}

/** Tek satirda kirpilan metin — sag ustteki sistem ve alan adi. */
function OneLine({
  children,
  size,
  color,
  maxWidth
}: {
  children: string;
  size: number;
  color: string;
  maxWidth: number;
}) {
  return (
    <div
      style={{
        display: 'flex',
        maxWidth,
        fontSize: size,
        color,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}
    >
      {children}
    </div>
  );
}

export function CardFrame({
  format,
  title,
  subject,
  label,
  domain,
  meta,
  badge,
  children
}: {
  format: CardFormat;
  /** Sablon adi — sol ustte, sembolun yaninda. */
  title: string;
  /** Sag ustteki sistem ve alan. Etiket varsa yerini ona birakir. */
  subject?: string;
  /** Sag ustteki cercevesiz etiket, "sematik" gibi. */
  label?: string;
  /** Alan adi — alt seritte, her kartta. */
  domain: string;
  /** Verinin tarihi ve varsa sayac. Bugunun tarihi DEGIL. */
  meta: string[];
  /** Alt seritteki rozet ya da etiket. */
  badge: React.ReactNode;
  children: React.ReactNode;
}) {
  const scale = CARD_SCALE[format];
  const size = CARD_SIZE[format];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: size.width,
        height: size.height,
        background: PALETTE.paper,
        color: PALETTE.ink,
        fontFamily: OG_FONT_FAMILY
      }}
    >
      <div
        style={{
          display: 'flex',
          height: HEAD_HEIGHT,
          flex: 'none',
          alignItems: 'center',
          gap: 20,
          padding: `0 ${scale.pad}px`,
          borderBottom: `1px solid ${PALETTE.rule}`
        }}
      >
        <BrandSymbol size={34} />
        <div
          style={{
            display: 'flex',
            fontSize: scale.title,
            fontWeight: 600,
            letterSpacing: '-0.02em'
          }}
        >
          {title}
        </div>
        <div style={{display: 'flex', marginLeft: 'auto'}}>
          {label ? (
            <CardLabel label={label} size={scale.chip} />
          ) : subject ? (
            <OneLine
              size={scale.subject}
              color={PALETTE.ink2}
              maxWidth={size.width - scale.pad * 2 - 320}
            >
              {subject}
            </OneLine>
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          gap: scale.body.gap,
          padding: `${scale.body.top}px ${scale.pad}px ${scale.body.bottom}px`
        }}
      >
        {children}
      </div>

      <div
        style={{
          display: 'flex',
          height: FOOT_HEIGHT,
          flex: 'none',
          alignItems: 'center',
          gap: 28,
          padding: `0 ${scale.pad}px`,
          borderTop: `1px solid ${PALETTE.rule}`
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: scale.domain,
            fontWeight: 600,
            letterSpacing: '-0.01em'
          }}
        >
          {domain}
        </div>
        {meta.map((entry) => (
          <div
            key={entry}
            style={{display: 'flex', fontSize: scale.meta, color: PALETTE.ink2}}
          >
            {entry}
          </div>
        ))}
        <div style={{display: 'flex', marginLeft: 'auto'}}>{badge}</div>
      </div>
    </div>
  );
}
