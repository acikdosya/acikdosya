import assert from 'node:assert/strict';
import {test} from 'node:test';
import en from '../messages/en.json';
import tr from '../messages/tr.json';
import {KIND_MESSAGE_KEY, KIND_ORDER, SCOPES} from './measurement/labels';
import {categorySchema, specKeys} from './schema';

/**
 * Mesaj paketi ile kod arasindaki sozlesme.
 *
 * Bu dosyanin sebebi somut: dorduncu iraksama durumu ('belirsiz') eklendi,
 * rozet onu ogrendi, yontem sayfasi ogrenmedi. Arayuzde cikan bir etiketin
 * sayfada karsiligi yoktu ve typecheck bunu goremezdi — mesaj anahtarlari
 * calisma zamaninda cozuluyor.
 */

type Bundle = Record<string, Record<string, string>>;

const bundles: [name: string, bundle: Bundle][] = [
  ['tr', tr as Bundle],
  ['en', en as Bundle]
];

function keys(value: unknown, prefix = ''): string[] {
  if (value === null || typeof value !== 'object') return [prefix];

  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, child]) => keys(child, prefix ? `${prefix}.${key}` : key)
  );
}

test('tr ve en ayni anahtar kumesini tasir', () => {
  const trKeys = new Set(keys(tr));
  const enKeys = new Set(keys(en));

  const onlyTr = [...trKeys].filter((key) => !enKeys.has(key));
  const onlyEn = [...enKeys].filter((key) => !trKeys.has(key));

  assert.deepEqual(onlyTr, [], 'yalnizca tr icinde olan anahtarlar');
  assert.deepEqual(onlyEn, [], 'yalnizca en icinde olan anahtarlar');
});

test('her iraksama durumunun rozet metni var', () => {
  for (const [name, bundle] of bundles) {
    for (const kind of KIND_ORDER) {
      const key = `kind_${KIND_MESSAGE_KEY[kind]}`;
      assert.ok(bundle.Divergence[key], `${name}: Divergence.${key} eksik`);
    }
  }
});

test('her iraksama durumu yontem sayfasinda anlatiliyor', () => {
  for (const [name, bundle] of bundles) {
    for (const kind of KIND_ORDER) {
      const suffix = KIND_MESSAGE_KEY[kind];
      assert.ok(
        bundle.Method[`divergence_${suffix}`],
        `${name}: Method.divergence_${suffix} eksik — arayuzde cikan bir durum sayfada anlatilmiyor`
      );
      assert.ok(
        bundle.Method[`divergenceExample_${suffix}`],
        `${name}: Method.divergenceExample_${suffix} eksik`
      );
    }
  }
});

test('her scope degerinin etiketi var', () => {
  for (const [name, bundle] of bundles) {
    for (const scope of SCOPES) {
      assert.ok(
        bundle.Divergence[`scope_${scope}`],
        `${name}: Divergence.scope_${scope} eksik`
      );
    }
  }
});

test('her olcum alaninin etiketi var', () => {
  for (const [name, bundle] of bundles) {
    for (const key of specKeys) {
      assert.ok(
        bundle.Specs[key],
        `${name}: Specs.${key} eksik`
      );
    }
  }
});

test('her kategorinin etiketi var', () => {
  for (const [name, bundle] of bundles) {
    for (const category of categorySchema.options) {
      assert.ok(
        bundle.Categories[category],
        `${name}: Categories.${category} eksik`
      );
    }
  }
});

test('aile duzeyi tablo etiketi var', () => {
  for (const [name, bundle] of bundles) {
    assert.ok(
      bundle.SpecTable.familyLabel,
      `${name}: SpecTable.familyLabel eksik`
    );
  }
});

/* ---------------------------------------------------- Turkce karakterler */

/**
 * Turkce karakter sinamasi — CLAUDE.md §8.
 *
 * Iki ayri risk var ve ikisi de sessizce gecer:
 *
 *  1. ASCII'ye katlama. "Olcek" yazilip "Ölçek" yazilmamasi bir yazim
 *     hatasi degil, bir veri kaybi; typecheck ve lint goremez.
 *  2. Noktali/noktasiz i. İ (U+0130) ve ı (U+0131) latin-ext'te; alt
 *     kume yalniz latin secilirse yazi tipinde bulunmazlar. Metinde
 *     gectikleri yerlerin kaydi burada durur ki alt kume degisirse
 *     hangi ekranin bozulacagi bilinsin.
 */

/** Katlanmis yazim → dogrusu. Sema ve olcu metinlerinde arananlar. */
const FOLDED: Array<[wrong: RegExp, right: string]> = [
  [/\bOlcek\b/, 'Ölçek'],
  [/\bOlcu\b/, 'Ölçü'],
  [/\bgenislik\b/, 'genişlik'],
  [/\byukseklik\b/, 'yükseklik'],
  [/\bacikli[gk]i\b/, 'açıklığı'],
  [/\bgovde\b/, 'gövde'],
  [/\bcap\b/, 'çap']
];

