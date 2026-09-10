import * as THREE from 'three';

/**
 * Parametrik füze gövdesi.
 *
 * Hiçbir hazır model kullanılmaz — geometri yalnızca içerik dosyasındaki
 * ölçü alanlarından türetilir. Veri değişirse mesh değişir.
 *
 * Burun profili teğet ogive:
 *   rho = (R² + Ln²) / 2R
 *   y(x) = sqrt(rho² − (Ln − x)²) + R − rho     0 ≤ x ≤ Ln
 * Bu, y(0) = 0 ve y(Ln) = R sınır koşullarını sağlar; gövdeye teğet geçer.
 */

export interface MissileSpec {
  /** Toplam uzunluk, metre. content.specs.length_m[0].value */
  lengthM: number;
  /** Gövde çapı, milimetre. content.specs.diameter_mm[0].value */
  diameterMm: number;
  /** Burun bölümünün toplam uzunluğa oranı. Yayımlanmamışsa varsayılan. */
  noseRatio?: number;
  /** Kuyruk daralması (boattail) oranı. */
  boattail?: number;
  /** Kanatçık sayısı. */
  finCount?: number;
  /** Lathe segment sayısı — mobilde 48, masaüstünde 72. */
  radialSegments?: number;
}

export interface MissileResult {
  group: THREE.Group;
  /** Uzunluk (m) ve yarıçap (m) — annotation konumlandırması bunları kullanır. */
  dimensions: { L: number; R: number };
  /** Bellekten düşürmek için. R3F unmount'ta çağırılmalı. */
  dispose: () => void;
}

/** Sematik palet — CSS tokenlarinin 3D karsiligi (--ink, --ink-2). */
export const SCHEMATIC = {
  surface: 0x9ba1a4,
  edge: 0x1c2124,
  dimension: 0x5c6367,
} as const;

function profile(spec: Required<Pick<MissileSpec, 'lengthM' | 'diameterMm'>> &
  { noseRatio: number; boattail: number }, steps = 28): THREE.Vector2[] {
  const L = spec.lengthM;
  const R = spec.diameterMm / 2000;
  const Ln = L * spec.noseRatio;
  const rho = (R * R + Ln * Ln) / (2 * R);

  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * Ln;
    const y = Math.sqrt(Math.max(0, rho * rho - (Ln - x) ** 2)) + R - rho;
    // Lathe'in dejenere üçgen üretmemesi için minimum yarıçap
    pts.push(new THREE.Vector2(Math.max(y, 0.0005), x));
  }
  pts.push(new THREE.Vector2(R, L * 0.88));
  pts.push(new THREE.Vector2(R * spec.boattail, L));
  return pts;
}

export function buildMissile(spec: MissileSpec): MissileResult {
  const {
    lengthM, diameterMm,
    noseRatio = 0.22, boattail = 0.94,
    finCount = 4, radialSegments = 72,
  } = spec;

  const L = lengthM;
  const R = diameterMm / 2000;
  const group = new THREE.Group();
  const disposables: Array<{ dispose(): void }> = [];

  const surface = new THREE.MeshStandardMaterial({
    color: SCHEMATIC.surface, roughness: 0.86, metalness: 0.06,
  });
  const edgeMat = new THREE.LineBasicMaterial({
    color: SCHEMATIC.edge, transparent: true, opacity: 0.34,
  });
  disposables.push(surface, edgeMat);

  // gövde
  const bodyGeo = new THREE.LatheGeometry(
    profile({ lengthM, diameterMm, noseRatio, boattail }), radialSegments);
  const edgeGeo = new THREE.EdgesGeometry(bodyGeo, 24);
  disposables.push(bodyGeo, edgeGeo);
  group.add(new THREE.Mesh(bodyGeo, surface));
  group.add(new THREE.LineSegments(edgeGeo, edgeMat));

  // kanatçıklar
  const span = R * 1.9;
  const root = L * 0.14;
  const tip = root * 0.42;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(root, 0);
  shape.lineTo(root, span);
  shape.lineTo(root - tip, span);
  shape.closePath();

  const finGeo = new THREE.ExtrudeGeometry(shape, { depth: R * 0.09, bevelEnabled: false });
  finGeo.translate(0, 0, -R * 0.045);
  const finEdge = new THREE.EdgesGeometry(finGeo, 20);
  disposables.push(finGeo, finEdge);

  for (let i = 0; i < finCount; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.y = (i * 2 * Math.PI) / finCount;

    const fin = new THREE.Mesh(finGeo, surface);
    fin.rotation.set(-Math.PI / 2, 0, 0);
    fin.position.y = L - root;
    pivot.add(fin);

    const outline = new THREE.LineSegments(finEdge, edgeMat);
    outline.rotation.copy(fin.rotation);
    outline.position.copy(fin.position);
    pivot.add(outline);

    group.add(pivot);
  }

  // ölçü çizgisi — sayfanın cetvel motifiyle aynı görsel dil
  const off = -R * 2.4;
  const dimGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(off, 0, 0), new THREE.Vector3(off, L, 0),
    new THREE.Vector3(off - R * 0.25, 0, 0), new THREE.Vector3(off + R * 0.25, 0, 0),
    new THREE.Vector3(off - R * 0.25, L, 0), new THREE.Vector3(off + R * 0.25, L, 0),
  ]);
  const dimMat = new THREE.LineBasicMaterial({
    color: SCHEMATIC.dimension, transparent: true, opacity: 0.6,
  });
  disposables.push(dimGeo, dimMat);
  group.add(new THREE.LineSegments(dimGeo, dimMat));

  return {
    group,
    dimensions: { L, R },
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}

/**
 * Annotation konumu veriden türer: t = gövde boyunca oran (0..1),
 * angle = radyal açı (derece). Ölçüler değişse de etiket doğru yerde kalır.
 */
export function annotationPosition(
  t: number, angleDeg: number, dims: { L: number; R: number }, offset = 1.6,
): THREE.Vector3 {
  const rad = (angleDeg * Math.PI) / 180;
  return new THREE.Vector3(
    Math.cos(rad) * dims.R * offset,
    t * dims.L,
    Math.sin(rad) * dims.R * offset,
  );
}
