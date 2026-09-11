import type {PanelStation} from './parts';

/**
 * Yuzey istasyonlarinin uretimi — kanat, kanatcik, stabilize.
 *
 * Uc olcum bu dosyanin bicimini belirledi (AKINCI on gorunusu,
 * 11.09.2026):
 *
 *  1. KALINLIK VECHEYLE ORANTILI. Kokte 0,32 m, ucta 0,15 m; yerel
 *     vecheye orani acikligin tamaminda 0,152 ± 0,004. Sabit kalinlikli
 *     bir plaka bu iki ucu birden tutturamaz.
 *  2. KANAT UCU KIVRIMI DUZGUN BIR EGRI. Yukselis, kivrimin basladigi
 *     yerden uca dogru us alarak buyuyor; olculen profile en iyi uyan
 *     us 2,5–2,9 arasinda. Onceki surumde uc, ayri bir panel 30°
 *     cevrilerek yapiliyordu: sert bir kose ve birlesme yerinde dikey
 *     bir basamak.
 *  3. UC KAPALI. Son yarim metrede kalinlik hizla sifira gidiyor.
 *
 * Firar kenari egimi ok acisindan TUREMEZ, tersi: olculebilen sey firar
 * kenarinin nerede durdugu, ok acisi ondan cikar.
 */

/**
 * Kok baglantisi — kanat govdeye DUZ girmez.
 *
 * Olculen: kanadin orta cizgisi govde yaninda seyir yuksekliginin 0,50 m
 * altinda basliyor ve 2,6 m acikliga kadar tirmanip duzlesiyor. Model
 * kanadi kokten uca dumduz cizdigi surece govde birlesimi gercekteki
 * gibi gorunmuyor.
 */
export interface RootBlend {
  /** Kokte referans duzlemin ne kadar altinda, aciklik orani. */
  dropRatio: number;
  /** Duzlesmenin tamamlandigi aciklik orani. */
  reachRatio: number;
  /** Egrinin usu; olculen profile uydurulmus. */
  exponent: number;
}

export interface TipBlend {
  /** Kivrimin kapladigi yatay pay, aciklik orani. */
  reachRatio: number;
  /** Toplam dik yukselis, aciklik orani. */
  riseRatio: number;
  /**
   * Egrinin usu. Olculen yukselis profiline uydurulmus; 1 duz bir kose,
   * buyudukce kivrim uca dogru toplanir.
   */
  exponent: number;
}

export interface WingStationSpec {
  /** Kok duzleminden uca YATAY mesafe, metre. */
  span: number;
  rootChord: number;
  tipChord: number;
  /**
   * Kenar egimi. Urun, GERCEKTEN OLCULEN kenari bildirir:
   *
   *   rake   firar kenarinin egimi — ROKETSAN cizimi bunu gosteriyor
   *   sweep  hucum kenarinin ok acisi — AKINCI yan gorunusu bunu veriyor
   *
   * Ikisi ayni yamugun iki farkli parametrelemesi. Olculmeyen kenari
   * bildirmek, olcumu bir donusumden gecirip kaynagindan koparirdi.
   */
  rakeDeg?: number;
  sweepDeg?: number;
  /** Kalinligin yerel vecheye orani. */
  thicknessRatio: number;
  /** Kanat ucu kivrimi. Yoksa yuzey duz biter. */
  tip?: TipBlend;
  /** Govde baglantisi. Yoksa yuzey kokten duz cikar. */
  root?: RootBlend;
  /** Aciklik boyunca ornekleme adimi. Bicim degil cozunurluk. */
  steps?: number;
}

/**
 * Ucun kapandigi pay, aciklik orani.
 *
 * Olculen: kalinlik son 0,71 m'de (yarim acikligin %7'si) sifira
 * gidiyor. Kapanma olmadan loft bir cizgide degil, acik bir dikdortgen
 * kesitte biterdi.
 */
const CLOSE_RATIO = 0.07;

