import {
  BRAND_BRACKET,
  BRAND_MIN_MARK_PX,
  BRAND_VALUE
} from '@/lib/brand';

/**
 * Sembol — CLAUDE.md §10.
 *
 * 'full' ayraci ink, degeri signal cizer. 'mono' hepsini currentColor'a
 * birakir; fotograf ve desenli zemin uzerinde yalnizca bu varyant kullanilir.
 * Gradyan, golge ve kontur eklenmez, sembol dondurulmez ve esnetilmez.
 *
 * Kilit icinde metinle birlikte kullanildiginda label verilmez: ad zaten
 * kelime markasinda yaziyor, ikinci kez okutmak tekrar olur.
 */
type Props = {
  /** Sembol kutusunun kenari, piksel. §10 alt siniri 16. */
  size?: number;
  tone?: 'full' | 'mono';
  /** Sembol tek basina duruyorsa erisilebilir adi. Yoksa dekoratif sayilir. */
  label?: string;
};

export function BrandMark({size = 32, tone = 'full', label}: Props) {
  if (process.env.NODE_ENV !== 'production' && size < BRAND_MIN_MARK_PX) {
    console.warn(
      `BrandMark: ${size}px, §10 alt siniri ${BRAND_MIN_MARK_PX}px. ` +
        'Bu olcude ayracin kollari bir pikselin altina duser.'
    );
  }

  const bracketFill = tone === 'mono' ? 'currentColor' : 'var(--ink)';
  const valueFill = tone === 'mono' ? 'currentColor' : 'var(--signal)';

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role={label ? 'img' : undefined}
      aria-hidden={label ? undefined : true}
      /* Kucuk olculerde kenarlar piksel izgarasina otursun. */
      shapeRendering={size <= 32 ? 'crispEdges' : undefined}
    >
      {label ? <title>{label}</title> : null}
      {BRAND_BRACKET.map((rect) => (
        <rect key={`${rect.x}-${rect.y}`} {...rect} fill={bracketFill} />
      ))}
      <rect {...BRAND_VALUE} fill={valueFill} />
    </svg>
  );
}
