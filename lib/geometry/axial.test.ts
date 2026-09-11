import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as THREE from 'three';
import {ATMACA} from './atmaca';
import {axialProduct} from './axial';
import {buildGroup} from './build3d';
import {buildModel, frameFromParts} from './model';
import {buildParts} from './product';
import {chosen} from './ratio';
import {TAYFUN} from './tayfun';

/**
 * Eksenel govdenin altin degerleri.
 *
 * Parca kitine tasima oncesinde yazildi ve tasima sonrasinda ayni
 * degerleri bekliyor (tasks 1.4, 1.6). Sayilar sihirli degil: her biri
 * yayimlanmis olcuden ya da urun tanimindaki orandan turuyor, test de
 * turetmeyi tekrar ediyor ki bir gun oran degisirse test de degissin.
 *
 * Kanatcik yonelimi bu dosyanin asil konusu. Once sekil (veche, aciklik)
 * sirasiyla kuruluyor, sonra mesh X etrafinda -90° cevriliyordu; bu,
 * kalinligi govde eksenine tasiyip kanatcigi govdeye DIK bir plakaya
 * ceviriyordu. Yan etkisi kadrajdi: mesh 1,82 m genisken reach 0,58 m
 * bildiriyordu. Asagidaki "bildirilen reach gercek yanal uzanimla ayni"
 * sinavi o hatayi bir daha gecirmez.
 */

/** content/systems/*.json icindeki yayimlanmis olculer. */
const CASES = [
  {product: TAYFUN, label: 'TAYFUN', dims: {length_m: 6.5, diameter_mm: 610}},
  {product: TAYFUN, label: 'TAYFUN Blok-4', dims: {length_m: 10, diameter_mm: 938}},
  {product: ATMACA, label: 'ATMACA', dims: {length_m: 4.3, diameter_mm: 370}}
] as const;

/**
 * Lathe segment sayisi → toplam kose sayisi. Mobil 48, masaustu 72.
 *
 * Yuzeyler duz plakadan lofting'e gectiginde bilerek degisti: her
 * istasyonun kendi kesiti var. Kanatcigin CIZILEN kalinligi degismedi
 * (0,0273 m), yalniz oranin tanimi govde yaricapindan yerel vecheye
 * tasindi.
 */
const VERTICES_BY_SEGMENTS: Record<number, number> = {48: 4317, 72: 5109};

/** Olcu cizgisi ofseti urun tanimindan gelir; varsayilan 2,4. */
function dimensionOffset(product: (typeof CASES)[number]['product']): number {
  return product.dimensionOffsetRatio ?? 2.4;
}

function inspect(group: THREE.Object3D) {
  group.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(group);
  let vertices = 0;
  let meshes = 0;
  let lines = 0;
  group.traverse((object) => {
    const geometry = (object as THREE.Mesh).geometry as
      | THREE.BufferGeometry
      | undefined;
    if (!geometry?.attributes?.position) return;
    vertices += geometry.attributes.position.count;
    if ((object as THREE.Mesh).isMesh) meshes++;
    else lines++;
  });
  return {box, vertices, meshes, lines};
}

/**
 * En genis yanal uzanim: kanat varsa kanat ucu, yoksa kanatcik ucu.
 * ATMACA'nin govde ortasi kanatlari kanatciklardan disarida.
 */
function reachRatio(product: (typeof CASES)[number]['product']): number {
  const ratios = product.ratios as Record<string, {value: number}>;
  return Math.max(
    ratios.finSpanRatio.value,
    ratios.wingSpanRatio?.value ?? 0
  );
}

