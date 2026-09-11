import assert from 'node:assert/strict';
import {test} from 'node:test';
import {CATEGORY_COVERAGE} from './coverage';
import {allProducts} from './registry';
import {categorySchema} from '../schema';

/**
 * Kapsama tablosu ile urun kaydi arasindaki bosluk burada yakalanir.
 *
 * Derleme zamani kontrolu tablonun EKSIKSIZ olmasini sagliyor
 * (Record<Category, ...>), bu testler tablonun DOGRU olmasini sagliyor:
 * 'modelled' yazan kategoride gercekten bir urun var mi, 'no-model-yet'
 * yazanda gercekten yok mu.
 */

test('kapsama tablosu semadaki her kategoriyi tasir', () => {
  const declared = new Set(Object.keys(CATEGORY_COVERAGE));
  for (const category of categorySchema.options) {
    assert.ok(declared.has(category), `${category} kapsama tablosunda yok`);
  }
  assert.equal(declared.size, categorySchema.options.length);
});

test('modelled yazan kategoride en az bir urun var', () => {
  const covered = new Set(allProducts().map((product) => product.category));
  for (const [category, state] of Object.entries(CATEGORY_COVERAGE)) {
    if (state !== 'modelled') continue;
    assert.ok(
      covered.has(category as never),
      `${category} 'modelled' ama kayitli urunu yok`
    );
  }
});

test('no-model-yet yazan kategoride urun YOK', () => {
  const covered = new Set(allProducts().map((product) => product.category));
  for (const [category, state] of Object.entries(CATEGORY_COVERAGE)) {
    if (state !== 'no-model-yet') continue;
    assert.equal(
      covered.has(category as never),
      false,
      `${category} 'no-model-yet' ama kayitli urunu var`
    );
  }
});

test('her urunun kategorisi semada tanimli', () => {
  for (const product of allProducts()) {
    assert.ok(
      categorySchema.options.includes(product.category),
      `${product.slug}: taninmayan kategori ${product.category}`
    );
  }
});
