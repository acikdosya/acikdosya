import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  comparability,
  compareIntervals,
  comparePair,
  decimalPlaces,
  fieldDivergence,
  toInterval,
  TOLERANCE_RATIO,
  type SpecUnit
} from './divergence';
import type {Measurement} from '../schema';

/**
 * Iraksama hesabinin birim testleri — CLAUDE.md §3.
 *
 * Bu testlerin isi tek: `> 280` ile `> 500` gibi ayni anda dogru olabilen
 * iki degerin bir daha "celiski" diye etiketlenmemesi. Iceriktekilerden
 * bagimsiz olsun diye olcumler burada kuruluyor; dosya degistiginde
 * testler susmaz.
 */

function m(partial: Partial<Measurement> & {value: number}): Measurement {
  return {
    confidence: 'press',
    source: {tr: 'kaynak', en: 'source'},
    verified_at: '2026-09-10',
    ...partial
  };
}

const sized = (measurement: Measurement, unit: SpecUnit) => ({
  measurement,
  unit
});

test('iki alt sinir celismez — ikisi de ayni anda dogru olabilir', () => {
  const result = fieldDivergence(
    [
      m({value: 280, operator: '>', confidence: 'official'}),
      m({value: 500, operator: '>', confidence: 'press'})
    ],
    'km'
  );

  assert.equal(result?.kind, 'farkli-aciklama');
  assert.deepEqual(result?.differences, []);
});

test('kesisen alt ve ust sinir farkli aciklamadir', () => {
  // > 280 ile ≤ 1000: (280, ∞) ve (-∞, 1000] → 280 ile 1000 arasi ortak.
  const result = fieldDivergence(
    [m({value: 280, operator: '>'}), m({value: 1000, operator: '≤'})],
    'km'
  );

  assert.equal(result?.kind, 'farkli-aciklama');
});

test('kesismeyen alt ve ust sinir celiskidir', () => {
  // < 300 ile > 500: ortak nokta yok.
  const result = fieldDivergence(
    [m({value: 300, operator: '<'}), m({value: 500, operator: '>'})],
    'km'
  );

  assert.equal(result?.kind, 'celiski');
});

test('sinirda dokunan acik uclar kesismez', () => {
  // < 300 ve > 300 ayni sayiyi disarida birakir.
  const result = fieldDivergence(
    [m({value: 300, operator: '<'}), m({value: 300, operator: '>'})],
    'km'
  );

  assert.equal(result?.kind, 'celiski');
});

test('sinirda dokunan kapali uc kesisir', () => {
  // ≤ 300 ve ≥ 300 icin 300 ortak noktadir.
  const result = fieldDivergence(
    [m({value: 300, operator: '≤'}), m({value: 300, operator: '≥'})],
    'km'
  );

  assert.equal(result?.kind, 'farkli-aciklama');
});

test('iki farkli kesin deger celiskidir', () => {
  const result = fieldDivergence([m({value: 6.5}), m({value: 7.2})], 'm');

  assert.equal(result?.kind, 'celiski');
});

test('ayni kesin degeri veren iki kaynak iraksama degildir', () => {
  const result = fieldDivergence(
    [
      m({value: 6.5, confidence: 'official'}),
      m({value: 6.5, confidence: 'press'})
    ],
    'm'
  );

  assert.equal(result, undefined);
});

test('ayni operatoru ve degeri veren iki kaynak iraksama degildir', () => {
  const result = fieldDivergence(
    [m({value: 280, operator: '>'}), m({value: 280, operator: '>'})],
    'km'
  );

  assert.equal(result, undefined);
});

test('tek deger iraksama uretmez', () => {
  assert.equal(fieldDivergence([m({value: 280, operator: '>'})], 'km'), undefined);
  assert.equal(fieldDivergence(undefined, 'km'), undefined);
  assert.equal(fieldDivergence([], 'km'), undefined);
});

test('farkli scope kapsam farkidir, aralik hesabina girilmez', () => {
  // Sayilar ayriksa bile (6.5 ve 7.2) kapsam farki once gelir.
  const result = fieldDivergence(
    [
      m({value: 6.5, scope: 'beyan'}),
      m({value: 7.2, scope: 'olcum'})
    ],
    'm'
  );

  assert.equal(result?.kind, 'farkli-kapsam');
  assert.deepEqual(result?.differences, [
    {axis: 'scope', a: 'beyan', b: 'olcum'}
  ]);
});

