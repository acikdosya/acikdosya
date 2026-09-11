import assert from 'node:assert/strict';
import {test} from 'node:test';
import {getSystem} from '../content';
import {
  CARD_SIZE,
  parseFormat,
  parseGroup,
  parseRevisionIndex,
  parseSpecKey,
  parseSystem,
  parseSystems
} from './params';

/**
 * Sorgu dizesi cozumleme.
 *
 * Tek kural: TANIMSIZ DEGER VARSAYILANA DUSMEZ. Bir kartin sessizce baska
 * bir sisteme ya da baska bir alana dusmesi, gorselin icinde hicbir iz
 * birakmadan yanlis bilgi yaymak olurdu — kart paylasildiktan sonra
 * kimse sorgu dizesine bakmaz.
 */

test('bicim atlanabilir ama uydurulamaz', () => {
  assert.equal(parseFormat(null), 'yatay');
  assert.equal(parseFormat('yatay'), 'yatay');
  assert.equal(parseFormat('dikey'), 'dikey');
  assert.equal(parseFormat('kare'), undefined);
  assert.equal(parseFormat(''), undefined);
});

test('kart olculeri tasarimin sabitleri', () => {
  assert.deepEqual(CARD_SIZE.yatay, {width: 1200, height: 675});
  assert.deepEqual(CARD_SIZE.dikey, {width: 1080, height: 1350});
});

test('bilinmeyen sistem kart uretmez', () => {
  assert.ok(parseSystem('tayfun'));
  assert.equal(parseSystem('yok-boyle-bir-sistem'), undefined);
  assert.equal(parseSystem(null), undefined);
  assert.equal(parseSystem(''), undefined);
});

test('coklu sistemde biri bile bilinmiyorsa kart uretilmez', () => {
  assert.equal(parseSystems('tayfun,akinci', 3)?.length, 2);
  assert.equal(parseSystems('tayfun,yok', 3), undefined);
  /* Ayni sistem iki kez: karsilastirma degil, tekrar. */
  assert.equal(parseSystems('tayfun,tayfun', 3), undefined);
  /* Aralik disina cikan liste kart uretmez. */
  assert.equal(parseSystems('tayfun,atmaca,akinci', 2), undefined);
  assert.equal(parseSystems('', 3), undefined);
});

test('bilinmeyen alan adi kart uretmez', () => {
  assert.equal(parseSpecKey('range_km'), 'range_km');
  assert.equal(parseSpecKey('menzil'), undefined);
  assert.equal(parseSpecKey(null), undefined);
});

test('grup atlanirsa alanin degerini tasiyan grup secilir', () => {
  const tayfun = getSystem('tayfun');
  assert.ok(tayfun);

  /* BLOK-4 varyantinda menzil kaydi yok; secim ilk tasiyan gruba duser. */
  assert.equal(parseGroup(tayfun, null, 'range_km')?.id, 'tayfun');
  assert.equal(parseGroup(tayfun, 'tayfun-blok-4', 'length_m')?.id, 'tayfun-blok-4');
  assert.equal(parseGroup(tayfun, 'yok', 'length_m'), undefined);
});

test('duzeltme kaydi sira numarasiyla secilir', () => {
  const tayfun = getSystem('tayfun');
  assert.ok(tayfun);
  const total = tayfun.revisions?.length ?? 0;
  assert.ok(total > 0, 'TAYFUN dosyasinda duzeltme kaydi yok');

  assert.equal(parseRevisionIndex(tayfun, '0'), 0);
  assert.equal(parseRevisionIndex(tayfun, String(total - 1)), total - 1);
  assert.equal(parseRevisionIndex(tayfun, String(total)), undefined);
  assert.equal(parseRevisionIndex(tayfun, '-1'), undefined);
  assert.equal(parseRevisionIndex(tayfun, '1.5'), undefined);
  assert.equal(parseRevisionIndex(tayfun, 'ilk'), undefined);
  assert.equal(parseRevisionIndex(tayfun, null), undefined);
});

test('duzeltme kaydi olmayan sistemde kart uretilmez', () => {
  const atmaca = getSystem('atmaca');
  assert.ok(atmaca);
  assert.equal(atmaca.revisions?.length ?? 0, 0);
  assert.equal(parseRevisionIndex(atmaca, '0'), undefined);
});
