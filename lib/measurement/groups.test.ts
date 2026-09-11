import assert from 'node:assert/strict';
import {test} from 'node:test';
import {allMeasurements, specGroups} from './groups';
import type {Measurement, Specs, System, Variant} from '../schema';

function measurement(value: number): Measurement {
  return {
    value,
    confidence: 'official',
    source: {tr: 'kaynak', en: 'source'},
    verified_at: '2026-09-11'
  };
}

function variant(id: string, specs: Specs = {}): Variant {
  return {
    id,
    label: id,
    specs,
    attributes: {},
    annotations: []
  };
}

function system(overrides?: {
  specs?: Specs;
  variants?: Variant[];
}): System {
  return {
    $schema_version: '0.1',
    id: 'test',
    slug: 'test',
    name: {tr: 'Test', en: 'Test'},
    category: 'balistik-fuze',
    manufacturer: {id: 'test', name: 'TEST'},
    status: 'test',
    summary: {tr: 'Özet', en: 'Summary'},
    variants: overrides?.variants ?? [variant('v1')],
    timeline: [],
    disclaimer: {tr: 'Uyarı', en: 'Disclaimer'},
    ...(overrides?.specs ? {specs: overrides.specs} : {})
  };
}

test('aile olcusu yoksa yalnizca varyant gruplari doner', () => {
  const s = system({variants: [variant('v1', {length_m: [measurement(10)]})]});
  const groups = specGroups(s);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].kind, 'variant');
  assert.equal(groups[0].id, 'v1');
});

test('aile olcusu varsa ilk grup ailedir', () => {
  const s = system({
    specs: {length_m: [measurement(12)]},
    variants: [variant('v1', {length_m: [measurement(10)]})]
  });
  const groups = specGroups(s);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].kind, 'family');
  assert.equal(groups[0].id, 'family');
  assert.equal(groups[1].kind, 'variant');
});

test('allMeasurements tum gruplardaki olculeri dolasir', () => {
  const s = system({
    specs: {length_m: [measurement(12)]},
    variants: [
      variant('v1', {length_m: [measurement(10)]}),
      variant('v2', {length_m: [measurement(11)]})
    ]
  });
  const found = [...allMeasurements(s)];

  assert.equal(found.length, 3);
  assert.ok(found.some((item) => item.group.kind === 'family'));
  assert.ok(found.some((item) => item.group.id === 'v1'));
  assert.ok(found.some((item) => item.group.id === 'v2'));
});

test('aile olcusu varyanta kopyalanmamis olarak sayilir', () => {
  const s = system({
    specs: {length_m: [measurement(12)]},
    variants: [variant('v1')]
  });
  const found = [...allMeasurements(s)];

  assert.equal(found.length, 1);
  assert.equal(found[0].group.kind, 'family');
});

test('grup labeli aile icin ceviri anahtaridir', () => {
  const s = system({specs: {length_m: [measurement(12)]}});
  const groups = specGroups(s);

  assert.equal(groups[0].label, 'family');
});
