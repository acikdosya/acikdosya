import type {SelectedDimensions} from './measurements';
import {findPart, partAnchor, type Part, type Vec3} from './parts';
import {buildParts} from './product';
import {productFor} from './registry';

/**
 * Sistem icin parca listesi — `three` ICE AKTARMADAN.
 *
 * Ayri dosyada duruyor cunku lib/geometry/model.ts sahne kuruyor ve
 * `three` cekiyor. Iki boyutlu siluet sunucuda ciziliyor; oradan model.ts
 * ice aktarilsaydi 3B kutuphanesi sema yoluna girerdi ve §6 butcesi
 * bozulurdu.
 *
 * Uc tuketici ayni listeyi okur: web sahnesi, GLB pisirici ve iki
 * boyutlu izdusum. Ayni kaynaktan turedikleri icin ayrisamazlar
 * (specs/system-silhouette).
 */

/** Secilmis olculeri urun kaydinin bekledigi alan adlarina cevirir. */
export function dimensionFields(dimensions: SelectedDimensions) {
  return dimensions.kind === 'missile'
    ? {
        length_m: dimensions.lengthM,
        diameter_mm: dimensions.diameterMm
      }
    : {
        length_m: dimensions.lengthM,
        wingspan_m: dimensions.wingspanM,
        height_m: dimensions.heightM
      };
}

/** Urun tanimi ya da olcu eksikse undefined — varsayilan bicim yok. */
export function partsForSystem(
  systemSlug: string,
  dimensions: SelectedDimensions
): Part[] | undefined {
  const product = productFor(systemSlug);
  if (!product) return undefined;
  return buildParts(product, dimensionFields(dimensions));
}

/**
 * Bir etiketin baglandigi noktanin cerceve koordinati.
 *
 * Kamera odagi bunu okur: etiket artik govde ekseninde bir oran degil,
 * bir parca uzerinde bir oran. Kanat ucuna odaklanmak ancak boyle
 * mumkun. Parca bulunamazsa undefined — kamera yerinde kalir, yanlis
 * bir yere ucmaz.
 */
export function focusPointFor(
  systemSlug: string,
  dimensions: SelectedDimensions,
  target: {part: string; t: number; angle?: number}
): Vec3 | undefined {
  const parts = partsForSystem(systemSlug, dimensions);
  if (!parts) return undefined;

  const part = findPart(parts, target.part);
  if (!part) return undefined;

  return partAnchor(part, target.t, target.angle, 0);
}
