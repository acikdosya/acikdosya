import assert from 'node:assert/strict';
import {test} from 'node:test';
import {AKINCI as AKINCI_PRODUCT} from '@/lib/geometry/akinci';
import {buildParts} from '@/lib/geometry/product';
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

/* --------------------------------------------- izdusumden gelen dis hat */

/**
 * Ust gorunus artik gercek dis hat; on gorunus hala zarf.
 *
 * Ayrim kasitli: inis takimi henuz modellenmedigi icin modelin dikey
 * uzanimi yayimlanan 4,1 m degil, ve gercek konturu yukseklik braketinin
 * icine koymak yanlis okunurdu (tasks 3.2, 3.3).
 */

const DIMS = {length_m: 12.3, wingspan_m: 20};
const ITEM: AircraftItem = {
  id: 'akinci',
  label: 'AKINCI',
  lengthM: 12.3,
  wingspanM: 20,
  heightM: 4.1
};

/** Dis hat yolundaki her sayi cifti — M/L komutlari. */
function outlinePoints(path: string): Array<[number, number]> {
  return [...path.matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)].map(
    (match) => [Number(match[1]), Number(match[2])]
  );
}

test('parca listesi yoksa ust gorunus zarf kalir', () => {
  const layout = layoutAircrafts([ITEM]);
  assert.ok(layout);
  assert.equal(layout.rows[0].planOutline, undefined);
  assert.ok(layout.rows[0].plan.path.length > 0);
});

test('parca listesi varsa ust gorunus dis hat olur', () => {
  const layout = layoutAircrafts([
    {...ITEM, parts: buildParts(AKINCI_PRODUCT, DIMS)}
  ]);
  assert.ok(layout);
  const row = layout.rows[0];
  assert.ok(row.planOutline);
  // Zarf yerlesim ve olcu cizgileri icin hala hesaplaniyor.
  assert.ok(row.plan.width > 0);
});

test('dis hat zarfin icinde kalir', () => {
  const layout = layoutAircrafts([
    {...ITEM, parts: buildParts(AKINCI_PRODUCT, DIMS)}
  ]);
  assert.ok(layout);
  const row = layout.rows[0];
  assert.ok(row.planOutline);

  const coords = outlinePoints(row.planOutline);
  const xs = coords.map(([x]) => x);
  const ys = coords.map(([, y]) => y);

  assert.ok(Math.min(...xs) >= row.plan.x - 0.5, `sol ${Math.min(...xs)}`);
  assert.ok(
    Math.max(...xs) <= row.plan.x + row.plan.width + 0.5,
    `sag ${Math.max(...xs)}`
  );
  assert.ok(Math.min(...ys) >= row.plan.y - 0.5, `ust ${Math.min(...ys)}`);
  assert.ok(
    Math.max(...ys) <= row.plan.y + row.plan.height + 0.5,
    `alt ${Math.max(...ys)}`
  );
});

test('dis hat kanat acikligini ve uzunlugu tam doldurur', () => {
  const layout = layoutAircrafts([
    {...ITEM, parts: buildParts(AKINCI_PRODUCT, DIMS)}
  ]);
  assert.ok(layout);
  const row = layout.rows[0];
  const coords = outlinePoints(row.planOutline!);
  const span = (Math.max(...coords.map(([x]) => x)) -
    Math.min(...coords.map(([x]) => x))) / layout.scale;
  const length = (Math.max(...coords.map(([, y]) => y)) -
    Math.min(...coords.map(([, y]) => y))) / layout.scale;

  assert.ok(Math.abs(span - 20) < 0.05, `aciklik ${span} m`);
  assert.ok(Math.abs(length - 12.3) < 0.05, `uzunluk ${length} m`);
});

test('on gorunus zarf olarak kaliyor — inis takimi modellenmedi', () => {
  const layout = layoutAircrafts([
    {...ITEM, parts: buildParts(AKINCI_PRODUCT, DIMS)}
  ]);
  assert.ok(layout);
  assert.ok(layout.rows[0].front, 'yukseklik verisi varsa on gorunus cizilir');
  assert.equal(layout.rows[0].height?.valueM, 4.1);
});

test('on gorunus dis hatta doner — takim modellendi, yukseklik ortusuyor', () => {
  const layout = layoutAircrafts([
    {...ITEM, parts: buildParts(AKINCI_PRODUCT, {...DIMS, height_m: 4.1})}
  ]);
  assert.ok(layout);
  const row = layout.rows[0];
  assert.ok(row.frontOutline, 'on gorunus hala zarf');

  const coords = outlinePoints(row.frontOutline);
  const height =
    (Math.max(...coords.map(([, y]) => y)) -
      Math.min(...coords.map(([, y]) => y))) /
    layout.scale;
  assert.ok(Math.abs(height - 4.1) < 0.05, `dikey uzanim ${height} m`);
});

test('yukseklik verisi modele girmiyorsa on gorunus zarf kalir', () => {
  // Takim cizilmeyen model: dikey uzanim yayimlanan 4,1 m degil.
  const layout = layoutAircrafts([
    {...ITEM, parts: buildParts(AKINCI_PRODUCT, DIMS)}
  ]);
  assert.ok(layout);
  assert.equal(
    layout.rows[0].frontOutline,
    undefined,
    'kisa kontur yukseklik braketini yalanlar'
  );
  assert.ok(layout.rows[0].front, 'zarf cizilmeli');
});
