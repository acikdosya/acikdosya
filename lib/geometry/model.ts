import {buildAircraft, fuselageRadius} from './aircraft';
import type {SelectedDimensions} from './measurements';
import {buildMissile, FIN_SPAN_RATIO} from './missile';
import type {ModelDimensions, ModelResult} from './result';
import {specFor} from './selection';

export interface ModelSpec {
  /** content/systems/*.json'daki slug. */
  systemSlug: string;
  /** Ortak olcu seciminden gelen boyutlar — lib/geometry/measurements.ts. */
  dimensions: SelectedDimensions;
  /** Lathe segment sayisi; mobil 48, masaustu 72. */
  radialSegments?: number;
}

/**
 * Sistem slug'ina gore dogru profille parametrik model uretir.
 *
 * Tek kaynak (content/systems/*.json) → iki cikti:
 *   - web'de runtime mesh (components/model-viewer)
 *   - AR'da statik GLB (scripts/bake-glb.mjs)
 *
 * Her ikisi de bu fonksiyondan gecer, bu yuzden profil farkliligi
 * iki yerde birden tutarli olur.
 *
 * Dis profili tanimsiz ya da profil turu olcu turuyle uyusmayan
 * sistem icin undefined doner — varsayilan geometriyle cizmek yerine
 * hic cizmemek dogru olan (CLAUDE.md §9). Cagiranlar: sahne siluete
 * duser, GLB pisirici atlar.
 */
export function buildModel({
  systemSlug,
  dimensions,
  radialSegments
}: ModelSpec): ModelResult | undefined {
  const profile = specFor(systemSlug);
  if (!profile) return undefined;

  if (dimensions.kind === 'missile' && profile.kind === 'missile') {
    return buildMissile({
      lengthM: dimensions.lengthM,
      diameterMm: dimensions.diameterMm,
      noseRatio: profile.spec.noseRatio,
      boattail: profile.spec.boattail,
      finCount: profile.spec.finCount,
      radialSegments
    });
  }

  if (dimensions.kind === 'aircraft' && profile.kind === 'aircraft') {
    return buildAircraft({
      lengthM: dimensions.lengthM,
      wingspanM: dimensions.wingspanM,
      profile: profile.spec,
      radialSegments
    });
  }

  return undefined;
}

/**
 * Modelin olculeri — mesh kurmadan.
 *
 * Kamera kadraji, golge duzlemi ve yakinlasma sinirlari sahne
 * kurulmadan once biliniyor olmali. Ayni sayilari buildModel de
 * uretiyor; ikisi ayni sabitlerden turedigi icin ayrisamazlar.
 */
export function modelBounds({
  systemSlug,
  dimensions
}: Omit<ModelSpec, 'radialSegments'>): ModelDimensions | undefined {
  const profile = specFor(systemSlug);
  if (!profile) return undefined;

  if (dimensions.kind === 'missile' && profile.kind === 'missile') {
    const R = dimensions.diameterMm / 2000;
    return {L: dimensions.lengthM, R, reach: R * FIN_SPAN_RATIO};
  }

  if (dimensions.kind === 'aircraft' && profile.kind === 'aircraft') {
    return {
      L: dimensions.lengthM,
      R: fuselageRadius(dimensions.lengthM, profile.spec),
      reach: dimensions.wingspanM / 2
    };
  }

  return undefined;
}
