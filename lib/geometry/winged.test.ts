import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as THREE from 'three';
import {AKINCI} from './akinci';
import {buildGroup} from './build3d';
import {buildModel, modelBounds} from './model';
import {
  panelPointToFrame,
  partsBounds,
  sectionExtent,
  vec3,
  type PanelPart,
  type Part
} from './parts';
import {buildParts} from './product';
import {fuselageRadius, fuselageRadiusAt} from './winged';
import {ratioValues} from './ratio';

/**
 * Modelin kaynakli iki olcusu var: uzunluk ve kanat acikligi. Testler
 * bunlari koruyor.
 *
 * Kanat ucu yukari donunce panelin kendi boyu uzuyor; kalinlik payi da
 * yatay erisime ekleniyor. Ikisi hesaba katilmazsa model, yayimlanmis
 * kanat acikligindan birkac santim genis cikar — sayfa "20 m" yazarken
 * mesh 20,10 m olur.
 *
 * Altin degerler parca kitine tasinmadan once olculdu (tasks 2.1) ve
 * tasima sonrasinda ayni cikiyor. Sinir kutusu YALNIZ yuzeylerden
 * olculur: olcu cizgisi bir cizim ogesidir, modelin sinirlarini tarif
 * etmemeli.
 */

const AKINCI_DIMS = {length_m: 12.3, wingspan_m: 20, height_m: 4.1} as const;
const RATIOS = ratioValues(AKINCI.ratios);

/**
 * Faz 2 altin degerleri gorevini tamamladi: tasima sonrasi mesh birebir
 * ayni cikti. Faz 5'te gondol, pervane, inis takimi ve pilon eklendi,
 * yani degerler bilerek degisti. Yeni degerler ayni isi goruyor —
 * gelecekte kazara degisen bir oran burada yakalanir.
 */
const GOLDEN = {
  // Kanat ucu ayri bir panel olmaktan cikti: 24 -> 22 parca, 7 -> 5 yuzey.
  parts: 22,
  byKind: {body: 1, panel: 5, pod: 5, disc: 2, strut: 9},
  meshes: 32,
  lines: 33,
  meshVertices: 9662,
  lineVertices: 5362,
  meshMin: [-1.6031, 0, -10],
  meshMax: [2.4969, 12.3, 10]
} as const;

function parts(
  dims: {length_m: number; wingspan_m: number; height_m?: number} = AKINCI_DIMS
): Part[] {
  const built = buildParts(AKINCI, dims);
  assert.ok(built, 'parca listesi uretilmeli');
  return built;
}

function surfaces(group: THREE.Object3D) {
  group.updateMatrixWorld(true);
  const box = new THREE.Box3();
  let meshes = 0;
  let lines = 0;
  let meshVertices = 0;
  let lineVertices = 0;

  group.traverse((object) => {
    const geometry = (object as THREE.Mesh).geometry as
      | THREE.BufferGeometry
      | undefined;
    if (!geometry?.attributes?.position) return;
    const count = geometry.attributes.position.count;
    if ((object as THREE.Mesh).isMesh) {
      meshes++;
      meshVertices += count;
      box.expandByObject(object);
    } else {
      lines++;
      lineVertices += count;
    }
  });

  return {box, meshes, lines, meshVertices, lineVertices};
}

function panel(list: readonly Part[], id: string): PanelPart {
  const found = list.find((part) => part.id === id);
  assert.ok(found && found.kind === 'panel', `${id} paneli yok`);
  return found;
}

test('parca listesi kaynakli uzunluk ve kanat acikligini birebir tasir', () => {
  const bounds = partsBounds(parts());
  // z: kanat acikligi, y: govde ekseni (parts.ts'teki ortak cerceve).
  assert.ok(
    Math.abs(bounds.max.z - bounds.min.z - AKINCI_DIMS.wingspan_m) < 0.01,
    `aciklik ${bounds.max.z - bounds.min.z}`
  );
  assert.ok(
    Math.abs(bounds.max.y - bounds.min.y - AKINCI_DIMS.length_m) < 0.01,
    `uzunluk ${bounds.max.y - bounds.min.y}`
  );
});

