import {allMeasurements, type SpecGroup} from '../measurement/groups';
import type {
  Confidence,
  LocalizedText,
  Measurement,
  SpecKey,
  System
} from '../schema';
import {sourceKey} from './params';

/**
 * Kaynak zinciri karti — bir belge, ona dayanan degerler.
 *
 * TASARIMIN TERSI YONDE. Claude Design sablonu "bir iddia, N yayin, hepsinin
 * dayandigi tek kaynak" diyordu; semamizda bir kaydi baska bir yayina
 * baglayan alan yok ve bugunku veride ayni alanin degerleri zaten ayri
 * kaynaklardan geliyor, yani o yakinsama hic olusmuyor. Uydurulamaz (§5.7).
 *
 * Ayni omurgayi ters yonde kuran gercek bir olgu var: TEK BELGE dosyanin
 * bircok alanini tek basina tasiyor. ROKETSAN ATMACA katalogu bes degeri,
 * BAYKAR urun sayfasi dokuz degeri tasiyor. Kart bunu gosterir: soldaki
 * satirlar degerler, sagdaki kutu hepsinin dayandigi belge. Okuyucunun
 * gordugu sey aynidir — bir kaynak duserse ne kadarinin dustugu.
 */

/** Tasarimin sayi araligi: alti kalan bir satir zincir olusturmaz. */
export const MIN_ROWS = 3;
export const MAX_ROWS = 8;
/** Aralik asildiginda gosterilecek ornek satir sayisi. */
export const SAMPLE_ROWS = 3;

export type ChainRow = {
  key: SpecKey;
  group: SpecGroup;
  measurement: Measurement;
};

export type SourceChain = {
  system: System;
  /** Sorgu dizesindeki kimlik — lib/cards/params.ts sourceKey. */
  id: string;
  source: LocalizedText;
  sourceUrl?: string;
  documentVersion?: LocalizedText;
  accessedAt?: string;
  digest?: string;
  archiveUrl?: string;
  /** Belgeye dayanan toplam kayit. */
  total: number;
  /** Cizilecek satirlar. total > MAX_ROWS ise ornek. */
  rows: ChainRow[];
  /** Satirlar toplamin tamami mi. */
  sampled: boolean;
  /** Cizilen satirlarda gecen guven seviyeleri. */
  confidences: Confidence[];
  /** En yeni dogrulama tarihi — kartin tarihi. */
  verifiedAt: string;
};

/**
 * Belge alanlarinin en eksiksiz hali.
 *
 * Ayni belgeye dayanan iki kayittan biri surum adini, oteki ozeti tasiyor
 * olabilir; kutuda ikisi de yazilmali. Alanlar tek tek toplanir, bir
 * kaydin tamami secilmez.
 */
function documentFields(rows: readonly ChainRow[]) {
  let documentVersion: LocalizedText | undefined;
  let accessedAt: string | undefined;
  let digest: string | undefined;
  let archiveUrl: string | undefined;

  for (const {measurement} of rows) {
    documentVersion ??= measurement.document_version;
    accessedAt ??= measurement.accessed_at;
    digest ??= measurement.source_sha256;
    archiveUrl ??= measurement.archive_url;
  }

  return {documentVersion, accessedAt, digest, archiveUrl};
}

const CONFIDENCE_ORDER: Confidence[] = ['official', 'press', 'estimate'];

function confidencesOf(rows: readonly ChainRow[]): Confidence[] {
  const seen = new Set(rows.map((row) => row.measurement.confidence));
  return CONFIDENCE_ORDER.filter((confidence) => seen.has(confidence));
}

/**
 * Sistemdeki butun zincirler, kayit sayisina gore azalan.
 *
 * Siralama kararli: esit sayida kayit tasiyan iki belge arasinda ilk
 * gorulen once gelir, yani ayni icerik her derlemede ayni sirayi verir.
 */
export function sourceChains(system: System): SourceChain[] {
  const buckets = new Map<string, ChainRow[]>();

  for (const {group, key, measurement} of allMeasurements(system)) {
    const id = sourceKey(measurement);
    const bucket = buckets.get(id);
    if (bucket) bucket.push({group, key, measurement});
    else buckets.set(id, [{group, key, measurement}]);
  }

  const chains: SourceChain[] = [];

  for (const [id, all] of buckets) {
    if (all.length < MIN_ROWS) continue;

    /*
     * Aralik asildiginda tasarimin kurali: "8 kayit ve dahasi" yazmak
     * yerine ornek satirlar ve sayac. Sayac zaten omurgada duruyor, yani
     * okuyucu kac kaydin cizilmedigini gorur.
     */
    const sampled = all.length > MAX_ROWS;
    const rows = sampled ? all.slice(0, SAMPLE_ROWS) : all;
    const first = all[0].measurement;

    chains.push({
      system,
      id,
      source: first.source,
      sourceUrl: first.source_url,
      ...documentFields(all),
      total: all.length,
      rows,
      sampled,
      confidences: confidencesOf(rows),
      verifiedAt: all
        .map(({measurement}) => measurement.verified_at)
        .reduce((latest, date) => (date > latest ? date : latest))
    });
  }

  return chains.sort((a, b) => b.total - a.total);
}

/** Sorgu dizesindeki kimlige karsilik gelen zincir. */
export function sourceChain(
  system: System,
  id: string | null
): SourceChain | undefined {
  const chains = sourceChains(system);
  if (!id) return undefined;
  return chains.find((chain) => chain.id === id);
}
