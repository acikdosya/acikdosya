import assert from 'node:assert/strict';
import {test} from 'node:test';
import {getSystem, getSystemSlugs} from '../content';
import {SPEC_UNITS} from '../format';
import {specKeys, type System} from '../schema';
import {specGroups} from './groups';
import {comparability, fieldDivergence, type Sized} from './divergence';

/**
 * Nesne ekseni tek urunlu dosyalarda GORUNMEZ.
 *
 * Bu eksen bilesik sistemler icin eklendi: ayni dosyada hem bir fuze hem
 * onu firlatan sistem anlatildiginda "100+ km fuze menzili" ile
 * "70+ km sistem onleme menzili" ayni cetvele konamasin diye. Bedeli
 * olmamali: nesne beyani tasimayan bir dosyanin iraksama sonuclari, eksen
 * hic eklenmemis gibi kalmali.
 *
 * Testin sordugu soru bu. Dosya bazli sabit bir liste tutulmuyor —
 * oyle bir liste icerik her degistiginde susardi ve asil soruyu
 * sormayi birakirdi.
 */

function systems(): System[] {
  return getSystemSlugs().map((slug) => {
    const system = getSystem(slug);
    assert.ok(system, `${slug} okunamadi`);
    return system;
  });
}

/** Dosyadaki hicbir olcum nesne beyani tasimiyor mu. */
function carriesNoObject(system: System): boolean {
  return specGroups(system).every((group) =>
    specKeys.every((key) =>
      (group.specs[key] ?? []).every(
        (measurement) => measurement.object === undefined
      )
    )
  );
}

test('nesne beyani tasimayan dosyada eksen hic gorunmez', () => {
  let checked = 0;

  for (const system of systems()) {
    if (!carriesNoObject(system)) continue;

    for (const group of specGroups(system)) {
      for (const key of specKeys) {
        const list = group.specs[key];
        if (!list || list.length < 2) continue;

        const divergence = fieldDivergence(list, SPEC_UNITS[key]);
        if (!divergence) continue;
        checked += 1;

        const where = `${system.slug}/${group.id}/${key}`;

        assert.ok(
          !divergence.differences.some((item) => item.axis === 'object'),
          `${where}: nesne ekseni kapsam farki uretti`
        );
        assert.ok(
          !divergence.unknownAxes.includes('object'),
          `${where}: nesne ekseni belirsizlik uretti`
        );
      }
    }
  }

  // Kontrolun bos gecmedigini goster: en az bir alanda gercekten iraksama var.
  assert.ok(checked > 0, 'iraksayan alan bulunamadi — test bos calisti');
});

test('cift bazinda da eksen bos dosyada karara girmez', () => {
  /*
   * Alan duzeyi sonuc en agir cifti temsil ediyor; tek bir cift
   * 'belirsiz' donerken alan 'celiski' gorunebilir. Kontrol bu yuzden
   * ciftlere de iniyor.
   */
  for (const system of systems()) {
    if (!carriesNoObject(system)) continue;

    for (const group of specGroups(system)) {
      for (const key of specKeys) {
        const list = group.specs[key];
        if (!list || list.length < 2) continue;

        const unit = SPEC_UNITS[key];
        for (let i = 0; i < list.length; i += 1) {
          for (let j = i + 1; j < list.length; j += 1) {
            const a: Sized = {measurement: list[i], unit};
            const b: Sized = {measurement: list[j], unit};
            const result = comparability(a, b);
            if (!result) continue;

            assert.ok(
              !result.unknownAxes.includes('object'),
              `${system.slug}/${group.id}/${key}: cift nesne ekseninde belirsiz`
            );
            assert.ok(
              !result.differences.some((item) => item.axis === 'object'),
              `${system.slug}/${group.id}/${key}: cift nesne ekseninde ayristi`
            );
          }
        }
      }
    }
  }
});

test('nesne beyani tasiyan dosya bu kontrolden muaf degil, kapsam disi', () => {
  /*
   * Bilesik bir dosya eklendiginde yukaridaki iki test onu atlar. Bu
   * dogru davranis — orada eksenin GORUNMESI bekleniyor — ama atlamanin
   * sessiz olmamasi icin ayrimin kendisi de sinaniyor.
   */
  const all = systems();
  const single = all.filter(carriesNoObject);

  assert.ok(single.length > 0, 'tek urunlu dosya kalmadi');
  assert.equal(
    single.length + all.filter((system) => !carriesNoObject(system)).length,
    all.length
  );
});