for (const item of CASES) {
  const R = item.dims.diameter_mm / 2000;
  const finSpan = R * reachRatio(item.product);

  test(`${item.label}: sinir kutusu olcuden turer`, () => {
    const model = buildModel({
      systemSlug: item.product.slug,
      dimensions: {
        kind: 'missile',
        lengthM: item.dims.length_m,
        diameterMm: item.dims.diameter_mm
      },
      radialSegments: 72
    });
    assert.ok(model, 'model uretilmeli');
    const {box} = inspect(model.group);

    // Govde ekseni: burun 0, kuyruk L.
    assert.equal(+box.min.y.toFixed(6), 0);
    assert.equal(+box.max.y.toFixed(6), item.dims.length_m);

    // Yanal uzanim kanatcik ucu kadar, her yonde.
    assert.equal(+box.max.z.toFixed(6), +finSpan.toFixed(6));
    assert.equal(+box.min.z.toFixed(6), +(-finSpan).toFixed(6));
    assert.equal(+box.max.x.toFixed(6), +finSpan.toFixed(6));

    /*
     * Solda en disarida duran sey olcu cizgisi olmali: cizgi yuzeylerin
     * icinden gecerse okunmaz. ATMACA'da govde ortasi kanat 2,74
     * yaricapta oldugu icin ofset urun basina bildiriliyor.
     */
    const ruler = -R * dimensionOffset(item.product) - R * 0.25;
    assert.equal(+box.min.x.toFixed(6), +ruler.toFixed(6));
    assert.ok(
      Math.abs(ruler) > finSpan,
      `olcu cizgisi ${ruler} en genis yuzeyin (${finSpan}) icinde kaliyor`
    );
  });

  test(`${item.label}: bildirilen reach gercek yanal uzanimla ayni`, () => {
    const parts = buildParts(item.product, item.dims);
    assert.ok(parts);
    const scene = buildGroup(parts, {dimensionOffsetRatio: 0});
    const {box} = inspect(scene.group);
    const lateral = Math.max(box.max.z, -box.min.z, box.max.x, -box.min.x);
    assert.equal(
      +lateral.toFixed(6),
      +frameFromParts(parts).reach.toFixed(6),
      'kadraj reach okuyor; mesh ondan genisse kanatcik kesilir'
    );
  });

  test(`${item.label}: olcu eksikse parca uretilmez`, () => {
    assert.equal(
      buildParts(item.product, {length_m: item.dims.length_m}),
      undefined
    );
  });
}

for (const segments of [48, 72]) {
  test(`${segments} segment sabit kose sayisi verir`, () => {
    const parts = buildParts(TAYFUN, {length_m: 6.5, diameter_mm: 610});
    assert.ok(parts);
    const scene = buildGroup(parts, {
      segments: {body: segments},
      dimensionOffsetRatio: dimensionOffset(TAYFUN)
    });
    const {vertices, meshes, lines} = inspect(scene.group);
    assert.equal(vertices, VERTICES_BY_SEGMENTS[segments]);
    // govde + dort kanatcik
    assert.equal(meshes, 5);
    // govde konturu + dort kanatcik konturu + olcu cizgisi
    assert.equal(lines, 6);
  });
}

test('kanatcik plakasi govdeye DIK degil, veche govde ekseni boyunca', () => {
  const single = axialProduct({
    slug: 'tek-kanatcik',
    category: 'balistik-fuze',
    ratios: {
      ...TAYFUN.ratios,
      finCount: chosen(1, {note: {tr: 'test', en: 'test'}})
    }
  });
  const parts = buildParts(single, {length_m: 6.5, diameter_mm: 610});
  assert.ok(parts);
  const scene = buildGroup(parts, {dimensionOffsetRatio: 0});
  scene.group.updateMatrixWorld(true);

  const meshes: THREE.Mesh[] = [];
  scene.group.traverse((object) => {
    if ((object as THREE.Mesh).isMesh) meshes.push(object as THREE.Mesh);
  });
  // govde ve tek kanatcik
  assert.equal(meshes.length, 2);

  const box = new THREE.Box3().setFromObject(meshes[1]);
  const size = new THREE.Vector3();
  box.getSize(size);

  const R = 0.305;
  const ratios = TAYFUN.ratios;
  const rootChord = 6.5 * ratios.finChordRatio.value;
  // veche: govde ekseni boyunca
  assert.equal(+size.y.toFixed(6), +rootChord.toFixed(6));
  // aciklik: radyal, kok eksende, uc finSpanRatio'da
  assert.equal(+size.x.toFixed(6), +(R * ratios.finSpanRatio.value).toFixed(6));
  // kalinlik: oteki radyal eksende, YEREL vecheye orantili, en ince olan
  assert.equal(
    +size.z.toFixed(6),
    +(rootChord * ratios.finThicknessRatio.value).toFixed(6)
  );
  assert.ok(size.z < size.x && size.z < size.y, 'kalinlik en ince eksen olmali');

  // kanatcik kuyrukta biter
  assert.equal(+box.max.y.toFixed(6), 6.5);
});

