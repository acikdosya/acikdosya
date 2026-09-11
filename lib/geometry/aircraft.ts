import * as THREE from 'three';
import {SCHEMATIC, type ModelResult} from './result';

/**
 * Parametrik ucak govdesi.
 *
 * Hazir model kullanilmaz; olcek iki kaynakli sayidan gelir: gövde
 * uzunlugu ve kanat acikligi. Bu ikisi degisirse mesh degisir.
 *
 * Geri kalan oranlar yayimlanmis SAYI degildir. Sistem basina ayri bir
 * profil dosyasinda durur (ornek: lib/geometry/akinci.ts) ve her biri
 * nereden geldigini yazar: bir kismi ureticinin yayimladigi gorsellerden
 * olculmus oranlardir, bir kismi hala secilmis degerdir. Ikisi ayni
 * sey degil; profil dosyasi hangisinin hangisi oldugunu soyler,
 * sayfadaki not da okuyucuya bunu aktarir.
 *
 * Modellenmeyenler — gorsel referansi yeterli olmayan ayrintilar:
 * motor, pervane, iniş takimi, anten, yuk istasyonu. Iniş takimi
 * modellenmedigi icin modelin dikey olcusu, tablodaki yukseklik
 * degeri DEGILDIR; o deger takimi iceriyor.
 *
 * Cerceve result.ts'teki ortak sozlesme: lathe ekseni +Y (burun 0,
 * kuyruk L), yukari +X, kanat acikligi ±Z. Sahne ve GLB pisirici ayni
 * 90° cevirmeyi uyguladigi icin fuze ile ucak ayni kurali paylasir.
 */

export interface AircraftProfile {
  /** Govde capi / uzunluk. */
  fuselageRatio: number;
  /** Burun bolumu / uzunluk. */
  noseRatio: number;
  /** Kuyruk konisi / uzunluk. */
  tailConeRatio: number;
  /** Koni ucundaki yaricap / govde yaricapi. */
  tailTipRatio: number;
  /** Kanat hucum kenarinin govde boyunca orani. */
  wingPositionT: number;
  /** Kanat kok vechesi / uzunluk. */
  wingChordRatio: number;
  /** Uc veche / kok veche. */
  wingTaper: number;
  /** Hucum kenari ok acisi, derece. */
  wingSweepDeg: number;
  /** Kanat kalinligi / kok veche. */
  wingThicknessRatio: number;
  /** Kanat ucu kivriminin yatay payi / yarim aciklik. */
  tipSpanRatio: number;
  /** Kanat ucu kivriminin yataydan yukselisi, derece. */
  tipRiseDeg: number;
  /** V kuyrugun govde boyunca orani. */
  tailPositionT: number;
  /** Kuyruk ucunun govde ekseninden yuksekligi / uzunluk. */
  tailHeightRatio: number;
  /** Kuyruk kok vechesi / uzunluk. */
  tailChordRatio: number;
  /** V kuyrugun dikeyden sapmasi, derece. */
  tailDihedralDeg: number;
}

export interface AircraftSpec {
  /** Toplam uzunluk, metre. content.specs.length_m[0].value */
  lengthM: number;
  /** Kanat acikligi, metre. content.specs.wingspan_m[0].value */
  wingspanM: number;
  profile: AircraftProfile;
  /** Lathe segment sayisi — mobilde 48, masaustunde 72. */
  radialSegments?: number;
}

/** Govde yaricapi, metre. Kadraj hesabi mesh kurmadan buna bakar. */
export function fuselageRadius(
  lengthM: number,
  profile: AircraftProfile
): number {
  return (lengthM * profile.fuselageRatio) / 2;
}

/**
 * Govde kesiti: eliptik burun, silindirik orta, konik kuyruk.
 * Lathe (yaricap, eksen) ciftleri bekler.
 */
function fuselageProfile(
  L: number,
  R: number,
  profile: AircraftProfile,
  steps = 20
): THREE.Vector2[] {
  const nose = L * profile.noseRatio;
  const cone = L * profile.tailConeRatio;
  const points: THREE.Vector2[] = [];

  for (let i = 0; i <= steps; i++) {
    const y = (i / steps) * nose;
    const k = (nose - y) / nose;
    const r = R * Math.sqrt(Math.max(0, 1 - k * k));
    // Lathe'in dejenere ucgen uretmemesi icin minimum yaricap.
    points.push(new THREE.Vector2(Math.max(r, 0.0005), y));
  }

  points.push(new THREE.Vector2(R, L - cone));
  points.push(new THREE.Vector2(R * profile.tailTipRatio, L));
  return points;
}

/** Trapez panel: x spanwise, y veche yonunde (govde ekseni). */
function panelShape(
  span: number,
  rootChord: number,
  tipChord: number,
  sweepDeg: number
): THREE.Shape {
  const offset = span * Math.tan((sweepDeg * Math.PI) / 180);
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0, rootChord);
  shape.lineTo(span, offset + tipChord);
  shape.lineTo(span, offset);
  shape.closePath();
  return shape;
}

