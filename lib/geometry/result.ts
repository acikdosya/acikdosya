import * as THREE from 'three';
import {
  findPart,
  partAnchor,
  primaryBody,
  type Bounds,
  type Part
} from './parts';

/**
 * Parametrik modellerin ortak sozlesmesi.
 *
 * Butun urunler ayni cerceveyi paylasir: +Y govde ekseni (burun 0, kuyruk
 * L), +X yukari, ±Z yanal. Sahne ve GLB pisirici ayni 90° cevirmeyi
 * uyguladigi icin tek kural yetiyor.
 */

/** Sematik palet — CSS tokenlarinin 3D karsiligi (--ink, --ink-2). */
export const SCHEMATIC = {
  surface: 0x9ba1a4,
  edge: 0x1c2124,
  dimension: 0x5c6367
} as const;

/**
 * Modelin cerceve olculeri.
 *
 * Onceki sozlesme `{L, R, reach}` idi ve eksenel bir govde varsayiyordu;
 * `R` "govde yaricapi" demekti ve eksensiz bir urunde anlami yoktu.
 * Artik asil kaynak SINIR KUTUSU: parca listesinden turer, her urun
 * turunde anlamlidir. Adlandirilmis alanlar onun uzerinden okunur ve
 * govdesi olmayan bir uruende de tanimli kalir.
 */
export interface ModelFrame {
  /** Parca listesinin sinir kutusu — olcu cizgisi dahil DEGIL. */
  bounds: Bounds;
  /** Govde ekseni boyunca uzunluk, metre. */
  length: number;
  /** Govde yaricapi, metre. Etiket ofseti ve golge duzlemi bunu kullanir. */
  bodyRadius: number;
  /** En genis yanal yaricap: fuzede kanatcik ucu, ucakta kanat ucu. */
  reach: number;
}

export interface ModelResult {
  group: THREE.Group;
  /** Sahneyi ureten parca listesi — etiket cozumlemesi bunu okur. */
  parts: readonly Part[];
  frame: ModelFrame;
  /** Bellekten dusurmek icin. R3F unmount'ta cagirilmali. */
  dispose: () => void;
}

/** Etiketin hangi parcaya ve o parcanin neresine baglandigi. */
export interface AnnotationTarget {
  /** Parca kimligi. Verilmezse birincil govde. */
  part?: string;
  /** Parca uzerindeki oran, 0 bas 1 son. */
  t: number;
  /** Radyal aci, derece. Yalniz donel govdede anlamli. */
  angle?: number;
}

/**
 * Etiket konumu.
 *
 * Konum mutlak koordinat DEGIL, parca uzerindeki orandir: olculer
 * guncellenince etiket kendiliginden dogru yerde kalir (CLAUDE.md §9).
 *
 * Hedef parca bulunamazsa undefined doner. Yanlis yerde duran bir etiket,
 * hic olmayan bir etiketten daha kotudur.
 */
export function annotationPosition(
  parts: readonly Part[],
  target: AnnotationTarget,
  offset = 1.6
): THREE.Vector3 | undefined {
  const part = target.part ? findPart(parts, target.part) : primaryBody(parts);
  if (!part) return undefined;

  const point = partAnchor(part, target.t, target.angle, offset);
  return new THREE.Vector3(point.x, point.y, point.z);
}