test('olcu degisince parca listesi degisir', () => {
  const bounds = partsBounds(parts({length_m: 6, wingspan_m: 9}));
  assert.ok(Math.abs(bounds.max.z - bounds.min.z - 9) < 0.01);
  assert.ok(Math.abs(bounds.max.y - bounds.min.y - 6) < 0.01);
});

test('en yuksek nokta dikey stabilizenin ucu', () => {
  const bounds = partsBounds(parts());
  // +x yukari (parts.ts'teki ortak cerceve).
  const finTop = AKINCI_DIMS.length_m * RATIOS.finHeightRatio;
  assert.ok(
    bounds.max.x > finTop * 0.95 && bounds.max.x < finTop * 1.15,
    `stabilize ucu ${bounds.max.x}, oran ${finTop}`
  );
});

test('kanat panelleri govde uzerinde, govde icinden gecmez', () => {
  const list = parts();
  const R = fuselageRadius(AKINCI_DIMS.length_m, RATIOS);

  for (const id of ['wing-1', 'wing-2']) {
    const wing = panel(list, id);
    const rootChord = wing.stations[0].chord;
    const localR = fuselageRadiusAt(
      wing.root.y + rootChord / 2,
      AKINCI_DIMS.length_m,
      R,
      RATIOS
    );
    assert.ok(
      wing.root.x >= localR,
      `${id} govde icinde: root.x=${wing.root.x}, yerel yaricap=${localR}`
    );
  }
});

test('yatay stabilize acikligi oran tablosundaki degerde kalir', () => {
  const list = parts();
  const box = partsBounds([panel(list, 'stab-1'), panel(list, 'stab-2')]);
  const span = box.max.z - box.min.z;
  const expected = AKINCI_DIMS.wingspan_m * RATIOS.stabSpanRatio;
  assert.ok(
    Math.abs(span - expected) < 0.15,
    `stabilize acikligi ${span}, beklenen ${expected}`
  );
});

test('kuyruk tek dikey yuzey ve iki yatay yuzey — V kuyruk degil', () => {
  const list = parts();
  assert.equal(panel(list, 'fin').angleDeg, 0, 'dikey stabilize dik durmali');
  /*
   * Iki yatay yuzey AYNI acida; ikincisi yansitiliyor. Once -aci ile
   * dondurulyordu ve bu "yukari" yonunu de ters ceviriyordu.
   */
  for (const id of ['stab-1', 'stab-2']) {
    assert.equal(panel(list, id).angleDeg, 90 + RATIOS.stabAnhedralDeg, id);
  }
  assert.equal(panel(list, 'stab-1').mirror ?? false, false);
  assert.equal(panel(list, 'stab-2').mirror, true);
});

test('esli yuzeyler gercekten simetrik — iki kanat ucu da YUKARI', () => {
  const list = parts();
  const tipHeight = (id: string) => {
    const part = panel(list, id);
    const tip = part.stations[part.stations.length - 2];
    const root = part.stations[0];
    return {
      lift: panelPointToFrame(part, vec3(tip.span, tip.offset, tip.rise)).x -
        panelPointToFrame(part, vec3(root.span, root.offset, root.rise)).x,
      z: panelPointToFrame(part, vec3(tip.span, tip.offset, tip.rise)).z
    };
  };

  const left = tipHeight('wing-1');
  const right = tipHeight('wing-2');

  assert.ok(left.lift > 0.3, `sol kanat ucu yukselmiyor: ${left.lift}`);
  assert.ok(right.lift > 0.3, `sag kanat ucu yukselmiyor: ${right.lift}`);
  assert.ok(
    Math.abs(left.lift - right.lift) < 1e-9,
    'iki kanat ucu ayni yukselmiyor'
  );
  // Aciklik yonleri zit.
  assert.ok(left.z * right.z < 0, 'kanatlar ayni yone gidiyor');

  // Yatay stabilizeler de simetrik: ikisi de asagi saplar.
  const s1 = tipHeight('stab-1');
  const s2 = tipHeight('stab-2');
  assert.ok(s1.lift < 0 && s2.lift < 0, 'stabilize anhedral degil');
  assert.ok(Math.abs(s1.lift - s2.lift) < 1e-9, 'stabilizeler simetrik degil');
});

