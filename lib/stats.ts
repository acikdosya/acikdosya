import {SPEC_UNITS} from './format';
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
  type System,
  type Variant
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
  return `${measurement.operator ?? ''}${measurement.value}`;
}

function distinctCount<T>(items: readonly T[], key: (item: T) => string): number {
  return new Set(items.map(key)).size;
}

/*
 * Siralama tek yerde: lib/measurement/divergence.ts PAIR_ORDER. Burada
 * ikinci bir kopya tutmak, iki dosyanin ayri ayri degismesine izin verirdi.
 */

/** Tek bir varyantin tek bir alanindaki iraksama. */
export function variantDivergence(
  variant: Variant,
  key: SpecKey
): FieldDivergence | undefined {
  return fieldDivergence(variant.specs[key], SPEC_UNITS[key]);
}

/**
 * Tablo satirinin iraksamasi. Satir varyantlari yan yana dizdigi icin
 * en agir durum satiri temsil eder.
 */
export function specDivergence(
  system: System,
  key: SpecKey
): FieldDivergence | undefined {
  let best: FieldDivergence | undefined;

  for (const variant of system.variants) {
    const found = variantDivergence(variant, key);
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
export function findDivergence(system: System): Divergence | undefined {
  let best: Divergence | undefined;

  for (const key of specKeys) {
    for (const variant of system.variants) {
      const list = variant.specs[key];
      if (!list) continue;

      const divergence = variantDivergence(variant, key);
      if (!divergence) continue;

      const distinct = distinctCount(list, valueKey);

      if (best) {
        const order = PAIR_ORDER[divergence.kind] - PAIR_ORDER[best.kind];
        if (order > 0) continue;
        if (order === 0 && distinct <= best.distinct) continue;
      }

      best = {
        ...divergence,
        key,
        variantId: variant.id,
        variantLabel: variant.label,
        measurements: list,
        distinct,
        sources: distinctCount(list, (item) => item.source.tr)
      };
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

  for (const variant of system.variants) {
    for (const key of specKeys) {
      for (const measurement of variant.specs[key] ?? []) {
        values += 1;
        note(measurement.confidence, measurement.source.tr, measurement.verified_at);
      }
    }

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
