import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {test} from 'node:test';
import en from '@/messages/en.json';
import tr from '@/messages/tr.json';
import {allProducts, productFor} from '@/lib/geometry/registry';

/**
 * Koken kaydi ile mesaj paketi arasindaki sozlesme.
 *
 * Oran anahtarlari kodda yasiyor, etiketleri paketlerde. Bir urun yeni
 * bir oran eklerse ve etiketi yazilmazsa sayfada ham anahtar cikar;
 * typecheck bunu goremez, mesaj cozumlemesi calisma zamaninda oluyor.
 */

const CSS = readFileSync(
  join(process.cwd(), 'components', 'model-provenance', 'ModelProvenance.module.css'),
  'utf8'
);

test('her urun orani icin iki dilde etiket var', () => {
  const trLabels = (tr as Record<string, Record<string, string>>).RatioLabels;
  const enLabels = (en as Record<string, Record<string, string>>).RatioLabels;

  for (const product of allProducts()) {
    for (const key of Object.keys(product.ratios)) {
      assert.ok(trLabels[key], `tr etiketi yok: ${key}`);
      assert.ok(enLabels[key], `en etiketi yok: ${key}`);
    }
  }
});

test('kullanilmayan etiket birikmiyor', () => {
  const used = new Set(
    allProducts().flatMap((product) => Object.keys(product.ratios))
  );
  const declared = Object.keys(
    (tr as Record<string, Record<string, string>>).RatioLabels
  );
  const stale = declared.filter((key) => !used.has(key));
  assert.deepEqual(stale, [], 'hicbir urunun tasimadigi etiketler');
});

test('uc koken durumunun da metni var', () => {
  for (const [name, bundle] of [
    ['tr', tr],
    ['en', en]
  ] as const) {
    const block = (bundle as Record<string, Record<string, string>>)
      .ModelProvenance;
    for (const basis of ['measured', 'reading', 'chosen']) {
      assert.ok(block[basis], `${name}: ${basis} metni yok`);
      assert.ok(block[`${basis}Hint`], `${name}: ${basis} aciklamasi yok`);
    }
  }
});

test('uc durum RENKLE degil desenle ayrisir', () => {
  // Her durumun kendi alt cizgi deseni olmali.
  for (const [basis, style] of [
    ['measured', 'solid'],
    ['reading', 'dashed'],
    ['chosen', 'dotted']
  ] as const) {
    const block = CSS.match(
      new RegExp(`\\.basis\\[data-basis='${basis}'\\]\\s*\\{[^}]*\\}`)
    );
    assert.ok(block, `${basis} icin kural yok`);
    assert.ok(
      block[0].includes(`border-bottom-style: ${style}`),
      `${basis} deseni ${style} degil`
    );
  }
});

test('koken gosterimi guven rozetinin cerceve dilini kullanmaz', () => {
  /*
   * Guven rozetleri cerceveyle ayrisiyor (CLAUDE.md §4). Koken ayri bir
   * sey; ayni gorunurse okuyucu ikisini de yanlis okur. Bu yuzden burada
   * tam cerceve (border / border-style / outline) kullanilmaz.
   */
  const basisRules = CSS.slice(CSS.indexOf('.basis {'));
  assert.ok(
    !/\bborder:\s/.test(basisRules),
    'durum isareti tam cerceve tasiyor'
  );
  assert.ok(
    !/\boutline:\s/.test(basisRules),
    'durum isareti outline tasiyor'
  );
});

test('AKINCI kaydi uc durumu birden gosterir', () => {
  const product = productFor('akinci');
  assert.ok(product);
  const seen = new Set(
    Object.values(product.ratios).map((ratio) => ratio.basis)
  );
  assert.deepEqual([...seen].sort(), ['chosen', 'measured', 'reading']);
});

test('olculmus ve okuma oranlari kaynak baglantisi tasir', () => {
  for (const product of allProducts()) {
    for (const [key, ratio] of Object.entries(product.ratios)) {
      if (ratio.basis === 'chosen') continue;
      assert.ok(
        ratio.source_url.startsWith('https://'),
        `${product.slug}.${key} kaynak adresi yok`
      );
      assert.match(ratio.seen_at, /^\d{4}-\d{2}-\d{2}$/, key);
    }
  }
});
