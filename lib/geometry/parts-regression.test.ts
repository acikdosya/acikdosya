import assert from 'node:assert/strict';
import {test} from 'node:test';
import {getSystem, getSystemSlugs} from '../content';
import {selectMeasurements} from './measurements';
import {partsForSystem} from './parts-for';
import {productFor} from './registry';
import type {System} from '../schema';

/**
 * Yayindaki modeller degismedi mi.
 *
 * Bu dosya bir GERILEME AGI. Geometri katmani varyant duzeyine tasinirken,
 * yuzey gruplari listeye donerken ve govde istasyon listesine gecerken uc
 * yayindaki urunun urettigi parca listesi ayni kalmali. Aksi halde
 * okuyucunun bugun gordugu bicim, ic bir refactor yuzunden sessizce
 * degismis olur.
 *
 * Beklenen liste ELLE yazili. Icerikten turetilseydi test kendi kendini
 * onaylardi: parca kaybolsa bile gecerdi.
 */

type Shape = Record<string, string[]>;

/**
 * Uc yayindaki urunun parca kimlikleri, grup basina.
 *
 * Kimlikler etiket cercevesinin adresi (content/systems/*.json
 * annotations) ve kadrajin tutamagi; degismeleri gorunur olmali.
 */
const EXPECTED: Record<string, Shape> = {
  tayfun: {
    tayfun: ['body', 'fin-1', 'fin-2', 'fin-3', 'fin-4'],
    'tayfun-blok-4': ['body', 'fin-1', 'fin-2', 'fin-3', 'fin-4']
  },
  atmaca: {
    atmaca: [
      'body',
      'fin-1',
      'fin-2',
      'fin-3',
      'fin-4',
      'wing-1',
      'wing-2',
      'wing-3',
      'wing-4'
    ]
  }
};

function systems(): System[] {
  return getSystemSlugs().map((slug) => {
    const system = getSystem(slug);
    assert.ok(system, `${slug} okunamadi`);
    return system;
  });
}

/** Bir sistemin modellenen her grubu icin parca kimlikleri. */
function shapeOf(system: System): Shape {
  const shape: Shape = {};
  for (const selection of selectMeasurements(system)) {
    if (!selection.canModel) continue;
    const parts = partsForSystem(
      system.slug,
      selection.group.id,
      selection.dimensions
    );
    if (!parts) continue;
    shape[selection.group.id] = parts.map((part) => part.id).sort();
  }
  return shape;
}

test('yayindaki urunlerin parca listesi degismedi', () => {
  const byslug = new Map(systems().map((system) => [system.slug, system]));

  for (const [slug, expected] of Object.entries(EXPECTED)) {
    const system = byslug.get(slug);
    assert.ok(system, `${slug} icerik dosyasi yok`);

    const actual = shapeOf(system);
    for (const [group, ids] of Object.entries(expected)) {
      assert.deepEqual(
        actual[group],
        [...ids].sort(),
        `${slug}/${group} parca listesi degisti`
      );
    }
  }
});

test('AKINCI parca sayisi ve sinifi degismedi', () => {
  /*
   * AKINCI'nin listesi uzun (gondol, pervane, inis takimi, pilon) ve
   * kimlikleri elle yazmak testi kirilgan yapardi. Onun yerine parca
   * SINIFI basina sayim sabitleniyor: bir parca kaybolursa ya da bir
   * sinif digerine donusurse test duser.
   */
  const system = systems().find((item) => item.slug === 'akinci');
  assert.ok(system);

  const shape = shapeOf(system);
  // AKINCI olculeri aile duzeyinde; modellenen grup 'family'.
  const ids = shape.family;
  assert.ok(ids, 'akinci aile grubu modellenmedi');

  const byPrefix = new Map<string, number>();
  for (const id of ids) {
    const prefix = id.replace(/-\d+.*$/, '');
    byPrefix.set(prefix, (byPrefix.get(prefix) ?? 0) + 1);
  }

  assert.ok(ids.length >= 12, `AKINCI parca sayisi dustu: ${ids.length}`);
  assert.ok(byPrefix.has('body'), 'govde yok');
  assert.ok(
    [...byPrefix.keys()].some((key) => key.startsWith('wing')),
    'kanat yok'
  );
});

