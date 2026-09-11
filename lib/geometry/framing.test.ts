import assert from 'node:assert/strict';
import {test} from 'node:test';
import {AKINCI} from './akinci';
import {goalFor, horizontalRadius} from './framing';
import {frameFromParts} from './model';
import {buildParts} from './product';
import {TAYFUN} from './tayfun';

/**
 * Kadraj kurallari bu projenin en sessiz hatalarinin ciktigi yer: bir
 * zamanlar bildirilen erisim mesh'ten dardi ve kanatciklar kesiliyordu.
 * Bu yuzden kadraj sahneden ayri bir modulde ve sinaniyor.
 */

const FOV = 38;
const ASPECT = 16 / 9;

const akinci = frameFromParts(
  buildParts(AKINCI, {length_m: 12.3, wingspan_m: 20, height_m: 4.1})!
);
const tayfun = frameFromParts(
  buildParts(TAYFUN, {length_m: 6.5, diameter_mm: 610})!
);

/** Kameranin gordugu yari genislik ve yari yukseklik, hedef mesafesinde. */
function halfExtents(distance: number) {
  const tan = Math.tan(((FOV * Math.PI) / 180) / 2);
  return {height: tan * distance, width: tan * distance * ASPECT};
}

test('genel gorunum modeli cerceveye alir', () => {
  for (const [label, frame] of [
    ['AKINCI', akinci],
    ['TAYFUN', tayfun]
  ] as const) {
    const goal = goalFor(frame, {kind: 'overview'}, undefined, FOV, ASPECT);
    const distance = goal.position.distanceTo(goal.target);
    const seen = halfExtents(distance);
    assert.ok(
      seen.width >= horizontalRadius(frame) * 0.99,
      `${label}: kadraj ${seen.width}, model yaricapi ${horizontalRadius(frame)}`
    );
  }
});

test('on gorunus kanat acikligini ve dikey uzanimi cerceveye alir', () => {
  const goal = goalFor(akinci, {kind: 'front'}, undefined, FOV, ASPECT);
  const distance = goal.position.distanceTo(goal.target);
  const seen = halfExtents(distance);

  const halfSpan = akinci.reach;
  const halfHeight = (akinci.bounds.max.x - akinci.bounds.min.x) / 2;

  assert.ok(seen.width >= halfSpan, `yatay ${seen.width} < ${halfSpan}`);
  assert.ok(seen.height >= halfHeight, `dikey ${seen.height} < ${halfHeight}`);
});

test('on gorunus burun ekseninden bakar, modelin icinde durmaz', () => {
  const goal = goalFor(akinci, {kind: 'front'}, undefined, FOV, ASPECT);
  // Govde ekseni dunyada X; kamera burnun onunde olmali.
  assert.equal(goal.position.z, 0);
  assert.ok(
    goal.position.x > akinci.length / 2,
    `kamera ${goal.position.x}, burun ${akinci.length / 2}`
  );
});

test('on gorunus modelin dikey ortasini hedefler', () => {
  const goal = goalFor(akinci, {kind: 'front'}, undefined, FOV, ASPECT);
  const centre = (akinci.bounds.max.x + akinci.bounds.min.x) / 2;
  assert.ok(Math.abs(goal.target.y - centre) < 1e-9);
  // Inis takimi geldigi icin merkez sifirda DEGIL.
  assert.ok(Math.abs(centre) > 0.1, `merkez ${centre}`);
});

test('odak noktasi parca uzerinde cozulur, govde ekseninde degil', () => {
  // Kanat ucu: govde ekseninden uzakta, yanal.
  const focus = {x: 0.9, y: 4.0};
  const goal = goalFor(akinci, {kind: 'focus', part: 'wing-tip-1', t: 0.6}, focus, FOV, ASPECT);
  // Sahne cevirmesi: dunya x = L/2 - model y
  assert.ok(Math.abs(goal.target.x - (akinci.length / 2 - focus.y)) < 1e-9);
  assert.ok(Math.abs(goal.target.y - focus.x) < 1e-9);
});

test('odak noktasi cozulemezse genel gorunume dusulur', () => {
  const missing = goalFor(
    akinci,
    {kind: 'focus', part: 'olmayan-parca', t: 0.5},
    undefined,
    FOV,
    ASPECT
  );
  const overview = goalFor(akinci, {kind: 'overview'}, undefined, FOV, ASPECT);
  assert.deepEqual(missing.position.toArray(), overview.position.toArray());
});

test('kanat acikligi govdeden uzunsa kadraj acikliga gore kurulur', () => {
  // AKINCI: 20 m aciklik, 12,3 m govde.
  assert.ok(akinci.reach * 2 > akinci.length);
  const goal = goalFor(akinci, {kind: 'overview'}, undefined, FOV, ASPECT);
  const seen = halfExtents(goal.position.distanceTo(goal.target));
  assert.ok(seen.width >= akinci.reach, 'kanat ucu kesiliyor');
});
