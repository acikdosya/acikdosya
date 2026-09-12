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
import {projectParts} from './project2d';

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
    body: {
      noseRatio: TAYFUN.ratios.noseRatio,
      shoulderT: TAYFUN.ratios.shoulderT,
      boattail: TAYFUN.ratios.boattail
    },
    groups: [
      {
        id: 'fin',
        ratios: {
          count: chosen(1, {note: {tr: 'test', en: 'test'}}),
          chordRatio: TAYFUN.ratios.finChordRatio,
          taper: TAYFUN.ratios.finTaper,
          spanRatio: TAYFUN.ratios.finSpanRatio,
          rakeDeg: TAYFUN.ratios.finRakeDeg,
          trailingT: TAYFUN.ratios.finTrailingT,
          thicknessRatio: TAYFUN.ratios.finThicknessRatio
        }
      }
    ]
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

/*
 * YUZEY GRUBU LISTESI — specs/system-geometry.
 *
 * Grup sayisi sabit bir ust sinira bagli degil ve parca kimlikleri grup
 * adindan turuyor. Kimlik onemli: etiketler ona baglaniyor
 * (content/systems/*.json annotations) ve kadraj onu tutamak olarak
 * okuyor, yani sessizce degismemeli.
 */

const TEST_SURFACE = {
  count: chosen(4, {note: {tr: 'test', en: 'test'}}),
  chordRatio: chosen(0.1, {note: {tr: 'test', en: 'test'}}),
  taper: chosen(0.5, {note: {tr: 'test', en: 'test'}}),
  spanRatio: chosen(1.5, {note: {tr: 'test', en: 'test'}}),
  rakeDeg: chosen(0, {note: {tr: 'test', en: 'test'}}),
  trailingT: chosen(1, {note: {tr: 'test', en: 'test'}}),
  thicknessRatio: chosen(0.03, {note: {tr: 'test', en: 'test'}})
};

const TEST_BODY = {
  noseRatio: chosen(0.2, {note: {tr: 'test', en: 'test'}}),
  shoulderT: chosen(0.9, {note: {tr: 'test', en: 'test'}}),
  boattail: chosen(0.95, {note: {tr: 'test', en: 'test'}})
};

test('parca kimlikleri grup adindan turer', () => {
  const product = axialProduct({
    slug: 'uc-grup',
    category: 'hava-savunma-sistemi',
    body: TEST_BODY,
    groups: [
      {id: 'fin-aft', ratios: {...TEST_SURFACE}},
      {id: 'fin-control', ratios: {...TEST_SURFACE}},
      {id: 'wing-mid', ratios: {...TEST_SURFACE}}
    ]
  });

  const parts = buildParts(product, {length_m: 5.4, diameter_mm: 370});
  assert.ok(parts);
  const ids = parts.map((part) => part.id);

  assert.ok(ids.includes('body'));
  for (const group of ['fin-aft', 'fin-control', 'wing-mid']) {
    for (let i = 1; i <= 4; i++) {
      assert.ok(ids.includes(`${group}-${i}`), `${group}-${i} uretilmedi`);
    }
  }
  // govde + uc grup x dort yuzey
  assert.equal(parts.length, 13);
});

test('grup sayisi ikiyle sinirli degil', () => {
  const product = axialProduct({
    slug: 'dort-grup',
    category: 'hava-savunma-sistemi',
    body: TEST_BODY,
    groups: [
      {id: 'a', ratios: {...TEST_SURFACE}},
      {id: 'b', ratios: {...TEST_SURFACE}},
      {id: 'c', ratios: {...TEST_SURFACE}},
      {id: 'd', ratios: {...TEST_SURFACE}}
    ]
  });
  const parts = buildParts(product, {length_m: 5, diameter_mm: 400});
  assert.equal(parts?.length, 17);
});

test('grupsuz urun yalniz govde cizer', () => {
  const product = axialProduct({
    slug: 'govde-tek',
    category: 'hava-savunma-sistemi',
    body: TEST_BODY,
    groups: []
  });
  const parts = buildParts(product, {length_m: 5, diameter_mm: 400});
  assert.deepEqual(parts?.map((part) => part.id), ['body']);
});

test('oran anahtarlari grup onekiyle benzersiz kalir', () => {
  const product = axialProduct({
    slug: 'onek',
    category: 'hava-savunma-sistemi',
    body: TEST_BODY,
    groups: [
      {id: 'fin-aft', prefix: 'finAft', ratios: {...TEST_SURFACE}},
      {id: 'fin-control', prefix: 'finControl', ratios: {...TEST_SURFACE}}
    ]
  });

  const keys = Object.keys(product.ratios);
  assert.ok(keys.includes('finAftCount'));
  assert.ok(keys.includes('finControlSpanRatio'));
  assert.equal(new Set(keys).size, keys.length, 'oran anahtari tekrarlandi');
});

test('ayni onekli iki grup tanim zamaninda reddedilir', () => {
  /*
   * Sessizce ustune yazmak, bir grubun oranlarini otekinin kokeniyle
   * gostermek olurdu — koken kaydinin en sinsi bozulmasi.
   */
  assert.throws(
    () =>
      axialProduct({
        slug: 'cakisma',
        category: 'hava-savunma-sistemi',
        body: TEST_BODY,
        groups: [
          {id: 'fin', ratios: {...TEST_SURFACE}},
          {id: 'fin-2', prefix: 'fin', ratios: {...TEST_SURFACE}}
        ]
      }),
    /iki kez tanimli/
  );
});

