import assert from 'node:assert/strict';
import {test} from 'node:test';
import en from '../../messages/en.json';
import tr from '../../messages/tr.json';
import {
  boomEnd,
  discBladeRings,
  panelPointToFrame,
  panelSection,
  partAnchor,
  partsBounds,
  vec3,
  type BodyPart,
  type BoomPart,
  type PanelPart,
  type Part
} from './parts';
import {buildParts} from './product';
import {ratioValues} from './ratio';
import {productFor} from './registry';
import {TB2} from './tb2';

const DIMS = {length_m: 6.4, wingspan_m: 12, height_m: 2.2} as const;
const RATIOS = ratioValues(TB2.ratios);

function parts(
  dims: {length_m: number; wingspan_m: number; height_m?: number} = DIMS
): Part[] {
  const built = buildParts(TB2, dims);
  assert.ok(built, 'TB2 parça listesi üretilmeli');
  return built;
}

function panel(list: readonly Part[], id: string): PanelPart {
  const found = list.find((part) => part.id === id);
  assert.ok(found && found.kind === 'panel', `${id} paneli yok`);
  return found;
}

function body(list: readonly Part[]): BodyPart {
  const found = list.find((part) => part.id === 'body');
  assert.ok(found && found.kind === 'body', 'gövde yok');
  return found;
}

function tipOf(part: PanelPart) {
  const tip = part.stations[part.stations.length - 1];
  return panelPointToFrame(part, vec3(tip.span, tip.offset, tip.rise));
}

function rootOf(part: PanelPart) {
  const root = part.stations[0];
  return panelPointToFrame(part, vec3(root.span, root.offset, root.rise));
}

test('TB2 kayıtlı ürün olarak çözülür ve varsayılan geometriye düşmez', () => {
  const match = productFor('tb2', 'tb2');
  assert.ok(match);
  assert.equal(match.product, TB2);
  assert.equal(match.matched, 'system');
});

test('kaynaklı uzunluk, kanat açıklığı ve yükseklik korunur', () => {
  const bounds = partsBounds(parts());
  assert.ok(Math.abs(bounds.max.y - bounds.min.y - DIMS.length_m) < 0.01);
  assert.ok(Math.abs(bounds.max.z - bounds.min.z - DIMS.wingspan_m) < 0.01);
  assert.ok(Math.abs(bounds.max.x - bounds.min.x - DIMS.height_m) < 0.01);
});

test('gövde pervanede biter; kuyruğu kirişler taşır', () => {
  const list = parts();
  const stations = body(list).spec.stations;
  const bodyEnd = stations[stations.length - 1].y;
  const tailRoot = rootOf(panel(list, 'tail-1'));
  const propeller = list.find((part) => part.id === 'propeller');
  assert.ok(propeller?.kind === 'disc');

  const spinner = list.find((part) => part.id === 'propeller-spinner');
  assert.ok(spinner?.kind === 'pod');
  const spinnerTip = spinner.origin.y + spinner.spec.stations[spinner.spec.stations.length - 1].y;

  assert.ok(bodyEnd < DIMS.length_m * 0.7, `gövde ${bodyEnd} m'de bitmeli, kuyruğa uzanmamalı`);
  // Kanat düzlemi göbek konisinin üzerinde: gövde sonu ile koni ucu arasında.
  assert.ok(propeller.center.y > bodyEnd, 'pervane düzlemi gövdenin içinde');
  assert.ok(propeller.center.y < spinnerTip, 'pervane düzlemi koninin gerisinde');
  assert.ok(tailRoot.y > bodyEnd + 1, 'kuyruk yüzeyleri gövdenin gerisinde olmalı');

  for (const boom of list.filter((part): part is BoomPart => part.kind === 'boom')) {
    assert.ok(Math.abs(boomEnd(boom).y - DIMS.length_m) < 1e-9, 'kiriş ucu ölçülen uzunluğun son noktası');
  }
});

