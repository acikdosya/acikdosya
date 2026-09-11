import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  selectMeasurements,
  systemKind,
  type AircraftDimensions
} from './measurements';
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

/**
 * Varsayilan slug 'tayfun': dis profili tanimli bir sistem, cunku
 * model uretimi olcuye DE profile de bagli (lib/geometry/selection.ts).
 */
function system(
  category: System['category'],
  overrides?: {
    specs?: Specs;
    variants?: Variant[];
    slug?: string;
  }
): System {
  return {
    $schema_version: '0.1',
    id: 'test',
    slug: overrides?.slug ?? 'tayfun',
    name: {tr: 'Test', en: 'Test'},
    category,
    manufacturer: {id: 'test', name: 'TEST'},
    status: 'test',
    summary: {tr: 'Özet', en: 'Summary'},
    variants: overrides?.variants ?? [variant('v1')],
    timeline: [],
    disclaimer: {tr: 'Uyarı', en: 'Disclaimer'},
    ...(overrides?.specs ? {specs: overrides.specs} : {})
  };
}

test('fuze kategorisi missile olarak taninir', () => {
  assert.equal(systemKind(system('balistik-fuze')), 'missile');
  assert.equal(systemKind(system('seyir-fuzesi')), 'missile');
});

test('IHA kategorisi aircraft olarak taninir', () => {
  assert.equal(systemKind(system('insansiz-hava-araci')), 'aircraft');
});

test('fuze icin uzunluk ve cap secilir', () => {
  const s = system('balistik-fuze', {
    specs: {
      length_m: [measurement(6)],
      diameter_mm: [measurement(610)]
    }
  });
  const result = selectMeasurements(s);

  assert.equal(result.length, 1);
  assert.equal(result[0].dimensions.kind, 'missile');
  assert.equal(result[0].dimensions.lengthM, 6);
  assert.equal(result[0].dimensions.diameterMm, 610);
  assert.equal(result[0].canModel, true);
});

test('dis profili tanimsiz fuze icin model uretilmez', () => {
  const s = system('balistik-fuze', {
    slug: 'henuz-profili-yok',
    specs: {
      length_m: [measurement(6)],
      diameter_mm: [measurement(610)]
    }
  });
  const result = selectMeasurements(s);

  assert.equal(result.length, 1);
  assert.equal(result[0].canModel, false);
  assert.ok(result[0].reason);
});

test('dis profili olan ucak icin model uretilir', () => {
  const s = system('insansiz-hava-araci', {
    slug: 'akinci',
    specs: {
      length_m: [measurement(12.2)],
      wingspan_m: [measurement(20)]
    }
  });
  const result = selectMeasurements(s);

  assert.equal(result.length, 1);
  assert.equal(result[0].canModel, true);
  assert.equal(result[0].reason, undefined);
});

test('ucak icin uzunluk ve kanat acikligi secilir; model uretilmez', () => {
  const s = system('insansiz-hava-araci', {
    specs: {
      length_m: [measurement(12.2)],
      wingspan_m: [measurement(20)]
    }
  });
  const result = selectMeasurements(s);

  assert.equal(result.length, 1);
  assert.equal(result[0].dimensions.kind, 'aircraft');
  assert.equal(result[0].dimensions.lengthM, 12.2);
  assert.equal(result[0].dimensions.wingspanM, 20);
  assert.equal(result[0].canModel, false);
});

test('ucakta yukseklik varsa secime dahil edilir', () => {
  const s = system('insansiz-hava-araci', {
    specs: {
      length_m: [measurement(12)],
      wingspan_m: [measurement(20)],
      height_m: [measurement(4.1)]
    }
  });
  const result = selectMeasurements(s);

  assert.equal(result[0].dimensions.kind, 'aircraft');
  const dims = result[0].dimensions as AircraftDimensions;
  assert.equal(dims.heightM, 4.1);
  assert.equal(result[0].sources.length, 3);
});

test('eksik gerekli alan olan grup atlanir', () => {
  const s = system('insansiz-hava-araci', {
    specs: {
      length_m: [measurement(12)]
      // wingspan_m eksik
    }
  });
  const result = selectMeasurements(s);

  assert.equal(result.length, 0);
});

test('varyantlara ozgu olcu de aile olcusu kadar secilir', () => {
  const s = system('balistik-fuze', {
    specs: {
      length_m: [measurement(6)],
      diameter_mm: [measurement(610)]
    },
    variants: [
      variant('v1', {
        length_m: [measurement(5)],
        diameter_mm: [measurement(400)]
      })
    ]
  });
  const result = selectMeasurements(s);

  assert.equal(result.length, 2);
  assert.ok(result.some((r) => r.group.kind === 'family'));
  assert.ok(result.some((r) => r.group.id === 'v1'));
});

test('kaynaklar secim sonucunda aciklanir', () => {
  const s = system('balistik-fuze', {
    specs: {
      length_m: [measurement(6)],
      diameter_mm: [measurement(610)]
    }
  });
  const result = selectMeasurements(s);

  assert.equal(result[0].sources.length, 2);
});
