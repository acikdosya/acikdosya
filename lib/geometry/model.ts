import {buildMissile, type MissileResult} from './missile';
import {specFor} from './selection';

export interface ModelSpec {
  /** content/systems/*.json'daki slug. */
  systemSlug: string;
  /** Metre cinsinden toplam uzunluk. */
  lengthM: number;
  /** Milimetre cinsinde govde capi. */
  diameterMm: number;
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
 */
export function buildModel({
  systemSlug,
  lengthM,
  diameterMm,
  radialSegments
}: ModelSpec): MissileResult {
  const profile = specFor(systemSlug);
  return buildMissile({
    lengthM,
    diameterMm,
    noseRatio: profile.noseRatio,
    boattail: profile.boattail,
    finCount: profile.finCount,
    radialSegments
  });
}
