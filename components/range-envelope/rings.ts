import {SPEC_UNITS} from '@/lib/format';
import {specGroups} from '@/lib/measurement/groups';
import type {
  Confidence,
  LocalizedText,
  Operator,
  SpecKey,
  System
} from '@/lib/schema';

/**
 * Menzil zarfi halkalari veriden turer. Elle sabit deger yok:
 * yeni bir menzil beyani eklenince halka kendiliginden cikar.
 *
 * HANGI ALANIN cizildigi ise veriden DEGIL, icerikteki acik kayittan
 * gelir (`range_ring`). Onceki surumde kural bir kategori daliydi —
 * "IHA degilse range_km ciz" — ve yeni bir kategori eklemek halkayi
 * kendiliginden actiriyordu. Halka bir yaricap iddiasi oldugu icin bu
 * karar sessiz verilemez (specs/range-envelope).
 *
 * Kayit yoksa halka yok. Eksiklik degil, mesru karar: yaricap iddiasi
 * tasimayan deger mesafe cetveline duser.
 */
export type Ring = {
  id: string;
  /**
   * Olcu grubunun adi. Aile grubunda cevrilecek anahtar gelir, bu yuzden
   * `isFamily` ile birlikte okunur — ham "family" dizesi sayfaya cikmasin.
   */
  variantLabel: string;
  /** Grup aile duzeyi mi. Etiketi cagiran ceviri paketinden verir. */
  isFamily: boolean;
  km: number;
  operator?: Operator;
  confidence: Confidence;
  source: LocalizedText;
  /** Resmi teyidi olmayan degerler kapali baslar, gizlenmez. */
  defaultVisible: boolean;
};

/** Halka yalnizca kilometre olcen bir alandan cizilebilir. */
function isDistanceField(key: SpecKey): boolean {
  return SPEC_UNITS[key] === 'km';
}

export function buildRings(system: System): Ring[] {
  const rings: Ring[] = [];

  const marker = system.range_ring;
  if (!marker) return rings;
  if (!isDistanceField(marker.field)) return rings;

  for (const group of specGroups(system)) {
    const measurements = group.specs[marker.field];
    if (!measurements) continue;

    measurements.forEach((measurement, index) => {
      /*
       * Nesne suzgeci: ayni alanda iki nesnenin kaydi varsa yalniz
       * isaretlenen nesne cizilir. Isaretci nesne belirtmiyorsa alandaki
       * butun kayitlar cizilir — tek nesneli dosyalarin hali.
       */
      if (marker.object && measurement.object !== marker.object) return;

      rings.push({
        id: `${group.id}-${marker.field}-${index}`,
        variantLabel: group.label,
        isFamily: group.kind === 'family',
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