export function buildAircraft(spec: AircraftSpec): ModelResult {
  const {lengthM: L, wingspanM, profile, radialSegments = 72} = spec;

  const R = fuselageRadius(L, profile);
  const halfSpan = wingspanM / 2;
  const group = new THREE.Group();
  const disposables: Array<{dispose(): void}> = [];

  const surface = new THREE.MeshStandardMaterial({
    color: SCHEMATIC.surface,
    roughness: 0.86,
    metalness: 0.06
  });
  const edgeMat = new THREE.LineBasicMaterial({
    color: SCHEMATIC.edge,
    transparent: true,
    opacity: 0.34
  });
  disposables.push(surface, edgeMat);

  // govde
  const bodyGeo = new THREE.LatheGeometry(
    fuselageProfile(L, R, profile),
    radialSegments
  );
  const edgeGeo = new THREE.EdgesGeometry(bodyGeo, 24);
  disposables.push(bodyGeo, edgeGeo);
  group.add(new THREE.Mesh(bodyGeo, surface));
  group.add(new THREE.LineSegments(edgeGeo, edgeMat));

  /**
   * Bir yuzey: kanat yarisi, kanat ucu kivrimi ya da kuyruk paneli.
   *
   * `angleDeg` panelin acilma yonu; 0 dik yukari (+X), ±90° yatay (±Z).
   * Govde ekseni Y oldugu icin Y etrafindaki donus vecheyi bozmaz.
   * `rootY`/`rootZ` panelin kok noktasi — kanat ucu paneli ana kanadin
   * bittigi yerden baslar.
   */
  function addPanel(options: {
    span: number;
    rootChord: number;
    tipChord: number;
    sweepDeg: number;
    thickness: number;
    rootY: number;
    rootZ?: number;
    angleDeg: number;
  }) {
    const geometry = new THREE.ExtrudeGeometry(
      panelShape(
        options.span,
        options.rootChord,
        options.tipChord,
        options.sweepDeg
      ),
      {depth: options.thickness, bevelEnabled: false}
    );
    geometry.translate(0, 0, -options.thickness / 2);
    const edges = new THREE.EdgesGeometry(geometry, 20);
    disposables.push(geometry, edges);

    const pivot = new THREE.Group();
    pivot.rotation.y = (options.angleDeg * Math.PI) / 180;
    pivot.position.set(0, options.rootY, options.rootZ ?? 0);

    pivot.add(new THREE.Mesh(geometry, surface));
    pivot.add(new THREE.LineSegments(edges, edgeMat));

    group.add(pivot);
  }

  /*
   * Kanat iki parca: ana panel ve yukari donen uc. Kanat acikligi
   * kaynakli oldugu icin ikisinin YATAY toplami tam olarak yarim
   * acikliktir; uc parca yukari donunce kendi boyu uzar, acikligi
   * buyutmez.
   */
  const wingChord = L * profile.wingChordRatio;
  const wingY = L * profile.wingPositionT;
  const wingTipChord = wingChord * profile.wingTaper;
  const thickness = wingChord * profile.wingThicknessRatio;
  const sweep = Math.tan((profile.wingSweepDeg * Math.PI) / 180);

  const mainSpan = halfSpan * (1 - profile.tipSpanRatio);
  const tipRise = (profile.tipRiseDeg * Math.PI) / 180;
  /*
   * Uc panelin yatay erisimi: boyunun kosinus payi arti kalinliginin
   * sinus payi. Kalinlik hesaba katilmazsa model, kaynakli kanat
   * acikligindan birkac santim genis cikar.
   */
  const tipSpan =
    (halfSpan - mainSpan - (thickness * 0.8 * Math.sin(tipRise)) / 2) /
    Math.cos(tipRise);

  const wingPanel = {
    span: mainSpan,
    rootChord: wingChord,
    tipChord: wingTipChord,
    sweepDeg: profile.wingSweepDeg,
    thickness,
    rootY: wingY
  };
  const tipPanel = {
    span: tipSpan,
    rootChord: wingTipChord,
    tipChord: wingTipChord * 0.8,
    sweepDeg: profile.wingSweepDeg,
    thickness: thickness * 0.8,
    rootY: wingY + mainSpan * sweep
  };

  for (const side of [1, -1]) {
    addPanel({...wingPanel, angleDeg: 90 * side});
    addPanel({
      ...tipPanel,
      rootZ: -mainSpan * side,
      angleDeg: (90 - profile.tipRiseDeg) * side
    });
  }

  /*
   * V kuyruk. Olculen sey kuyruk ucunun govde ekseninden yuksekligi;
   * dikeyden sapma acisi secilmis bir deger. Panel boyu ikisinden
   * turer, boylece olculen yukseklik korunur.
   */
  const tailChord = L * profile.tailChordRatio;
  const dihedral = (profile.tailDihedralDeg * Math.PI) / 180;
  const tailPanel = {
    span: (L * profile.tailHeightRatio) / Math.cos(dihedral),
    rootChord: tailChord,
    tipChord: tailChord * profile.wingTaper,
    sweepDeg: profile.wingSweepDeg,
    thickness: tailChord * profile.wingThicknessRatio,
    rootY: L * profile.tailPositionT
  };
  addPanel({...tailPanel, angleDeg: profile.tailDihedralDeg});
  addPanel({...tailPanel, angleDeg: -profile.tailDihedralDeg});

  // olcu cizgisi — sayfanin cetvel motifiyle ayni gorsel dil
  const off = -R * 3.2;
  const dimGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(off, 0, 0),
    new THREE.Vector3(off, L, 0),
    new THREE.Vector3(off - R * 0.25, 0, 0),
    new THREE.Vector3(off + R * 0.25, 0, 0),
    new THREE.Vector3(off - R * 0.25, L, 0),
    new THREE.Vector3(off + R * 0.25, L, 0)
  ]);
  const dimMat = new THREE.LineBasicMaterial({
    color: SCHEMATIC.dimension,
    transparent: true,
    opacity: 0.6
  });
  disposables.push(dimGeo, dimMat);
  group.add(new THREE.LineSegments(dimGeo, dimMat));

  return {
    group,
    // reach: kanat ucu — kadraj govdeye gore degil buna gore kurulur.
    dimensions: {L, R, reach: halfSpan},
    dispose: () => disposables.forEach((item) => item.dispose())
  };
}