test('kiriş kökü: hücum kenarında sivri başlar, kirişe kesintisiz bağlanır', () => {
  const list = parts();
  for (const suffix of ['1', '2']) {
    const fairing = list.find((part) => part.id === `boom-fairing-${suffix}`);
    const boom = list.find((part) => part.id === `boom-${suffix}`);
    assert.ok(fairing?.kind === 'pod' && boom?.kind === 'boom');
    const stations = fairing.spec.stations;
    const first = stations[0];
    const last = stations[stations.length - 1];

    assert.ok(Math.abs(fairing.origin.y - DIMS.length_m * RATIOS.boomStartT) < 1e-9, 'uç hücum kenarında değil');
    assert.ok(first.radius < 0.001, 'kaplama sivri başlamıyor');
    for (let i = 1; i < stations.length; i++) {
      assert.ok(stations[i].radius >= stations[i - 1].radius, 'kaplama kirişe doğru genişlemeli');
    }
    // Son halka kirişin ilk kesitiyle aynı: konum, yükseklik, yarıçap.
    assert.ok(Math.abs(fairing.origin.y + last.y - boom.start.y) < 1e-9);
    assert.ok(Math.abs(fairing.origin.x + (last.lift ?? 0) - boom.start.x) < 1e-9);
    assert.ok(Math.abs(last.radius - boom.radius) < 1e-9);
    assert.equal(fairing.origin.z, boom.start.z);
  }
});

test('pervane kanadı: düz firar kenarı, uca incelen veçhe, açılı kesit', () => {
  const propeller = parts().find((part) => part.id === 'propeller');
  assert.ok(propeller?.kind === 'disc' && propeller.blade);
  const stations = propeller.blade.stations;
  const trailing = stations[0].offset + stations[0].chord;

  for (let i = 1; i < stations.length; i++) {
    assert.ok(Math.abs(stations[i].offset + stations[i].chord - trailing) < 1e-12, 'firar kenarı düz değil');
    assert.ok(stations[i].chord <= stations[i - 1].chord + 1e-12, 'veçhe uca doğru büyüyor');
    assert.ok(stations[i].thickness > 0 && stations[i].thickness < stations[i].chord);
  }
  const tip = stations[stations.length - 1];
  assert.ok(Math.abs(tip.span - propeller.radius) < 1e-9, 'kanat ucu disk yarıçapında değil');
  assert.ok(Math.abs(tip.chord / propeller.bladeChord - RATIOS.propTipChordRatio) < 1e-9);
  assert.ok(propeller.blade.angleDeg > 0);

  // Yan karelerdeki kesit: +Z kanadında hücum kenarı yukarıda ve burna dönük.
  const [starboard] = discBladeRings(propeller);
  const ring = starboard[Math.floor(starboard.length / 2)];
  const leading = ring[0];
  const trailingPoint = ring.reduce((best, point) => (point.y > best.y ? point : best));
  assert.ok(leading.z > 0, 'ilk kanat +Z yanında değil');
  assert.ok(leading.x > trailingPoint.x && leading.y < trailingPoint.y, 'kanat açısı ters');
});

