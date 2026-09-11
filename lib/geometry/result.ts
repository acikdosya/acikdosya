import * as THREE from 'three';

/**
 * Parametrik modellerin ortak sozlesmesi.
 *
 * Fuze ve ucak ayni cerceveyi paylasir: lathe ekseni +Y, burun 0'da,
 * kuyruk L'de. Sahne ve GLB pisirici modeli z ekseninde 90° cevirip
 * yatiriyor; iki uretici de bu cerceveye uydugu icin tek kural yetiyor.
 */

/** Sematik palet — CSS tokenlarinin 3D karsiligi (--ink, --ink-2). */
export const SCHEMATIC = {
  surface: 0x9ba1a4,
  edge: 0x1c2124,
  dimension: 0x5c6367
} as const;

export interface ModelDimensions {
  /** Toplam uzunluk, metre — lathe ekseni boyunca. */
  L: number;
  /** Govde yaricapi, metre. Bolum odagi ve etiket ofseti bunu kullanir. */
  R: number;
  /**
   * En genis yanal yaricap, metre: fuzede kanatcik ucu, ucakta kanat ucu.
   * Genel gorunumun kadraji bunu hesaba katar, yoksa kanat ucu kesilir.
   */
  reach: number;
}

export interface ModelResult {
  group: THREE.Group;
  dimensions: ModelDimensions;
  /** Bellekten dusurmek icin. R3F unmount'ta cagirilmali. */
  dispose: () => void;
}

/**
 * Annotation konumu veriden türer: t = gövde boyunca oran (0..1),
 * angle = radyal açı (derece). Ölçüler değişse de etiket doğru yerde kalır.
 */
export function annotationPosition(
  t: number,
  angleDeg: number,
  dims: ModelDimensions,
  offset = 1.6
): THREE.Vector3 {
  const rad = (angleDeg * Math.PI) / 180;
  return new THREE.Vector3(
    Math.cos(rad) * dims.R * offset,
    t * dims.L,
    Math.sin(rad) * dims.R * offset
  );
}
