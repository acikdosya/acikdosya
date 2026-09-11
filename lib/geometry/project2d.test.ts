import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {test} from 'node:test';
import {AKINCI} from './akinci';
import {ATMACA} from './atmaca';
import {partsBounds} from './parts';
import {buildParts} from './product';
import {projectBounds, projectParts, type ViewAxis} from './project2d';
import {TAYFUN} from './tayfun';

/**
 * Izdusum ile uc boyutlu model ayni parca listesinden turuyor; sinir
 * kutulari da ortusmeli. Ortusmezse iki katman ayrisiyor demektir ve
 * ayrisma tam olarak kacindigimiz sey (specs/system-silhouette).
 */

const CASES = [
  {label: 'TAYFUN', product: TAYFUN, dims: {length_m: 6.5, diameter_mm: 610}},
  {label: 'ATMACA', product: ATMACA, dims: {length_m: 4.3, diameter_mm: 370}},
  {label: 'AKINCI', product: AKINCI, dims: {length_m: 12.3, wingspan_m: 20}}
] as const;

const AXES: ViewAxis[] = ['front', 'side', 'top'];

/** Model ekseninden ekran eksenine: u ve v hangi model eksenini okuyor. */
const MAPPING: Record<ViewAxis, {u: 'x' | 'y' | 'z'; v: 'x' | 'y' | 'z'}> = {
  side: {u: 'y', v: 'x'},
  top: {u: 'y', v: 'z'},
  front: {u: 'z', v: 'x'}
};

test('project2d three ice aktarmaz', () => {
  const source = readFileSync(
    join(process.cwd(), 'lib', 'geometry', 'project2d.ts'),
    'utf8'
  );
  const imports = [...source.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
  assert.equal(
    imports.some((name) => name === 'three' || name.startsWith('three/')),
    false,
    `three ice aktarilmis: ${imports.join(', ')}`
  );
});

for (const item of CASES) {
  const parts = buildParts(item.product, item.dims);
  assert.ok(parts, `${item.label} parca listesi`);
  const solid = partsBounds(parts);

  for (const axis of AXES) {
    test(`${item.label} ${axis}: izdusum sinir kutusu uc boyutluyla ortusur`, () => {
      const flat = projectBounds(parts, axis);
      assert.ok(flat);
      const map = MAPPING[axis];

      const width = solid.max[map.u] - solid.min[map.u];
      const height = solid.max[map.v] - solid.min[map.v];

      assert.ok(
        Math.abs(flat.maxU - flat.minU - width) < 0.02,
        `genislik ${flat.maxU - flat.minU}, 3B ${width}`
      );
      assert.ok(
        Math.abs(flat.maxV - flat.minV - height) < 0.02,
        `yukseklik ${flat.maxV - flat.minV}, 3B ${height}`
      );
    });
  }

  test(`${item.label}: her parca kapali bir yol uretir`, () => {
    for (const axis of AXES) {
      const outlines = projectParts(parts, axis);
      assert.equal(outlines.length, parts.length);
      for (const outline of outlines) {
        assert.ok(outline.path.startsWith('M '), `${outline.id} ${axis}`);
        assert.ok(outline.path.endsWith(' Z'), `${outline.id} ${axis}`);
        assert.ok(
          Number.isFinite(
            Number(outline.path.split(' ')[1])
          ),
          `${outline.id} ${axis} sayisal olmayan koordinat`
        );
      }
    }
  });

  test(`${item.label}: izdusum sirasi parca listesiyle ayni`, () => {
    const outlines = projectParts(parts, 'side');
    assert.deepEqual(
      outlines.map((outline) => outline.id),
      parts.map((part) => part.id)
    );
  });
}

test('yan gorunus burun ile kuyrugu yatay serer', () => {
  const parts = buildParts(TAYFUN, {length_m: 6.5, diameter_mm: 610});
  assert.ok(parts);
  const flat = projectBounds(parts, 'side');
  assert.ok(flat);
  // u ekseni govde boyu, v ekseni kanatcik acikligi
  assert.ok(flat.maxU - flat.minU > flat.maxV - flat.minV);
});

test('on gorunus kanat acikligini yatay eksende verir', () => {
  const parts = buildParts(AKINCI, {length_m: 12.3, wingspan_m: 20});
  assert.ok(parts);
  const flat = projectBounds(parts, 'front');
  assert.ok(flat);
  assert.ok(
    Math.abs(flat.maxU - flat.minU - 20) < 0.02,
    `aciklik ${flat.maxU - flat.minU}`
  );
});

test('govde konturu icbukey kalir — zarfa duzlesmez', () => {
  const parts = buildParts(TAYFUN, {length_m: 6.5, diameter_mm: 610});
  assert.ok(parts);
  const body = projectParts(parts, 'side').find((o) => o.id === 'body');
  assert.ok(body);
  /*
   * Ogive burun disbukey bir zarfa girse duz bir konide duzlesirdi.
   * Yolun burun bolgesindeki noktalari bir dogru uzerinde OLMAMALI.
   */
  const coords = body.path
    .split(/[MLZ]/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => chunk.split(/\s+/).map(Number));
  const nose = coords.filter(([u]) => u < 6.5 * 0.22).slice(0, 12);
  assert.ok(nose.length >= 6);
  const [first] = nose;
  const last = nose[nose.length - 1];
  const offLine = nose.some(([u, v]) => {
    const t = (u - first[0]) / (last[0] - first[0] || 1);
    const straight = first[1] + (last[1] - first[1]) * t;
    return Math.abs(v - straight) > 0.005;
  });
  assert.ok(offLine, 'burun profili dogrusallasmis');
});

test('kanat acikligi olculen degeri asmaz', () => {
  const parts = buildParts(AKINCI, {length_m: 12.3, wingspan_m: 20});
  assert.ok(parts);
  for (const axis of ['front', 'top'] as const) {
    const flat = projectBounds(parts, axis);
    assert.ok(flat);
    const span = axis === 'front' ? flat.maxU - flat.minU : flat.maxV - flat.minV;
    assert.ok(span <= 20.01, `${axis} acikligi ${span}`);
  }
});
