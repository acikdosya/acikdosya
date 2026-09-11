import {primary} from '../format';
import {specGroups, type SpecGroup} from '../measurement/groups';
import {type Measurement, type System} from '../schema';

/**
 * Sistem kategorisine gore geometri turu.
 *
 * Fuzeler: uzunluk + cap ekseninde govde profili.
 * Hava araclari: uzunluk + kanat acikligi + yukseklik ekseninde
 * dis hat semasi.
 */
export type SystemKind = 'missile' | 'aircraft';

export function systemKind(system: System): SystemKind {
  if (system.category === 'insansiz-hava-araci') return 'aircraft';
  return 'missile';
}

export type MissileDimensions = {
  kind: 'missile';
  lengthM: number;
  diameterMm: number;
};

export type AircraftDimensions = {
  kind: 'aircraft';
  lengthM: number;
  wingspanM: number;
  heightM?: number;
};

export type SelectedDimensions = MissileDimensions | AircraftDimensions;

/**
 * Bir grup icin secilmis, tutarli olcu seti.
 *
 * Web modeli, GLB, SVG siluet ve OG ayni secim sonucunu kullanir;
 * farkli alanlardaki "en guvenli" deger birlestirilerek uydurulmus
 * bir sistem uretilmez.
 */
export type MeasurementSelection = {
  group: SpecGroup;
  dimensions: SelectedDimensions;
  /** Secime katilan kayitlar — model altinda hangi kaydin kullanildigi aciklar. */
  sources: Measurement[];
  /** Bu grup icin 3B model uretilebilir mi. */
  canModel: boolean;
  /** Model uretilemiyorsa neden. */
  reason?: string;
};

/**
 * Sistemdeki her olcu grubu icin bir secim sonucu uretir.
 *
 * Eksik gerekli alan varsa o grup atlanir; bu, "veri yok" demektir,
 * varsayilan degerle doldurulmus model degil.
 */
export function selectMeasurements(
  system: System
): MeasurementSelection[] {
  const kind = systemKind(system);
  const result: MeasurementSelection[] = [];

  for (const group of specGroups(system)) {
    const lengthList = group.specs.length_m;
    if (!lengthList) continue;
    const length = primary(lengthList);

    if (kind === 'missile') {
      const diameterList = group.specs.diameter_mm;
      if (!diameterList) continue;
      const diameter = primary(diameterList);

      result.push({
        group,
        dimensions: {
          kind: 'missile',
          lengthM: length.value,
          diameterMm: diameter.value
        },
        sources: [length, diameter],
        canModel: true
      });
      continue;
    }

    const wingspanList = group.specs.wingspan_m;
    if (!wingspanList) continue;
    const wingspan = primary(wingspanList);

    const heightList = group.specs.height_m;
    const height = heightList ? primary(heightList) : undefined;

    result.push({
      group,
      dimensions: {
        kind: 'aircraft',
        lengthM: length.value,
        wingspanM: wingspan.value,
        heightM: height?.value
      },
      sources: [length, wingspan, ...(height ? [height] : [])],
      canModel: false,
      reason:
        'Yeterli dis profil kaniti yok; ilk surumde yalnizca boyut semasi.'
    });
  }

  return result;
}

/**
 * Gosterim icin tek bir grup secilir. Birden fazla grup varsa en guvenilir
 * olani; esitlikte ilk grup (aile duzeyi oncelikli degil, specGroups sirasi).
 */
export function primarySelection(
  selections: readonly MeasurementSelection[]
): MeasurementSelection | undefined {
  if (selections.length === 0) return undefined;
  return selections[0];
}
