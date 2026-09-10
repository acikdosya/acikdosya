import type {Measurement, Operator} from '../schema';

/**
 * Iki olcum birbiriyle celisiyor mu — CLAUDE.md §3.
 *
 * Bu dosyanin varlik sebebi su hata: ayni alanda iki deger gorunce
 * "celiski" demek. `> 280 km` (resmi) ile `> 500 km` (basin) CELISMEZ;
 * ikisi de alt sinirdir, ikisi de ayni anda dogru olabilir. Operatoru
 * hesaba katmayan bir kiyas kaydin kendisini yanlis etiketler — ve bu,
 * projenin duzeltmeye calistigi hatanin ta kendisidir.
 *
 * Modul uygulama katmanindan bagimsiz: React, ceviri veya icerik yukleyici
 * import etmez. Girdisi olcum ve birim, ciktisi karar. Boylece testi
 * tarayicisiz kosar.
 */

/** Alan adinin icindeki birim — lib/format.ts SPEC_UNITS ile ayni kume. */
export type SpecUnit = 'm' | 'mm' | 'km' | 'kg';

type Dimension = 'uzunluk' | 'kutle';

/**
 * Taban birim: uzunluk metre, kutle kilogram.
 *
 * Birim alan adinin icinde tasindigi icin ayni alandaki degerler zaten
 * ayni birimdedir. Tablo yine de burada duruyor: kaynak metreyle, digeri
 * kilometreyle konustugunda kiyas yapilabilsin ve donusum tek yerde,
 * gorunur bir katsayi olarak yasasin.
 */
const UNITS: Record<SpecUnit, {dimension: Dimension; toBase: number}> = {
  mm: {dimension: 'uzunluk', toBase: 0.001},
  m: {dimension: 'uzunluk', toBase: 1},
  km: {dimension: 'uzunluk', toBase: 1000},
  kg: {dimension: 'kutle', toBase: 1}
};

/**
 * `~` isaretinin bandi. Sabit oran, %10.
 *
 * Gerekce: `~` bir olcum hatasi degil, kaynagin kesinlik taahhudunden
 * kacinmasidir. Ayni cismi `~10 m` ve `10,8 m` diye yazan iki kaynak bir
 * yuvarlama adimi arayla ayni seyi soyluyor (%8, bant icinde); `~10 m` ile
 * `12 m` soylemiyor (%20, bant disinda).
 *
 * Oran neden sabit: bant genisligi kaynagin kac basamak yazdigina gore
 * degisseydi rozet veriden degil dizgiden turemis olurdu — `~10` ile
 * `~10,0` ayni beyani farkli sonuca goturuurdu.
 *
 * Emin olunmayan yerde bant GENIS tutulur. Genis bant "farkli aciklama"
 * uretir, dar bant "celiski"; yanlislikla celiski ilan etmek daha agir
 * bir hatadir.
 *
 * Bir deger bundan baska bir bant gerektiriyorsa cozum operatoru zorlamak
 * degil, olcume ayri bir belirsizlik alani eklemektir. Bugun boyle bir
 * alan yok; ihtiyac dogunca eklenir.
 */
export const TOLERANCE_RATIO = 0.1;

/**
 * Ucu acik olabilen sayi araligi. Sonsuz uclar Infinity ile yazilir;
 * `closed` o ucun degerin kendisini icerip icermedigini soyler.
 */
export type Interval = {
  min: number;
  max: number;
  minClosed: boolean;
  maxClosed: boolean;
};

/**
 * Operatoru araliga cevirir. Operatorsuz deger tek noktadir — kaynak
 * sinir degil rakam vermistir, boyle kaydedilir.
 */
export function toInterval(
  value: number,
  operator: Operator | undefined
): Interval {
  switch (operator) {
    case '>':
      return {min: value, max: Infinity, minClosed: false, maxClosed: false};
    case '≥':
      return {min: value, max: Infinity, minClosed: true, maxClosed: false};
    case '<':
      return {min: -Infinity, max: value, minClosed: false, maxClosed: false};
    case '≤':
      return {min: -Infinity, max: value, minClosed: false, maxClosed: true};
    case '~': {
      const band = Math.abs(value) * TOLERANCE_RATIO;
      return {
        min: value - band,
        max: value + band,
        minClosed: true,
        maxClosed: true
      };
    }
    default:
      return {min: value, max: value, minClosed: true, maxClosed: true};
  }
}

/** Olcum ve birimi birlikte — birim alan adindan gelir, degerin parcasidir. */
export type Sized = {
  measurement: Measurement;
  unit: SpecUnit;
};

function unitOf(unit: SpecUnit) {
  const entry = UNITS[unit];
  if (!entry) throw new Error(`bilinmeyen birim: ${unit}`);
  return entry;
}