test('göbek konisi: gövde sonundan çıkar, uç yüzeyinin içinde kalır, sivri biter', () => {
  const list = parts();
  const spinner = list.find((part) => part.id === 'propeller-spinner');
  const propeller = list.find((part) => part.id === 'propeller');
  assert.ok(spinner?.kind === 'pod' && propeller?.kind === 'disc');
  const stations = spinner.spec.stations;
  const base = stations[0];
  const tip = stations[stations.length - 1];

  assert.ok(Math.abs(spinner.origin.y - DIMS.length_m * RATIOS.bodyEndT) < 1e-9);
  assert.equal(spinner.origin.x, propeller.center.x);
  assert.ok(Math.abs(base.radius - DIMS.length_m * RATIOS.spinnerRadiusRatio) < 1e-9);
  assert.ok(Math.abs(tip.y - DIMS.length_m * RATIOS.spinnerLengthRatio) < 1e-9);
  assert.ok(tip.radius < 0.001);
  for (let i = 1; i < stations.length; i++) {
    assert.ok(stations[i].radius < stations[i - 1].radius, 'koni uca doğru daralmalı');
  }

  // Koni uç yüzeyinin içinden çıkar: tepe, taban ve yanlarda gövde kesiti daha geniş.
  const body = list.find((part) => part.id === 'body');
  assert.ok(body?.kind === 'body');
  const end = body.spec.stations[body.spec.stations.length - 2];
  assert.ok((end.lift ?? 0) + end.radius * (end.upperScale ?? 1) > spinner.origin.x + base.radius);
  assert.ok((end.lift ?? 0) - end.radius * (end.lowerScale ?? 1) < spinner.origin.x - base.radius);
  assert.ok(end.radius > base.radius);

  // Disk göbeği konik kapağın içinde kalır.
  const coneAt = (y: number) => {
    const s = y - spinner.origin.y;
    const after = stations.findIndex((station) => station.y >= s);
    const a = stations[after - 1];
    const b = stations[after];
    return a.radius + ((b.radius - a.radius) * (s - a.y)) / (b.y - a.y);
  };
  assert.ok(propeller.hubRadius < coneAt(propeller.center.y + propeller.thickness));
});

test('çift kiriş ve tepede birleşen ters V kuyruk', () => {
  const list = parts();
  assert.equal(list.filter((part) => part.kind === 'boom').length, 2);
  assert.equal(list.filter((part) => part.id.startsWith('tail-')).length, 2);

  for (const id of ['tail-1', 'tail-2']) {
    const tail = panel(list, id);
    const root = rootOf(tail);
    const tip = tipOf(tail);
    assert.ok(tip.x > root.x + 0.8, `${id} yukarı çıkmıyor`);
    // Merkez düzleminde biter; taşma ya da boşluk yok.
    assert.ok(Math.abs(tip.z) < 1e-9, `${id} merkezde bitmiyor (z=${tip.z})`);
  }
});

test('kuyruk kökü kirişin üstünde: alt yüzey kirişin altına sarkmaz', () => {
  const list = parts();
  const tail = panel(list, 'tail-1');
  const boom = list.find((part): part is BoomPart => part.id === 'boom-1');
  assert.ok(boom);
  // Kirişin kuyruk veçhesi boyunca en alçak merkez yüksekliği.
  const lowestCentre = (y: number) =>
    boom.start.x + ((boom.endLift ?? 0) * (y - boom.start.y)) / boom.length;
  const root = tail.stations[0];
  const bottom = tail.root.x + root.rise - root.thickness / 2;
  assert.ok(bottom >= lowestCentre(tail.root.y) - 1e-9, `kök ${bottom} m, kiriş merkezi ${lowestCentre(tail.root.y)} m`);
  // Kalınlık kuyruğun kendi okumasından: yüzeye dik kalınlık / veçhe.
  const mid = tail.stations[Math.floor(tail.stations.length / 2)];
  const normal = mid.thickness * Math.cos((RATIOS.tailAngleDeg * Math.PI) / 180);
  assert.ok(Math.abs(normal / mid.chord - RATIOS.tailThicknessRatio) < 1e-9);
});

test('gövde kesiti dizisi kayıtlı okumaları taşır', () => {
  const section = body(parts()).spec.section;
  assert.ok(section);
  assert.ok(
    section.some((p) => Math.abs(p.v - 0.695) < 1e-9 && Math.abs(p.w - RATIOS.bodyShoulderWidthRatio) < 1e-9),
    'omuz eni dizide yok'
  );
  assert.ok(
    section.some((p) => p.v <= -0.95 && Math.abs(p.w - RATIOS.bodyFloorWidthRatio) <= 0.02),
    'taban eni dizide yok'
  );
  // Düz yanlar alt köşenin başladığı yere kadar iner.
  const cornerTop = -1 + RATIOS.bodyLowerCornerRatio;
  assert.ok(section.some((p) => Math.abs(p.v - cornerTop) < 1e-9 && p.w >= 0.99));
});

