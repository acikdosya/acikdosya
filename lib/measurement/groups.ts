import {
  specKeys,
  type Measurement,
  type SpecKey,
  type Specs,
  type System
} from '../schema';

/**
 * Bir sistemin ölçü grupları: aile düzeyi beyanlar ve varyantlar.
 *
 * Aile düzeyindeki değerler varyantlara otomatik kopyalanmaz; her grup
 * kendi kaynak bağlamını taşır. Tüketiciler (tablo, istatistik, hero,
 * JSON-LD) bu ortak yoldan dolaşır, böylece yeni aile alanı yalnızca
 * tabloda görünüp istatistik/SEO'da kaybolmaz.
 */
export type SpecGroup = {
  kind: 'family' | 'variant';
  id: string;
  /** Varyant adı veya aile grubu için çeviri anahtarı (`family`). */
  label: string;
  specs: Specs;
};

export function specGroups(system: System): SpecGroup[] {
  const groups: SpecGroup[] = [];

  if (system.specs) {
    groups.push({
      kind: 'family',
      id: 'family',
      label: 'family',
      specs: system.specs
    });
  }

  for (const variant of system.variants) {
    groups.push({
      kind: 'variant',
      id: variant.id,
      label: variant.label,
      specs: variant.specs
    });
  }

  return groups;
}

/** Bir gruptaki tüm ölçüleri düz dizi olarak verir. */
export function* measurementsInGroup(
  group: SpecGroup
): Generator<{key: SpecKey; measurement: Measurement}> {
  for (const key of specKeys) {
    const list = group.specs[key];
    if (!list) continue;
    for (const measurement of list) {
      yield {key, measurement};
    }
  }
}

/** Sistemdeki tüm ölçüleri gruplar halinde düz dizi olarak verir. */
export function* allMeasurements(
  system: System
): Generator<{group: SpecGroup; key: SpecKey; measurement: Measurement}> {
  for (const group of specGroups(system)) {
    for (const {key, measurement} of measurementsInGroup(group)) {
      yield {group, key, measurement};
    }
  }
}
