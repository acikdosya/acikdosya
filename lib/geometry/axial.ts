import {wingStations} from './panel';
import type {Part} from './parts';
import {vec3} from './parts';
import {defineProduct, type Category, type ProductDefinition} from './product';
import {ratioValues, type RatioTable} from './ratio';

/**
 * Eksenel govdeli urun — fuze ailesi.
 *
 * Govde tek bir donel yuzey; uzerinde ISTENILEN SAYIDA yuzey grubu
 * bulunabilir. Onceki surumde iki sabit yuva vardi (kuyruk kanatcigi ve
 * bir govde ortasi grup) ve bir KONTROL YUZEYININ hangisine yazilacagi
 * belirsizdi. SIPER Urun-1'de uc grup birden var: arka kanat, kontrol
 * yuzeyi ve orta kanat (specs/system-geometry).
 *
 * Grup listesi bu soruyu ortadan kaldiriyor — bir grup nerede duruyorsa
 * odur. TAYFUN'un tek grubu var, ATMACA'nin iki, SIPER Urun-1'in uc.
 * Fark parca listesinde degil, urun tanimindadir.
 *
 * Burun profili teget ogive:
 *   rho  = (R² + Ln²) / 2R
 *   y(x) = sqrt(rho² − (Ln − x)²) + R − rho     0 ≤ x ≤ Ln
 * y(0) = 0 ve y(Ln) = R sinir kosullarini saglar; govdeye teget gecer.
 *
 * Olcek iki yayimlanmis sayidan gelir: uzunluk ve govde capi. Oranlarin
 * hicbiri yayimlanmis sayi DEGILDIR; her biri kendi koken beyanini tasir.
 */

/** Govdenin kendi oranlari — yuzey gruplarindan bagimsiz. */
export type AxialBodyRatioKey = 'noseRatio' | 'shoulderT' | 'boattail';

/**
 * Govde uzerinde bir CAP ISTASYONU.
 *
 * Tek capli govde her fuzeyi anlatmiyor: ayrilabilir itici tasiyan bir
 * fuzede arka bolum ana govdeden kalin ve aralarinda bir gecis konisi var
 * (specs/system-geometry). Istasyon o kademenin iki ucunu tarif eder.
 *
 * Ikisi de ORAN, yani ikisi de koken beyani tasir: `t` eksen uzerindeki
 * yeri toplam uzunluga gore, `radiusRatio` yaricapi govde anma
 * yaricapina gore verir.
 */
export interface AxialBodyStation {
  /** Oran anahtarlarinin oneki: 'booster' -> boosterT, boosterRadiusRatio. */
  id: string;
  ratios: RatioTable<'t' | 'radiusRatio'>;
}

/**
 * Bir yuzey grubunun oranlari. Anahtarlar ONEKSIZ yazilir; urun tablosuna
 * girerken grubun oneki eklenir ('fin' + 'count' -> 'finCount').
 *
 * Onek neden kodda uretiliyor da elle yazilmiyor: oran anahtari ayni
 * zamanda mesaj paketindeki etiketin adresi (RatioLabels). Iki yerde elle
 * yazilan bir onek, bir grubun etiketsiz kalmasina izin verirdi.
 */
export type SurfaceRatioKey =
  | 'count'
  | 'chordRatio'
  | 'taper'
  | 'spanRatio'
  | 'rakeDeg'
  | 'trailingT'
  | 'thicknessRatio';

/**
 * Bir yuzey grubunun tanimi.
 *
 * `id` parca kimliginin koku: 'fin' -> fin-1, fin-2... Etiketler bu
 * kimlige baglandigi icin (content/systems/*.json annotations) grup adi
 * urun taniminda yazili durur, koddan turetilmez.
 */
export interface AxialSurfaceGroup {
  id: string;
  /** Oran anahtarlarinin oneki. Yazilmazsa `id` kullanilir. */
  prefix?: string;
  ratios: RatioTable<SurfaceRatioKey>;
}

export type AxialProduct = ProductDefinition<'length_m' | 'diameter_mm', string>;

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

/** 'count' -> 'finCount'. Onek ve anahtar tek yerde birlesir. */
function prefixed(prefix: string, key: string): string {
  return `${prefix}${key[0].toUpperCase()}${key.slice(1)}`;
}

