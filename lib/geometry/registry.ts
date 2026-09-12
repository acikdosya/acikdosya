import {AKINCI} from './akinci';
import {ATMACA} from './atmaca';
import type {AnyProduct} from './product';
import {SIPER_URUN_1} from './siper-urun-1';
import {SIPER_URUN_2} from './siper-urun-2';
import {TAYFUN} from './tayfun';

/** "<sistem>/<varyant>" — tek yerde kurulur, iki tarafta ayni yazilsin. */
export function variantKey(systemSlug: string, variantId: string): string {
  return `${systemSlug}/${variantId}`;
}

/**
 * Urun kaydi — sistem ve varyanta gore dis bicim tanimi.
 *
 * Anahtar ARTIK CIFT. Bir ailenin varyantlari her zaman ayni govdeyi
 * paylasmaz: SIPER'in iki urunu farkli kanat duzeni, farkli burun ve
 * birinde ayrilabilir bir itici tasiyor. Onceki surumde kayit yalniz
 * sistem slug'ina bagliydi ve iki varyant ayni tabloyla ciziliyordu —
 * elimizdeki cizimle celisen bir bicim (specs/variant-geometry).
 *
 * Cozum once "<sistem>/<varyant>" anahtarini, bulamazsa sistem slug'ini
 * dener. TAYFUN'un iki varyanti gercekten ayni bicimi paylasiyor ve ayni
 * tabloyu iki kez yazmak iki kopyanin ayrismasina izin verirdi.
 *
 * Tanimsiz cift icin VARSAYILAN DONMEZ. Bilmedigimiz bir sistemi baska
 * bir sistemin geometrisiyle cizmek, olcusu olmayan alani ortalama bir
 * sayiyla doldurmakla ayni sey olurdu (CLAUDE.md §9).
 *
 * Yeni sistem eklemek: bir urun tanimi dosyasi ve bu tabloya bir satir.
 */
const PRODUCTS = new Map<string, AnyProduct>([
  ['tayfun', TAYFUN as AnyProduct],
  ['atmaca', ATMACA as AnyProduct],
  ['akinci', AKINCI as AnyProduct],
  /*
   * SIPER iki varyanti AYRI tanim tasiyor: Urun-1'de ayrilabilir itici ve
   * orta kanat, Urun-2'de govde boyu strake. Uretici cizimi ikisini acikca
   * farkli gosteriyor; ortak bir tablo o kanitla celisirdi.
   */
  [variantKey('siper', 'siper-urun-1'), SIPER_URUN_1 as AnyProduct],
  [variantKey('siper', 'siper-urun-2'), SIPER_URUN_2 as AnyProduct]
]);

/**
 * Kaydin nerede bulundugu.
 *
 * Sisteme dusmek mesru — ayni bicimi paylasan varyantlar var — ama SESSIZ
 * OLAMAZ. Cagiran hangi anahtarin tuttugunu gorur; boylece "bu varyantin
 * kendi tanimi var mi" sorusu kod icinde cevaplanabilir kalir.
 */
export type ProductMatch = {
  product: AnyProduct;
  matched: 'variant' | 'system';
  /** Kaydin bulundugu anahtar; hata ve kayit metinlerinde gecer. */
  key: string;
};

/**
 * Map, duz nesne DEGIL: duz nesnede "constructor" ya da "toString"
 * sorgusu prototipten bir deger dondururdu ve tanimsiz bir slug sessizce
 * "urunu var" gorunurdu. Varsayilana dusmeme kuralinin en sinsi sizintisi
 * bu olurdu.
 */
export function productFor(
  systemSlug: string,
  variantId?: string
): ProductMatch | undefined {
  if (variantId !== undefined) {
    const key = variantKey(systemSlug, variantId);
    const own = PRODUCTS.get(key);
    if (own) return {product: own, matched: 'variant', key};
  }

  const shared = PRODUCTS.get(systemSlug);
  if (shared) return {product: shared, matched: 'system', key: systemSlug};

  return undefined;
}

/** Kayitli her urun — kapsama sinavlari ve koken kaydi bunu gezer. */
export function allProducts(): readonly AnyProduct[] {
  return [...PRODUCTS.values()];
}

/** Kayitli anahtarlar — sozlesme testleri hangi satirin ne oldugunu sorar. */
export function productKeys(): readonly string[] {
  return [...PRODUCTS.keys()];
}
