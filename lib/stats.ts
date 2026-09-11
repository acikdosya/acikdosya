import {SPEC_UNITS} from './format';
import {
  allMeasurements,
  specGroups,
  type SpecGroup
} from './measurement/groups';
import {
  fieldDivergence,
  PAIR_ORDER,
  type FieldDivergence
} from './measurement/divergence';
import {
  specKeys,
  type Confidence,
  type Measurement,
  type SpecKey,
  type System
} from './schema';

/**
 * Ana sayfadaki sayilar buradan gelir. Hicbiri elle yazilmaz — dosya
 * degisince sayfa da degisir. CLAUDE.md §5.7: kaynagi olmayan sayi
 * uretilmez, o yuzden "34 deger, 12 kaynak" gibi bir vitrin metni yok.
 */

export type Divergence = FieldDivergence & {
  key: SpecKey;
  variantId: string;
  variantLabel: string;
  measurements: readonly Measurement[];
  /** Farkli deger adedi. Ayni sayiyi iki kaynak veriyorsa iraksama yoktur. */
  distinct: number;
  /** Farkli kaynak adedi. */
  sources: number;
};

/** Operator degerin parcasi: "> 280" ile "280" ayni sayi degildir. */
function valueKey(measurement: Measurement): string {
  const upper =
    measurement.upper_value !== undefined
      ? `-${measurement.upper_operator ?? ''}${measurement.upper_value}`
      : '';
  return `${measurement.operator ?? ''}${measurement.value}${upper}`;
}

function distinctCount<T>(items: readonly T[], key: (item: T) => string): number {
  return new Set(items.map(key)).size;
}

/*
 * Siralama tek yerde: lib/measurement/divergence.ts PAIR_ORDER. Burada
 * ikinci bir kopya tutmak, iki dosyanin ayri ayri degismesine izin verirdi.
 */

/** Tek bir grubun (aile veya varyant) tek bir alanindaki iraksama. */
export function groupDivergence(
  group: SpecGroup,
  key: SpecKey
): FieldDivergence | undefined {
  return fieldDivergence(group.specs[key], SPEC_UNITS[key]);
}

/** @deprecated groupDivergence kullan. */
export function variantDivergence(
  variant: {specs: SpecGroup['specs']},
  key: SpecKey
): FieldDivergence | undefined {
  return fieldDivergence(variant.specs[key], SPEC_UNITS[key]);
}

/**
 * Tablo satirinin iraksamasi. Satir butun gruplari (aile + varyantlar)
 * yan yana dizdigi icin en agir durum satiri temsil eder.
 */
export function specDivergence(
  system: System,
  key: SpecKey
): FieldDivergence | undefined {
  let best: FieldDivergence | undefined;

  for (const group of specGroups(system)) {
    const found = groupDivergence(group, key);
    if (!found) continue;
    if (!best || PAIR_ORDER[found.kind] < PAIR_ORDER[best.kind]) best = found;
  }

  return best;
}

/**
 * Hero'da gosterilecek satir. Once durumun agirligi, sonra farkli deger
 * adedi karar verir; esitlikte specKeys ve varyant sirasi. Boylece ayni
 * icerik her build'de ayni satiri secer.
 *
 * Iraksama yoksa undefined doner ve ana sayfa paneli hic cizmez. Uydurma
 * bir ornek satir konmaz — CLAUDE.md §5.7.
 */
/** Grup + alan + iraksama → ana sayfanin okudugu kayit. */
function toDivergence(
  group: SpecGroup,
  key: SpecKey,
  divergence: FieldDivergence,
  list: readonly Measurement[]
): Divergence {
  return {
    ...divergence,
    key,
    variantId: group.id,
    variantLabel: group.label,
    measurements: list,
    distinct: distinctCount(list, valueKey),
    sources: distinctCount(list, (item) => item.source.tr)
  };
}

/**
 * Isaretlenmis alanin iraksamasi — icerikteki `hero` isaretcisi.
 *
 * Isaretci hangi grubu kastettigini soylemiyorsa alanin degerini tasiyan
 * ILK grup secilir. Isaretlenen alan iraksamiyorsa undefined doner;
 * derleme bu durumu zaten reddediyor (scripts/validate-content.ts), yani
 * buradaki undefined bir gerileme degil, savunma hattidir.
 */
export function markedDivergence(system: System): Divergence | undefined {
  const marker = system.hero;
  if (!marker) return undefined;

  for (const group of specGroups(system)) {
    if (marker.variant && group.id !== marker.variant) continue;

    const list = group.specs[marker.field];
    if (!list) continue;

    const divergence = groupDivergence(group, marker.field);
    if (!divergence) continue;

    return toDivergence(group, marker.field, divergence, list);
  }

  return undefined;
}

export function findDivergence(system: System): Divergence | undefined {
  let best: Divergence | undefined;

  for (const key of specKeys) {
    for (const group of specGroups(system)) {
      const list = group.specs[key];
      if (!list) continue;

      const divergence = groupDivergence(group, key);
      if (!divergence) continue;

      const distinct = distinctCount(list, valueKey);

      if (best) {
        const order = PAIR_ORDER[divergence.kind] - PAIR_ORDER[best.kind];
        if (order > 0) continue;
        if (order === 0 && distinct <= best.distinct) continue;
      }

      best = toDivergence(group, key, divergence, list);
    }
  }

  return best;
}

export type Tally = Record<Confidence, number>;

export type SystemStats = {
  /** Kayittaki sayisal deger adedi. */
  values: number;
  /** Farkli kaynak adedi — ayni kaynak iki alanda geciyorsa bir kez sayilir. */
  sources: number;
  /** Guven dagilimi. Sayisal degerler, metinsel ozellikler ve takvim olaylari. */
  tally: Tally;
  /** Dagilimdaki toplam kayit. values'tan buyuktur: ozellikler ve olaylar dahil. */
  entries: number;
  /** En yeni dogrulama tarihi, ISO. Hicbir alanda yoksa undefined. */
  verifiedAt?: string;
};

/**
 * Guven dagilimi guven tasiyan her kayit uzerinden hesaplanir: olcumler,
 * metinsel ozellikler ve takvim olaylari. 3D etiketleri disarida — onlar
 * ayni bilgiyi ikinci kez sayardi.
 */
export function systemStats(system: System): SystemStats {
  const tally: Tally = {official: 0, press: 0, estimate: 0};
  const sourceLabels = new Set<string>();
  let values = 0;
  let entries = 0;
  let verifiedAt: string | undefined;

  const note = (confidence: Confidence, source?: string, date?: string) => {
    tally[confidence] += 1;
    entries += 1;
    if (source) sourceLabels.add(source);
    if (date && (!verifiedAt || date > verifiedAt)) verifiedAt = date;
  };

  for (const {group, measurement} of allMeasurements(system)) {
    values += 1;
    note(measurement.confidence, measurement.source.tr, measurement.verified_at);

    if (group.kind === 'variant') {
      // attributes yalnizca varyantlarda tanimlidir.
    }
  }

  for (const variant of system.variants) {
    for (const attribute of Object.values(variant.attributes)) {
      if (!attribute) continue;
      note(attribute.confidence, attribute.source?.tr, attribute.verified_at);
    }
  }

  for (const event of system.timeline) {
    note(event.confidence, event.source?.tr);
  }

  return {values, sources: sourceLabels.size, tally, entries, verifiedAt};
}
