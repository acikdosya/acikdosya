import {useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/routing';
import {formatNumber, primary} from '@/lib/format';
import type {System} from '@/lib/schema';
import {HUMAN_HEIGHT_M, layoutSilhouettes} from './geometry';
import styles from './ScaleSilhouette.module.css';

type Props = {
  system: System;
  locale: Locale;
};

/**
 * Varyantlarin olcekli siluetleri. Client JS yok, geometri sunucuda veriden
 * uretiliyor.
 *
 * Hareket yok — CLAUDE.md §4. Eskiden her siluet artan gecikmeyle ciziliyordu;
 * bu bir kaskad ve §4 kaskadi hem scroll'da hem yuklemede yasakliyor. Sayfanin
 * tek orkestre edilmis ani hero'daki celisen veri satirinin rozetleridir.
 */
export function ScaleSilhouette({system, locale}: Props) {
  const t = useTranslations('ScaleSilhouette');

  const items = system.variants
    .map((variant) => {
      const length = variant.specs.length_m;
      const diameter = variant.specs.diameter_mm;
      if (!length || !diameter) return undefined;

      return {
        id: variant.id,
        label: variant.label,
        lengthM: primary(length).value,
        diameterMm: primary(diameter).value
      };
    })
    .filter((item) => item !== undefined);

  const layout = layoutSilhouettes(items);
  if (!layout) return null;

  const humanHeight = layout.human.height;

  return (
    <figure className={styles.frame}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="img"
        aria-label={t('ariaLabel', {
          names: items.map((item) => item.label).join(', '),
          height: formatNumber(HUMAN_HEIGHT_M, locale)
        })}
      >
        <line
          className={styles.dimension}
          x1={0}
          y1={layout.groundY}
          x2={layout.width}
          y2={layout.groundY}
        />

        <g
          className={styles.human}
          transform={`translate(${layout.human.x} ${layout.human.y})`}
        >
          <circle
            cx={humanHeight * 0.09}
            cy={humanHeight * 0.08}
            r={humanHeight * 0.075}
          />
          <rect
            x={humanHeight * 0.03}
            y={humanHeight * 0.17}
            width={humanHeight * 0.12}
            height={humanHeight * 0.42}
            rx={humanHeight * 0.05}
          />
          <rect
            x={humanHeight * 0.037}
            y={humanHeight * 0.58}
            width={humanHeight * 0.045}
            height={humanHeight * 0.42}
            rx={humanHeight * 0.02}
          />
          <rect
            x={humanHeight * 0.105}
            y={humanHeight * 0.58}
            width={humanHeight * 0.045}
            height={humanHeight * 0.42}
            rx={humanHeight * 0.02}
          />
        </g>
        <text
          className={styles.dimensionText}
          x={layout.human.x}
          y={layout.human.labelY}
        >
          {t('humanLabel', {height: formatNumber(HUMAN_HEIGHT_M, locale)})}
        </text>

        {layout.rows.map((row, index) => {
          const alt = index > 0;
          const bodyClass = alt
            ? `${styles.body} ${styles.bodyAlt}`
            : styles.body;

          return (
            <g key={row.id}>
              <text
                className={
                  alt
                    ? `${styles.variantLabel} ${styles.variantLabelAlt}`
                    : styles.variantLabel
                }
                x={layout.human.x + 52}
                y={row.labelY}
              >
                {row.label}
              </text>
              <path className={bodyClass} d={row.body} />
              <path className={bodyClass} d={row.fins} />
              <line
                className={styles.dimension}
                x1={row.dimension.x1}
                y1={row.dimension.y}
                x2={row.dimension.x2}
                y2={row.dimension.y}
              />
              <text
                className={styles.dimensionText}
                x={row.dimension.labelX}
                y={row.dimension.y + 4}
              >
                {t('lengthLabel', {value: formatNumber(row.lengthM, locale)})}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className={styles.caption}>{t('caption')}</figcaption>
    </figure>
  );
}