test('profili tanimsiz sistem icin model uretilmez', () => {
  const model = buildModel({
    systemSlug: 'bilinmeyen',
    dimensions: {kind: 'missile', lengthM: 6.5, diameterMm: 610}
  });
  assert.equal(model, undefined);
});

test('ATMACA burnu daha kut — ureticinin cizimi oyle gosteriyor', () => {
  assert.ok(
    ATMACA.ratios.noseRatio.value < TAYFUN.ratios.noseRatio.value,
    'kut radome, sivri ogive degil'
  );
});

test('TAYFUN oranlarinin tamami secilmis — ortografik kaynagi yok', () => {
  for (const [key, ratio] of Object.entries(TAYFUN.ratios)) {
    assert.equal(
      ratio.basis,
      'chosen',
      `tayfun.${key} olculmus isaretli; ortografik referans gorsel yok`
    );
  }
});

/* ------------------------------------------- ATMACA: olculmus geometri */

test('ATMACA iki yuzey grubu tasir: govde ortasi kanat ve kuyruk kanatcigi', () => {
  const parts = buildParts(ATMACA, {length_m: 4.3, diameter_mm: 370});
  assert.ok(parts);
  assert.equal(parts.filter((part) => part.id.startsWith('fin-')).length, 4);
  assert.equal(parts.filter((part) => part.id.startsWith('wing-')).length, 4);
  // govde + dort kanatcik + dort kanat
  assert.equal(parts.length, 9);
});

test('ATMACA kanadi kanatcigindan disarida ve daha genis vecheli', () => {
  const r = ATMACA.ratios as Record<string, {value: number}>;
  assert.ok(r.wingSpanRatio.value > r.finSpanRatio.value);
  assert.ok(r.wingChordRatio.value > r.finChordRatio.value);
});

test('ATMACA kanatciginin firar kenari govde eksenine dik', () => {
  const r = ATMACA.ratios as Record<string, {value: number}>;
  assert.equal(r.finRakeDeg.value, 0);
  // kanadinki degil: uca dogru buruna kaciyor
  assert.ok(r.wingRakeDeg.value < 0);
});

test('ATMACA oranlari ortografik cizimden olculdu', () => {
  const derived = new Set(['finThicknessRatio', 'wingThicknessRatio']);
  for (const [key, ratio] of Object.entries(ATMACA.ratios)) {
    if (derived.has(key)) {
      // Kalinlik ust gorunuste okunamaz; secilmis kalir.
      assert.equal(ratio.basis, 'chosen', key);
      continue;
    }
    assert.equal(ratio.basis, 'measured', `${key} olculmus olmali`);
    assert.ok(ratio.source_url.endsWith('.pdf'), key);
    assert.ok(ratio.projection_check.tr.length > 40, key);
  }
});

test('ATMACA modeli cizimin govde yuzeyindeki vechesini yeniden uretir', () => {
  const r = ATMACA.ratios as Record<string, {value: number}>;
  const L = 4.3;
  const R = 0.185;
  /** Cizimde 1223 px = govde boyu; olculen degerler piksel cinsinden. */
  const PX = 1223 / L;

  function chordAtSurface(
    chordRatio: number,
    taper: number,
    spanRatio: number,
    rakeDeg: number
  ) {
    const rootChord = L * chordRatio;
    const tipChord = rootChord * taper;
    const span = R * spanRatio;
    const offset =
      rootChord - tipChord + span * Math.tan((rakeDeg * Math.PI) / 180);
    // Govde yuzeyi: aciklik ekseninde s = R / span
    const s = R / span;
    const leading = offset * s;
    const trailing = rootChord + (offset + tipChord - rootChord) * s;
    return (trailing - leading) * PX;
  }

  const fin = chordAtSurface(
    r.finChordRatio.value,
    r.finTaper.value,
    r.finSpanRatio.value,
    r.finRakeDeg.value
  );
  const wing = chordAtSurface(
    r.wingChordRatio.value,
    r.wingTaper.value,
    r.wingSpanRatio.value,
    r.wingRakeDeg.value
  );

  // Cizimde olculen: kanatcik 73 px, kanat 229 px.
  assert.ok(Math.abs(fin - 73) < 3, `kanatcik yuzey vechesi ${fin.toFixed(1)} px`);
  assert.ok(Math.abs(wing - 229) < 5, `kanat yuzey vechesi ${wing.toFixed(1)} px`);
});
