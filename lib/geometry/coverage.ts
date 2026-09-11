import type {Category} from '../schema';

/**
 * Her kategori icin model durumu — acik tablo.
 *
 * `Record<Category, ...>` exhaustive: lib/schema.ts'teki kategori enumuna
 * yeni bir deger eklenip buraya satir yazilmazsa DERLEME DUSER. Amac,
 * "yeni kategori eklendi ama modeli yok" halinin sessizce gecmemesi.
 *
 * 'no-model-yet' bir eksiklik degil, bir KAYIT: o kategoride henuz
 * uretilebilir bir dis profil yok ve sayfa modeli hic acmaz. Varsayilan
 * bir geometriye dusmenin alternatifi budur (CLAUDE.md §9).
 */
export type CategoryCoverage = 'modelled' | 'no-model-yet';

export const CATEGORY_COVERAGE: Record<Category, CategoryCoverage> = {
  'balistik-fuze': 'modelled',
  'seyir-fuzesi': 'modelled',
  'insansiz-hava-araci': 'modelled'
};

export function coverageFor(category: Category): CategoryCoverage {
  return CATEGORY_COVERAGE[category];
}
