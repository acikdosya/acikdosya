import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {test} from 'node:test';
import {ATMACA} from '@/lib/geometry/atmaca';
import {buildParts} from '@/lib/geometry/product';
import {TAYFUN} from '@/lib/geometry/tayfun';
import {layoutSilhouettes} from './geometry';

/**
 * Siluet, uc boyutlu modelle AYNI parca listesinden turuyor. Parca
 * listesi yoksa kontur cizilmez, kesikli olcu zarfi cizilir — cunku
 * varsayilan bir bicim vermek §9'un yasakladigi sey (tasks 3.2, 3.3).
 */

const TAYFUN_DIMS = {length_m: 6.5, diameter_mm: 610};

function item(parts?: ReturnType<typeof buildParts>) {
  return {
    id: 'tayfun',
    label: 'TAYFUN',
    lengthM: 6.5,
    diameterMm: 610,
    parts
  };
}

/** Yoldaki tum sayi ciftleri. */
function points(path: string): Array<[number, number]> {
  return [...path.matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)].map(
    (match) => [Number(match[1]), Number(match[2])]
  );
}

test('siluet yolu three ice aktarmadan uretilir', () => {
  const chain = ['geometry.ts', 'aircraft-geometry.ts'].map((name) =>
    readFileSync(join(process.cwd(), 'components', 'scale-silhouette', name), 'utf8')
  );
  chain.push(
    readFileSync(join(process.cwd(), 'lib', 'geometry', 'parts-for.ts'), 'utf8')
  );
  for (const source of chain) {
    const imports = [...source.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
    assert.equal(
      imports.some((name) => name === 'three' || name.startsWith('three/')),
      false,
      `three ice aktarilmis: ${imports.join(', ')}`
    );
    assert.equal(
      imports.some((name) => name.endsWith('geometry/model')),
      false,
      'model.ts three cekiyor; sema yolundan ice aktarilmamali'
    );
  }
});

test('parca listesi varsa kontur cizilir, zarf cizilmez', () => {
  const parts = buildParts(TAYFUN, TAYFUN_DIMS);
  const layout = layoutSilhouettes([item(parts)]);
  assert.ok(layout);
  const [row] = layout.rows;
  assert.equal(row.envelope, undefined);
  assert.ok(row.body.length > 0);
  assert.ok(row.fins.length > 0);
});

test('parca listesi yoksa kesikli zarf cizilir, kontur cizilmez', () => {
  const layout = layoutSilhouettes([item(undefined)]);
  assert.ok(layout);
  const [row] = layout.rows;
  assert.ok(row.envelope);
  assert.equal(row.body, '');
  assert.equal(row.fins, '');
});

test('kontur yayimlanmis uzunlugu asmaz', () => {
  const parts = buildParts(TAYFUN, TAYFUN_DIMS);
  const layout = layoutSilhouettes([item(parts)]);
  assert.ok(layout);
  const [row] = layout.rows;
  const xs = [...points(row.body), ...points(row.fins)].map(([x]) => x);
  const drawn = (Math.max(...xs) - Math.min(...xs)) / layout.scale;
  assert.ok(
    Math.abs(drawn - 6.5) < 0.02,
    `cizilen uzunluk ${drawn} m, yayimlanan 6,5 m`
  );
});

test('govde konturu bugunku gorunume yakin kalir', () => {
  const parts = buildParts(TAYFUN, TAYFUN_DIMS);
  const layout = layoutSilhouettes([item(parts)]);
  assert.ok(layout);
  const [row] = layout.rows;
  const body = points(row.body);

  // Govde yaricapi: yayimlanan 610 mm capin yarisi, olcege vurulmus.
  const ys = body.map(([, y]) => y);
  const drawnRadius = (Math.max(...ys) - Math.min(...ys)) / 2 / layout.scale;
  assert.ok(
    Math.abs(drawnRadius - 0.305) < 0.01,
    `cizilen yaricap ${drawnRadius} m`
  );
});

test('ATMACA konturu govde ortasi kanadi da tasir', () => {
  const parts = buildParts(ATMACA, {length_m: 4.3, diameter_mm: 370});
  const layout = layoutSilhouettes([
    {id: 'atmaca', label: 'ATMACA', lengthM: 4.3, diameterMm: 370, parts}
  ]);
  assert.ok(layout);
  const [row] = layout.rows;
  const ys = points(row.fins).map(([, y]) => y);
  const reach = (Math.max(...ys) - Math.min(...ys)) / 2 / layout.scale;
  // Kanat ucu 2,74 yaricapta = 0,507 m
  assert.ok(
    Math.abs(reach - 0.185 * 2.74) < 0.02,
    `yuzey uzanimi ${reach} m`
  );
});

test('tek olcek carpani: iki varyant ayni carpani paylasir', () => {
  const layout = layoutSilhouettes([
    {
      id: 'a',
      label: 'A',
      lengthM: 6.5,
      diameterMm: 610,
      parts: buildParts(TAYFUN, TAYFUN_DIMS)
    },
    {
      id: 'b',
      label: 'B',
      lengthM: 10,
      diameterMm: 938,
      parts: buildParts(TAYFUN, {length_m: 10, diameter_mm: 938})
    }
  ]);
  assert.ok(layout);
  const width = (row: (typeof layout.rows)[number]) => {
    const xs = points(row.body).map(([x]) => x);
    return Math.max(...xs) - Math.min(...xs);
  };
  const ratio = width(layout.rows[1]) / width(layout.rows[0]);
  assert.ok(Math.abs(ratio - 10 / 6.5) < 0.02, `oran ${ratio}`);
});