export function wingStations(spec: WingStationSpec): PanelStation[] {
  const steps = spec.steps ?? 12;
  const rake =
    spec.rakeDeg === undefined
      ? undefined
      : Math.tan((spec.rakeDeg * Math.PI) / 180);
  const sweep =
    spec.sweepDeg === undefined
      ? undefined
      : Math.tan((spec.sweepDeg * Math.PI) / 180);
  const tipReach = spec.tip ? spec.span * spec.tip.reachRatio : 0;
  const tipRise = spec.tip ? spec.span * spec.tip.riseRatio : 0;
  const blendFrom = spec.span - tipReach;
  const closeFrom = spec.span * (1 - CLOSE_RATIO);
  const rootReach = spec.root ? spec.span * spec.root.reachRatio : 0;
  const rootDrop = spec.root ? spec.span * spec.root.dropRatio : 0;

  function station(x: number, closeFactor = 1): PanelStation {
    const t = spec.span === 0 ? 0 : x / spec.span;
    const chord = spec.rootChord + (spec.tipChord - spec.rootChord) * t;
    /*
     * Firar kenari bildirilmisse hucum kenari ondan turer; hucum kenari
     * bildirilmisse ofset dogrudan odur.
     */
    const leading =
      rake !== undefined
        ? spec.rootChord + x * rake - chord
        : x * (sweep ?? 0);
    let rise = 0;
    if (spec.tip && x > blendFrom) {
      rise +=
        tipRise *
        Math.pow((x - blendFrom) / Math.max(tipReach, 1e-9), spec.tip.exponent);
    }
    if (spec.root && x < rootReach) {
      // Kokte asagida baslar, rootReach'te referans duzleme oturur.
      rise -=
        rootDrop *
        Math.pow((rootReach - x) / Math.max(rootReach, 1e-9), spec.root.exponent);
    }

    return {
      span: x,
      rise,
      offset: leading + chord * (1 - closeFactor) * 0.5,
      chord: chord * closeFactor,
      thickness: chord * spec.thicknessRatio * closeFactor
    };
  }

  /*
   * Ucun kapanmasi: veche ve kalinlik birlikte sifira gider. Parabolik
   * bir kapanma olculen profile eliptik olandan daha iyi uyuyor —
   * kalinlik 9,45 / 9,63 / 9,80 m'de 0,134 / 0,100 / 0,056 m okundu.
   */
  function closeFactor(x: number): number {
    if (x <= closeFrom) return 1;
    const k = (x - closeFrom) / Math.max(spec.span - closeFrom, 1e-9);
    return Math.max(0, 1 - k * k);
  }

  const stations: PanelStation[] = [];
  /*
   * Ornekleme egrinin oldugu yere yogunlasir. Duz bolumde istasyon
   * sayisi onemsiz — kalinlik ve veche dogrusal degisiyor. Kivrim ve
   * kapanma bolgesinde ise az ornek acili bir kirilma birakir, ki
   * duzeltmeye calistigimiz sey tam olarak buydu.
   */
  const straightTo = Math.min(blendFrom, closeFrom);

  // Kok baglantisi egrili: orada da sik ornekle.
  const rootTo = Math.min(rootReach, straightTo);
  if (rootTo > 0) {
    const rootSteps = steps;
    for (let i = 0; i <= rootSteps; i++) {
      stations.push(station((i / rootSteps) * rootTo));
    }
  }

  const straightSteps = Math.max(2, Math.round(steps / 3));
  for (let i = rootTo > 0 ? 1 : 0; i <= straightSteps; i++) {
    stations.push(
      station(rootTo + (i / straightSteps) * (straightTo - rootTo))
    );
  }

  const outerSteps = spec.tip ? steps * 2 : steps;
  for (let i = 1; i <= outerSteps; i++) {
    const x = straightTo + (i / outerSteps) * (spec.span - straightTo);
    stations.push(station(x, closeFactor(x)));
  }

  return stations;
}
