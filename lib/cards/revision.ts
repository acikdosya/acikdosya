import {
  attributeKeys,
  specKeys,
  type AttributeKey,
  type Revision,
  type SpecKey,
  type System
} from '../schema';

/**
 * Duzeltme kaydi karti — bir degerin neden degistigi.
 *
 * IKI SEY BILINCLI OLARAK YOK:
 *
 * Guven rozeti yok. Duzeltme kaydi bir olcum degildir (CLAUDE.md §3);
 * rozet takmak onu olcum gibi gosterirdi. Alt seritteki yerde bunun
 * yerine kaydin ne oldugunu soyleyen cercevesiz bir etiket durur.
 *
 * "Kaldirildi" durumu SEZILMEZ. Tasarim kaldirma halini vurgu rengiyle
 * ayiriyordu; bizim semamizda from/to serbest metin ve bugunku veride
 * "kayit yok" yaziyor. Turkce bir dizeye bakarak durum cikarmak, kaydin
 * kendisinin soylemedigi bir sey uydurmak olurdu. Iki deger esit
 * agirlikta yazilir, eskisi ustu cizili; okuyucu ne oldugunu metinden
 * okur.
 */

export type RevisionCard = {
  system: System;
  revision: Revision;
  /** Kaydin dizideki sirasi — sorgu dizesindeki kimlik. */
  index: number;
  /** Dosyadaki toplam duzeltme sayisi. */
  total: number;
};

/**
 * Duzeltilen alanin adi nereden okunur.
 *
 * `field` serbest metin olabilir: sema disinda kalan yerler de duzeltilir
 * (sayfa basligi, ozet). Bilinen bir anahtarsa ceviri paketinden gecer,
 * degilse kaydin yazdigi gibi kalir — uydurma bir baslik uretilmez.
 */
export type RevisionField =
  | {kind: 'spec'; key: SpecKey}
  | {kind: 'attribute'; key: AttributeKey}
  | {kind: 'text'; value: string};

export function revisionField(field: string): RevisionField {
  if ((specKeys as readonly string[]).includes(field)) {
    return {kind: 'spec', key: field as SpecKey};
  }
  if ((attributeKeys as readonly string[]).includes(field)) {
    return {kind: 'attribute', key: field as AttributeKey};
  }
  return {kind: 'text', value: field};
}

export function revisionCard(
  system: System,
  index: number
): RevisionCard | undefined {
  const revisions = system.revisions ?? [];
  const revision = revisions[index];
  if (!revision) return undefined;

  return {system, revision, index, total: revisions.length};
}
