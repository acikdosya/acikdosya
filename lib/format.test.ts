import assert from 'node:assert/strict';
import {test} from 'node:test';
import {formatRevisionValue, unitLabel, withUnit} from './format';

/**
 * Duzeltme degerinin dile gore cizimi.
 *
 * Bu testin sebebi somut: from/to eskiden serbest METINDI ve tek dilde
 * yaziliyordu. Ingilizce sayfada "12,2 m" duruyordu — Turkce ondalik
 * ayraciyla, cunku dize dosyaya oyle yazilmisti.
 */

test('olcum kolu dile gore cizilir', () => {
  const value = {kind: 'measurement', value: 12.3, unit: 'm'} as const;

  assert.equal(formatRevisionValue(value, 'tr'), '12,3 m');
  assert.equal(formatRevisionValue(value, 'en'), '12.3 m');
});

test('operator degerin onunde durur', () => {
  const value = {
    kind: 'measurement',
    value: 280,
    operator: '>',
    unit: 'km'
  } as const;

  /*
   * Operator ile sayi arasinda ince bosluk (U+2009) var; formatValue
   * oyle yaziyor ve tablo da oyle gorunuyor. Kacis dizisiyle yazildi
   * ki bir sonraki okuyucu onu normal bosluga "duzeltmesin".
   */
  assert.equal(formatRevisionValue(value, 'tr'), '>\u2009280 km');
});

test('metin kolu dogrudan gecer', () => {
  const value = {
    kind: 'text',
    tr: '> 280 km (resmî)',
    en: '> 280 km (official)'
  } as const;

  assert.equal(formatRevisionValue(value, 'tr'), '> 280 km (resmî)');
  assert.equal(formatRevisionValue(value, 'en'), '> 280 km (official)');
});

test('kaldirma kolu dize uretmez', () => {
  /*
   * Etiketi cagiran verir. Buradan "kayit yok" dondurmek, ceviriyi
   * bicimlendirme katmanina tasimak olurdu.
   */
  assert.equal(formatRevisionValue({kind: 'removed'}, 'tr'), undefined);
  assert.equal(formatRevisionValue({kind: 'removed'}, 'en'), undefined);
});

/**
 * Birimin BASILAN karsiligi.
 *
 * Token ile basilan bicim uzun sure ayni seydi, cunku hepsi simgeydi.
 * Bilesik sistemlerle iki birimsiz buyukluk geldi ve ayrim gorunur oldu:
 * "100 adet" Ingilizce sayfada Turkce bir kelime birakirdi.
 */

test('simge birimler oldugu gibi basilir', () => {
  assert.equal(withUnit('12,3', 'm'), '12,3 m');
  assert.equal(withUnit('280', 'km'), '280 km');
  assert.equal(withUnit('750', 'kg'), '750 kg');
});

test('sayim birimsiz basilir — bosluk da yok', () => {
  assert.equal(unitLabel('count'), '');
  assert.equal(withUnit('100', 'count'), '100');
  // "100 " diye biten bir hucre eksik birim izlenimi verir.
  assert.ok(!withUnit('100', 'count').endsWith(' '));
});

test('aci kelimeyle degil simgeyle, sayiya bitisik basilir', () => {
  /*
   * SI birim simgesinden once bosluk ister ama duzlem aci simgelerini
   * (° ′ ″) disarida tutar. "360 °" tipografik olarak yanlis.
   */
  assert.equal(unitLabel('deg'), '°');
  assert.equal(withUnit('360', 'deg'), '360°');
  assert.equal(withUnit('12,3', 'm'), '12,3 m');
});
