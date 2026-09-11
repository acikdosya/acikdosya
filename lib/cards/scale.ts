import type {ScaleCardItem} from '@/components/scale-silhouette/card-geometry';
import {primary} from '../format';
import {
  selectMeasurements,
  systemKind,
  type MeasurementSelection
} from '../geometry/measurements';
import {partsForSystem} from '../geometry/parts-for';
import type {Confidence, Measurement, SpecKey, System} from '../schema';

/**
 * Olcek karsilastirmasi karti — bir ile uc sistem, tek carpan.
 *
 * Her satirin BASKIN olcusu ayni eksene serilir; hangi olcunun baskin
 * oldugu sistem turune gore degisir (fuzede uzunluk, IHA'da kanat
 * acikligi). Cizim gorunus secimiyle cozuluyor, satir basina ayri bir
 * carpanla degil — bkz. components/scale-silhouette/card-geometry.ts.
 *
 * Rozet cizilen olcunun rozetidir. Fuzede uzunluk, ucakta kanat
 * acikligi: altta bir olcuyu yazip baskasini cizmek makineye ve
 * okuyucuya ayri sey soylemek olurdu (§5.8).
 */

export const MIN_SYSTEMS = 1;
export const MAX_SYSTEMS = 3;

export type ScaleRow = {
  system: System;
  selection: MeasurementSelection;
  item: ScaleCardItem;
  /** Cizimin genis eksenindeki olcu — rozet de bunun rozeti. */
  dominant: {key: SpecKey; measurement: Measurement};
  /** Dar eksendeki olcu. Satirin altinda ikinci olarak yazilir. */
  secondary: {key: SpecKey; measurement: Measurement};
};

export type ScaleCard = {
  rows: ScaleRow[];
  confidences: Confidence[];
  verifiedAt: string;
};

const CONFIDENCE_ORDER: Confidence[] = ['official', 'press', 'estimate'];

function rowFor(system: System): ScaleRow | undefined {
  const [selection] = selectMeasurements(system);
  if (!selection) return undefined;

  const {group, dimensions} = selection;
  const parts = partsForSystem(system.slug, dimensions);

  /*
   * Olculer secim sonucundan degil gruptan yeniden okunuyor: karta
   * yazilacak olan sayi degil KAYIT — rozet, kapsam ve dogrulama tarihi
   * de gerekiyor. Secim ayni kaydi kullandigi icin sayilar ortusur.
   */
  const read = (key: SpecKey) => {
    const list = group.specs[key];
    return list ? {key, measurement: primary(list)} : undefined;
  };

  if (dimensions.kind === 'missile') {
    const dominant = read('length_m');
    const secondary = read('diameter_mm');
    if (!dominant || !secondary) return undefined;

    return {
      system,
      selection,
      dominant,
      secondary,
      item: {
        id: system.slug,
        view: 'side',
        parts,
        spanM: dimensions.lengthM,
        depthM: dimensions.diameterMm / 1000
      }
    };
  }

  const dominant = read('wingspan_m');
  const secondary = read('length_m');
  if (!dominant || !secondary) return undefined;

  return {
    system,
    selection,
    dominant,
    secondary,
    item: {
      id: system.slug,
      /* Ust gorunus, dik serilmis: genis kenar kanat acikligi. */
      view: 'top',
      swap: true,
      parts,
      spanM: dimensions.wingspanM,
      depthM: dimensions.lengthM
    }
  };
}

export function scaleCard(systems: readonly System[]): ScaleCard | undefined {
  if (systems.length < MIN_SYSTEMS || systems.length > MAX_SYSTEMS) {
    return undefined;
  }

  const rows: ScaleRow[] = [];
  for (const system of systems) {
    const row = rowFor(system);
    /* Bir sistem cizilemiyorsa kart hic uretilmez: eksik bir
     * karsilastirma, karsilastirmanin kendisini yanlis yapar. */
    if (!row) return undefined;
    rows.push(row);
  }

  const seen = new Set(rows.map((row) => row.dominant.measurement.confidence));

  return {
    rows,
    confidences: CONFIDENCE_ORDER.filter((confidence) => seen.has(confidence)),
    verifiedAt: rows
      .map((row) => row.dominant.measurement.verified_at)
      .reduce((latest, date) => (date > latest ? date : latest))
  };
}

/** Kart hangi sistem turunu ciziyor — basligi ve etiketleri belirler. */
export function rowKind(row: ScaleRow) {
  return systemKind(row.system);
}