test('kanat-gövde kaplaması seçilen uç payında tam derinliğe ulaşır', () => {
  const fairing = parts().find((part) => part.id === 'wing-fairing');
  assert.ok(fairing?.kind === 'pod');
  const stations = fairing.spec.stations;
  const chord = DIMS.length_m * RATIOS.wingChordRatio;
  const full = Math.max(...stations.map((s) => s.radius));
  for (const s of stations) {
    const k = s.y / chord;
    const inside = k >= RATIOS.wingFairingRampRatio - 1e-9 && k <= 1 - RATIOS.wingFairingRampRatio + 1e-9;
    if (inside) assert.ok(Math.abs(s.radius - full) < 1e-9, `${k} tam derinlikte değil`);
    else assert.ok(s.radius < full, `${k} uç payında daralmıyor`);
  }
});

test('ters V tek parça: iki yarı merkezde gönyeyle birleşir, kesişmez', () => {
  const list = parts();
  const [one, two] = ['tail-1', 'tail-2'].map((id) => panel(list, id));
  const ringAt = (part: PanelPart) =>
    panelSection(part.stations[part.stations.length - 1]).map((point) =>
      panelPointToFrame(part, point)
    );
  const a = ringAt(one);
  const b = ringAt(two);
  // Son kesitler aynı dikey düzlemde ve noktası noktasına aynı.
  for (const point of [...a, ...b]) assert.ok(Math.abs(point.z) < 1e-9, 'son kesit merkez düzleminde değil');
  for (let i = 0; i < a.length; i++) {
    assert.ok(Math.abs(a[i].x - b[i].x) < 1e-9 && Math.abs(a[i].y - b[i].y) < 1e-9, 'iki yarının ucu örtüşmüyor');
  }
  // Hiçbir kesit merkez düzlemini geçmez.
  for (const part of [one, two]) {
    const side = Math.sign(rootOf(part).z);
    for (const station of part.stations) {
      for (const point of panelSection(station).map((p) => panelPointToFrame(part, p))) {
        assert.ok(point.z * side > -1e-9, `${part.id} merkez düzlemini geçiyor`);
      }
    }
  }
});

test('kanat dihedrali iki yanda da yukarı', () => {
  for (const id of ['wing-1', 'wing-2']) {
    const wing = panel(parts(), id);
    const root = rootOf(wing);
    const tip = wing.stations[wing.stations.length - 2];
    const tipPoint = panelPointToFrame(wing, vec3(tip.span, tip.offset, tip.rise));
    assert.ok(tipPoint.x > root.x, `${id} dihedral vermiyor`);
  }
});

test('kanat yüksek değil: veçhe düzlemi gövde orta çizgisinin altından geçer', () => {
  const list = parts();
  const wing = panel(list, 'wing-1');
  const top = Math.max(
    ...body(list).spec.stations.map((s) => (s.lift ?? 0) + s.radius * (s.upperScale ?? 1))
  );
  assert.ok(wing.root.x < 0, 'kanat kökü orta çizginin üstünde');
  assert.ok(wing.root.x < top - 0.3, 'kanat gövde üstüne oturmuş');
});

test('kirişler kuyruğa doğru incelir, yükselir ve dik oval kesit taşır', () => {
  for (const boom of parts().filter((part): part is BoomPart => part.kind === 'boom')) {
    assert.ok(boom.endRadius !== undefined && boom.endRadius < boom.radius);
    assert.ok(boom.aspect !== undefined && boom.aspect > 1, 'kesit dikey oval olmalı');
    assert.ok(boom.endLift !== undefined && boom.endLift > 0, 'kiriş kuyruğa doğru yükselmeli');
  }
});

