import {primary} from './format';
import {specGroups, type SpecGroup} from './measurement/groups';
import {
  specKeys,
  type Measurement,
  type Revision,
  type SpecKey,
  type System
} from './schema';
import {findDivergence, markedDivergence, type Divergence} from './stats';

/**
 * Ana sayfa hero panelinin konusu — CLAUDE.md §5.7.
 *
 * Panel eskiden tek bir kosula bagliydi: dosyada iraksayan bir alan varsa
 * cizilir, yoksa hero yarim kalirdi. Bu, sayfanin en gorunur bolumunu
 * icerigin o gunku haline rehin veriyordu; bir kaynagi kaldirmak sayfanin
 * hareket anini da goturuyordu.
 *
 * Simdi sirali geri cekilme var. Ucu de GERCEK veriden okunur; farazi
 * ornek satir uretilmez:
 *
 *  0. isaretli alan  Icerikte `hero` isaretcisi varsa panel onu anlatir.
 *                    Konu artik bir siralama kuralinin ciktisi degil,
 *                    yazili bir karar.
 *  1. iraksama       Ayni alanda ayrisan degerler. Yontemi en iyi bu anlatir.
 *  2. son duzeltme   Yayimlanmis bir degeri neden degistirdigimiz. Dosyanin
 *                    kendi tarihi — iraksama yoksa gosterilecek en guclu sey.
 *  3. koken zinciri  Tek bir degerin tam kaydi: deger, guven, kapsam,
 *                    kaynak, dogrulama tarihi. Her zaman vardir.
 *
 * Hicbiri yoksa (dosyada tek bir olcum bile yoksa) panel cizilmez.
 */
export type HeroFocus =
  | {tier: 'divergence'; system: System; divergence: Divergence}
  | {tier: 'revision'; system: System; revision: Revision}
  | {
      tier: 'provenance';
      system: System;
      group: SpecGroup;
      key: SpecKey;
      measurement: Measurement;
    };

/**
 * Kaydin ne kadari doldurulmus. Yuksek olan hero'ya cikar, cunku panelin
 * isi zincirin TAMAMINI gostermek: yarim bir kayit yontemi anlatmaz.
 *
 * Baglanti en agirlikli: okuyucunun kendi gidip bakabilecegi tek alan o.
 * Deger, guven, kaynak ve dogrulama tarihi zaten her kayitta zorunlu,
 * bu yuzden puana girmezler.
 */
function completeness(measurement: Measurement): number {
  let score = 0;
  if (measurement.source_url) score += 2;
  if (measurement.scope) score += 1;
  if (measurement.stated_at) score += 1;
  return score;
}

/** En yeni duzeltme. Esitlikte dosya sirasi karar verir. */
function latestRevision(
  systems: readonly System[]
): {system: System; revision: Revision} | undefined {
  let best: {system: System; revision: Revision} | undefined;

  for (const system of systems) {
    for (const revision of system.revisions ?? []) {
      if (!best || revision.date > best.revision.date) {
        best = {system, revision};
      }
    }
  }

  return best;
}

/**
 * En eksiksiz tek olcum. Esitlikte guven seviyesi (primary), sonra
 * specKeys ve varyant sirasi karar verir — ayni icerik her build'de ayni
 * satiri secer.
 */
function fullestRecord(
  systems: readonly System[]
): Extract<HeroFocus, {tier: 'provenance'}> | undefined {
  let best: Extract<HeroFocus, {tier: 'provenance'}> | undefined;
  let bestScore = -1;

  for (const system of systems) {
    for (const key of specKeys) {
      for (const group of specGroups(system)) {
        const list = group.specs[key];
        if (!list) continue;

        const measurement = primary(list);
        const score = completeness(measurement);
        if (score <= bestScore) continue;

        bestScore = score;
        best = {tier: 'provenance', system, group, key, measurement};
      }
    }
  }

  return best;
}

export function heroFocus(systems: readonly System[]): HeroFocus | undefined {
  /*
   * Isaretci once. Birden fazla dosya isaretlenemez (derlemede sinaniyor),
   * yani buradaki ilk bulma tek bulmadir.
   */
  for (const system of systems) {
    const marked = markedDivergence(system);
    if (marked) return {tier: 'divergence', system, divergence: marked};
  }

  for (const system of systems) {
    const divergence = findDivergence(system);
    if (divergence) return {tier: 'divergence', system, divergence};
  }

  const revision = latestRevision(systems);
  if (revision) return {tier: 'revision', ...revision};

  return fullestRecord(systems);
}
