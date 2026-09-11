import assert from 'node:assert/strict';
import {test} from 'node:test';
import {buildParts, defineProduct, resolveDimensions} from './product';
import type {Part} from './parts';
import {wingStations} from './panel';
import {vec3} from './parts';
import {chosen, measured} from './ratio';

const NOTE = {tr: 'gerekce', en: 'rationale'};
const SEEN = {
  source_url: 'https://example.org/gorunus.png',
  seen_at: '2026-09-11',
  projection_check: {tr: 'sinav', en: 'check'}
};

/** Eksenel govde: TAYFUN ve ATMACA'nin sekli. */
const axial = defineProduct({
  slug: 'ornek-fuze',
  category: 'balistik-fuze',
  requires: ['length_m', 'diameter_mm'],
  ratios: {
    noseRatio: measured(0.22, {note: NOTE, axis: 'along', ...SEEN}),
    finCount: chosen(4, {note: NOTE})
  },
  build({dims, ratios}): Part[] {
    const R = dims.diameter_mm / 2000;
    const parts: Part[] = [
      {
        kind: 'body',
        id: 'body',
        orientation: 'along',
        origin: vec3(),
        spec: {
          aspect: 1,
          stations: [
            {y: 0, radius: 0.0005},
            {y: dims.length_m * ratios.noseRatio, radius: R},
            {y: dims.length_m, radius: R}
          ]
        }
      }
    ];
    for (let i = 0; i < ratios.finCount; i++) {
      parts.push({
        kind: 'panel',
        id: `fin-${i}`,
        root: vec3(0, dims.length_m * 0.86, 0),
        angleDeg: (i * 360) / ratios.finCount,
        stations: wingStations({
          span: R * 1.9,
          rootChord: dims.length_m * 0.14,
          tipChord: dims.length_m * 0.06,
          rakeDeg: 0,
          thicknessRatio: 0.09
        }),
        rootFillet: 0
      });
    }
    return parts;
  }
});

/** Kanatli hava araci: AKINCI'nin sekli, kisaltilmis. */
const winged = defineProduct({
  slug: 'ornek-iha',
  category: 'insansiz-hava-araci',
  requires: ['length_m', 'wingspan_m'],
  ratios: {
    fuselageRatio: measured(0.09, {note: NOTE, axis: 'lateral', ...SEEN}),
    wingPositionT: measured(0.27, {note: NOTE, axis: 'along', ...SEEN})
  },
  build({dims, ratios}): Part[] {
    const R = (dims.length_m * ratios.fuselageRatio) / 2;
    return [
      {
        kind: 'body',
        id: 'body',
        orientation: 'along',
        origin: vec3(),
        spec: {
          aspect: 1,
          stations: [
            {y: 0, radius: 0.0005},
            {y: dims.length_m, radius: R}
          ]
        }
      },
      {
        kind: 'panel',
        id: 'wing-left',
        root: vec3(R, dims.length_m * ratios.wingPositionT, 0),
        angleDeg: 90,
        stations: wingStations({
          span: dims.wingspan_m / 2,
          rootChord: 2.7,
          tipChord: 0.95,
          rakeDeg: 0,
          thicknessRatio: 0.09
        }),
        rootFillet: 0.13
      }
    ];
  }
});

/** Cift kirisli ters V kuyruk — kit bunu yeni tip dali acmadan tasiyor mu. */
const twinBoom = defineProduct({
  slug: 'ornek-cift-kiris',
  category: 'insansiz-hava-araci',
  requires: ['length_m', 'wingspan_m'],
  ratios: {boomOffset: chosen(0.18, {note: NOTE})},
  build({dims, ratios}): Part[] {
    const offset = dims.wingspan_m * ratios.boomOffset;
    const parts: Part[] = [
      {
        kind: 'body',
        id: 'body',
        orientation: 'along',
        origin: vec3(),
        spec: {aspect: 1, stations: [{y: 0, radius: 0.2}, {y: dims.length_m, radius: 0.2}]}
      }
    ];
    for (const side of [1, -1]) {
      parts.push({
        kind: 'boom',
        id: `boom-${side > 0 ? 'right' : 'left'}`,
        start: vec3(0, dims.length_m * 0.3, offset * side),
        length: dims.length_m * 0.6,
        radius: 0.09
      });
      parts.push({
        kind: 'panel',
        id: `vtail-${side > 0 ? 'right' : 'left'}`,
        root: vec3(0, dims.length_m * 0.85, offset * side),
        angleDeg: side > 0 ? -35 : 35,
        stations: wingStations({
          span: 1.2,
          rootChord: 0.8,
          tipChord: 0.5,
          rakeDeg: 0,
          thicknessRatio: 0.09
        }),
        rootFillet: 0
      });
    }
    return parts;
  }
});

test('eksik olcu model uretmez', () => {
  assert.equal(resolveDimensions(['length_m', 'diameter_mm'], {length_m: 6.5}), undefined);
  assert.equal(buildParts(axial, {length_m: 6.5}), undefined);
});

test('sayi olmayan deger eksik sayilir', () => {
  assert.equal(
    resolveDimensions(['length_m'], {length_m: Number.NaN}),
    undefined
  );
});

test('eksenel urun govde ve kanatcik uretir', () => {
  const parts = buildParts(axial, {length_m: 6.5, diameter_mm: 938});
  assert.ok(parts);
  assert.equal(parts.filter((p) => p.kind === 'body').length, 1);
  assert.equal(parts.filter((p) => p.kind === 'panel').length, 4);
});

test('kanatli urun ayni imzayla ifade edilir', () => {
  const parts = buildParts(winged, {length_m: 12.3, wingspan_m: 20});
  assert.ok(parts);
  assert.equal(parts.length, 2);
});

test('cift kirisli ters V kuyruk yeni tip dali gerektirmez', () => {
  const parts = buildParts(twinBoom, {length_m: 6.5, wingspan_m: 12});
  assert.ok(parts);
  assert.equal(parts.filter((p) => p.kind === 'boom').length, 2);
  assert.equal(parts.filter((p) => p.kind === 'panel').length, 2);
});

test('olcu degisince parcalar degisir', () => {
  const small = buildParts(axial, {length_m: 6.5, diameter_mm: 938})!;
  const large = buildParts(axial, {length_m: 7.5, diameter_mm: 938})!;
  const smallBody = small.find((p) => p.kind === 'body');
  const largeBody = large.find((p) => p.kind === 'body');
  assert.ok(smallBody?.kind === 'body' && largeBody?.kind === 'body');
  const smallEnd = smallBody.spec.stations.at(-1)!.y;
  const largeEnd = largeBody.spec.stations.at(-1)!.y;
  assert.equal(smallEnd, 6.5);
  assert.equal(largeEnd, 7.5);
});

test('fazladan olcu verilmesi zarar vermez', () => {
  const parts = buildParts(winged, {
    length_m: 12.3,
    wingspan_m: 20,
    height_m: 4.1
  });
  assert.ok(parts);
});
