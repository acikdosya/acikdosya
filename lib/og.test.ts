import assert from 'node:assert/strict';
import {test} from 'node:test';
import {AKINCI} from './geometry/akinci';
import {buildParts} from './geometry/product';
import {TAYFUN} from './geometry/tayfun';
import {aircraftDataUri, silhouetteDataUri} from './og';

/**
 * Paylasim gorseli sayfadaki semayla AYNI parca listesinden turer.
 * Ayri, elle cizilmis bir varlik tutulmaz (specs/system-silhouette).
 */

function decode(src: string): string {
  const base64 = src.replace('data:image/svg+xml;base64,', '');
  return Buffer.from(base64, 'base64').toString('utf8');
}

test('fuze paylasim gorseli izdusumden gelir', () => {
  const parts = buildParts(TAYFUN, {length_m: 6.5, diameter_mm: 610});
  const image = silhouetteDataUri([
    {id: 'tayfun', label: 'TAYFUN', lengthM: 6.5, diameterMm: 610, parts}
  ]);
  assert.ok(image);
  const svg = decode(image.src);
  assert.ok(svg.includes('<path'));
  assert.ok(!svg.includes('stroke-dasharray'), 'kontur kesikli cizilmemeli');
});

test('parca listesi yoksa paylasim gorseli de kontur cizmez', () => {
  const image = silhouetteDataUri([
    {id: 'x', label: 'X', lengthM: 6.5, diameterMm: 610}
  ]);
  assert.ok(image);
  const svg = decode(image.src);
  // Govde ve yuzey yollari bos; yalnizca bos path ogeleri kalir.
  assert.ok(svg.includes('d=""'), 'kontur uretilmemeli');
});

test('ucak paylasim gorseli parca listesi varsa dis hat cizer', () => {
  const parts = buildParts(AKINCI, {length_m: 12.3, wingspan_m: 20});
  const image = aircraftDataUri([
    {
      id: 'akinci',
      label: 'AKINCI',
      lengthM: 12.3,
      wingspanM: 20,
      heightM: 4.1,
      parts
    }
  ]);
  assert.ok(image);
  const svg = decode(image.src);
  assert.ok(!svg.includes('stroke-dasharray'), 'dis hat kesikli olmamali');
});

test('ucak paylasim gorseli parca listesi yoksa kesikli zarf cizer', () => {
  const image = aircraftDataUri([
    {id: 'akinci', label: 'AKINCI', lengthM: 12.3, wingspanM: 20, heightM: 4.1}
  ]);
  assert.ok(image);
  assert.ok(decode(image.src).includes('stroke-dasharray'));
});

test('gorsel olcusu olcuden turer — veri degisince gorsel degisir', () => {
  const small = silhouetteDataUri([
    {
      id: 'a',
      label: 'A',
      lengthM: 6.5,
      diameterMm: 610,
      parts: buildParts(TAYFUN, {length_m: 6.5, diameter_mm: 610})
    }
  ]);
  const large = silhouetteDataUri([
    {
      id: 'a',
      label: 'A',
      lengthM: 10,
      diameterMm: 938,
      parts: buildParts(TAYFUN, {length_m: 10, diameter_mm: 938})
    }
  ]);
  assert.ok(small && large);
  assert.notEqual(decode(small.src), decode(large.src));
});