test('kanat govdeye DUZ girmiyor — kok baglantisi egrili', () => {
  const wing = panel(parts(), 'wing-1');
  const inboard = wing.stations.filter((station) => station.span < 2.7);
  assert.ok(inboard.length > 6, 'kok bolgesi seyrek orneklenmis');

  // Kokte referans duzlemin ALTINDA baslamali ve tirmanmali.
  assert.ok(inboard[0].rise < -0.4, `kok yukselisi ${inboard[0].rise}`);
  for (let i = 1; i < inboard.length; i++) {
    assert.ok(
      inboard[i].rise > inboard[i - 1].rise,
      'kok baglantisi tirmanmiyor'
    );
  }
  // 2,6 m'de referans duzleme oturur.
  const level = wing.stations.find((station) => station.span > 2.7);
  assert.ok(level && Math.abs(level.rise) < 1e-9, 'duzlesme tamamlanmamis');
});

test('kadraj hesabi mesh ile ayni olculeri verir', () => {
  const spec = {
    systemSlug: 'akinci',
    dimensions: {
      kind: 'aircraft' as const,
      lengthM: AKINCI_DIMS.length_m,
      wingspanM: AKINCI_DIMS.wingspan_m
    }
  };
  const built = buildModel(spec);
  const quick = modelBounds(spec);
  assert.ok(built && quick);
  assert.deepEqual(quick, built.frame);
  built.dispose();
});

test('olcu turu urun tanimiyla uyusmazsa model uretilmez', () => {
  // AKINCI uzunluk + kanat acikligi istiyor; fuze olcusu gelirse govde uydurulmaz.
  assert.equal(
    buildModel({
      systemSlug: 'akinci',
      dimensions: {kind: 'missile', lengthM: 6, diameterMm: 610}
    }),
    undefined
  );
  assert.equal(
    buildModel({
      systemSlug: 'tayfun',
      dimensions: {kind: 'aircraft', lengthM: 12, wingspanM: 20}
    }),
    undefined
  );
});

/* ------------------------------------------------------- altin degerler */

test('AKINCI altin degerleri: parca ve kose sayilari', () => {
  const list = parts();
  assert.equal(list.length, GOLDEN.parts);

  const byKind: Record<string, number> = {};
  for (const part of list) byKind[part.kind] = (byKind[part.kind] ?? 0) + 1;
  assert.deepEqual(byKind, {...GOLDEN.byKind});

  const scene = buildGroup(list, {dimensionOffsetRatio: 3.2});
  const found = surfaces(scene.group);
  assert.equal(found.meshes, GOLDEN.meshes);
  // her yuzeyin konturu + olcu cizgisi
  assert.equal(found.lines, GOLDEN.lines);
  assert.equal(found.meshVertices, GOLDEN.meshVertices);
  assert.equal(found.lineVertices, GOLDEN.lineVertices);

  scene.dispose();
});

test('kanat TEK parca — uc kivrimi ayri panel degil', () => {
  const wings = parts().filter((part) => part.id.startsWith('wing'));
  assert.equal(wings.length, 2, 'kanat basina tek parca olmali');
  assert.ok(
    !parts().some((part) => part.id.includes('tip')),
    'ayri kanat ucu paneli kalmis'
  );
});

