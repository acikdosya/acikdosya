import assert from 'node:assert/strict';
import {test} from 'node:test';
import {KIZILELMA} from './kizilelma';
import {
  panelPointToFrame,
  panelSection,
  partsBounds,
  stationSections,
  type BodyPart,
  type PanelPart,
  type Part
} from './parts';
import {buildParts} from './product';
import {ratioValues} from './ratio';
import {productFor} from './registry';

/*
 * Ölçüler içerikte kayıtlı: content/systems/kizilelma.json, güncel ürün
 * sayfası.
 */
const DIMS = {length_m: 14.5, wingspan_m: 10, height_m: 3.5} as const;
const RATIOS = ratioValues(KIZILELMA.ratios);

function parts(
  dims: {length_m: number; wingspan_m: number; height_m?: number} = DIMS
): Part[] {
  const built = buildParts(KIZILELMA, dims);
  assert.ok(built, 'KIZILELMA parça listesi üretilmeli');
  return built;
}

function panel(list: readonly Part[], id: string): PanelPart {
  const found = list.find((part) => part.id === id);
  assert.ok(found && found.kind === 'panel', `${id} paneli yok`);
  return found;
}

function body(list: readonly Part[]): BodyPart {
  const found = list.find((part) => part.kind === 'body');
  assert.ok(found && found.kind === 'body', 'gövde yok');
  return found;
}

/** Panelin uç kesitinin çerçevedeki noktaları. */
function tipPoints(part: PanelPart) {
  const tip = part.stations[part.stations.length - 1];
  return panelSection(tip).map((point) => panelPointToFrame(part, point));
}

const near = (a: number, b: number, tolerance: number, label: string) =>
  assert.ok(Math.abs(a - b) <= tolerance, `${label}: ${a} ≠ ${b}`);

test('KIZILELMA kayıtlı ürün olarak çözülür', () => {
  const match = productFor('kizilelma', 'kizilelma');
  assert.ok(match);
  assert.equal(match.product, KIZILELMA);
});

test('kaynaklı uzunluk, kanat açıklığı ve yükseklik korunur', () => {
  const bounds = partsBounds(parts());
  near(bounds.max.y - bounds.min.y, 14.5, 1e-6, 'uzunluk');
  near(bounds.max.z - bounds.min.z, 10, 1e-6, 'açıklık');
  near(bounds.max.x - bounds.min.x, 3.5, 1e-6, 'yükseklik');
});

test('yükseklik verisi yoksa iniş takımı uydurulmaz', () => {
  const list = parts({length_m: 14.5, wingspan_m: 10});
  assert.ok(!list.some((part) => part.id.startsWith('gear-')));
  assert.ok(!list.some((part) => part.id.startsWith('wheel-')));
});

test('gövde kesiti eksen boyunca biçim değiştirir: burun dar, orta gövde kutu üstünde kubbe', () => {
  const spec = body(parts()).spec;
  const sections = stationSections(spec);
  assert.ok(sections, 'gövde anahtar kesitli');
  assert.ok(spec.stations.every((station) => station.section !== undefined));
  // Dokuz nokta: taban ortası … sırt; her istasyonda aynı kenar.
  assert.ok(sections.every((profile) => profile.length === 9));
  // Orta gövdede kubbe tabanı kutudan dar, köşe kutudan geniş.
  const mid = sections[Math.floor(sections.length / 2)];
  assert.ok(mid[5].w < mid[3].w, 'kubbe kutudan dar');
  assert.ok(mid[4].w >= mid[3].w, 'köşe kutudan taşar');
  // Taban düz: taban ortası ile köşesi aynı yükseklikte.
  assert.equal(mid[0].v, mid[1].v);
});

test('kanat ucu okunan köşelerde; firar kenarı düz', () => {
  const wing = panel(parts(), 'wing-1');
  const tip = tipPoints(wing);
  const ys = tip.map((point) => point.y);
  near(Math.min(...ys), 14.5 * RATIOS.wingTipLeadingT, 0.02, 'uç hücum kenarı');
  near(
    Math.max(...ys) - Math.min(...ys),
    14.5 * RATIOS.wingTipChordRatio,
    0.02,
    'uç veçhesi'
  );
  const zs = tip.map((point) => Math.abs(point.z));
  near(Math.max(...zs), 5, 1e-6, 'yarım açıklık');
  // Dihedral yok: uç kesit kökle aynı yükseklikte.
  near(tip[0].x, 14.5 * RATIOS.wingHeightRatio, 0.05, 'kanat düzlemi');
});

test('kanard köşe hizasında, kanadın önünde ve ondan kısa', () => {
  const list = parts();
  const canard = panel(list, 'canard-1');
  const wing = panel(list, 'wing-1');
  assert.ok(canard.root.x > wing.root.x, 'kanard kanadın üstünde');
  const reach = Math.max(...tipPoints(canard).map((point) => Math.abs(point.z)));
  near(reach, (10 * RATIOS.canardSpanRatio) / 2, 1e-6, 'kanard yarım açıklığı');
  assert.ok(reach < 5);
});

test('çift kuyruk dışa yatık ve okunan yükseklikte biter', () => {
  const list = parts();
  for (const id of ['tail-1', 'tail-2']) {
    const tail = panel(list, id);
    const tip = tipPoints(tail);
    const rootZ = Math.abs(tail.root.z);
    const tipZ = Math.max(...tip.map((point) => Math.abs(point.z)));
    assert.ok(tipZ > rootZ, `${id} dışa yatık`);
    const rise = Math.max(...tip.map((point) => point.x)) - tail.root.x;
    const cant = (Math.atan2(tipZ - rootZ, rise) * 180) / Math.PI;
    near(cant, RATIOS.tailCantDeg, 1.5, `${id} yatıklık`);
  }
  const top = partsBounds(list).max.x;
  near(top, 14.5 * RATIOS.tailTipHeightRatio, 0.05, 'kuyruk tepesi');
});

test('dış parçalar var, mühimmat ve yük istasyonu yok', () => {
  const ids = parts().map((part) => part.id);
  for (const id of ['body', 'wing-1', 'wing-2', 'canard-1', 'canard-2', 'tail-1', 'tail-2', 'nozzle']) {
    assert.ok(ids.includes(id), `${id} yok`);
  }
  assert.ok(!ids.some((id) => /pylon|store|muhimmat|weapon/.test(id)));
});

test('çizilmeyenler ve yükseklik farkı sayfada yazılı (§9)', () => {
  const omitted = KIZILELMA.omitted ?? [];
  assert.ok(omitted.length >= 3);
  assert.ok(omitted.some((entry) => entry.tr.includes('%4,6')));
  assert.ok(omitted.some((entry) => entry.en.includes('4.6 percent')));
});

test('oranlar hiçbiri ölçülmüş değil: izdüşüm sınavı yapılmadı', () => {
  for (const [key, ratio] of Object.entries(KIZILELMA.ratios)) {
    assert.notEqual(ratio.basis, 'measured', `${key} ölçülmüş sayılmamalı`);
    if (ratio.basis === 'reading') {
      assert.match(ratio.source_url, /bayraktar-kizilelma\/0_\d+\.png$/);
    }
  }
});
