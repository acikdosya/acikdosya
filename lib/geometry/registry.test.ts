import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {test} from 'node:test';
import {allProducts, productFor, variantKey} from './registry';
import {ratioTableSchema} from './ratio.schema';

const SYSTEMS_DIR = join(process.cwd(), 'content', 'systems');

function systemFiles() {
  return readdirSync(SYSTEMS_DIR)
    .filter((name) => name.endsWith('.json'))
    .map((name) => ({
      name,
      data: JSON.parse(readFileSync(join(SYSTEMS_DIR, name), 'utf8')) as {
        slug: string;
        category: string;
      }
    }));
}

test('her urunun oran tablosu koken semasindan gecer', () => {
  for (const product of allProducts()) {
    const result = ratioTableSchema.safeParse(product.ratios);
    assert.equal(
      result.success,
      true,
      `${product.slug}: ${result.success ? '' : JSON.stringify(result.error.issues)}`
    );
  }
});

test('her oran bos olmayan iki dilli gerekce tasir', () => {
  for (const product of allProducts()) {
    for (const [key, ratio] of Object.entries(product.ratios)) {
      assert.ok(ratio.note.tr.length > 20, `${product.slug}.${key} tr gerekcesi kisa`);
      assert.ok(ratio.note.en.length > 20, `${product.slug}.${key} en gerekcesi kisa`);
    }
  }
});

test('olculmus oran kaynagini ve izdusum sinavini tasir', () => {
  for (const product of allProducts()) {
    for (const [key, ratio] of Object.entries(product.ratios)) {
      if (ratio.basis !== 'measured') continue;
      assert.ok(ratio.source_url.startsWith('https://'), `${product.slug}.${key}`);
      assert.ok(ratio.projection_check.tr.length > 0, `${product.slug}.${key}`);
      assert.ok(ratio.projection_check.en.length > 0, `${product.slug}.${key}`);
    }
  }
});

test('kayittaki slug ve kategori icerik dosyasiyla ortusur', () => {
  const files = systemFiles();
  for (const product of allProducts()) {
    const match = files.find((file) => file.data.slug === product.slug);
    assert.ok(match, `${product.slug} icin icerik dosyasi yok`);
    assert.equal(
      product.category,
      match.data.category,
      `${product.slug}: kayit "${product.category}", icerik "${match.data.category}"`
    );
  }
});

test('tanimsiz slug varsayilan urune DUSMEZ', () => {
  assert.equal(productFor('bilinmeyen'), undefined);
  assert.equal(productFor(''), undefined);
  // Object prototip anahtarlari kayit gibi davranmamali.
  assert.equal(productFor('constructor'), undefined);
  assert.equal(productFor('toString'), undefined);
});

/*
 * VARYANT DUZEYI KAYIT — specs/variant-geometry.
 *
 * Kayit artik "<sistem>/<varyant>" anahtarini da taniyor. Sisteme dusmek
 * mesru, cunku TAYFUN'un iki varyanti gercekten ayni bicimi paylasiyor;
 * ama dusus SESSIZ olamaz. Asagidaki testlerin isi, o gorunurlugu ve
 * varsayilana dusmeme kuralinin varyant duzeyinde de gecerli oldugunu
 * sabitlemek.
 */

test('varyant tanimi yoksa sisteme duser ve bunu soyler', () => {
  const match = productFor('tayfun', 'tayfun-blok-4');
  assert.ok(match, 'tayfun/tayfun-blok-4 cozulmedi');
  assert.equal(match.matched, 'system');
  assert.equal(match.key, 'tayfun');
});

test('varyantsiz cagri da ayni urunu bulur', () => {
  const withVariant = productFor('tayfun', 'tayfun');
  const without = productFor('tayfun');
  assert.ok(withVariant && without);
  assert.equal(withVariant.product, without.product);
});

test('tanimsiz cift varsayilan urune DUSMEZ', () => {
  assert.equal(productFor('bilinmeyen', 'bilinmeyen'), undefined);
  assert.equal(productFor('', ''), undefined);
  // Varyant kimligi prototip anahtari olsa bile sistem cozumu bozulmaz.
  const match = productFor('tayfun', 'constructor');
  assert.ok(match);
  assert.equal(match.matched, 'system');
  // Sistem tanimsizken varyant kimligi bir sey uyduramaz.
  assert.equal(productFor('constructor', 'tayfun'), undefined);
});

test('varyant anahtari sistem anahtarini gecer', () => {
  /*
   * Bugun hicbir sistemde varyant tanimi yok, o yuzden kural dogrudan
   * sinanamaz. Anahtar kurucusunun bicimi yine de sabitleniyor: iki
   * taraf ayni dizeyi kurmazsa varyant tanimi hic bulunamaz.
   */
  assert.equal(variantKey('siper', 'siper-urun-1'), 'siper/siper-urun-1');
});