test('kanat kalinligi YEREL vecheyle orantili', () => {
  const wing = panel(parts(), 'wing-1');
  const ratios = wing.stations
    .filter((station) => station.chord > 0.01)
    .map((station) => station.thickness / station.chord);
  const first = ratios[0];
  for (const ratio of ratios) {
    assert.ok(
      Math.abs(ratio - first) < 1e-6,
      `t/c acikliga gore degisiyor: ${first} vs ${ratio}`
    );
  }
  // Olculen deger: 0,152 ± 0,004
  assert.ok(Math.abs(first - 0.152) < 0.005, `t/c ${first}`);
});

test('kanat ucu kivrimi duzgun bir egri, sert kose degil', () => {
  const wing = panel(parts(), 'wing-1');
  const rises = wing.stations.map((station) => station.rise);
  // Yukselis monoton artmali ve adim adim buyumeli (dis bukey egri).
  const steps: number[] = [];
  for (let i = 1; i < rises.length; i++) {
    const step = rises[i] - rises[i - 1];
    assert.ok(step >= -1e-9, 'yukselis geri donuyor');
    if (step > 1e-6) steps.push(step);
  }
  assert.ok(steps.length > 8, `kivrim yalniz ${steps.length} adimda`);
  /*
   * Sert bir kose yukselisin tamamini TEK adimda tasirdi. Egride hicbir
   * adim toplamin dortte birinden fazlasini tasimamali.
   */
  const total = rises[rises.length - 1];
  const largest = Math.max(...steps);
  assert.ok(
    largest / total < 0.25,
    `en buyuk adim toplamin %${((largest / total) * 100).toFixed(0)}'i`
  );
});

test('kanat ucu kapali: kalinlik ve veche sifira gider', () => {
  const wing = panel(parts(), 'wing-1');
  const last = wing.stations[wing.stations.length - 1];
  assert.ok(last.thickness < 1e-6, `uc kalinligi ${last.thickness}`);
  assert.ok(last.chord < 1e-6, `uc vechesi ${last.chord}`);
});

test('kanat ucu yukselisi olculen degerde', () => {
  const wing = panel(parts(), 'wing-1');
  const rise = wing.stations[wing.stations.length - 1].rise;
  // Olculen: 0,518 m
  assert.ok(Math.abs(rise - 0.518) < 0.01, `yukselis ${rise} m`);
});

test('parca kumesi: gondol, pervane, takim ve pilon modellenir', () => {
  const ids = parts().map((part) => part.id);
  assert.ok(ids.some((id) => id.startsWith('nacelle-')), 'gondol yok');
  assert.ok(ids.some((id) => id.startsWith('propeller-')), 'pervane yok');
  assert.ok(ids.some((id) => id.startsWith('gear-')), 'inis takimi yok');
  assert.ok(ids.some((id) => id.startsWith('wheel-')), 'tekerlek yok');
  assert.ok(ids.some((id) => id.startsWith('pylon-')), 'pilon yok');
  // Muhimmat MODELLENMEZ — CLAUDE.md §5.4, specs/system-geometry.
  assert.ok(
    !ids.some((id) => /store|muhimmat|bomb|missile/i.test(id)),
    'mühimmat parcasi var'
  );
});

test('alti yuk istasyonu: yanda uc, iki yanda', () => {
  const pylons = parts().filter((part) => part.id.startsWith('pylon-'));
  assert.equal(pylons.length, 6);
});

test('inis takimi yayimlanan yukseklikten turer', () => {
  const bounds = partsBounds(parts());
  // Zemin dikey stabilize ucundan tam 4,1 m asagida olmali.
  assert.ok(
    Math.abs(bounds.max.x - bounds.min.x - 4.1) < 0.01,
    `dikey uzanim ${bounds.max.x - bounds.min.x} m, yayimlanan 4,1 m`
  );
});

