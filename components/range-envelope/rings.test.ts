import assert from 'node:assert/strict';
import {test} from 'node:test';
import {getSystem, getSystemSlugs} from '@/lib/content';
import type {System} from '@/lib/schema';
import {buildRings} from './rings';

/**
 * Halkayi hangi alan cizer.
 *
 * Kural kategori dalindan icerikteki acik kayda tasindi. Bu dosyanin iki
 * isi var: gecisin yayindaki halkalari degistirmedigini gostermek ve
 * kaydin gercekten karari verdigini — yani kayit yoksa halka da olmadigini
 * sabitlemek.
 */

function systems(): System[] {
  return getSystemSlugs().map((slug) => {
    const system = getSystem(slug);
    assert.ok(system, `${slug} okunamadi`);
    return system;
  });
}

const shape = (system: System) =>
  buildRings(system)
    .map((ring) => `${ring.km}|${ring.operator ?? ''}|${ring.confidence}`)
    .sort();

test('yayindaki halkalar gecisten sonra ayni', () => {
  /*
   * Beklenen kume elle yazili. Iceriden turetilseydi test kendi
   * kendini onaylardi: kural degisip halkalar kaybolsa bile gecerdi.
   */
  const expected: Record<string, string[]> = {
    tayfun: ['280|>|official', '561||press'],
    atmaca: ['200|>|official', '250||official'],
    akinci: []
  };

  for (const system of systems()) {
    const want = expected[system.slug];
    if (!want) continue;
    assert.deepEqual(shape(system), want.sort(), `${system.slug} halkalari degisti`);
  }
});

test('halka kaydi olmayan dosyada halka cizilmez', () => {
  for (const system of systems()) {
    if (system.range_ring) continue;
    assert.deepEqual(
      buildRings(system),
      [],
      `${system.slug}: kayit yokken halka cizildi`
    );
  }
});

test('kayit kaldirilinca halka da kalkar — karar kayitta', () => {
  const [system] = systems().filter((item) => item.range_ring);
  assert.ok(system, 'halka kaydi olan dosya yok');

  assert.ok(buildRings(system).length > 0);
  assert.deepEqual(buildRings({...system, range_ring: undefined}), []);
});

test('kategori halkayi kendiliginden actiramaz', () => {
  /*
   * Onceki kural "IHA degilse ciz" idi; yeni bir kategori eklemek
   * halkayi sessizce actiriyordu. Kategoriyi degistirmek artik hicbir
   * sey degistirmemeli.
   */
  const [system] = systems().filter((item) => !item.range_ring);
  assert.ok(system, 'halka kaydi olmayan dosya yok');

  assert.deepEqual(
    buildRings({...system, category: 'balistik-fuze'}),
    [],
    'kategori degisince halka cizildi'
  );
});

test('nesne suzgeci yalniz isaretlenen nesneyi cizer', () => {
  const [system] = systems().filter((item) => item.range_ring);
  assert.ok(system);

  const field = system.range_ring!.field;
  const withObjects: System = {
    ...system,
    range_ring: {field, object: 'sistem'},
    variants: system.variants.map((variant) => ({
      ...variant,
      specs: {
        ...variant.specs,
        [field]: (variant.specs[field] ?? []).map((measurement, index) => ({
          ...measurement,
          object: index === 0 ? ('sistem' as const) : ('fuze' as const)
        }))
      }
    }))
  };

  const rings = buildRings(withObjects);
  const total = system.variants.reduce(
    (sum, variant) => sum + (variant.specs[field] ?? []).length,
    0
  );

  assert.ok(rings.length > 0, 'suzgec her seyi eledi');
  assert.ok(rings.length < total, 'suzgec hicbir sey elemedi');
});
