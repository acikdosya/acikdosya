import {createHash} from 'node:crypto';
import {getSystem} from '../content';
import {specGroups, type SpecGroup} from '../measurement/groups';
import {specKeys, type Measurement, type SpecKey, type System} from '../schema';

/**
 * Kart rotalarinin sorgu dizesi — tek cozumleme yeri.
 *
 * Kural: TANIMSIZ DEGER VARSAYILANA DUSMEZ. Bilinmeyen bir sistem slug'i
 * ya da alan adi geldiginde kart uretilmez, 404 doner. Sessizce baska bir
 * sisteme dusen bir kart, paylasildiginda yanlis sistemi anlatirdi ve
 * gorselin icinde bunu belli edecek hicbir sey olmazdi.
 *
 * Atlanmis istege bagli parametre baska bir sey: o varsayilanina duser
 * (format verilmezse yatay). Fark bilincli — "yanlis yazilmis" ile
 * "yazilmamis" ayni sey degil.
 */

export const CARD_FORMATS = ['yatay', 'dikey'] as const;
export type CardFormat = (typeof CARD_FORMATS)[number];

export const CARD_SIZE: Record<CardFormat, {width: number; height: number}> = {
  yatay: {width: 1200, height: 675},
  dikey: {width: 1080, height: 1350}
};

export function parseFormat(raw: string | null): CardFormat | undefined {
  if (raw === null) return 'yatay';
  return (CARD_FORMATS as readonly string[]).includes(raw)
    ? (raw as CardFormat)
    : undefined;
}

/** Tek sistem. Bilinmeyen slug undefined — cagiran 404 dondurur. */
export function parseSystem(raw: string | null): System | undefined {
  if (!raw) return undefined;
  return getSystem(raw);
}

/**
 * Birden fazla sistem: `sistem=tayfun,akinci`. Biri bile bilinmiyorsa
 * hicbiri cizilmez — eksik bir karsilastirma, karsilastirmanin kendisini
 * yanlis yapar.
 */
export function parseSystems(
  raw: string | null,
  limit: number
): System[] | undefined {
  if (!raw) return undefined;

  const slugs = raw.split(',').map((slug) => slug.trim()).filter(Boolean);
  if (slugs.length === 0 || slugs.length > limit) return undefined;
  if (new Set(slugs).size !== slugs.length) return undefined;

  const systems = slugs.map((slug) => getSystem(slug));
  return systems.every((system): system is System => system !== undefined)
    ? systems
    : undefined;
}

export function parseSpecKey(raw: string | null): SpecKey | undefined {
  if (!raw) return undefined;
  return (specKeys as readonly string[]).includes(raw)
    ? (raw as SpecKey)
    : undefined;
}

/**
 * Olcu grubu: aile beyanlari ya da bir varyant. Atlanirsa alanin degerini
 * tasiyan ilk grup secilir — grup, alanin kendisinden turer.
 */
export function parseGroup(
  system: System,
  raw: string | null,
  key: SpecKey
): SpecGroup | undefined {
  const groups = specGroups(system);

  if (raw) return groups.find((group) => group.id === raw);
  return groups.find((group) => (group.specs[key]?.length ?? 0) > 0);
}

/**
 * Duzeltme kaydinin kimligi: dizideki sirasi.
 *
 * (tarih, alan) cifti benzersiz DEGIL — TAYFUN dosyasinda ayni gun iki
 * range_km duzeltmesi var. Sira numarasi kayitlar sona eklendigi surece
 * kararli; araya kayit sokulursa paylasilmis bir bag baska bir kaydi
 * gosterir. Bedeli biliniyor, alternatifi kayda yeni bir kimlik alani
 * eklemekti.
 */
export function parseRevisionIndex(
  system: System,
  raw: string | null
): number | undefined {
  const revisions = system.revisions ?? [];
  if (!raw || revisions.length === 0) return undefined;

  if (!/^\d+$/.test(raw)) return undefined;
  const index = Number(raw);
  return index < revisions.length ? index : undefined;
}

/**
 * Bir olcumun dayandigi belgenin kimligi.
 *
 * Adres varsa adresten, yoksa kaynak adindan turuyor: ayni belgeyi iki
 * kayitta farkli adlandirmis olsak bile adres ikisini birlestirir. Kisa
 * ozet, sorgu dizesinde okunabilir kalsin diye.
 */
export function sourceKey(measurement: Measurement): string {
  const identity = measurement.source_url ?? `ad:${measurement.source.tr}`;
  return createHash('sha256').update(identity).digest('hex').slice(0, 8);
}
