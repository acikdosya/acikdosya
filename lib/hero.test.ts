import assert from 'node:assert/strict';
import {test} from 'node:test';
import {getSystem, getSystemSlugs} from './content';
import {heroFocus} from './hero';
import type {System} from './schema';
import {markedDivergence} from './stats';

/**
 * Ana sayfa panelinin konusu.
 *
 * Panel eskiden bir siralama kuralinin ciktisiydi: butun dosyalar taranir,
 * en agir iraksama kazanirdi. Yani bir kaynak eklemek sitenin en gorunur
 * bolumunun konusunu sessizce degistirebiliyordu. Artik konu icerikte
 * yaziyor; kod yalnizca isaretci yoksa karar veriyor.
 */

function systems(): System[] {
  return getSystemSlugs().map((slug) => {
    const system = getSystem(slug);
    assert.ok(system, `${slug} okunamadi`);
    return system;
  });
}

test('panel isaretlenmis alani anlatir', () => {
  const focus = heroFocus(systems());

  assert.ok(focus);
  assert.equal(focus.tier, 'divergence');
  assert.equal(focus.system.slug, 'tayfun');
  assert.equal(focus.tier === 'divergence' && focus.divergence.key, 'range_km');
  /* > 280 beyan ile 561 test: kapsamlar ayrisiyor, celiski degil. */
  assert.equal(focus.tier === 'divergence' && focus.divergence.kind, 'farkli-kapsam');
});

test('isaretci sirayi degil kaydi izler', () => {
  /*
   * Dosya sirasi alfabetik: akinci once geliyor ve onun da iraksayan bir
   * alani var. Isaretci olmasaydi panel onu anlatirdi.
   */
  const list = systems();
  assert.equal(list[0].slug, 'akinci');

  const focus = heroFocus(list);
  assert.ok(focus);
  assert.equal(focus.system.slug, 'tayfun');
});

test('tek dosya isaretli', () => {
  const marked = systems().filter((system) => system.hero !== undefined);

  assert.equal(marked.length, 1, 'ana sayfa tek konu anlatir');
  assert.equal(marked[0].slug, 'tayfun');
});

test('isaretci yoksa geri cekilme zinciri devreye girer', () => {
  const list = systems().map((system) => ({...system, hero: undefined}));
  const focus = heroFocus(list);

  assert.ok(focus);
  assert.equal(focus.tier, 'divergence');
  /* Zincir eski davranisi koruyor: ilk iraksayan dosya. */
  assert.equal(focus.system.slug, 'akinci');
});

test('isaretlenen alan iraksamiyorsa panel ona dusmez', () => {
  /*
   * Derleme bu durumu zaten reddediyor (scripts/validate-content.ts).
   * Yine de savunma hatti var: isaretci cozulmezse zincir devralir,
   * panel bos kalmaz.
   */
  const [akinci, ...rest] = systems();
  const broken: System = {...akinci, hero: {field: 'mtow_kg'}};

  assert.equal(markedDivergence(broken), undefined);
  assert.ok(heroFocus([broken, ...rest]));
});

test('isaretci grubu daraltabilir', () => {
  const tayfun = getSystem('tayfun');
  assert.ok(tayfun);

  /* BLOK-4 varyantinda menzil kaydi yok; isaretci oraya yoneltilirse cozulmez. */
  assert.equal(
    markedDivergence({...tayfun, hero: {field: 'range_km', variant: 'tayfun-blok-4'}}),
    undefined
  );
  assert.ok(
    markedDivergence({...tayfun, hero: {field: 'range_km', variant: 'tayfun'}})
  );
});
