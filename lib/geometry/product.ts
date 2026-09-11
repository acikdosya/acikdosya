import type {Part} from './parts';
import type {RatioTable, ValueTable} from './ratio';
import {ratioValues} from './ratio';
import type {Category} from '../schema';

/**
 * Urun tanimi — bir sistemin bicimi.
 *
 * Bir urun iki seyden ibaret: hangi OLCULERE dayandigi ve hangi ORANLARI
 * tasidigi. Parca listesi bu ikisinden turer. Yeni bir sistem eklemek
 * artik dokuz dosyaya degil, bir urun tanimina ve bir kayit satirina
 * bakar (specs/system-geometry).
 *
 * Tip dali YOK. "Fuze mi ucak mi" sorusu bu katmanda sorulmaz; bir urun
 * hangi parcalari kuruyorsa odur. TB2'nin cift kirisli ters V kuyrugu da,
 * TAYFUN'un dort kanatcigi da ayni imzadan cikar.
 */

/**
 * Modele girebilen olcu alanlari.
 *
 * Hepsi content/systems/*.json icindeki yayimlanmis alanlardir. Bu listede
 * olmayan bir sayi modele giremez — CLAUDE.md §3'teki "confidence alani
 * olmayan sayi UI'a cikmaz" kuralinin geometri tarafindaki karsiligi.
 */
export type DimensionField =
  | 'length_m'
  | 'diameter_mm'
  | 'wingspan_m'
  | 'height_m';

/** Bir varyant icin secilmis olculer. Eksik alan undefined kalir. */
export type Dimensions = Partial<Record<DimensionField, number>>;

export interface BuildInput<
  R extends DimensionField,
  K extends string
> {
  /** Urunun istedigi olculer; hepsi dolu oldugu garanti. */
  dims: Record<R, number>;
  /**
   * Urunun ZORUNLU tutmadigi ama varsa kullandigi olculer.
   *
   * AKINCI'nin inis takimi boyu yayimlanan `height_m` degerinden turer;
   * o deger yoksa takim cizilmez ama ucak yine cizilir. Alani `requires`
   * icine koymak, yuksekligi olmayan bir varyantta modeli tamamen
   * susturur ve elimizdeki iki kaynakli olcuyu da bosa harcardi.
   */
  extra: Dimensions;
  /** Oran tablosunun yalniz sayilari. Koken kaydi sayfaya aittir. */
  ratios: ValueTable<K>;
}

export type {Category};

export interface ProductDefinition<
  R extends DimensionField = DimensionField,
  K extends string = string
> {
  /** content/systems/<slug>.json ile ayni. */
  slug: string;
  category: Category;
  /**
   * Model icin gereken olculer. Biri eksikse model URETILMEZ; varsayilan
   * bir degerle doldurulmaz (CLAUDE.md §9).
   */
  requires: readonly R[];
  ratios: RatioTable<K>;
  /**
   * Olcu cizgisinin govde ANMA yaricapina gore yanal ofseti.
   *
   * Bir CIZIM karari, bicim orani degil — bu yuzden koken beyani tasimaz.
   * Deger urune gore degisir, cunku cizginin disinda kalmasi gereken sey
   * her sistemde farkli: TAYFUN'da kanatcik ucu 1,9 yaricapta, ATMACA'da
   * govde ortasi kanat 2,74 yaricapta, AKINCI'da ince govde cizgiyi
   * uzaga iter. Verilmezse 2,4.
   */
  dimensionOffsetRatio?: number;
  build(input: BuildInput<R, K>): Part[];
}

/** Kayitta duran her urun; tur parametreleri disaridan gorunmez. */
export type AnyProduct = ProductDefinition<DimensionField, string>;

/**
 * Istenen olculer var mi.
 *
 * Eksikse undefined doner ve cagiran model kurmaz. Bos donmek ile
 * varsayilan deger uretmek arasindaki fark bu projenin tamami.
 */
export function resolveDimensions<R extends DimensionField>(
  requires: readonly R[],
  available: Dimensions
): Record<R, number> | undefined {
  const out = {} as Record<R, number>;
  for (const field of requires) {
    const value = available[field];
    if (value === undefined || !Number.isFinite(value)) return undefined;
    out[field] = value;
  }
  return out;
}

/**
 * Urunun parca listesi.
 *
 * Olcu eksikse undefined. Tek giris noktasi burasi; web sahnesi, GLB
 * pisirici ve iki boyutlu izdusum ayni listeyi okur, bu yuzden ayrisamaz.
 */
export function buildParts(
  product: AnyProduct,
  available: Dimensions
): Part[] | undefined {
  const dims = resolveDimensions(product.requires, available);
  if (!dims) return undefined;
  return product.build({
    dims,
    extra: available,
    ratios: ratioValues(product.ratios)
  });
}

/**
 * Tanimi yardimcisi — tur cikarimini korur.
 *
 * `requires` dizisinden R, `ratios` nesnesinden K cikarilir; boylece
 * build govdesinde `dims.length_m` ve `ratios.noseRatio` yazim
 * denetiminden gecer.
 */
export function defineProduct<
  const R extends DimensionField,
  const K extends string
>(definition: ProductDefinition<R, K>): ProductDefinition<R, K> {
  return definition;
}
