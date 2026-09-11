import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {test} from 'node:test';
import {wingStations} from './panel';
import {
  PART_KINDS,
  boundsSize,
  emptyBounds,
  isEmptyBounds,
  partAnchor,
  partBounds,
  partsBounds,
  primaryBody,
  vec3,
  type Part
} from './parts';

const HERE = join(process.cwd(), 'lib', 'geometry');

/**
 * Kit islenmemis kalmali: three sunucu yoluna, zod istemci paketine
 * girmemeli (design.md §1). Bagimlilik listesi burada sabitlenir; bir
 * ice aktarim sessizce eklenirse test duser.
 */
const RENDERER_FREE = ['parts.ts', 'ratio.ts'];

for (const file of RENDERER_FREE) {
  test(`${file} three ya da zod ice aktarmaz`, () => {
    const source = readFileSync(join(HERE, file), 'utf8');
    const imports = [...source.matchAll(/from\s+'([^']+)'/g)].map((m) => m[1]);
    assert.equal(
      imports.some((name) => name === 'three' || name.startsWith('three/')),
      false,
      `three ice aktarilmis: ${imports.join(', ')}`
    );
    assert.equal(
      imports.some((name) => name === 'zod'),
      false,
      `zod ice aktarilmis: ${imports.join(', ')}`
    );
  });
}

test('kit alti ilkel tasir', () => {
  assert.deepEqual([...PART_KINDS], [
    'body',
    'pod',
    'panel',
    'disc',
    'strut',
    'boom'
  ]);
});

const body: Part = {
  kind: 'body',
  id: 'body',
  orientation: 'along',
  origin: vec3(0, 0, 0),
  spec: {
    aspect: 1,
    stations: [
      {y: 0, radius: 0.01},
      {y: 2, radius: 0.5},
      {y: 6, radius: 0.5}
    ]
  }
};

test('donel govde sinirlari yaricapi her iki eksende tasir', () => {
  const bounds = partBounds(body);
  const size = boundsSize(bounds);
  assert.equal(size.y, 6);
  assert.ok(Math.abs(size.x - 1) < 1e-9);
  assert.ok(Math.abs(size.z - 1) < 1e-9);
});

test('aspect yalniz dikey ekseni buyutur', () => {
  const oval: Part = {...body, spec: {...body.spec, aspect: 1.28}};
  const size = boundsSize(partBounds(oval));
  assert.ok(Math.abs(size.x - 1.28) < 1e-9);
  assert.ok(Math.abs(size.z - 1) < 1e-9);
});

test('yatay panel yanal ekseni acar, dikey panel dikeyi', () => {
  const panel: Part = {
    kind: 'panel',
    id: 'wing',
    root: vec3(0, 3, 0),
    angleDeg: 90,
    stations: wingStations({
      span: 10,
      rootChord: 2.7,
      tipChord: 0.95,
      rakeDeg: 0,
      thicknessRatio: 0.09
    }),
    rootFillet: 0.13
  };
  const lateral = boundsSize(partBounds(panel));
  assert.ok(Math.abs(lateral.z - 10) < 1e-9, `z=${lateral.z}`);

  const fin: Part = {
    ...panel,
    angleDeg: 0,
    stations: wingStations({
      span: 2.5,
      rootChord: 2.7,
      tipChord: 0.95,
      rakeDeg: 0,
      thicknessRatio: 0.09
    })
  };
  const vertical = boundsSize(partBounds(fin));
  assert.ok(Math.abs(vertical.x - 2.5) < 1e-9, `x=${vertical.x}`);
});

test('kanat acikligi govdeden uzunsa siniri kanat belirler', () => {
  const wing: Part = {
    kind: 'panel',
    id: 'wing',
    root: vec3(0, 3, 0),
    angleDeg: 90,
    stations: wingStations({
      span: 10,
      rootChord: 2.7,
      tipChord: 0.95,
      rakeDeg: 0,
      thicknessRatio: 0.09
    }),
    rootFillet: 0
  };
  const size = boundsSize(partsBounds([body, wing]));
  assert.ok(size.z > size.y, 'yanal uzanim govde boyunu asmali');
});

test('bos liste bos sinir verir', () => {
  assert.equal(isEmptyBounds(partsBounds([])), true);
  assert.equal(isEmptyBounds(emptyBounds()), true);
});

test('etiket konumu oran degisince tasinir, mutlak degil', () => {
  const nose = partAnchor(body, 0.1, 90);
  const tail = partAnchor(body, 0.9, 90);
  assert.ok(tail.y > nose.y);

  const longer: Part = {
    ...body,
    spec: {
      ...body.spec,
      stations: [
        {y: 0, radius: 0.01},
        {y: 2, radius: 0.5},
        {y: 12, radius: 0.5}
      ]
    }
  };
  assert.ok(partAnchor(longer, 0.9, 90).y > tail.y);
});

test('donel olmayan parcada aci yok sayilir', () => {
  const strut: Part = {
    kind: 'strut',
    id: 'gear',
    from: vec3(-0.5, 5, 0),
    to: vec3(-1.6, 5, 0),
    radius: 0.05
  };
  const withAngle = partAnchor(strut, 0.5, 200);
  const without = partAnchor(strut, 0.5);
  assert.deepEqual(withAngle, without);
});

test('birincil govde yalniz body rolunden gelir', () => {
  const pod: Part = {...body, kind: 'pod', id: 'nacelle'};
  assert.equal(primaryBody([pod]), undefined);
  assert.equal(primaryBody([pod, body])?.id, 'body');
});
