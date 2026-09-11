import {AKINCI} from './akinci';
import {ATMACA} from './atmaca';
import type {AnyProduct} from './product';
import {TAYFUN} from './tayfun';

/**
 * Urun kaydi — slug'a gore dis bicim tanimi.
 *
 * Tanimsiz slug icin VARSAYILAN DONMEZ. Bilmedigimiz bir sistemi baska
 * bir sistemin geometrisiyle cizmek, olcusu olmayan alani ortalama bir
 * sayiyla doldurmakla ayni sey olurdu (CLAUDE.md §9).
 *
 * Yeni sistem eklemek: bir urun tanimi dosyasi ve bu tabloya bir satir.
 */
const PRODUCTS = new Map<string, AnyProduct>([
  ['tayfun', TAYFUN as AnyProduct],
  ['atmaca', ATMACA as AnyProduct],
  ['akinci', AKINCI as AnyProduct]
]);

/**
 * Map, duz nesne DEGIL: duz nesnede "constructor" ya da "toString"
 * sorgusu prototipten bir deger dondururdu ve tanimsiz bir slug sessizce
 * "urunu var" gorunurdu. Varsayilana dusmeme kuralinin en sinsi sizintisi
 * bu olurdu.
 */
export function productFor(slug: string): AnyProduct | undefined {
  return PRODUCTS.get(slug);
}

/** Kayitli her urun — kapsama sinavlari ve koken kaydi bunu gezer. */
export function allProducts(): readonly AnyProduct[] {
  return [...PRODUCTS.values()];
}
