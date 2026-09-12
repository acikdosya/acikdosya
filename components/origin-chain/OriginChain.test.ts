import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {test} from 'node:test';
import en from '@/messages/en.json';
import tr from '@/messages/tr.json';

/**
 * Koken zincirinin sayfa sozlesmesi.
 *
 * Testin sordugu tek soru: gosterilen sayi nereden geliyor. Kayitta
 * sayac yok (lib/origins.test.ts); bilesen de bir sayac okumamali,
 * yoksa iki gercek olusur ve ayrisabilirler.
 *
 * Ikinci soru gorsel: ayni yayinci tekrari yalniz RENKLE degil DESENLE
 * de ayrismali. Renk korlugunde ve siyah beyaz ciktida bagimsiz bir
 * yayin ile ayni yayincinin devam yazisi ayirt edilemezse bolum
 * anlatmak istedigi seyi anlatmaz (CLAUDE.md §4).
 */

const DIR = join(process.cwd(), 'components', 'origin-chain');
const SOURCE = readFileSync(join(DIR, 'OriginChain.tsx'), 'utf8');
const CSS = readFileSync(join(DIR, 'OriginChain.module.css'), 'utf8');

test('sayi listeden turer, kayittan okunmaz', () => {
  assert.match(
    SOURCE,
    /carried_by\.length/,
    'bilesen tekrar sayisini listeden hesaplamiyor'
  );
  // Kayitta boyle bir alan yok; okunmaya calisilmasi da yasak.
  assert.ok(
    !/origin\.count\b/.test(SOURCE),
    'bilesen kayittan bir sayac okuyor'
  );
});

test('bagimsiz yayinci sayisi da listeden turer', () => {
  assert.match(SOURCE, /isSamePublisher\(origin, item\)/);
  assert.match(SOURCE, /\.filter\(/);
});

test('ayni yayinci tekrari desenle de ayrisir', () => {
  /*
   * Kenar cizgisi duz iken tekrarda noktali oluyor. Yalniz renk
   * degistirmek yetmez: uc durumlu rozet dilinde de ayni kural var.
   */
  assert.match(
    CSS,
    /\[data-same-publisher\][\s\S]*?border-left-style:\s*dotted/,
    'ayni yayinci tekrari yalniz renkle ayrisiyor'
  );
});

test('koken kaydi olmayan dosyada bolum hic cizilmez', () => {
  /*
   * Bos bir "Koken zinciri" basligi, denetimin yapildigi ama sonuc
   * cikmadigi izlenimi verirdi. Kayit yoklugu bunun tersini soyler.
   */
  assert.match(SOURCE, /origins\.length === 0\) return null/);
});

test('sayinin kapsami iki dilde birlikte yaziliyor', () => {
  const trCopy = (tr as Record<string, Record<string, string>>).OriginChain;
  const enCopy = (en as Record<string, Record<string, string>>).OriginChain;

  for (const key of [
    'intro',
    'notAccessed',
    'carriedBy',
    'independent',
    'samePublisher',
    'auditNote'
  ]) {
    assert.ok(trCopy[key], `tr metni yok: ${key}`);
    assert.ok(enCopy[key], `en metni yok: ${key}`);
  }

  // Sayi cogul kalibiyla geliyor: "1 yayin" ile "6 yayin" ayni cumle degil.
  for (const copy of [trCopy, enCopy]) {
    assert.match(copy.carriedBy, /\{count, plural,/);
    assert.match(copy.independent, /\{count, plural,/);
  }

  // Denetim kapsami acikca yaziyor — "dunyadaki toplam" degil.
  assert.ok(trCopy.auditNote.includes('Dünya çapındaki toplam değildir'));
  assert.ok(enCopy.auditNote.includes('not a worldwide total'));
});

test('kokene erisilemedigi kayitta ve sayfada yaziyor', () => {
  assert.match(SOURCE, /origin\.accessed \? null : \(/);
});