test('tek tarafta scope varsa sonuc belirsiz, asla celiski', () => {
  const result = fieldDivergence(
    [m({value: 6.5, scope: 'beyan'}), m({value: 7.2})],
    'm'
  );

  assert.equal(result?.kind, 'belirsiz');
  assert.deepEqual(result?.differences, []);
  assert.deepEqual(result?.unknownAxes, ['scope']);
});

test('tek tarafta variant_id varsa sonuc belirsiz', () => {
  const result = fieldDivergence(
    [m({value: 6.5, variant_id: 'tayfun'}), m({value: 7.2})],
    'm'
  );

  assert.equal(result?.kind, 'belirsiz');
  assert.deepEqual(result?.unknownAxes, ['variant_id']);
});

test('tek tarafta stated_at karari ETKILEMEZ', () => {
  // stated_at kiyaslanabilirlik ekseni degil: iki ayrik sayi hala celisir.
  const result = fieldDivergence(
    [m({value: 6.5, stated_at: '2022'}), m({value: 7.2})],
    'm'
  );

  assert.equal(result?.kind, 'celiski');
  assert.deepEqual(result?.unknownAxes, []);
});

test('ayni kapsam, farkli stated_at, ayrik aralik — celiski', () => {
  const result = fieldDivergence(
    [
      m({value: 6.5, scope: 'beyan', variant_id: 'tayfun', stated_at: '2022'}),
      m({value: 7.2, scope: 'beyan', variant_id: 'tayfun', stated_at: '2025-07'})
    ],
    'm'
  );

  assert.equal(result?.kind, 'celiski');
  assert.deepEqual(result?.differences, []);
});

test('iki tarafta da kapsam bossa celiski hala mumkun', () => {
  const result = fieldDivergence([m({value: 6.5}), m({value: 7.2})], 'm');

  assert.equal(result?.kind, 'celiski');
  assert.deepEqual(result?.unknownAxes, []);
});

test('belirsiz ciftte aralik hesabi CALISTIRILMAZ', () => {
  const a = sized(m({value: 6.5, scope: 'beyan'}), 'm');
  const b = sized(m({value: 7.2}), 'm');

  // Aralik hesabi calissaydi bu cift celiski verirdi:
  assert.equal(compareIntervals(a, b).kind, 'celiski');

  // Kiyaslanabilirlik kontrolu once doner, o hesap hic cagrilmaz.
  assert.equal(comparability(a, b)?.kind, 'belirsiz');
  assert.equal(comparePair(a, b).kind, 'belirsiz');
});

test('bilinen kapsam farki, bilinmeyen eksene gore once gelir', () => {
  // scope iki tarafta da dolu ve farkli; variant_id tek tarafli.
  const result = comparePair(
    sized(m({value: 6.5, scope: 'beyan', variant_id: 'tayfun'}), 'm'),
    sized(m({value: 7.2, scope: 'olcum'}), 'm')
  );

  assert.equal(result.kind, 'farkli-kapsam');
  assert.deepEqual(result.unknownAxes, ['variant_id']);
});

test('alan duzeyi: celiski ve belirsiz birlikteyse celiski kazanir', () => {
  // A-B tam tanimli ve ayrik; A-C tek tarafli scope yuzunden belirsiz.
  const result = fieldDivergence(
    [
      m({value: 6.5, scope: 'beyan', variant_id: 'tayfun'}),
      m({value: 9, scope: 'beyan', variant_id: 'tayfun'}),
      m({value: 7.2})
    ],
    'm'
  );

  assert.equal(result?.kind, 'celiski');
});

test('alan duzeyi: yalnizca belirsiz ciftler varsa belirsiz', () => {
  /*
   * Kapsamsiz iki deger birbiriyle KIYASLANABILIR. Ucuncu deger de
   * kapsamsiz ve otekiyle ayni araligi veriyor, yani o cift bir bulgu
   * uretmiyor. Geriye yalnizca belirsiz ciftler kaliyor.
   */
  const result = fieldDivergence(
    [m({value: 6.5, scope: 'beyan'}), m({value: 7.2}), m({value: 7.2})],
    'm'
  );

  assert.equal(result?.kind, 'belirsiz');
});

test('olcum ile beyan ayri kapsamdir', () => {
  const result = comparePair(
    sized(m({value: 10, scope: 'olcum'}), 'm'),
    sized(m({value: 10, scope: 'beyan'}), 'm')
  );

  assert.equal(result.kind, 'farkli-kapsam');
});