test('gövde: sarkık burun, düz taban, küt arka uç', () => {
  const list = parts();
  const stations = body(list).spec.stations;
  const H = (DIMS.length_m * RATIOS.bodyDepthRatio) / 2;
  const first = stations[0];
  const last = stations[stations.length - 1];
  const propeller = list.find((part) => part.id === 'propeller');
  assert.ok(propeller?.kind === 'disc');

  assert.ok((first.lift ?? 0) < -0.2, 'burun ucu orta çizginin altında olmalı');
  // Son halka göbek merkezine kapanan düz uç yüzeyi; önceki halka okunan uç kesiti.
  const end = stations[stations.length - 2];
  assert.ok(last.radius < 0.001 && last.y - end.y < 0.001, 'gövde küt kapanmıyor');
  assert.ok(Math.abs((last.lift ?? 0) - propeller.center.x) < 1e-9, 'uç yüzeyi göbekte kapanmıyor');
  const endTop = (end.lift ?? 0) + end.radius * (end.upperScale ?? 1);
  const endBottom = (end.lift ?? 0) - end.radius * (end.lowerScale ?? 1);
  assert.ok(Math.abs(endTop - DIMS.length_m * RATIOS.bodyEndTopRatio) < 1e-9);
  assert.ok(Math.abs(endBottom - DIMS.length_m * RATIOS.bodyEndBottomRatio) < 1e-9);
  assert.ok(Math.abs(end.radius - (DIMS.wingspan_m * RATIOS.bodyEndWidthRatio) / 2) < 1e-9);

  const depths = stations.map((s) => s.radius * (s.upperScale ?? 1) * 2);
  assert.ok(Math.abs(Math.max(...depths) - 2 * H) < 1e-9, 'en derin kesit okunan derinlikte değil');

  const floor = stations.filter(
    (s) => s.y > DIMS.length_m * RATIOS.noseBottomT && s.y < DIMS.length_m * RATIOS.aftBottomStartT
  );
  assert.ok(floor.length > 5);
  for (const s of floor) {
    const bottom = (s.lift ?? 0) - s.radius * (s.lowerScale ?? 1);
    assert.ok(Math.abs(bottom + H) < 1e-9, `taban ${s.y} m'de düz değil`);
  }
});

test('dış parçalar var, mühimmat geometrisi yok', () => {
  const ids = parts().map((part) => part.id);
  for (const required of [
    'propeller',
    'propeller-spinner',
    'wing-fairing',
    'boom-fairing-1',
    'boom-fairing-2',
    'ventral-fairing',
    'sensor-turret',
    'sensor-window',
    'gear-nose',
    'gear-main-a',
    'wheel-nose'
  ]) {
    assert.ok(ids.includes(required), `${required} yok`);
  }
  // Yük istasyonları çizilmez: karelerde mühimmat yüklü (sayfada yazılı).
  assert.ok(!ids.some((id) => id.startsWith('pylon-')));
  assert.ok(!ids.some((id) => /store|muhimmat|bomb|missile/i.test(id)));
});

test('çizilmeyen burun probu sayfada yazılı (§9)', () => {
  const notes = TB2.omitted ?? [];
  assert.ok(notes.some((note) => note.tr.includes('prob') && note.en.includes('probe')));
  // Prob gerçekten çizilmiyor: burun ucunun önünde parça yok.
  const bounds = partsBounds(parts());
  assert.ok(Math.abs(bounds.min.y) < 1e-9, 'burun ucunun önünde bir parça var');
});

test('yükseklik verisi yoksa iniş takımı uydurulmaz', () => {
  const list = parts({length_m: 6.4, wingspan_m: 12});
  assert.ok(!list.some((part) => part.id.startsWith('gear-') || part.id.startsWith('wheel-')));
  assert.ok(list.some((part) => part.id === 'body'));
});

