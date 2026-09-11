import {wingStations} from './panel';
import type {Part} from './parts';
import {vec3} from './parts';
import {defineProduct, type Category, type ProductDefinition} from './product';
import {ratioValues, type RatioTable} from './ratio';

/**
 * Eksenel govdeli urun — fuze ailesi.
 *
 * Govde tek bir donel yuzey; uzerinde EN COK IKI yuzey grubu bulunur:
 *
 *   kanatciklar  kuyrukta, esit acilarla dagilmis trapez yuzeyler
 *   kanatlar     govde ortasinda, ayni dizilim (istege bagli)
 *
 * Ikinci grup istege bagli, cunku her fuzede yok: TAYFUN'un yalniz
 * kuyruk kanatciklari var, ATMACA'nin ayrica govde ortasinda dort
 * kanadi var (ROKETSAN katalog cizimi). Fark parca listesinde degil,
 * urun tanimindadir.
 *
 * Burun profili teget ogive:
 *   rho  = (R² + Ln²) / 2R
 *   y(x) = sqrt(rho² − (Ln − x)²) + R − rho     0 ≤ x ≤ Ln
 * y(0) = 0 ve y(Ln) = R sinir kosullarini saglar; govdeye teget gecer.
 *
 * Olcek iki yayimlanmis sayidan gelir: uzunluk ve govde capi. Oranlarin
 * hicbiri yayimlanmis sayi DEGILDIR; her biri kendi koken beyanini tasir.
 */

export type AxialRatioKey =
  | 'noseRatio'
  | 'shoulderT'
  | 'boattail'
  | 'finCount'
  | 'finChordRatio'
  | 'finTaper'
  | 'finSpanRatio'
  | 'finRakeDeg'
  | 'finTrailingT'
  | 'finThicknessRatio';

/** Govde ortasi kanat grubu. Tasimayan urunde bu anahtarlar hic yok. */
export type AxialWingRatioKey =
  | 'wingCount'
  | 'wingChordRatio'
  | 'wingTaper'
  | 'wingSpanRatio'
  | 'wingRakeDeg'
  | 'wingTrailingT'
  | 'wingThicknessRatio';

export type AxialProduct = ProductDefinition<
  'length_m' | 'diameter_mm',
  AxialRatioKey | AxialWingRatioKey
>;

/** Ogive burun ornekleme adimi. Bicim degil cozunurluk; oran tablosunda yok. */
const NOSE_STEPS = 28;

interface SurfaceGroup {
  id: string;
  count: number;
  /** Firar kenarinin govde boyunca orani, burundan. */
  trailingT: number;
  chordRatio: number;
  taper: number;
  /** Uc yaricapinin govde yaricapina orani. */
  spanRatio: number;
  /**
   * FIRAR kenarinin egimi, derece. 0 ise firar kenari govde eksenine dik.
   *
   * Hucum kenari ok acisi degil, cunku olculebilen sey firar kenari:
   * ROKETSAN cizimindeki kanatcikta firar kenari acikligin tamaminda
   * ayni eksende duruyor (rake 0), kanatta ise one dogru kaciyor
   * (negatif rake). Ok acisi bu uc orandan TUREYEN sonuctur.
   */
  rakeDeg: number;
  /** Kalinligin YEREL vecheye orani — sabit kalinlik degil. */
  thicknessRatio: number;
}

function surfaces(
  parts: Part[],
  group: SurfaceGroup,
  L: number,
  R: number
) {
  const rootChord = L * group.chordRatio;
  const stations = wingStations({
    span: R * group.spanRatio,
    rootChord,
    tipChord: rootChord * group.taper,
    rakeDeg: group.rakeDeg,
    thicknessRatio: group.thicknessRatio
  });

  for (let i = 0; i < group.count; i++) {
    parts.push({
      kind: 'panel',
      id: `${group.id}-${i + 1}`,
      // Kok govde ekseninde baslar; ic kismi govdenin icinde kalir.
      root: vec3(0, L * group.trailingT - rootChord, 0),
      angleDeg: (i * 360) / group.count,
      stations,
      rootFillet: 0
    });
  }
}

export function axialProduct(options: {
  slug: string;
  category: Category;
  ratios: RatioTable<AxialRatioKey>;
  /** Govde ortasi kanat grubu. Yoksa urun yalniz kuyruk kanatcigi tasir. */
  wings?: RatioTable<AxialWingRatioKey>;
  /** Olcu cizgisi ofseti — en genis yuzeyin disinda kalmali. */
  dimensionOffsetRatio?: number;
}): AxialProduct {
  const wingRatios = options.wings ? ratioValues(options.wings) : undefined;

  return defineProduct({
    slug: options.slug,
    category: options.category,
    requires: ['length_m', 'diameter_mm'],
    dimensionOffsetRatio: options.dimensionOffsetRatio,
    // Koken kaydi iki grubu birlikte gosterir; sayfa tek liste cizer.
    ratios: {
      ...options.ratios,
      ...(options.wings ?? {})
    } as RatioTable<AxialRatioKey | AxialWingRatioKey>,
    build({dims, ratios}): Part[] {
      const L = dims.length_m;
      const R = dims.diameter_mm / 2000;

      const noseLength = L * ratios.noseRatio;
      const rho = (R * R + noseLength * noseLength) / (2 * R);

      const stations = [];
      for (let i = 0; i <= NOSE_STEPS; i++) {
        const y = (i / NOSE_STEPS) * noseLength;
        const radius =
          Math.sqrt(Math.max(0, rho * rho - (noseLength - y) ** 2)) + R - rho;
        // Lathe'in dejenere ucgen uretmemesi icin en kucuk yaricap.
        stations.push({y, radius: Math.max(radius, 0.0005)});
      }
      /*
       * Govde capinin korundugu son nokta. shoulderT 1 ise daralma yok;
       * o durumda ikinci bir istasyon eklemek lathe'e sifir uzunlukta bir
       * halka koyardi.
       */
      if (ratios.shoulderT < 1) {
        stations.push({y: L * ratios.shoulderT, radius: R});
      }
      stations.push({y: L, radius: R * ratios.boattail});

      const parts: Part[] = [
        {
          kind: 'body',
          id: 'body',
          orientation: 'along',
          origin: vec3(),
          spec: {aspect: 1, stations, nominalRadius: R}
        }
      ];

      surfaces(
        parts,
        {
          id: 'fin',
          count: ratios.finCount,
          trailingT: ratios.finTrailingT,
          chordRatio: ratios.finChordRatio,
          taper: ratios.finTaper,
          spanRatio: ratios.finSpanRatio,
          rakeDeg: ratios.finRakeDeg,
          thicknessRatio: ratios.finThicknessRatio
        },
        L,
        R
      );

      if (wingRatios) {
        surfaces(
          parts,
          {
            id: 'wing',
            count: wingRatios.wingCount,
            trailingT: wingRatios.wingTrailingT,
            chordRatio: wingRatios.wingChordRatio,
            taper: wingRatios.wingTaper,
            spanRatio: wingRatios.wingSpanRatio,
            rakeDeg: wingRatios.wingRakeDeg,
            thicknessRatio: wingRatios.wingThicknessRatio
          },
          L,
          R
        );
      }

      return parts;
    }
  });
}