test('farkli varyant kapsam farkidir', () => {
  const result = fieldDivergence(
    [
      m({value: 280, operator: '>', variant_id: 'tayfun'}),
      m({value: 500, operator: '>', variant_id: 'tayfun-blok-4'})
    ],
    'km'
  );

  assert.equal(result?.kind, 'farkli-kapsam');
  assert.deepEqual(result?.differences, [
    {axis: 'variant_id', a: 'tayfun', b: 'tayfun-blok-4'}
  ]);
});

test('farkli aciklama tarihi kapsam farki DEGILDIR', () => {
  // stated_at gorunur ama karara girmez — ayni kapsamda iki beyan farkli
  // tarihlerde de celisebilir ve o celiski gizlenmemeli.
  const result = fieldDivergence(
    [
      m({value: 6.5, stated_at: '2022'}),
      m({value: 7.2, stated_at: '2025-07'})
    ],
    'm'
  );

  assert.equal(result?.kind, 'celiski');
  assert.deepEqual(result?.differences, []);
});

test('farkli birimdeki iki deger tabana cevrilerek kiyaslanir', () => {
  // 6500 mm ile 6.5 m ayni uzunluk.
  const same = comparePair(
    sized(m({value: 6500}), 'mm'),
    sized(m({value: 6.5}), 'm')
  );
  assert.equal(same.kind, 'farkli-aciklama');

  // Iki deger ayni araliga dustugu icin alan duzeyinde iraksama yok;
  // ayrik olanlar ise celiski verir: 6500 mm ile 7.2 m.
  const apart = comparePair(
    sized(m({value: 6500}), 'mm'),
    sized(m({value: 7.2}), 'm')
  );
  assert.equal(apart.kind, 'celiski');

  // 0.28 km ile 280 m ayni sayi; ama "> 0,28 km" bu sayiyi disarida
  // birakir, yani 280 m ile ortak noktalari yok.
  const mixed = comparePair(
    sized(m({value: 0.28, operator: '>'}), 'km'),
    sized(m({value: 280}), 'm')
  );
  assert.equal(mixed.kind, 'celiski');
});

test('farkli boyut kiyaslanamaz', () => {
  assert.throws(
    () =>
      comparePair(sized(m({value: 10}), 'm'), sized(m({value: 10}), 'kg')),
    /farkli boyut/
  );
});

test('~ bandi sabit oranli ve simetrik', () => {
  const interval = toInterval(10, '~');

  assert.equal(TOLERANCE_RATIO, 0.1);
  assert.equal(interval.min, 10 - 10 * TOLERANCE_RATIO);
  assert.equal(interval.max, 10 + 10 * TOLERANCE_RATIO);
  assert.equal(interval.minClosed, true);
  assert.equal(interval.maxClosed, true);
});

test('~ bandi yuvarlama farkini yutar, gercek farki yutmaz', () => {
  const inside = fieldDivergence(
    [m({value: 10, operator: '~'}), m({value: 10.8})],
    'm'
  );
  assert.equal(inside?.kind, 'farkli-aciklama');

  const outside = fieldDivergence(
    [m({value: 10, operator: '~'}), m({value: 12})],
    'm'
  );
  assert.equal(outside?.kind, 'celiski');
});

test('operatorsuz TAM SAYI tek noktadir', () => {
  const interval = toInterval(280, undefined);

  assert.equal(interval.min, 280);
  assert.equal(interval.max, 280);
  assert.equal(interval.minClosed, true);
  assert.equal(interval.maxClosed, true);
});

/*
 * ORTUK HASSASIYET BANDI.
 *
 * Sebebi yayindaki bir kayit: ureticinin broşürü 12,3 m, urun sayfasi
 * 12,2 m diyor. Iki nokta deger kesismedigi icin hesap en sert kelimeyi
 * kullaniyordu. "12,3" yazan kaynak bir yuvarlama yapmistir; iki okuma
 * 12,25'te degiyor ve degme kesisme sayilir.
 */

test('ondalik deger yazildigi hassasiyetin bandini tasir', () => {
  const interval = toInterval(12.3, undefined);

  assert.equal(interval.min, 12.25);
  assert.equal(interval.max, 12.35);
  assert.equal(interval.minClosed, true);
  assert.equal(interval.maxClosed, true);
});