test('burun takımı: tekerlek bağlantının hafifçe önünde, ikinci destekli', () => {
  const list = parts();
  const leg = list.find((part) => part.id === 'gear-nose');
  assert.ok(leg?.kind === 'strut');
  assert.ok(leg.to.y < leg.from.y, 'burun tekerleği bağlantının önünde değil');

  // Destek havada kalmaz: üstte gövde tabanına, altta bacağın üzerine bağlanır.
  const brace = list.find((part) => part.id === 'gear-nose-drag');
  assert.ok(brace?.kind === 'strut', 'burun destek çubuğu yok');
  const H = (DIMS.length_m * RATIOS.bodyDepthRatio) / 2;
  const fairingEnd = DIMS.length_m * (RATIOS.ventralFairingPositionT + RATIOS.ventralFairingLengthRatio);
  if (brace.from.y > fairingEnd) {
    assert.ok(Math.abs(brace.from.x + H) < 1e-9, 'destek üst ucu gövde tabanında değil');
  }
  const k = (brace.to.x - leg.from.x) / (leg.to.x - leg.from.x);
  assert.ok(k > 0 && k < 1, 'destek alt ucu bacağın boyunda değil');
  assert.ok(Math.abs(leg.from.y + (leg.to.y - leg.from.y) * k - brace.to.y) < 1e-9, 'destek alt ucu bacakta değil');
});

test('etiket çapaları parçanın görünen yerinde', () => {
  const list = parts();
  const H = (DIMS.length_m * RATIOS.bodyDepthRatio) / 2;
  // Taret gövdenin altında asılı: çapa gövde tabanının altında kalmalı.
  const turret = list.find((part) => part.id === 'sensor-turret');
  assert.ok(turret);
  assert.ok(partAnchor(turret, 0.5, 180).x < -H, 'taret etiketi gövdenin içinde');
  // Pervane kanatları yatay park ediyor: çapa kanat boyunca, göbeğin yanında.
  const propeller = list.find((part) => part.id === 'propeller');
  assert.ok(propeller?.kind === 'disc');
  const anchor = partAnchor(propeller, 0.6);
  assert.ok(Math.abs(Math.abs(anchor.z) - propeller.radius * 0.6) < 1e-9, 'pervane etiketi kanat boyunca değil');
  assert.ok(Math.abs(anchor.x - propeller.center.x) < propeller.thickness * 2, 'pervane etiketi göbeğin üstünde havada');
});

test('kanat tek yüzey ve ucu kesik: sivrilmez, ayrı kontrol yüzeyi yok', () => {
  const list = parts();
  assert.ok(!list.some((part) => part.id.startsWith('aileron-')), 'ayrı aileron çiziliyor');
  for (const id of ['wing-1', 'wing-2']) {
    const stations = panel(list, id).stations;
    const tip = stations[stations.length - 1];
    const tipChord = DIMS.length_m * RATIOS.wingChordRatio * RATIOS.wingTaper;
    assert.ok(Math.abs(tip.chord - tipChord) < 1e-9, `${id} ucu sivriliyor`);
    assert.ok(tip.thickness > 0, `${id} ucu kapanıyor`);
  }
});

test('oranların iki dilde etiketi ve açık köken durumu var', () => {
  for (const [key, ratio] of Object.entries(TB2.ratios)) {
    assert.ok(tr.RatioLabels[key as keyof typeof tr.RatioLabels], `TR etiketi yok: ${key}`);
    assert.ok(en.RatioLabels[key as keyof typeof en.RatioLabels], `EN etiketi yok: ${key}`);
    if (ratio.basis === 'measured') {
      assert.equal(key, 'propBladeCount', `${key} için izdüşüm sınavı yalnızca sayımı kapsıyor`);
    }
    if (ratio.basis === 'reading') {
      assert.match(ratio.source_url, /keyshotxr\/img\/bayraktar-tb2\/0_\d+\.png$/, `${key} kaynak karesi`);
    }
  }
});