/** Olcumu taban birime tasinmis aralik olarak verir. */
function intervalOf({measurement, unit}: Sized): Interval {
  const {toBase} = unitOf(unit);
  const raw = toInterval(measurement.value, measurement.operator);

  return {
    min: raw.min === -Infinity ? -Infinity : raw.min * toBase,
    max: raw.max === Infinity ? Infinity : raw.max * toBase,
    minClosed: raw.minClosed,
    maxClosed: raw.maxClosed
  };
}

/**
 * Iki aralik ortak bir nokta tasiyor mu. Acik uclar sinirda kesismez:
 * `< 300` ile `> 300` ayni sayiyi disarida birakir.
 */
function overlaps(a: Interval, b: Interval): boolean {
  if (a.max < b.min || b.max < a.min) return false;
  if (a.max === b.min) return a.maxClosed && b.minClosed;
  if (b.max === a.min) return b.maxClosed && a.minClosed;
  return true;
}

function sameInterval(a: Interval, b: Interval): boolean {
  return (
    a.min === b.min &&
    a.max === b.max &&
    a.minClosed === b.minClosed &&
    a.maxClosed === b.maxClosed
  );
}

/**
 * KIYASLANABILIRLIK EKSENLERI.
 *
 * Iki alan: deger nasil elde edildi (scope) ve hangi varyanti tarif ediyor
 * (variant_id). Ikisi de ayni degilse sayilar ayni cetvele konamaz.
 *
 * stated_at BU LISTEDE YOK ve karara girmez. Bir beyanin 2022'de, otekinin
 * 2025'te yapilmis olmasi tek basina onlari kiyaslanamaz yapmaz: ayni
 * kapsamdaki iki beyan farkli tarihlerde de celisebilir ve o celiski
 * gorunmelidir. Tarih yine de her degerin altinda yazar.
 *
 * Ileride gerekebilecek ama BUGUN TASARLANMAYAN sey: ayni kapsamdaki daha
 * yeni bir beyanin eskisini gecersiz kilmasi (supersession). O geldiginde
 * stated_at karara girer; simdi girmiyor.
 */
export const COMPARISON_AXES = ['scope', 'variant_id'] as const;
export type ComparisonAxis = (typeof COMPARISON_AXES)[number];

export type DivergenceKind =
  | 'celiski'
  | 'farkli-aciklama'
  | 'farkli-kapsam'
  | 'belirsiz';

export type AxisDifference = {
  axis: ComparisonAxis;
  /** Ham degerler; etiketlemeyi arayuz yapar, bu modul cevirmez. */
  a: string;
  b: string;
};

export type PairDivergence = {
  kind: DivergenceKind;
  /** Kiyas ekseninde ayrisan alanlar. Yalnizca 'farkli-kapsam'ta dolu. */
  differences: readonly AxisDifference[];
  /** Bir tarafta bos olan eksenler — "kiyaslandi" degil "bilinmiyor". */
  unknownAxes: readonly ComparisonAxis[];
};

function axisValue(
  measurement: Measurement,
  axis: ComparisonAxis
): string | undefined {
  switch (axis) {
    case 'scope':
      return measurement.scope;
    case 'variant_id':
      return measurement.variant_id;
  }
}

/**
 * Cagiran sozlesmesi: ayni boyutta iki birim. Metre ile kilogramı
 * kiyaslamak sessizce bir sonuc uretmez, hata atar.
 *
 * Bu bir DOGRULAMA, kiyasin parcasi degil — bu yuzden kapsam kontrolunden
 * once calisir ve kiyaslanamayan ciftlerde de calisir.
 */
function assertSameDimension(a: Sized, b: Sized): void {
  const left = unitOf(a.unit);
  const right = unitOf(b.unit);

  if (left.dimension !== right.dimension) {
    throw new Error(
      `farkli boyut kiyaslanamaz: ${a.unit} (${left.dimension}) ve ${b.unit} (${right.dimension})`
    );
  }
}

/**
 * Iki olcum kiyaslanabilir mi. Kiyaslanabiliyorsa undefined doner ve karar
 * aralik hesabina kalir; kiyaslanamiyorsa sonucu burada verir.
 *
 * Iki cikis var ve ikisi de aralik hesabina HIC girmez:
 *
 *  farkli-kapsam  Bir eksen iki tarafta da dolu ve farkli. Bildigimiz bir
 *                 fark: biri nesneyi olcmus, digeri sayiyi aciklamis.
 *  belirsiz       Bir eksen tek tarafta dolu. Fark degil bilgisizlik;
 *                 kiyaslamaya kalkmak celiski uydurmak olurdu.
 *
 * Bildigimiz fark, bilmedigimize gore once gelir: iki eksenden biri
 * ayrisirken oteki tek tarafliysa sonuc 'farkli-kapsam' olur. Ikisi de
 * aralik hesabini engelledigi icin bu secim celiski riski yaratmaz,
 * yalnizca okuyucuya daha fazlasini soyler.
 */
