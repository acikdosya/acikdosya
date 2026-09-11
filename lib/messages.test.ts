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
