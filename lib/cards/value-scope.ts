import {SPEC_UNITS} from '../format';
import type {SpecGroup} from '../measurement/groups';
import type {DivergenceKind} from '../measurement/divergence';
import type {Confidence, Measurement, SpecKey, System} from '../schema';
import {groupDivergence} from '../stats';

/**
 * Deger ve kapsami karti — ayni alandaki degerler yan yana.
 *
 * Kartin BASLIGI her zaman notrdur ve durumu elle etiketlenmez. Durum
 * adi hesabin kendisinden gelir (lib/measurement/divergence.ts): iki
 * deger ayni cetvele konabiliyorsa ve araliklar kesismiyorsa sonuc
 * 'celiski' olur ve kart oyle yazar; kapsam ayrisiyorsa 'farkli-kapsam'
 * yazar. Elle "celiski" demek bu projede yasak, hesaba dayanarak demek
 * ise zorunlu — CLAUDE.md §3.
 *
 * Bugunku veride ikisi de var: AKINCI uzunlugu celiski, TAYFUN menzili
 * farkli kapsam.
 */

/** Tasarimin sayi araligi. Disina cikan veri kart uretmez. */
export const MIN_COLUMNS = 2;
export const MAX_COLUMNS = 3;

export type ValueScopeCard = {
  system: System;
  group: SpecGroup;
  key: SpecKey;
  unit: string;
  /** Dosyadaki sirayla. Siralamiyoruz: sira bir siralama ima ederdi. */
  columns: Measurement[];
  /** Hesabin verdigi durum. Alan ayrismiyorsa undefined. */
  kind: DivergenceKind | undefined;
  /** Kacinci kapsamda kac deger — baslik bu sayilardan kurulur. */
  scopeCount: number;
  confidences: Confidence[];
  verifiedAt: string;
};

const CONFIDENCE_ORDER: Confidence[] = ['official', 'press', 'estimate'];

export function valueScope(
  system: System,
  group: SpecGroup,
  key: SpecKey
): ValueScopeCard | undefined {
  const columns = group.specs[key];
  if (!columns) return undefined;
  if (columns.length < MIN_COLUMNS || columns.length > MAX_COLUMNS) {
    return undefined;
  }

  const seen = new Set(columns.map((column) => column.confidence));
  /*
   * Kapsami yazilmamis kayitlar tek bir "belirtilmemis" kumesi sayilir;
   * ikisi ayni sey olmayabilir ama bizim bildigimiz kadariyla ayrilar.
   */
  const scopes = new Set(columns.map((column) => column.scope ?? '—'));

  return {
    system,
    group,
    key,
    unit: SPEC_UNITS[key],
    columns,
    kind: groupDivergence(group, key)?.kind,
    scopeCount: scopes.size,
    confidences: CONFIDENCE_ORDER.filter((confidence) => seen.has(confidence)),
    verifiedAt: columns
      .map((column) => column.verified_at)
      .reduce((latest, date) => (date > latest ? date : latest))
  };
}
