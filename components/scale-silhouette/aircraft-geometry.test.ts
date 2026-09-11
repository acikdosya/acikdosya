import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  compactAircraftEnvelopes,
  layoutAircrafts,
  type AircraftItem
} from './aircraft-geometry';

/**
 * Bu dosyanin sebebi somut: ilk surumde kanat acikligi uzunlukla AYNI
 * eksende ciziliyordu. AKINCI'nin 20 metrelik acikligi 700 birimlik
 * tuvalde -102 ile 810 arasina dusuyor, iki uc da kirpiliyordu. Tip
 * sistemi bunu goremez — iki sayi da number.
 */

const AKINCI: AircraftItem = {
  id: 'family',
  label: 'Aile duzeyindeki beyanlar',
  lengthM: 12.2,
  wingspanM: 20,
  heightM: 4.1
};

/**
 * Path'teki noktalari cozer. Uretilen komutlar yalnizca M/H/V/Z oldugu
 * icin tam bir SVG ayristiricisina gerek yok.
 */
function points(path: string): Array<{x: number; y: number}> {
  const result: Array<{x: number; y: number}> = [];
  let x = 0;
  let y = 0;

  for (const [, command, rest] of path.matchAll(
    /([MHVZ])([-\d.\s]*)/g
  )) {
    const values = (rest.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
    if (command === 'M') {
      [x, y] = values;
    } else if (command === 'H') {
      [x] = values;
    } else if (command === 'V') {
      [y] = values;
    } else {
      continue;
    }
    result.push({x, y});
  }

  return result;
}

test('kanat acikligi ile uzunluk ayri eksenlerde', () => {
  const layout = layoutAircrafts([AKINCI]);
  assert.ok(layout);

  const [row] = layout.rows;
  // Genis olcu yatay eksende: 20 m > 12,2 m oldugu icin zarf enli olmali.
  assert.ok(
    row.plan.width > row.plan.height,
    'ust gorunus zarfi kanat acikligi yonunde enli degil'
  );
});

test('iki eksen tek carpanla cizilir', () => {
  const layout = layoutAircrafts([AKINCI]);
  assert.ok(layout);

  const [row] = layout.rows;
  const horizontal = row.plan.width / AKINCI.wingspanM;
  const vertical = row.plan.height / AKINCI.lengthM;

  assert.ok(
    Math.abs(horizontal - vertical) < 0.01,
    `eksen basina ayri olcek: ${horizontal} / ${vertical}`
  );
  assert.ok(Math.abs(horizontal - layout.scale) < 0.01);
});

test('cizimin hicbir parcasi tuvalin disina tasmaz', () => {
  const layout = layoutAircrafts([AKINCI]);
  assert.ok(layout);

  const paths = layout.rows.flatMap((row) => [
    row.plan.path,
    row.front?.path,
    row.length.path,
    row.wingspan.path,
    row.height?.path
  ]);

  for (const path of paths) {
    if (!path) continue;
    for (const point of points(path)) {
      assert.ok(
        point.x >= 0 && point.x <= layout.width,
        `x tuval disinda: ${point.x} (${path})`
      );
      assert.ok(
        point.y >= 0 && point.y <= layout.height,
        `y tuval disinda: ${point.y} (${path})`
      );
    }
  }

  for (const row of layout.rows) {
    assert.ok(row.plan.x + row.plan.width <= layout.width);
    // Olcu etiketi sag sutuna sigmali; tasan metin kirpilir.
    assert.ok(row.length.labelX + 96 <= layout.width);
  }
});

test('zemin cizgisi on gorunusun alt kenarinda', () => {
  const layout = layoutAircrafts([AKINCI]);
  assert.ok(layout);

  const front = layout.rows[0].front;
  assert.ok(front);
  assert.equal(layout.groundY, front.y + front.height);
  assert.equal(layout.human.y, layout.groundY - layout.human.height);
});

test('yukseklik verisi yoksa on gorunus cizilmez', () => {
  const layout = layoutAircrafts([{...AKINCI, heightM: undefined}]);
  assert.ok(layout);

  assert.equal(layout.rows[0].front, undefined);
  assert.equal(layout.rows[0].height, undefined);
});

test('bos veya sifir olculu kume cizim uretmez', () => {
  assert.equal(layoutAircrafts([]), undefined);
  assert.equal(
    layoutAircrafts([{...AKINCI, wingspanM: 0}]),
    undefined
  );
  assert.equal(layoutAircrafts([{...AKINCI, lengthM: 0}]), undefined);
});

test('paylasim gorseli sayfayla ayni carpani kullanir', () => {
  const layout = layoutAircrafts([AKINCI]);
  const compact = compactAircraftEnvelopes([AKINCI]);
  assert.ok(layout && compact);

  assert.equal(compact.rects[0].width, layout.rows[0].plan.width);
  // Yukseklik verisi var: seride on gorunus var, ust gorunus degil.
  assert.equal(compact.rects[0].height, layout.rows[0].front?.height);
  assert.ok(compact.width > compact.height, 'paylasim serisi genis degil');
});
