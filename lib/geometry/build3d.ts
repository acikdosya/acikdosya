import * as THREE from 'three';
import {
  bodyRadiusOf,
  panelSection,
  partsBounds,
  primaryBody,
  type LatheSpec,
  type Bounds,
  type DiscPart,
  type PanelPart,
  type Part,
  type StrutPart,
  type BoomPart
} from './parts';
import {SCHEMATIC} from './result';

/**
 * Parca listesinden sahne nesnesi.
 *
 * Malzeme, kontur, olcu cizgisi ve dispose TEK yerde. Onceki duzende her
 * urun kurucusu kendi malzemesini, kendi kontur kalinligini ve kendi
 * disposables dizisini tutuyordu; urun basina cogalan bir kod yigini.
 *
 * Cerceve lib/geometry/parts.ts ile ayni: +Y govde ekseni, +X yukari,
 * ±Z yanal. Sahne ve GLB pisirici ayni 90° cevirmeyi disaridan uygular.
 */

/**
 * Parca sinifi basina segment sayisi.
 *
 * Pervane diski ve tekerlek govdenin cozunurlugunu tasimak zorunda
 * degil; AKINCI'da parca sayisi ikiye katlanirken GLB'nin 3 MB altinda
 * kalmasi buna bagli (CLAUDE.md §6, design.md §9).
 */
export interface SegmentBudget {
  /** Govde ve gondol lathe segmentleri. Mobil 48, masaustu 72. */
  body: number;
  /** Pervane diski. */
  disc: number;
  /** Cubuk ve kiris gibi ince donel yuzeyler. */
  small: number;
}

export const DESKTOP_SEGMENTS: SegmentBudget = {body: 72, disc: 24, small: 12};
export const MOBILE_SEGMENTS: SegmentBudget = {body: 48, disc: 16, small: 8};

export interface SceneModel {
  group: THREE.Group;
  parts: readonly Part[];
  bounds: Bounds;
  /** Bellekten dusurmek icin. R3F unmount'ta cagirilmali. */
  dispose(): void;
}

export interface BuildOptions {
  segments?: Partial<SegmentBudget>;
  /**
   * Olcu cizgisinin govde yaricapina gore yanal ofseti. Fuzede 2,4,
   * kanatli hava aracinda 3,2 — ince govdeli bir sistemde cizgi govdeye
   * yapisik gorunmesin. 0 ise cizgi cizilmez.
   */
  dimensionOffsetRatio?: number;
}

/**
 * Yuzeyin lofting ile kurulmus geometrisi.
 *
 * Onceki surumde yuzeyler ExtrudeGeometry ile uretiliyordu: sabit
 * kalinlikta, dik kenarli bir plaka. Uc olcum bunun yanlis oldugunu
 * gosterdi — AKINCI'nin kanat kalinligi kokte 0,32 m, ucta 0,15 m ve
 * yerel vecheye orani acikligin tamaminda 0,152 sabit. Sabit kalinlikli
 * bir plaka bu iki ucu birden tutturamaz.
 *
 * Simdi her istasyonun kendi kesiti var ve aralari dortgen seritlerle
 * baglaniyor. Yan fayda: kanat ucu kivrimi ayri bir panel olmaktan
 * cikti, istasyonlarin `rise` degeriyle tasindigi icin birlesme
 * yerindeki sert kose ve dikey basamak da kalkti.
 */