/*
 * KADEMELI GOVDE — specs/system-geometry.
 *
 * Ayrilabilir itici tasiyan bir fuzede arka bolum ana govdeden kalin.
 * Onceki surumde govde tek capliydi ve bu bicim ifade edilemiyordu.
 */

const station = (t: number, radiusRatio: number) => ({
  t: chosen(t, {note: {tr: 'test', en: 'test'}}),
  radiusRatio: chosen(radiusRatio, {note: {tr: 'test', en: 'test'}})
});

function bodyProfile(product: ReturnType<typeof axialProduct>) {
  const parts = buildParts(product, {length_m: 10, diameter_mm: 1000});
  assert.ok(parts);
  const body = parts.find((part) => part.id === 'body');
  assert.ok(body && body.kind === 'body');
  return body.spec.stations;
}

test('kademeli govde iki capi ve aralarindaki gecisi tasir', () => {
  const product = axialProduct({
    slug: 'kademeli',
    category: 'hava-savunma-sistemi',
    body: TEST_BODY,
    stations: [
      // 'shoulder' kullanilamaz: govdenin shoulderT anahtariyla cakisir.
      {id: 'step', ratios: station(0.6, 1)},
      {id: 'booster', ratios: station(0.7, 1.25)}
    ],
    groups: []
  });

  const profile = bodyProfile(product);
  // R = 0,5 m; kademe 1,25 katinda.
  const at = (y: number) =>
    profile.find((s) => Math.abs(s.y - y) < 1e-9)?.radius;

  assert.equal(at(6), 0.5, 'gecisin basi anma yaricapinda degil');
  assert.equal(at(7), 0.625, 'gecisin sonu kademe yaricapinda degil');
  // Kuyruk son istasyonun yaricapindan daralir, anma yaricapindan degil.
  assert.equal(at(10), 0.625 * TEST_BODY.boattail.value);
});

test('istasyon bildirilince shoulderT devreye girmez', () => {
  /*
   * Ikisi birlikte uygulansaydi govde kademeden sonra anma capina geri
   * sicrardi — bildirilen bicimin tersi.
   */
  const product = axialProduct({
    slug: 'omuzsuz',
    category: 'hava-savunma-sistemi',
    body: TEST_BODY,
    stations: [{id: 'booster', ratios: station(0.8, 1.2)}],
    groups: []
  });

  const profile = bodyProfile(product);
  const shoulderY = 10 * TEST_BODY.shoulderT.value;
  const stray = profile.filter(
    (s) => Math.abs(s.y - shoulderY) < 1e-9 && Math.abs(s.radius - 0.5) < 1e-9
  );
  assert.equal(stray.length, 0, 'shoulderT istasyonu da eklenmis');
});

test('istasyonlar tanim sirasindan bagimsiz, burundan kuyruga siralanir', () => {
  const product = axialProduct({
    slug: 'sirasiz',
    category: 'hava-savunma-sistemi',
    body: TEST_BODY,
    stations: [
      {id: 'gec', ratios: station(0.8, 1.2)},
      {id: 'erken', ratios: station(0.6, 1)}
    ],
    groups: []
  });

  const ys = bodyProfile(product).map((s) => s.y);
  assert.deepEqual([...ys].sort((a, b) => a - b), ys, 'profil sirali degil');
});

test('istasyonsuz urun eskisi gibi tek capli kalir', () => {
  const stepped = axialProduct({
    slug: 'tek-cap',
    category: 'hava-savunma-sistemi',
    body: TEST_BODY,
    groups: []
  });
  const profile = bodyProfile(stepped);
  assert.equal(profile.at(-1)?.radius, 0.5 * TEST_BODY.boattail.value);
  assert.ok(
    profile.some((s) => Math.abs(s.y - 10 * TEST_BODY.shoulderT.value) < 1e-9),
    'shoulderT istasyonu kayboldu'
  );
});

test('istasyon oranlari koken kaydina girer', () => {
  const product = axialProduct({
    slug: 'koken',
    category: 'hava-savunma-sistemi',
    body: TEST_BODY,
    stations: [{id: 'booster', ratios: station(0.7, 1.25)}],
    groups: []
  });

  const keys = Object.keys(product.ratios);
  assert.ok(keys.includes('boosterT'));
  assert.ok(keys.includes('boosterRadiusRatio'));
});

test('bolumlu burun istasyonu ortografik izdusumde de gorunur', () => {
  /*
   * URUN-2'nin radomu ayri bir bolum olarak ciziliyor. Bolum siniri
   * govde profilinde bir istasyon; iki boyutlu sema ayni parca
   * listesinden turedigi icin kontur orada da kirilmali
   * (specs/system-silhouette).
   */
  const product = axialProduct({
    slug: 'radom',
    category: 'hava-savunma-sistemi',
    body: {
      ...TEST_BODY,
      noseRatio: chosen(0.3, {note: {tr: 'test', en: 'test'}})
    },
    stations: [{id: 'radome', ratios: station(0.18, 0.62)}],
    groups: []
  });

  const parts = buildParts(product, {length_m: 10, diameter_mm: 1000});
  assert.ok(parts);

  const outline = projectParts(parts, 'side');
  assert.ok(outline.length > 0, 'izdusum bos');

  // Istasyonun bulundugu y'de konturun yaricapi bildirilen orana esit.
  const body = parts.find((part) => part.id === 'body');
  assert.ok(body && body.kind === 'body');
  const at = body.spec.stations.find((s) => Math.abs(s.y - 1.8) < 1e-9);
  assert.ok(at, 'radom istasyonu profile girmedi');
  assert.equal(at.radius, 0.31);
});
