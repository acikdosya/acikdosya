import * as THREE from 'three';
import type {ModelFrame} from './result';

/**
 * Kamera kadraji — olcuden turer, elle yazilmis kamera konumu yok.
 *
 * Sahne bileseninden AYRI dosyada: burasi yalniz three'ye bagli, R3F'e
 * degil, yani sinanabilir. Kadraj kurallari bu projenin en sessiz
 * hatalarinin ciktigi yer (bir zamanlar bildirilen erisim mesh'ten
 * dardi ve kanatciklar kesiliyordu), o yuzden testlenebilir olmali.
 *
 * Sahne modeli Z ekseninde 90° ceviriyor: model +Y (govde ekseni) dunya
 * -X'e, model +X (yukari) dunya +Y'ye gidiyor. Burun +L/2'de, kuyruk
 * -L/2'de.
 */

/** Kamera on ayari. Odak hedefi bir PARCA uzerindeki orandir. */
export type ViewSpec =
  | {kind: 'overview'}
  | {kind: 'front'}
  | {kind: 'focus'; part: string; t: number; angle?: number};

export interface Goal {
  target: THREE.Vector3;
  position: THREE.Vector3;
}

/**
 * Modelin yatay yaricapi: govde yarim uzunlugu ile kanat/kanatcik ucu.
 * Model kendi ekseninde dondugu icin kadraj bu yaricapi kullanmali —
 * yalniz uzunluga bakan bir kadraj, AKINCI gibi kanat acikligi
 * govdesinden uzun bir sistemde kanat ucunu keser.
 */
export function horizontalRadius(frame: ModelFrame): number {
  return Math.hypot(frame.length / 2, frame.reach);
}

export function goalFor(
  frame: ModelFrame,
  view: ViewSpec,
  focus: {x: number; y: number} | undefined,
  fov: number,
  aspect: number
): Goal {
  const tan = Math.tan(((fov * Math.PI) / 180) / 2);

  if (view.kind === 'front') {
    /*
     * On gorunus: burun ucuna bakilir. Kadraj kanat acikligini yatayda,
     * modelin dikey uzanimini dikeyde cerceveye alir — iki boyutlu
     * semadaki 'front' izdusumuyle ayni eksen (specs/system-silhouette).
     * Mesafeye govde yarim boyu eklenir, yoksa kamera burnun icinde
     * kalir.
     */
    const halfSpan = frame.reach;
    const top = frame.bounds.max.x;
    const bottom = frame.bounds.min.x;
    const centre = (top + bottom) / 2;
    const halfHeight = (top - bottom) / 2;

    const distance =
      Math.max(halfSpan / (tan * aspect), halfHeight / tan) * 1.25 +
      frame.length / 2;

    return {
      target: new THREE.Vector3(0, centre, 0),
      position: new THREE.Vector3(distance, centre, 0)
    };
  }

  if (view.kind === 'overview' || !focus) {
    /*
     * Kamera yuksekligi sabit bir oran DEGIL: kameraya donuk kanat ucu
     * en yakin nokta ve yukseklik arttikca kadrajin altindan tasar. Bu
     * yuzden yukseklik, en yakin noktanin dikey gorus acisina gore
     * sinirlanir.
     */
    const radius = horizontalRadius(frame);
    const distance = Math.max(radius / (tan * aspect * 0.85), radius * 1.2);
    const nearest = Math.max(distance - radius, radius * 0.2);
    const height = Math.min(radius * 0.3, tan * nearest * 0.8);

    return {
      target: new THREE.Vector3(0, 0, 0),
      position: new THREE.Vector3(0, height, distance)
    };
  }

  // Odak: hedef nokta parca uzerinde cozuldu, model cercevesinde geldi.
  const x = frame.length / 2 - focus.y;
  const y = focus.x;
  const R = frame.bodyRadius;
  const distance = Math.max((R * 7) / (2 * tan), R * 3);
  return {
    target: new THREE.Vector3(x, y, 0),
    position: new THREE.Vector3(x, y + R * 1.2, distance)
  };
}
