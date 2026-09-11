import type {LocalizedText} from '../schema';

/**
 * Modelin bicimini belirleyen bir oran ve kokeni.
 *
 * Sayfadaki her sayi guven seviyesiyle sunuluyor (CLAUDE.md §3). Modelin
 * bicimini belirleyen oranlar ise bugune kadar duzyazi yorumda "OLCULEN" /
 * "SECILEN" diye ayriliyordu. Duzyazi yirmi urune kadar yasamaz; tip yasar
 * ve sinanabilir.
 *
 * KOKEN GUVEN SEVIYESI DEGILDIR. Ikisi farkli soruya cevap verir:
 *   confidence  bu SAYIYI kim soyledi (resmi merci / basin / bagimsiz)
 *   basis       bu ORANI kim cikardi (biz olctuk / biz sectik)
 * Birlestirmek §4'un yasakladigi dorduncu rozet varyantini arka kapidan
 * getirirdi. Bu yuzden ratio.ts confidence tasimaz.
 *
 * Bu modul three ve zod ICE AKTARMAZ. Urun tanimlari istemciye gidiyor;
 * zod oraya girmemeli (§6 bütçesi). Calisma zamani semasi ratio.schema.ts
 * icinde ve yalniz test ile icerik dogrulamasi tarafindan kullanilir.
 */

/**
 * Oran nereden geldi. Uc durum:
 *
 *   measured  yayimlanmis bir gorselden okundu VE izdusum sinavi gecildi
 *   reading   yayimlanmis bir gorselden okundu, sinav YAPILMADI
 *   chosen    gorselden cikarilamadi, okunabilir bir sema icin secildi
 *
 * Ortadaki durum bos bir ayrim degil. Bir render'dan piksel okumak ile o
 * okumanin gecerli oldugunu gostermek ayri isler; ikincisi yapilmadan
 * birincisi 'measured' diye sunulursa okuma kendinden daha yetkili
 * gorunur. Okumayi 'chosen' saymak ise ters yonde yanlis olurdu —
 * kaynak adresi ve tarihi silinir, deger okunabilirlik icin secilmis
 * gibi durur.
 */
export type RatioBasis = 'measured' | 'reading' | 'chosen';

/**
 * Okuma hangi eksende yapildi.
 *
 * Ayrim dekoratif degil: perspektif bir render'da yatay ve dikey okumalarin
 * gecerliligi ayni degil. AKINCI on gorunusunde yatay oranlar kanat
 * duzleminde kalibre edildigi icin gecerli, dikey oranlar degil — burun
 * inis takimi ana tekerleklerden daha asagi projeksiyona dusuyor.
 */
export type RatioAxis = 'along' | 'lateral' | 'vertical';

/** Yayimlanmis bir gorselden okunmus oran. */
export interface MeasuredRatio {
  basis: 'measured';
  value: number;
  /** Neden bu sekilde okundu; sayfadaki koken kaydinda gorunur. */
  note: LocalizedText;
  /** Okumanin yapildigi gorselin adresi. Gorselin kendisi depoya GIRMEZ. */
  source_url: string;
  /** Gorselin gorulme tarihi, ISO. Adres bayatlarsa kayit yine durur. */
  seen_at: string;
  axis: RatioAxis;
  /**
   * Izdusum sinavi: okuma yapilmadan once gorselin ortografik oldugu
   * bilinen bir olcuyle sinanir. Sinav gecilmezse deger 'measured'
   * SAYILMAZ — bkz. specs/model-provenance.
   */
  projection_check: LocalizedText;
}

/**
 * Okunmus ama sinanmamis oran.
 *
 * Kaynak ve tarih 'measured' ile ayni titizlikte tutulur; eksik olan tek
 * sey izdusum sinavi. Sinav yapilip gecilirse kayit 'measured'a doner,
 * gecilmezse 'chosen'a duser ve gerekcesi notta yazilir.
 */
export interface ReadingRatio {
  basis: 'reading';
  value: number;
  note: LocalizedText;
  source_url: string;
  seen_at: string;
  axis: RatioAxis;
}

/** Gorselden cikarilamayan, okunabilir bir sema icin secilmis oran. */
export interface ChosenRatio {
  basis: 'chosen';
  value: number;
  /** Neden secildi ve neden olculemedi. */
  note: LocalizedText;
}

export type Ratio = MeasuredRatio | ReadingRatio | ChosenRatio;

/**
 * Olculmus oran.
 *
 * Dort alan da zorunlu, cunku dordu de bir kere atlanirsa bir daha geri
 * gelmiyor: adres bayatlar, tarih hatirlanmaz, eksen karisir, sinav
 * yapilmadigi unutulur.
 */
export function measured(
  value: number,
  fields: Omit<MeasuredRatio, 'basis' | 'value'>
): MeasuredRatio {
  return {basis: 'measured', value, ...fields};
}

/**
 * Okunmus, sinanmamis oran.
 *
 * Izdusum sinavi alani YOK: alan bos birakilabilseydi, sinav yapilmadigi
 * ile sinav gecildigi ayni gorunurdu.
 */
export function reading(
  value: number,
  fields: Omit<ReadingRatio, 'basis' | 'value'>
): ReadingRatio {
  return {basis: 'reading', value, ...fields};
}

/** Secilmis oran. Gerekcesi yaninda durur, yoksa "duzeltilir" ve kayar. */
export function chosen(
  value: number,
  fields: Omit<ChosenRatio, 'basis' | 'value'>
): ChosenRatio {
  return {basis: 'chosen', value, ...fields};
}

/**
 * Oranin sayisal degeri.
 *
 * Geometri katmani yalniz bunu okur; koken kaydi sayfaya aittir. Duz sayi
 * da kabul edilir ki olcuden dogrudan turetilen degerler (ornek: inis
 * takimi uzanimi, yayimlanmis yukseklikten cikar) sahte bir koken beyani
 * tasimak zorunda kalmasin.
 */
export function ratioValue(ratio: Ratio | number): number {
  return typeof ratio === 'number' ? ratio : ratio.value;
}

/** Bir oran tablosunun yalniz sayilari — geometri kurucularina giden hal. */
export type RatioTable<K extends string> = Record<K, Ratio>;
export type ValueTable<K extends string> = Record<K, number>;

export function ratioValues<K extends string>(
  table: RatioTable<K>
): ValueTable<K> {
  const out = {} as ValueTable<K>;
  for (const key of Object.keys(table) as K[]) {
    out[key] = table[key].value;
  }
  return out;
}
