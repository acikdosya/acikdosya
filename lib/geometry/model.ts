import {buildGroup} from './build3d';
import type {SelectedDimensions} from './measurements';
import {bodyRadiusOf, partsBounds, primaryBody, type Part} from './parts';
import {partsForSystem} from './parts-for';
import {productFor} from './registry';
import type {ModelFrame, ModelResult} from './result';

export interface ModelSpec {
  /** content/systems/*.json'daki slug. */
  systemSlug: string;
  /** Ortak olcu seciminden gelen boyutlar — lib/geometry/measurements.ts. */
  dimensions: SelectedDimensions;
  /** Lathe segment sayisi; mobil 48, masaustu 72. */
  radialSegments?: number;
}

/** Urun ofset bildirmemisse kullanilan deger. */
const DEFAULT_DIMENSION_OFFSET = 2.4;

/**
 * Parca listesinden kadraj olculeri.
 *
 * Elle yazilmis ikinci bir hesap TUTULMAZ: sinirlar parcalardan turer,
 * bu yuzden mesh ile bildirilen erisim ayrisamaz. Olcu cizgisi bir parca
 * degil, bu yuzden erisime karismaz — cizgi solda duruyor ve kadraji
 * gereksizce genisletmemeli.
 */
export function frameFromParts(parts: readonly Part[]): ModelFrame {
  const bounds = partsBounds(parts);
  const body = primaryBody(parts);

  const L = body
    ? Math.abs(
        (body.spec.stations[body.spec.stations.length - 1]?.y ?? 0) -
          (body.spec.stations[0]?.y ?? 0)
      )
    : bounds.max.y - bounds.min.y;

  const R = body
    ? bodyRadiusOf(body)
    : (bounds.max.x - bounds.min.x) / 2;

  const reach = Math.max(
    Math.abs(bounds.min.x),
    Math.abs(bounds.max.x),
    Math.abs(bounds.min.z),
    Math.abs(bounds.max.z)
  );

  return {bounds, length: L, bodyRadius: R, reach};
}

function partsFor(spec: ModelSpec): Part[] | undefined {
  return partsForSystem(spec.systemSlug, spec.dimensions);
}

/**
 * Sistem slug'ina gore dogru profille parametrik model uretir.
 *
 * Tek kaynak (content/systems/*.json) → iki cikti:
 *   - web'de runtime mesh (components/model-viewer)
 *   - AR'da statik GLB (scripts/bake-glb.mjs)
 *
 * Dis profili tanimsiz ya da profil turu olcu turuyle uyusmayan sistem
 * icin undefined doner — varsayilan geometriyle cizmek yerine hic
 * cizmemek dogru olan (CLAUDE.md §9). Cagiranlar: sahne siluete duser,
 * GLB pisirici atlar.
 */
export function buildModel({
  systemSlug,
  dimensions,
  radialSegments
}: ModelSpec): ModelResult | undefined {
  const parts = partsFor({systemSlug, dimensions, radialSegments});
  if (!parts) return undefined;

  const scene = buildGroup(parts, {
    segments: radialSegments ? {body: radialSegments} : undefined,
    dimensionOffsetRatio:
      productFor(systemSlug)?.dimensionOffsetRatio ?? DEFAULT_DIMENSION_OFFSET
  });

  return {
    group: scene.group,
    parts,
    frame: frameFromParts(parts),
    dispose: scene.dispose
  };
}

/**
 * Modelin olculeri — mesh kurmadan.
 *
 * Kamera kadraji, golge duzlemi ve yakinlasma sinirlari sahne kurulmadan
 * once biliniyor olmali. Ayni parca listesi buildModel'i de besledigi
 * icin iki sonuc ayrisamaz.
 */
export function modelBounds({
  systemSlug,
  dimensions
}: Omit<ModelSpec, 'radialSegments'>): ModelFrame | undefined {
  const parts = partsFor({systemSlug, dimensions});
  return parts ? frameFromParts(parts) : undefined;
}
