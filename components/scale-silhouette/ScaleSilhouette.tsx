import {useTranslations} from 'next-intl';
import type {Locale} from '@/i18n/routing';
import {formatNumber} from '@/lib/format';
import {selectMeasurements, systemKind} from '@/lib/geometry/measurements';
import {partsForSystem} from '@/lib/geometry/parts-for';
import type {System} from '@/lib/schema';
import {HUMAN_HEIGHT_M, layoutAircrafts} from './aircraft-geometry';
import {layoutSilhouettes} from './geometry';
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
function groupLabel(
  group: {kind: 'family' | 'variant'; label: string},
  t: (key: string) => string
): string {
  return group.kind === 'family' ? t('familyLabel') : group.label;
}

/**
 * Olcek referansi. Ayni figur iki semada da kullaniliyor; oranlar figur
 * yuksekligine gore, cunku yukseklik olcekten geliyor.
 */
function HumanFigure({
  x,
  y,
  height
}: {
  x: number;
  y: number;
  height: number;
}) {
  return (
    <g className={styles.human} transform={`translate(${x} ${y})`}>
      <circle cx={height * 0.09} cy={height * 0.08} r={height * 0.075} />
      <rect
        x={height * 0.03}
        y={height * 0.17}
        width={height * 0.12}
        height={height * 0.42}
        rx={height * 0.05}
      />
      <rect
        x={height * 0.037}
        y={height * 0.58}
        width={height * 0.045}
        height={height * 0.42}
        rx={height * 0.02}
      />
      <rect
        x={height * 0.105}
        y={height * 0.58}
        width={height * 0.045}
        height={height * 0.42}
        rx={height * 0.02}
      />
    </g>
  );
}

function MissileSilhouette({
  system,
  locale
}: {
  system: System;
  locale: Locale;
}) {
  const t = useTranslations('ScaleSilhouette');

  const items = selectMeasurements(system)
    .filter((selection) => selection.dimensions.kind === 'missile')
    .map((selection) => {
      const dims = selection.dimensions as import('@/lib/geometry/measurements').MissileDimensions;
      return {
        id: selection.group.id,
        label: groupLabel(selection.group, t),
        lengthM: dims.lengthM,
        diameterMm: dims.diameterMm,
        /*
         * Parca listesi varsa kontur cizilir, yoksa kesikli olcu zarfi.
         * Urun tanimi olmayan sisteme varsayilan bir bicim verilmez.
         */
        parts: partsForSystem(system.slug, selection.group.id, dims)
      };
    });

  const layout = layoutSilhouettes(items);
  if (!layout) return null;

  return (
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

      <HumanFigure
        x={layout.human.x}
        y={layout.human.y}
        height={layout.human.height}
      />
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
            {row.envelope ? (
              <path className={styles.envelope} d={row.envelope} />
            ) : (
              <>
                <path className={bodyClass} d={row.body} />
                <path className={bodyClass} d={row.fins} />
              </>
            )}
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
  );
}

/**
 * Ucak boyut semasi.
 *
 * Kontur yok, zarf var — gerekcesi aircraft-geometry.ts basinda. Her
 * grup icin ust gorunus (kanat acikligi × uzunluk) ve yukseklik verisi
 * varsa on gorunus (kanat acikligi × yukseklik) cizilir. Hangi kenarin
 * ne oldugunu olcu etiketleri soyler; kutunun kendisi bir bicim iddiasi
 * tasimaz.
 */
function AircraftSilhouette({
  system,
  locale
}: {
  system: System;
  locale: Locale;
}) {
  const t = useTranslations('ScaleSilhouette');

  const items = selectMeasurements(system)
    .filter((selection) => selection.dimensions.kind === 'aircraft')
    .map((selection) => {
      const dims = selection.dimensions as import('@/lib/geometry/measurements').AircraftDimensions;
      return {
        id: selection.group.id,
        label: groupLabel(selection.group, t),
        lengthM: dims.lengthM,
        wingspanM: dims.wingspanM,
        heightM: dims.heightM,
        parts: partsForSystem(system.slug, selection.group.id, dims)
      };
    });

  const layout = layoutAircrafts(items);
  if (!layout) return null;

  return (
    <svg
      className={styles.svg}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      role="img"
      aria-label={t('ariaLabelAircraft', {
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

      <HumanFigure
        x={layout.human.x}
        y={layout.human.y}
        height={layout.human.height}
      />
      <text
        className={styles.dimensionText}
        x={layout.human.x}
        y={layout.human.labelY}
      >
        {t('humanLabel', {height: formatNumber(HUMAN_HEIGHT_M, locale)})}
      </text>

      {layout.rows.map((row, index) => {
        const alt = index > 0;
        const envelopeClass = alt
          ? `${styles.envelope} ${styles.envelopeAlt}`
          : styles.envelope;

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

            {row.planOutline ? (
              <path
                className={alt ? `${styles.body} ${styles.bodyAlt}` : styles.body}
                d={row.planOutline}
              />
            ) : (
              <path className={envelopeClass} d={row.plan.path} />
            )}
            <path className={styles.dimension} d={row.length.path} />
            <text
              className={styles.dimensionText}
              x={row.length.labelX}
              y={row.length.labelY}
            >
              {t('lengthNamed', {
                value: formatNumber(row.length.valueM, locale)
              })}
            </text>

            <path className={styles.dimension} d={row.wingspan.path} />
            <text
              className={`${styles.dimensionText} ${styles.dimensionTextMid}`}
              x={row.wingspan.labelX}
              y={row.wingspan.labelY}
            >
              {t('spanNamed', {
                value: formatNumber(row.wingspan.valueM, locale)
              })}
            </text>

            {row.front && row.height ? (
              <>
                {row.frontOutline ? (
                  <path
                    className={
                      alt ? `${styles.body} ${styles.bodyAlt}` : styles.body
                    }
                    d={row.frontOutline}
                  />
                ) : (
                  <path className={envelopeClass} d={row.front.path} />
                )}
                <path className={styles.dimension} d={row.height.path} />
                <text
                  className={styles.dimensionText}
                  x={row.height.labelX}
                  y={row.height.labelY}
                >
                  {t('heightNamed', {
                    value: formatNumber(row.height.valueM, locale)
                  })}
                </text>
              </>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export function ScaleSilhouette({system, locale}: Props) {
  const t = useTranslations('ScaleSilhouette');
  const kind = systemKind(system);

  return (
    <figure className={styles.frame}>
      {kind === 'missile' ? (
        <MissileSilhouette system={system} locale={locale} />
      ) : (
        <AircraftSilhouette system={system} locale={locale} />
      )}
      {/* Altyazi tura gore: ucakta cizilen sey siluet degil, olcu zarfi. */}
      <figcaption className={styles.caption}>
        {kind === 'missile' ? t('caption') : t('captionAircraft')}
      </figcaption>
    </figure>
  );
}