export function comparability(a: Sized, b: Sized): PairDivergence | undefined {
  assertSameDimension(a, b);

  const differences: AxisDifference[] = [];
  const unknownAxes: ComparisonAxis[] = [];

  for (const axis of COMPARISON_AXES) {
    const one = axisValue(a.measurement, axis);
    const other = axisValue(b.measurement, axis);

    if (one === undefined || other === undefined) {
      if (one !== undefined || other !== undefined) unknownAxes.push(axis);
      continue;
    }
    if (one !== other) differences.push({axis, a: one, b: other});
  }

  if (differences.length > 0) {
    return {kind: 'farkli-kapsam', differences, unknownAxes};
  }
  if (unknownAxes.length > 0) {
    return {kind: 'belirsiz', differences: [], unknownAxes};
  }

  return undefined;
}

/**
 * Aralik hesabi. Yalnizca kiyaslanabilir ciftler icin cagrilir —
 * kapsami ayrisan ya da eksik olan bir cift buraya hic gelmez.
 */
export function compareIntervals(a: Sized, b: Sized): PairDivergence {
  assertSameDimension(a, b);

  return {
    kind: overlaps(intervalOf(a), intervalOf(b)) ? 'farkli-aciklama' : 'celiski',
    differences: [],
    unknownAxes: []
  };
}

/**
 * Iki olcumu kiyaslar.
 *
 * Sira onemli: once kiyaslanabilirlik sorulur. Kapsam ayrisiyorsa ya da
 * eksikse aralik hesabina hic girilmez — test atisinda kat edilen mesafe
 * ile beyan edilen azami menzil arasinda "kesisim" aramak farkli iki seyi
 * ayni cetvele koymak olurdu.
 */
export function comparePair(a: Sized, b: Sized): PairDivergence {
  return comparability(a, b) ?? compareIntervals(a, b);
}

/**
 * Cift sonuclarinin siralamasi. Kucuk sayi once gelir.
 *
 * Bilinen bir bulgu, bilinmeyene gore ustundur: celiski en agir, belirsiz
 * en hafif. Alan duzeyinde en yuksek dereceli etiket gosterilir; ciftlerin
 * kendi durumlari degerlerin altinda gorunmeye devam eder.
 */
export const PAIR_ORDER: Record<DivergenceKind, number> = {
  celiski: 0,
  'farkli-aciklama': 1,
  'farkli-kapsam': 2,
  belirsiz: 3
};

export type FieldDivergence = {
  kind: DivergenceKind;
  /** Kiyas ekseninde ayrisan alanlar, tekrarsiz. */
  differences: readonly AxisDifference[];
  unknownAxes: readonly ComparisonAxis[];
};

function sameDifference(a: AxisDifference, b: AxisDifference): boolean {
  return a.axis === b.axis && a.a === b.a && a.b === b.b;
}

/**
 * Bir alandaki tum degerleri birlikte degerlendirir.
 *
 * Her cift kendi sonucunu uretir; alanin etiketi en yuksek dereceli cift
 * sonucudur (PAIR_ORDER). Yani tek bir belirsiz cift, baska bir ciftte
 * kurulmus gercek bir celiskiyi susturmaz.
 *
 * Ayni araligi veren iki deger iraksama SAYILMAZ: iki kaynagin `> 280`
 * demesi uyusmadir, kaydin zenginligidir. Bu eleme yalnizca kiyaslanabilir
 * ciftler icin gecerli — kapsami ayrisan iki esit sayi hala "kiyaslanmadi"
 * demektir, "uyusuyor" demek degil.
 *
 * Iraksama yoksa undefined doner ve arayuz hicbir sey cizmez — bos bir
 * etiket, olmayan bir tartisma varmis izlenimi verir.
 */
export function fieldDivergence(
  list: readonly Measurement[] | undefined,
  unit: SpecUnit
): FieldDivergence | undefined {
  if (!list || list.length < 2) return undefined;

  const sized = list.map((measurement) => ({measurement, unit}));
  const differences: AxisDifference[] = [];
  const unknownAxes = new Set<ComparisonAxis>();
  let kind: DivergenceKind | undefined;

  for (let i = 0; i < sized.length; i += 1) {
    for (let j = i + 1; j < sized.length; j += 1) {
      const pair = comparePair(sized[i], sized[j]);

      for (const axis of pair.unknownAxes) unknownAxes.add(axis);
      for (const difference of pair.differences) {
        if (!differences.some((item) => sameDifference(item, difference))) {
          differences.push(difference);
        }
      }

      /*
       * Kiyaslanabilir olup ayni araligi veren cift bir bulgu degil.
       * Kapsami ayrisan cift buraya dusmez: onun sonucu zaten
       * 'farkli-kapsam' ya da 'belirsiz'.
       */
      if (
        pair.kind === 'farkli-aciklama' &&
        sameInterval(intervalOf(sized[i]), intervalOf(sized[j]))
      ) {
        continue;
      }

      if (!kind || PAIR_ORDER[pair.kind] < PAIR_ORDER[kind]) kind = pair.kind;
    }
  }

  if (!kind) return undefined;

  return {kind, differences, unknownAxes: [...unknownAxes]};
}