test('ana takim govdeden cikar ve tekerlege DISA acilir', () => {
  const list = parts();
  const legs = list.filter(
    (part) => part.kind === 'strut' && part.id.startsWith('gear-main-')
  );
  assert.equal(legs.length, 2);

  for (const leg of legs) {
    assert.ok(leg.kind === 'strut');
    // Ust uc govde yaninda, alt uc tekerlekte: asagi inerken disa acilir.
    assert.ok(
      Math.abs(leg.to.z) > Math.abs(leg.from.z),
      `${leg.id} ice kapaniyor: ust ${leg.from.z}, alt ${leg.to.z}`
    );
    // Ust uc gondolun ICINDE kalmali, ustunde degil.
    const nacelleZ = 10 * RATIOS.nacelleSpanRatio;
    assert.ok(
      Math.abs(leg.from.z) < nacelleZ,
      `${leg.id} gondola baglanmis: ${leg.from.z} vs gondol ${nacelleZ}`
    );
  }

  // Iki bacak ayna simetrik.
  const [a, b] = legs;
  assert.ok(a.kind === 'strut' && b.kind === 'strut');
  assert.ok(Math.abs(a.from.z + b.from.z) < 1e-9);
  assert.ok(Math.abs(a.to.z + b.to.z) < 1e-9);
});

test('her tekerlek kendi bacaginin ucuna oturur', () => {
  const list = parts();
  for (const id of ['nose', 'main-a', 'main-b']) {
    const leg = list.find((part) => part.id === `gear-${id}`);
    const wheel = list.find((part) => part.id === `wheel-${id}`);
    assert.ok(leg?.kind === 'strut' && wheel?.kind === 'pod');
    const half = (wheel.spec.stations.at(-1)?.y ?? 0) / 2;
    assert.ok(
      Math.abs(wheel.origin.z + half - leg.to.z) < 1e-9,
      `${id}: tekerlek ${wheel.origin.z + half}, bacak ${leg.to.z}`
    );
  }
});

test('yukseklik verisi yoksa inis takimi CIZILMEZ', () => {
  const without = parts({length_m: 12.3, wingspan_m: 20});
  assert.ok(
    !without.some((part) => part.id.startsWith('gear-')),
    'yukseklik olmadan takim uydurulmus'
  );
  // Ucak yine de cizilir; eksik olcu butun modeli susturmaz.
  assert.ok(without.some((part) => part.id === 'body'));
});

test('govde OVAL DEGIL — olculen kesit profili tasir', () => {
  const body = parts().find((part) => part.id === 'body');
  assert.ok(body && body.kind === 'body');
  const section = body.spec.section;
  assert.ok(section && section.length > 10, 'kesit profili yok');

  // Alttan uste sirali ve iki ucta kapali.
  assert.equal(section[0].w, 0);
  assert.equal(section[section.length - 1].w, 0);
  for (let i = 1; i < section.length; i++) {
    assert.ok(section[i].v > section[i - 1].v, 'profil sirali degil');
  }

  const extent = sectionExtent(body.spec);
  assert.ok(Math.abs(extent.width - 1) < 1e-9);
  assert.ok(Math.abs(extent.down - 1.31) < 1e-9, `alt uzanim ${extent.down}`);

  /*
   * Elips sinavi: alt yari, ayni uzanimdaki bir elipsten belirgin
   * olcude dar olmali. Oval bir govde bu sinavdan gecerdi.
   */
  let maxGap = 0;
  for (const point of section) {
    if (point.v >= 0) continue;
    const ellipse = Math.sqrt(
      Math.max(0, 1 - (point.v / extent.down) ** 2)
    );
    maxGap = Math.max(maxGap, ellipse - point.w);
  }
  assert.ok(maxGap > 0.15, `elipsten en buyuk sapma yalniz ${maxGap}`);
});