export function axialProduct(options: {
  slug: string;
  category: Category;
  /** Govde oranlari: burun, omuz, kuyruk daralmasi. */
  body: RatioTable<AxialBodyRatioKey>;
  /**
   * Burun ile kuyruk arasindaki cap istasyonlari, burundan kuyruga.
   *
   * Yazilmazsa govde tek caplidir ve `shoulderT` ile `boattail` eskisi
   * gibi calisir. Yazilirsa istasyonlar `shoulderT`'nin YERINE gecer;
   * ikisini birlikte uygulamak govdeyi anma capina geri sicratirdi.
   */
  stations?: readonly AxialBodyStation[];
  /**
   * Yuzey gruplari, arkadan one dogru yazilir. Bos olabilir: yalniz
   * govdeden ibaret bir urun de gecerlidir.
   */
  groups: readonly AxialSurfaceGroup[];
  /** Olcu cizgisi ofseti — en genis yuzeyin disinda kalmali. */
  dimensionOffsetRatio?: number;
}): AxialProduct {
  /*
   * Grup oranlari tanim zamaninda cozuluyor ve kapanista tutuluyor.
   * build() icinde duz tablodan okumak da mumkundu ama o zaman onek
   * mantigi iki yerde yasardi.
   */
  const groups = options.groups.map((group) => ({
    id: group.id,
    values: ratioValues(group.ratios)
  }));

  // Istasyonlar burundan kuyruga siralanir; tanim sirasi baglayici degil.
  const stations = (options.stations ?? [])
    .map((station) => ({id: station.id, values: ratioValues(station.ratios)}))
    .sort((a, b) => a.values.t - b.values.t);

  /*
   * Koken kaydi butun gruplari TEK listede gosterir; sayfa oranlari
   * duruma gore siralar, gruba gore degil. Onek anahtari benzersiz
   * kilar: iki grup ayni 'count' anahtarini tasimaz.
   */
  const flat: Record<string, RatioTable<string>[string]> = {...options.body};
  for (const station of options.stations ?? []) {
    for (const [key, ratio] of Object.entries(station.ratios)) {
      const name = prefixed(station.id, key);
      if (name in flat) {
        throw new Error(
          `${options.slug}: "${name}" oran anahtari iki kez tanimli — istasyon onekleri benzersiz olmali`
        );
      }
      flat[name] = ratio;
    }
  }
  for (const group of options.groups) {
    const prefix = group.prefix ?? group.id;
    for (const [key, ratio] of Object.entries(group.ratios)) {
      const name = prefixed(prefix, key);
      if (name in flat) {
        throw new Error(
          `${options.slug}: "${name}" oran anahtari iki kez tanimli — grup onekleri benzersiz olmali`
        );
      }
      flat[name] = ratio;
    }
  }

  return defineProduct({
    slug: options.slug,
    category: options.category,
    requires: ['length_m', 'diameter_mm'],
    dimensionOffsetRatio: options.dimensionOffsetRatio,
    ratios: flat as RatioTable<string>,
    build({dims, ratios}): Part[] {
      const L = dims.length_m;
      const R = dims.diameter_mm / 2000;

      const noseLength = L * ratios.noseRatio;
      const rho = (R * R + noseLength * noseLength) / (2 * R);

      const profile: {y: number; radius: number}[] = [];
      for (let i = 0; i <= NOSE_STEPS; i++) {
        const y = (i / NOSE_STEPS) * noseLength;
        const radius =
          Math.sqrt(Math.max(0, rho * rho - (noseLength - y) ** 2)) + R - rho;
        // Lathe'in dejenere ucgen uretmemesi icin en kucuk yaricap.
        profile.push({y, radius: Math.max(radius, 0.0005)});
      }
      /*
       * Bildirilmis cap istasyonlari. Kademeli govde bunlarla kurulur:
       * gecisin basi ve sonu iki ayri istasyondur ve aralarindaki koni
       * lathe tarafindan cizilir.
       */
      let lastRadiusRatio = 1;
      for (const station of stations) {
        profile.push({
          y: L * station.values.t,
          radius: R * station.values.radiusRatio
        });
        lastRadiusRatio = station.values.radiusRatio;
      }

      /*
       * Govde capinin korundugu son nokta. Yalnizca istasyon
       * BILDIRILMEMISSE anlamli: bildirilmisse govdenin nerede daraldigi
       * zaten orada yazili. shoulderT 1 ise daralma yok; o durumda
       * ikinci bir istasyon eklemek lathe'e sifir uzunlukta bir halka
       * koyardi.
       */
      if (stations.length === 0 && ratios.shoulderT < 1) {
        profile.push({y: L * ratios.shoulderT, radius: R});
      }
      profile.push({y: L, radius: R * lastRadiusRatio * ratios.boattail});

      const parts: Part[] = [
        {
          kind: 'body',
          id: 'body',
          orientation: 'along',
          origin: vec3(),
          spec: {aspect: 1, stations: profile, nominalRadius: R}
        }
      ];

      for (const group of groups) {
        surfaces(
          parts,
          {
            id: group.id,
            count: group.values.count,
            trailingT: group.values.trailingT,
            chordRatio: group.values.chordRatio,
            taper: group.values.taper,
            spanRatio: group.values.spanRatio,
            rakeDeg: group.values.rakeDeg,
            thicknessRatio: group.values.thicknessRatio
          },
          L,
          R
        );
      }

      return parts;
    }
  });
}