function trStrings(value: unknown, prefix = ''): Array<[string, string]> {
  if (typeof value === 'string') return [[prefix, value]];
  if (value === null || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, child]) => trStrings(child, prefix ? `${prefix}.${key}` : key)
  );
}

test('tr paketinde ASCII katlamasi yok', () => {
  const offenders: string[] = [];
  for (const [key, text] of trStrings(tr)) {
    for (const [wrong, right] of FOLDED) {
      if (wrong.test(text)) offenders.push(`${key}: "${text}" → ${right}`);
    }
  }
  assert.deepEqual(offenders, [], 'Turkce karakterler ASCII"ye katlanmis');
});

test('sema ve olcu metinleri latin-ext karakterleri tasiyor', () => {
  const sections = ['ScaleSilhouette', 'ModelViewer', 'Sections'];
  const text = sections
    .map((section) => trStrings((tr as Record<string, unknown>)[section]))
    .flat()
    .map(([, value]) => value)
    .join(' ');

  // Alt kume yalniz latin olsaydi bunlarin hicbiri cizilemezdi.
  for (const char of ['ö', 'ü', 'ç', 'ş', 'ğ', 'ı']) {
    assert.ok(text.includes(char), `${char} hicbir sema metninde gecmiyor`);
  }
});

test('noktali buyuk I ve noktasiz kucuk i kayitli', () => {
  const all = trStrings(tr)
    .map(([, value]) => value)
    .join(' ');
  // U+0130 ve U+0131 — yazi tipi alt kumesi degisirse once bunlar duser.
  assert.ok(all.includes('İ'), 'İ (U+0130) hicbir metinde yok');
  assert.ok(all.includes('ı'), 'ı (U+0131) hicbir metinde yok');
});

test('en paketinde cevrilmemis Turkce metin yok', () => {
  /*
   * Marka adi iki pakette de "Açık Dosya" olarak gecer ve cevrilmez
   * (CLAUDE.md §10). Sizinti aramasi once onu cikarir, yoksa markanin
   * kendisi ihlal gibi gorunur.
   */
  const BRAND = /Açık Dosya/g;
  const leaks: string[] = [];
  for (const [key, text] of trStrings(en)) {
    if (/[şğıİŞĞ]/.test(text.replace(BRAND, ''))) leaks.push(`${key}: ${text}`);
  }
  assert.deepEqual(leaks, [], 'en paketinde cevrilmemis Turkce metin');
});

test('ucak model notu artik modellenen parcalari "modellenmez" demiyor', () => {
  /*
   * Metin bir zamanlar motor, pervane, inis takimi ve yuk istasyonlarinin
   * modellenmedigini soyluyordu. Dordu de artik modelleniyor; eski cumle
   * kalirsa sayfa okuyucuya yanlis sey soyler (tasks 5.9).
   */
  const note = (tr as Record<string, Record<string, string>>).ModelViewer
    .noteAircraft;
  assert.ok(!/modellenmez\./.test(note.split('mühimmat')[0]), note);
  assert.ok(note.includes('iniş takımının boyu') || note.includes('İniş'));
  assert.ok(note.includes('pilon'), 'pilon anlatilmamis');
  assert.ok(note.includes('mühimmat'), 'muhimmat karari yazilmamis');
});

test('model notlari bicim kaydina yonlendiriyor', () => {
  for (const key of ['note', 'noteAircraft'] as const) {
    const trText = (tr as Record<string, Record<string, string>>).ModelViewer[key];
    const enText = (en as Record<string, Record<string, string>>).ModelViewer[key];
    assert.ok(trText.includes('biçim kaydında'), `tr ${key}`);
    assert.ok(enText.includes('shape record'), `en ${key}`);
  }
});

test('ucak sema aciklamasi artik "kontur cizilmez" demiyor', () => {
  /*
   * Metin bir zamanlar yalniz zarf cizildigini ve dis hat icin
   * kaynagimiz olmadigini soyluyordu. Oran tablosu olan sistemde artik
   * gercek kontur ciziliyor; eski cumle kalirsa sayfa kendi cizdigi seyi
   * yalanlar.
   */
  const caption = (tr as Record<string, Record<string, string>>)
    .ScaleSilhouette.captionAircraft;
  assert.ok(
    !/konturu üretilmemiştir|yalnızca yayımlanmış boyutların zarfı/.test(caption),
    caption
  );
  assert.ok(caption.includes('izdüşüm'), 'izdusum anlatilmamis');
  assert.ok(caption.includes('zarf'), 'zarfin ne zaman cizildigi yazilmamis');
});