test('ana takim bacagi govde YUZEYINE baglanir', () => {
  const list = parts();
  const body = list.find((part) => part.id === 'body');
  const leg = list.find((part) => part.id === 'gear-main-a');
  assert.ok(body?.kind === 'body' && leg?.kind === 'strut');

  const extent = sectionExtent(body.spec);
  const R = fuselageRadius(AKINCI_DIMS.length_m, RATIOS);
  const localR = fuselageRadiusAt(
    leg.from.y,
    AKINCI_DIMS.length_m,
    R,
    RATIOS
  );

  /*
   * Baglanti noktasi govdenin en alt noktasinda DEGIL: yanal olarak
   * disarida oldugu icin orada govde yok. Profilin uzerinde olmali.
   */
  assert.ok(
    leg.from.x > -localR * extent.down + 0.2,
    `baglanti govdenin altinda bosta: x=${leg.from.x}`
  );
  assert.ok(leg.from.x < 0, 'baglanti govdenin ust yarisinda');
  // Yanal konum govdenin genisligi icinde.
  assert.ok(Math.abs(leg.from.z) <= localR * extent.width + 1e-9);
});

test('AKINCI altin degerleri: yuzey sinir kutusu', () => {
  const scene = buildGroup(parts(), {dimensionOffsetRatio: 3.2});
  const {box} = surfaces(scene.group);

  assert.deepEqual(
    [box.min.x, box.min.y, box.min.z].map((value) => +value.toFixed(5)),
    [...GOLDEN.meshMin]
  );
  assert.deepEqual(
    [box.max.x, box.max.y, box.max.z].map((value) => +value.toFixed(5)),
    [...GOLDEN.meshMax]
  );

  scene.dispose();
});

test('olcu cizgisi govdenin solunda, yuzeylerin disinda', () => {
  const scene = buildGroup(parts(), {dimensionOffsetRatio: 3.2});
  const surfaceBox = surfaces(scene.group).box;
  const wholeBox = new THREE.Box3().setFromObject(scene.group);
  assert.ok(wholeBox.min.x < surfaceBox.min.x, 'cizgi yuzeylerin solunda durmali');
  scene.dispose();
});

/* ---------------------------------------------------------- koken kaydi */

test('AKINCI oranlari uc koken durumunu birlikte tasir', () => {
  const counts = {measured: 0, reading: 0, chosen: 0};
  for (const ratio of Object.values(AKINCI.ratios)) counts[ratio.basis]++;

  assert.ok(counts.measured > 0, JSON.stringify(counts));
  assert.ok(counts.reading > 0, JSON.stringify(counts));
  assert.ok(counts.chosen > 0, JSON.stringify(counts));
});

/**
 * Olculmus sayilabilecek her oran ya kalibrasyon duzleminde okundu ya
 * da bir SAYIM. Sayimi perspektif bozamaz; oteki her okuma icin
 * derinlik onemli (specs/model-provenance).
 */
const WING_PLANE_KEYS = new Set([
  'fuselageRatio',
  'tipReachRatio',
  'tipRiseRatio',
  'wingThicknessRatio',
  'wingHeightRatio',
  'wingRootDropRatio',
  'wingRootReachRatio',
  'bodySectionLowerRatio',
  'nacelleSpanRatio',
  'nacelleDiameterRatio',
  'nacelleDropRatio',
  'pylonSpanInnerRatio',
  'pylonSpanMiddleRatio',
  'pylonSpanOuterRatio',
]);
const COUNT_KEYS = new Set(['nacelleCount', 'propBladeCount']);

test('kanat duzlemi disindaki hicbir oran olculmus degil', () => {
  for (const [key, ratio] of Object.entries(AKINCI.ratios)) {
    if (ratio.basis !== 'measured') continue;
    assert.ok(
      WING_PLANE_KEYS.has(key) || COUNT_KEYS.has(key),
      `${key} olculmus isaretli ama ne kalibrasyon duzleminde ne de bir sayim`
    );
  }
});

test('perspektif render\'dan okunan dikey oranlar olculmus degil', () => {
  for (const key of ['propDiameterRatio', 'wheelDiameterRatio', 'strutRadiusRatio', 'crossAspect']) {
    const ratio = (AKINCI.ratios as Record<string, {basis: string}>)[key];
    assert.ok(ratio, key);
    assert.notEqual(
      ratio.basis,
      'measured',
      `${key} kalibrasyon duzleminin disinda ama olculmus isaretli`
    );
  }
});
