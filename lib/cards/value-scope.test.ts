import assert from 'node:assert/strict';
import {test} from 'node:test';
import {getSystem} from '../content';
import {specGroups} from '../measurement/groups';
import {groupDivergence} from '../stats';
import {MAX_COLUMNS, MIN_COLUMNS, valueScope} from './value-scope';

/**
 * Deger ve kapsami kart verisi.
 *
 * Kartin tasidigi en kritik iddia durum adinin HESAPTAN geldigi:
 * "celiski" kelimesi elle yazilmaz, iraksama hesabi oyle dondugu icin
 * yazilir. Asagidaki testler kart ile hesabin ayrisamayacagini siniyor.
 */

function group(slug: string, id: string) {
  const system = getSystem(slug);
  assert.ok(system);
  const found = specGroups(system).find((entry) => entry.id === id);
  assert.ok(found, `${slug}/${id} grubu yok`);
  return {system, group: found};
}

test('durum adi iraksama hesabindan gelir', () => {
  const {system, group: variant} = group('tayfun', 'tayfun');
  const card = valueScope(system, variant, 'range_km');

  assert.ok(card);
  assert.equal(card.kind, groupDivergence(variant, 'range_km')?.kind);
  assert.equal(card.kind, 'farkli-kapsam');
});

test('hesap celiski derse kart da celiski der', () => {
  /*
   * Bugunku veride bu gercekten var: AKINCI uzunlugu iki ureticinin
   * kendi beyaninda 12,3 ve 12,2 m. Kart hesabin sonucunu gizlemez.
   */
  const {system, group: family} = group('akinci', 'family');
  const card = valueScope(system, family, 'length_m');

  assert.ok(card);
  assert.equal(card.kind, 'celiski');
});

test('kapsam sayisi baslik dilini belirler', () => {
  const {system, group: variant} = group('tayfun', 'tayfun');
  const card = valueScope(system, variant, 'range_km');

  assert.ok(card);
  /* beyan ve test — iki ayri kapsam, baslik bunu sayar. */
  assert.equal(card.scopeCount, 2);
});

test('aralik disindaki alan kart uretmez', () => {
  const {system, group: variant} = group('tayfun', 'tayfun');

  /* Tek degerli alan: kiyaslanacak ikinci bir kayit yok. */
  assert.equal(valueScope(system, variant, 'length_m'), undefined);
  /* Hic kaydi olmayan alan. */
  assert.equal(valueScope(system, variant, 'mtow_kg'), undefined);
});

test('kolon sayisi tasarimin araliginda kalir', () => {
  for (const slug of ['tayfun', 'atmaca', 'akinci']) {
    const system = getSystem(slug);
    assert.ok(system);

    for (const entry of specGroups(system)) {
      for (const key of Object.keys(entry.specs) as (keyof typeof entry.specs)[]) {
        const card = valueScope(system, entry, key);
        if (!card) continue;

        assert.ok(card.columns.length >= MIN_COLUMNS);
        assert.ok(card.columns.length <= MAX_COLUMNS);
      }
    }
  }
});

test('kolon sirasi dosyadaki sira', () => {
  const {system, group: variant} = group('atmaca', 'atmaca');
  const card = valueScope(system, variant, 'mass_kg');

  assert.ok(card);
  assert.deepEqual(card.columns, variant.specs.mass_kg);
});
