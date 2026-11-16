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
  | {kind: 'section'; key: RevisionSectionKey}
  | {kind: 'text'; value: string};

/**
 * Olcum ya da ozellik olmayan ama bilinen bolum anahtarlari.
 *
 * Tek liste burada; defter (components/revision-log) ve kart ayni cozumu
 * `revisionFieldLabel` uzerinden kullanir. Eskiden ikisi de yalniz olcum
 * ve ozellik anahtarini taniyordu ve TAYFUN'un `source` kaydi iki dilde
 * ham Ingilizce anahtar olarak ciziliyordu.
 */
export const revisionSectionKeys = ['timeline', 'source'] as const;
export type RevisionSectionKey = (typeof revisionSectionKeys)[number];

export function revisionField(field: string): RevisionField {
  if ((specKeys as readonly string[]).includes(field)) {
    return {kind: 'spec', key: field as SpecKey};
  }
  if ((attributeKeys as readonly string[]).includes(field)) {
    return {kind: 'attribute', key: field as AttributeKey};
  }
  if ((revisionSectionKeys as readonly string[]).includes(field)) {
    return {kind: 'section', key: field as RevisionSectionKey};
  }
  return {kind: 'text', value: field};
}

/** Uc ceviri kaynagi: olcum adlari, ozellik adlari, defterin kendi paketi. */
export type RevisionFieldTranslators = {
  tSpec: (key: string) => string;
  tAttribute: (key: string) => string;
  /** `RevisionLog` paketi; bolum adlari `section_<anahtar>` anahtarinda. */
  tLog: (key: string) => string;
};

/** Duzeltilen alanin okuyucunun dilindeki adi. */
export function revisionFieldLabel(
  field: string,
  {tSpec, tAttribute, tLog}: RevisionFieldTranslators
): string {
  const resolved = revisionField(field);
  switch (resolved.kind) {
    case 'spec':
      return tSpec(resolved.key);
    case 'attribute':
      return tAttribute(resolved.key);
    case 'section':
      return tLog(`section_${resolved.key}`);
    case 'text':
      return resolved.value;
  }
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