test('bir basamak farkli iki okuma celiski degil', () => {
  const result = fieldDivergence([m({value: 12.3}), m({value: 12.2})], 'm');

  assert.equal(result?.kind, 'farkli-aciklama');
});

test('iki basamak farkli iki okuma celiski', () => {
  const result = fieldDivergence([m({value: 12.3}), m({value: 12.1})], 'm');

  assert.equal(result?.kind, 'celiski');
});

test('tam sayilarda bant yok — sondaki sifirdan basamak cikarilmaz', () => {
  const result = fieldDivergence([m({value: 2300}), m({value: 2400})], 'kg');

  assert.equal(result?.kind, 'celiski');
  assert.equal(decimalPlaces(2300), 0);
  assert.equal(decimalPlaces(610), 0);
});

test('bant yalnizca ondalik yazan tarafa uygulanir', () => {
  /*
   * 12 tam sayi, yani tek nokta; 12,3 bandi [12,25 – 12,35]. Ikisi
   * kesismiyor. Tam sayiyi ondalik komsusuna bakarak genisletmek,
   * kaynagin yazmadigi bir hassasiyet uydurmak olurdu.
   */
  const result = fieldDivergence([m({value: 12}), m({value: 12.3})], 'm');

  assert.equal(result?.kind, 'celiski');
});

test('bant basamak sayisiyla daralir', () => {
  assert.equal(decimalPlaces(12.3), 1);
  assert.equal(decimalPlaces(12.34), 2);

  const two = toInterval(12.34, undefined);
  assert.equal(two.min, 12.335);
  assert.equal(two.max, 12.345);
});

test('degen uclar kil payi ayrilmaz', () => {
  /*
   * Uc noktalar ondalik izgarada hesaplanmasaydi 12.3 - 0.05 ile
   * 12.2 + 0.05 ikili gosterimde farkli cikardi ve degmesi gereken iki
   * bant ayrilirdi. Ayni sayiyi vermeleri sart.
   */
  assert.equal(toInterval(12.3, undefined).min, toInterval(12.2, undefined).max);
});

test('~ isareti ortuk banda dusmez, kendi oranini korur', () => {
  const interval = toInterval(10.5, '~');

  assert.equal(interval.min, 10.5 - 10.5 * TOLERANCE_RATIO);
  assert.equal(interval.max, 10.5 + 10.5 * TOLERANCE_RATIO);
});

test('uncertainty ortuk kurali gecersiz kilar', () => {
  const interval = toInterval(12.3, undefined, undefined, undefined, 0.4);

  assert.equal(interval.min, 12.3 - 0.4);
  assert.equal(interval.max, 12.3 + 0.4);

  /* Genis bant celiskiyi yutar: 12,3 ± 0,4 ile 12,1 artik kesisiyor. */
  const result = fieldDivergence(
    [m({value: 12.3, uncertainty: 0.4}), m({value: 12.1})],
    'm'
  );
  assert.equal(result?.kind, 'farkli-aciklama');
});

test('uncertainty ~ bandini da ezer', () => {
  const interval = toInterval(10, '~', undefined, undefined, 0.2);

  assert.equal(interval.min, 9.8);
  assert.equal(interval.max, 10.2);
});

test('aralikli kayitta ortuk bant yok', () => {
  /* Kaynak iki ucu kendisi vermis; uclarini genisletmek onu degistirmek olur. */
  const interval = toInterval(4.3, undefined, 5.2);

  assert.equal(interval.min, 4.3);
  assert.equal(interval.max, 5.2);
});

test('ucten fazla degerde kiyaslanabilir bir ayrik cift celiski yapar', () => {
  // A ve B kapsam farkli, A ve C kiyaslanabilir ve ayrik.
  const result = fieldDivergence(
    [
      m({value: 6.5, scope: 'beyan'}),
      m({value: 7.2, scope: 'olcum'}),
      m({value: 9, scope: 'beyan'})
    ],
    'm'
  );

  assert.equal(result?.kind, 'celiski');
  // Kapsam farki kaybolmaz, satirda gosterilecek.
  assert.equal(result?.differences.length, 2);
});

test('kapsami ayrisan iki esit sayi uyusma sayilmaz', () => {
  const result = fieldDivergence(
    [
      m({value: 280, operator: '>', scope: 'beyan'}),
      m({value: 280, operator: '>', scope: 'test'})
    ],
    'km'
  );

  assert.equal(result?.kind, 'farkli-kapsam');
});
