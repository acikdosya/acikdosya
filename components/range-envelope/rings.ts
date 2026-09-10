import type {Confidence, LocalizedText, Operator, System} from '@/lib/schema';

/**
 * Menzil zarfi halkalari veriden turer. Elle sabit deger yok:
 * yeni bir menzil beyani eklenince halka kendiliginden cikar.
 */
export type Ring = {
  id: string;
  variantLabel: string;
  km: number;
  operator?: Operator;
  confidence: Confidence;
  source: LocalizedText;
  /** Resmi teyidi olmayan degerler kapali baslar, gizlenmez. */
  defaultVisible: boolean;
};

export function buildRings(system: System): Ring[] {
  const rings: Ring[] = [];

  for (const variant of system.variants) {
    const measurements = variant.specs.range_km;
    if (!measurements) continue;

    measurements.forEach((measurement, index) => {
      rings.push({
        id: `${variant.id}-${index}`,
        variantLabel: variant.label,
        km: measurement.value,
        operator: measurement.operator,
        confidence: measurement.confidence,
        source: measurement.source,
        defaultVisible: measurement.confidence !== 'estimate'
      });
    });
  }

  return rings.sort((a, b) => a.km - b.km);
}