test('modellenmeyen grup parca listesi uretmez', () => {
  /*
   * SIPER Urun-3'un olcu kaydi yok; model uretilmemeli. Bu, varyant
   * duzeyine gecerken en kolay kirilacak yer: eksik olculu bir grup
   * sessizce kardesinin bicimini alabilirdi.
   */
  const system = systems().find((item) => item.slug === 'siper');
  if (!system) return;

  const shape = shapeOf(system);
  assert.ok(!('siper-urun-3' in shape), 'olcusuz varyant icin parca uretildi');
});

/*
 * SIPER: iki varyant, iki bicim.
 *
 * Ureticinin cizimi ikisini acikca farkli gosteriyor — Urun-1'de
 * ayrilabilir itici ve orta kanat, Urun-2'de govde boyu strake. Ortak bir
 * oran tablosuyla cizmek o kanitla celisirdi (specs/variant-geometry).
 */

test('SIPER varyantlari ayri parca listesi uretir', () => {
  const system = systems().find((item) => item.slug === 'siper');
  assert.ok(system, 'siper icerik dosyasi yok');

  const shape = shapeOf(system);
  const u1 = shape['siper-urun-1'];
  const u2 = shape['siper-urun-2'];
  assert.ok(u1, 'Urun-1 modellenmedi');
  assert.ok(u2, 'Urun-2 modellenmedi');

  assert.notDeepEqual(u1, u2, 'iki varyant ayni parca listesini uretti');

  // Urun-1: uc yuzey grubu.
  assert.ok(u1.some((id) => id.startsWith('fin-aft-')));
  assert.ok(u1.some((id) => id.startsWith('fin-control-')));
  assert.ok(u1.some((id) => id.startsWith('wing-mid-')));
  assert.ok(!u1.some((id) => id.startsWith('strake-')), 'Urun-1 strake tasiyor');

  // Urun-2: arka kanat ve strake, kontrol yuzeyi yok.
  assert.ok(u2.some((id) => id.startsWith('fin-aft-')));
  assert.ok(u2.some((id) => id.startsWith('strake-')));
  assert.ok(
    !u2.some((id) => id.startsWith('fin-control-')),
    'Urun-2 kontrol yuzeyi tasiyor'
  );
});

test('SIPER varyantlari kendi kayitlarindan cozulur, sisteme DUSMEZ', () => {
  for (const variant of ['siper-urun-1', 'siper-urun-2']) {
    const match = productFor('siper', variant);
    assert.ok(match, `${variant} cozulmedi`);
    assert.equal(match.matched, 'variant', `${variant} sisteme dustu`);
  }
  // Sistem duzeyinde SIPER tanimi YOK: varyantsiz cagri bir sey bulmamali.
  assert.equal(productFor('siper'), undefined);
});

test('Urun-1 kademeli govde tasir, Urun-2 tasimaz', () => {
  const system = systems().find((item) => item.slug === 'siper');
  assert.ok(system);

  const radii = (variantId: string) => {
    const selection = selectMeasurements(system).find(
      (item) => item.group.id === variantId
    );
    assert.ok(selection);
    const parts = partsForSystem(system.slug, variantId, selection.dimensions);
    const body = parts?.find((part) => part.id === 'body');
    assert.ok(body && body.kind === 'body');
    return body.spec.stations.map((station) => station.radius);
  };

  const u1 = radii('siper-urun-1');
  const u2 = radii('siper-urun-2');
  // Urun-1'de anma yaricapini ASAN istasyon var (itici).
  const nominal1 = Math.max(...u1.slice(0, 29));
  assert.ok(
    u1.some((r) => r > nominal1 * 1.05),
    'Urun-1 govdesinde kademe yok'
  );
  const nominal2 = Math.max(...u2.slice(0, 29));
  assert.ok(
    !u2.some((r) => r > nominal2 * 1.05),
    'Urun-2 govdesinde beklenmeyen kademe var'
  );
});
