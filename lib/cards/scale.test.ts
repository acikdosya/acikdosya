import assert from 'node:assert/strict';
import {test} from 'node:test';
import {getSystem} from '../content';
import {MAX_SYSTEMS, scaleCard} from './scale';
import type {System} from '../schema';

/**
 * Olcek karti verisi.
 *
 * Kartin secmesi gereken tek sey su: hangi olcu cizimin GENIS ekseninde
 * duracak. Fuzede uzunluk, IHA'da kanat acikligi. Yanlis secim IHA'yi
 * oldugundan kucuk gosterirdi ve kartin tek isi karsilastirma.
 */

function system(slug: string): System {
  const found = getSystem(slug);
  assert.ok(found, `${slug} dosyasi yok`);
  return found;
}

test('fuzede baskin olcu uzunluktur', () => {
  const card = scaleCard([system('tayfun')]);
  assert.ok(card);

  const [row] = card.rows;
  assert.equal(row.dominant.key, 'length_m');
  assert.equal(row.secondary.key, 'diameter_mm');
  assert.equal(row.item.view, 'side');
  assert.ok(!row.item.swap);
});

test('IHA da baskin olcu kanat acikligidir', () => {
  const card = scaleCard([system('akinci')]);
  assert.ok(card);

  const [row] = card.rows;
  assert.equal(row.dominant.key, 'wingspan_m');
  assert.equal(row.secondary.key, 'length_m');
  assert.equal(row.item.view, 'top');
  assert.equal(row.item.swap, true);
  /* Ust gorunus cevrildigi icin genis kenar aciklik olmali. */
  assert.ok(row.item.spanM > row.item.depthM);
});

test('karisik sinif tek kartta durabilir', () => {
  const card = scaleCard([system('tayfun'), system('akinci')]);
  assert.ok(card);
  assert.equal(card.rows.length, 2);
  assert.deepEqual(
    card.rows.map((row) => row.item.view),
    ['side', 'top']
  );
});

test('rozet cizilen olcunun rozetidir', () => {
  const card = scaleCard([system('akinci')]);
  assert.ok(card);

  const [row] = card.rows;
  assert.ok(
    card.confidences.includes(row.dominant.measurement.confidence),
    'kartin rozeti cizilen olcuden gelmiyor'
  );
});

test('sayi araligi disinda kart uretilmez', () => {
  assert.equal(scaleCard([]), undefined);

  const many = Array.from({length: MAX_SYSTEMS + 1}, () => system('tayfun'));
  assert.equal(scaleCard(many), undefined);
});

test('kart tarihi cizilen olculerin en yenisi', () => {
  const card = scaleCard([system('tayfun'), system('akinci')]);
  assert.ok(card);

  const latest = card.rows
    .map((row) => row.dominant.measurement.verified_at)
    .reduce((best, date) => (date > best ? date : best));

  assert.equal(card.verifiedAt, latest);
});
