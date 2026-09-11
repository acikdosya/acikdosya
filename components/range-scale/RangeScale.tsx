import {useTranslations} from 'next-intl';
import {ConfidenceBadge} from '@/components/confidence-badge/ConfidenceBadge';
import type {Locale} from '@/i18n/routing';
import {formatNumber, formatValue, primary} from '@/lib/format';
import {specGroups} from '@/lib/measurement/groups';
import type {Measurement, SpecKey, System} from '@/lib/schema';
import {axisPath, layoutRangeScale, QUARTER_MERIDIAN_KM} from './geometry';
import styles from './RangeScale.module.css';

/**
 * Menzil beyaninin mesafe cetveli — menzil zarfinin haritasiz karsiligi.
 *
 * Gerekcesi geometry.ts basinda: halka bir yaricap iddiasidir ve
 * ucaktaki "operasyonel menzil" terimi oyle yorumlanmadi. Cetvel sayiyi
 * yer olcusune gore gosterir, bir yone isaret etmez.
 *
 * Client JS yok; geometri sunucuda veriden uretiliyor.
 */

/** Cetvele girecek alanlar, gosterim sirasiyla. */
const RANGE_KEYS: SpecKey[] = ['operational_range_km', 'range_km'];

type Row = {
  id: string;
  label: string;
  fieldLabel: string;
  measurement: Measurement;
};

export function RangeScale({
  system,
  locale
}: {
  system: System;
  locale: Locale;
}) {
  const t = useTranslations('RangeScale');
  const tSpecs = useTranslations('Specs');
  const tTable = useTranslations('SpecTable');

  const rows: Row[] = [];
  for (const group of specGroups(system)) {
    for (const key of RANGE_KEYS) {
      const list = group.specs[key];
      if (!list) continue;
      rows.push({
        id: `${group.id}-${key}`,
        label:
          group.kind === 'family' ? tTable('familyLabel') : group.label,
        fieldLabel: tSpecs(key),
        measurement: primary(list)
      });
    }
  }

  const layout = layoutRangeScale(
    rows.map((row) => ({
      id: row.id,
      label: row.label,
      fieldLabel: row.fieldLabel,
      km: row.measurement.value
    }))
  );
  if (!layout) return null;

  const byId = new Map(rows.map((row) => [row.id, row]));

  return (
    <figure className={styles.frame}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        role="img"
        aria-label={t('ariaLabel', {
          names: rows.map((row) => row.fieldLabel).join(', '),
          reference: formatNumber(Math.round(QUARTER_MERIDIAN_KM), locale)
        })}
      >
        {layout.reference ? (
          <line
            className={styles.reference}
            x1={layout.reference.x}
            y1={layout.bars[0].y - 18}
            x2={layout.reference.x}
            y2={layout.axisY}
          />
        ) : null}

        {layout.bars.map((bar) => (
          <g key={bar.id}>
            <text className={styles.label} x={bar.x1} y={bar.labelY}>
              {bar.fieldLabel}
            </text>
            <rect
              className={styles.bar}
              x={bar.x1}
              y={bar.y}
              width={Math.max(bar.x2 - bar.x1, 1)}
              height={bar.height}
            />
            <text className={styles.value} x={bar.valueX} y={bar.valueY}>
              {t('kmLabel', {value: formatNumber(bar.km, locale)})}
            </text>
          </g>
        ))}

        <path className={styles.axis} d={axisPath(layout)} />

        {layout.ticks.map((tick) => (
          <text
            key={tick.km}
            className={styles.tickLabel}
            x={tick.x}
            y={layout.axisY + 18}
          >
            {formatNumber(tick.km / 1000, locale)}
          </text>
        ))}

        {layout.reference ? (
          <text
            className={styles.referenceLabel}
            x={layout.reference.x - 8}
            y={layout.bars[0].y - 24}
          >
            {t('reference', {
              value: formatNumber(Math.round(layout.reference.km), locale)
            })}
          </text>
        ) : null}
      </svg>

      <p className={styles.unit}>{t('axisUnit')}</p>

      <ul className={styles.notes}>
        {layout.bars.map((bar) => {
          const row = byId.get(bar.id);
          if (!row) return null;
          const note = row.measurement.context_note;

          return (
            <li key={bar.id} className={styles.note}>
              <span className={styles.noteHead}>
                {row.label} · {row.fieldLabel}{' '}
                <span className={styles.noteValue}>
                  {formatValue(row.measurement, locale)} km
                </span>
                <ConfidenceBadge confidence={row.measurement.confidence} />
              </span>
              {note ? (
                <span className={styles.noteBody}>{note[locale]}</span>
              ) : null}
            </li>
          );
        })}
      </ul>

      <figcaption className={styles.caption}>{t('caption')}</figcaption>
    </figure>
  );
}