function panelGeometry(part: PanelPart): THREE.BufferGeometry {
  const rings = part.stations.map(panelSection);
  const ring = rings[0]?.length ?? 0;
  const positions: number[] = [];
  const indices: number[] = [];

  for (const points of rings) {
    for (const point of points) positions.push(point.x, point.y, point.z);
  }

  // Komsu istasyonlari dortgen seritle bagla.
  for (let i = 0; i < rings.length - 1; i++) {
    const a = i * ring;
    const b = (i + 1) * ring;
    for (let j = 0; j < ring; j++) {
      const k = (j + 1) % ring;
      indices.push(a + j, b + j, b + k);
      indices.push(a + j, b + k, a + k);
    }
  }

  /*
   * Kok kapagi. Uc istasyonun kalinligi sifira gittiginde kesit zaten
   * bir cizgiye kapaniyor, orada kapak gerekmiyor; kok ise govdenin
   * icinde kaliyor ama yine de kapatiliyor, yoksa ic yuzey gorunur.
   */
  for (let j = 1; j < ring - 1; j++) {
    indices.push(0, j + 1, j);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Donel (ya da tek eksende olceklenmis) govde.
 *
 * Kesit profili yoksa bu yol kullanilir; fuze govdeleri buradan gecer ve
 * altin degerleri bu yuzden degismez.
 */
function circularGeometry(spec: LatheSpec, segments: number) {
  const points = spec.stations.map(
    (station) => new THREE.Vector2(Math.max(station.radius, 0.0005), station.y)
  );
  const geometry = new THREE.LatheGeometry(points, segments);
  if (spec.aspect !== 1) geometry.scale(spec.aspect, 1, 1);
  return geometry;
}

/**
 * Kesit profili olan govde — OVAL DEGIL.
 *
 * LatheGeometry yalniz dairesel kesit uretir, tek eksende olceklense de
 * sonuc elips kalir. AKINCI'nin on gorunusu govdenin damla bicimli
 * oldugunu gosteriyor: alt yari, ayni uzanimdaki bir elipsten 0,26
 * yarim ene kadar dar. Bu yuzden govde de yuzeyler gibi loft ediliyor —
 * her istasyonun kesiti olculen profilin yerel yaricapla olceklenmis
 * hali.
 */
function sectionGeometry(spec: LatheSpec, segments: number) {
  const profile = spec.section ?? [];
  // Kapali kesit: alttan uste sag kenar, sonra ustten alta sol kenar.
  const ring: Array<{u: number; w: number}> = [];
  for (const point of profile) ring.push({u: point.v, w: point.w});
  for (let i = profile.length - 2; i >= 1; i--) {
    ring.push({u: profile[i].v, w: -profile[i].w});
  }

  const positions: number[] = [];
  const indices: number[] = [];
  const count = ring.length;

  for (const station of spec.stations) {
    const radius = Math.max(station.radius, 0.0005);
    for (const point of ring) {
      positions.push(point.u * radius, station.y, point.w * radius);
    }
  }

  for (let i = 0; i < spec.stations.length - 1; i++) {
    const a = i * count;
    const b = (i + 1) * count;
    for (let j = 0; j < count; j++) {
      const k = (j + 1) % count;
      indices.push(a + j, b + j, b + k);
      indices.push(a + j, b + k, a + k);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  // Segment sayisi profil cozunurlugunden gelir; parametre burada kullanilmaz.
  void segments;
  return geometry;
}

/** Lathe ekseni yerel +Y; cerceve eksenine cevirme tek 90° donusle. */
function orientLathe(geometry: THREE.BufferGeometry, part: Part) {
  if (part.kind !== 'body' && part.kind !== 'pod') return;
  if (part.orientation === 'lateral') geometry.rotateX(Math.PI / 2);
  if (part.orientation === 'vertical') geometry.rotateZ(-Math.PI / 2);
}

class Builder {
  readonly group = new THREE.Group();
  private readonly disposables: Array<{dispose(): void}> = [];
  /** Ayni olculu paneller geometriyi paylasir — dort kanatcik tek sekil. */
  private readonly panelCache = new Map<string, THREE.BufferGeometry>();

  readonly surface = new THREE.MeshStandardMaterial({
    color: SCHEMATIC.surface,
    roughness: 0.86,
    metalness: 0.06
  });
  readonly edgeMaterial = new THREE.LineBasicMaterial({
    color: SCHEMATIC.edge,
    transparent: true,
    opacity: 0.34
  });

  constructor(readonly segments: SegmentBudget) {
    this.disposables.push(this.surface, this.edgeMaterial);
  }

  private own<T extends {dispose(): void}>(value: T): T {
    this.disposables.push(value);
    return value;
  }

  /** Yuzey + kontur. Sematik dil: mat yuzey, ince kenar (CLAUDE.md §9). */
  private addSolid(
    geometry: THREE.BufferGeometry,
    edgeAngle: number,
    parent: THREE.Object3D = this.group
  ) {
    const edges = this.own(new THREE.EdgesGeometry(geometry, edgeAngle));
    parent.add(new THREE.Mesh(geometry, this.surface));
    parent.add(new THREE.LineSegments(edges, this.edgeMaterial));
  }

  addLathe(part: Extract<Part, {kind: 'body' | 'pod'}>) {
    const geometry = this.own(
      part.spec.section
        ? sectionGeometry(part.spec, this.segments.body)
        : circularGeometry(part.spec, this.segments.body)
    );
    orientLathe(geometry, part);
    geometry.translate(part.origin.x, part.origin.y, part.origin.z);
    this.addSolid(geometry, 24);
  }

  addPanel(part: PanelPart) {
    /*
     * Ayni olculu yuzeyler geometriyi paylasir — dort kanatcik tek sekil.
     * Anahtar istasyon dizisinden turer.
     */
    const key = part.stations
      .map((s) => [s.span, s.rise, s.offset, s.chord, s.thickness].join(','))
      .join('|');

    let geometry = this.panelCache.get(key);
    if (!geometry) {
      geometry = this.own(panelGeometry(part));
      this.panelCache.set(key, geometry);
    }

    const pivot = new THREE.Group();
    pivot.rotation.y = (part.angleDeg * Math.PI) / 180;
    pivot.position.set(part.root.x, part.root.y, part.root.z);
    this.addSolid(geometry, 20, pivot);

    /*
     * Karsi yuzey YANSIMA, donus degil.
     *
     * Yansima pivot'un DISINDA uygulanir: once donus ve konum, sonra
     * merkez duzlemde aynalama. lib/geometry/parts.ts'teki sira da bu;
     * pivot'un kendi olcegine koymak once aynalayip sonra dondururdu ve
     * iki katman ayrisirdi.
     *
     * Donusle yapilsaydi (-90°) aciklik dogru yone giderdi ama "yukari"
     * ters donerdi: kanat ucu kivrimi bir yanda yukari, otekinde asagi
     * bakardi. Duz bir plakada gorunmeyen, kivrim eklenince goze batan
     * bir hata.
     */
    if (part.mirror) {
      const flip = new THREE.Group();
      flip.scale.z = -1;
      flip.add(pivot);
      this.group.add(flip);
      return;
    }

    this.group.add(pivot);
  }

  /**
   * Pervane: gobek ve kanatlar.
   *
   * Sematik kalir — kanat profili cizilmez, cunku kanat kesitine dair
   * kaynakli verimiz yok. Asil bilgi disk yaricapi.
   */
  addDisc(part: DiscPart) {
    const hub = this.own(
      new THREE.CylinderGeometry(
        part.hubRadius,
        part.hubRadius,
        part.thickness * 2,
        this.segments.disc
      )
    );
    // Silindir ekseni yerel +Y; disk normali cerceve eksenine cevrilir.
    if (part.orientation === 'lateral') hub.rotateX(Math.PI / 2);
    if (part.orientation === 'vertical') hub.rotateZ(-Math.PI / 2);
    hub.translate(part.center.x, part.center.y, part.center.z);
    this.addSolid(hub, 24);

    for (let i = 0; i < part.bladeCount; i++) {
      const blade = this.own(
        new THREE.BoxGeometry(
          part.radius - part.hubRadius,
          part.thickness,
          part.bladeChord
        )
      );
      blade.translate((part.radius + part.hubRadius) / 2, 0, 0);
      const pivot = new THREE.Group();
      pivot.position.set(part.center.x, part.center.y, part.center.z);
      pivot.rotation.set(0, 0, 0);
      const spin = (i * 2 * Math.PI) / part.bladeCount;
      if (part.orientation === 'along') pivot.rotation.y = spin;
      else if (part.orientation === 'lateral') pivot.rotation.z = spin;
      else pivot.rotation.x = spin;
      this.addSolid(blade, 24, pivot);
      this.group.add(pivot);
    }
  }

  /** Cubuk: iki nokta arasi silindir. Inis takimi bacagi, pilon. */
  addStrut(part: StrutPart) {
    const from = new THREE.Vector3(part.from.x, part.from.y, part.from.z);
    const to = new THREE.Vector3(part.to.x, part.to.y, part.to.z);
    const direction = new THREE.Vector3().subVectors(to, from);
    const length = direction.length();
    if (length <= 0) return;

    const geometry = this.own(
      new THREE.CylinderGeometry(
        part.radius,
        part.radius,
        length,
        this.segments.small
      )
    );
    // Silindir ekseni +Y; yonu iki nokta belirler.
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize()
    );
    geometry.applyQuaternion(quaternion);
    const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
    geometry.translate(mid.x, mid.y, mid.z);
    this.addSolid(geometry, 30);
  }

  /** Govdeye paralel ikincil kiris — cift kirisli duzenler icin. */
  addBoom(part: BoomPart) {
    const geometry = this.own(
      new THREE.CylinderGeometry(
        part.radius,
        part.radius,
        part.length,
        this.segments.small
      )
    );
    geometry.translate(
      part.start.x,
      part.start.y + part.length / 2,
      part.start.z
    );
    this.addSolid(geometry, 30);
  }

  /** Olcu cizgisi — sayfanin cetvel motifiyle ayni gorsel dil. */
  addDimensionLine(from: number, to: number, offset: number, tick: number) {
    const geometry = this.own(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(offset, from, 0),
        new THREE.Vector3(offset, to, 0),
        new THREE.Vector3(offset - tick, from, 0),
        new THREE.Vector3(offset + tick, from, 0),
        new THREE.Vector3(offset - tick, to, 0),
        new THREE.Vector3(offset + tick, to, 0)
      ])
    );
    const material = this.own(
      new THREE.LineBasicMaterial({
        color: SCHEMATIC.dimension,
        transparent: true,
        opacity: 0.6
      })
    );
    this.group.add(new THREE.LineSegments(geometry, material));
  }

  dispose = () => {
    for (const item of this.disposables) item.dispose();
  };
}

/**
 * Parca listesinden sahne.
 *
 * Sinirlar parca listesinden turer; elle yazilmis ikinci bir hesap yok
 * (specs/system-geometry). Kadraj bu sayilari okur.
 */
export function buildGroup(
  parts: readonly Part[],
  options: BuildOptions = {}
): SceneModel {
  const segments = {...DESKTOP_SEGMENTS, ...options.segments};
  const builder = new Builder(segments);

  for (const part of parts) {
    switch (part.kind) {
      case 'body':
      case 'pod':
        builder.addLathe(part);
        break;
      case 'panel':
        builder.addPanel(part);
        break;
      case 'disc':
        builder.addDisc(part);
        break;
      case 'strut':
        builder.addStrut(part);
        break;
      case 'boom':
        builder.addBoom(part);
        break;
    }
  }

  const offsetRatio = options.dimensionOffsetRatio ?? 2.4;
  const body = primaryBody(parts);
  if (body && offsetRatio > 0) {
    // Anma yaricapi: yerel omuz sismesi cizgiyi disari itmemeli.
    const radius = bodyRadiusOf(body);
    const stations = body.spec.stations;
    builder.addDimensionLine(
      body.origin.y + (stations[0]?.y ?? 0),
      body.origin.y + (stations[stations.length - 1]?.y ?? 0),
      -radius * offsetRatio,
      radius * 0.25
    );
  }

  return {
    group: builder.group,
    parts,
    bounds: partsBounds(parts),
    dispose: builder.dispose
  };
}
