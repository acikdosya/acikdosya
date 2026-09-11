import {primary} from '../format';
import {specGroups, type SpecGroup} from '../measurement/groups';
import {type Category, type Measurement, type System} from '../schema';
import {resolveDimensions, type Dimensions} from './product';
import {productFor} from './registry';

/**
 * Sistem kategorisine gore olcu ailesi.
 *
 * Fuzeler: uzunluk + cap ekseninde govde profili.
 * Hava araclari: uzunluk + kanat acikligi + yukseklik ekseninde
 * dis hat semasi.
 *
 * Bu bir SUNUM ayrimidir: hangi olcu alanlari okunur, tabloda hangi
 * baslik yazilir, hangi acikla­ma metni gosterilir. Modelin cizilip
 * cizilmeyecegini BELIRLEMEZ; onu urun kaydi belirler.
 */
export type SystemKind = 'missile' | 'aircraft';

/**
 * Kategori → olcu ailesi. Acik tablo, VARSAYILAN YOK.
 *
 * Onceki surumde taninmayan kategori sessizce 'missile' donuyordu; bu,
 * §9'un yasakladigi "varsayilan geometri" kuralinin tip duzeyindeki
 * karsiligiydi. Bir tank eklense fuze sayilir, sonra diameter_mm
 * bulunamadigi icin sessizce elenirdi.
 *
 * Record<Category, ...> exhaustive: semaya yeni kategori eklenip buraya
 * satir yazilmazsa DERLEME DUSER.
 */
const CATEGORY_KIND: Record<Category, SystemKind> = {
  'balistik-fuze': 'missile',
  'seyir-fuzesi': 'missile',
  'insansiz-hava-araci': 'aircraft'
};

export function systemKind(system: System): SystemKind {
  return CATEGORY_KIND[system.category];
}

export type MissileDimensions = {
  kind: 'missile';
  lengthM: number;
  diameterMm: number;
};

export type AircraftDimensions = {
  kind: 'aircraft';
  lengthM: number;
  wingspanM: number;
  heightM?: number;
};

export type SelectedDimensions = MissileDimensions | AircraftDimensions;

/**
 * Bir grup icin secilmis, tutarli olcu seti.
 *
 * Web modeli, GLB, SVG siluet ve OG ayni secim sonucunu kullanir;
 * farkli alanlardaki "en guvenli" deger birlestirilerek uydurulmus
 * bir sistem uretilmez.
 */
export type MeasurementSelection = {
  group: SpecGroup;
  dimensions: SelectedDimensions;
  /** Secime katilan kayitlar — model altinda hangi kaydin kullanildigi aciklar. */
  sources: Measurement[];
  /** Bu grup icin 3B model uretilebilir mi. */
  canModel: boolean;
  /** Model uretilemiyorsa neden. */
  reason?: string;
};

/**
 * Bu grup icin model cizilebilir mi.
 *
 * Iki kosul: sistemin bir urun tanimi olmali VE o tanimin istedigi
 * olculer grupta bulunmali. Ikisinden biri eksikse model URETILMEZ;
 * varsayilan bir geometriye ya da varsayilan bir sayiya dusulmez
 * (CLAUDE.md §9, specs/system-geometry).
 */
function canModel(
  slug: string,
  available: Dimensions
): {canModel: boolean; reason?: string} {
  const product = productFor(slug);
  if (!product) {
    return {
      canModel: false,
      reason: 'Bu sistem icin dis profil tanimlanmamis.'
    };
  }
  if (!resolveDimensions(product.requires, available)) {
    return {
      canModel: false,
      reason: 'Modelin istedigi olcu alanlari bu grupta eksik.'
    };
  }
  return {canModel: true};
}

/**
 * Sistemdeki her olcu grubu icin bir secim sonucu uretir.
 *
 * Eksik gerekli alan varsa o grup atlanir; bu, "veri yok" demektir,
 * varsayilan degerle doldurulmus model degil.
 */
export function selectMeasurements(
  system: System
): MeasurementSelection[] {
  const kind = systemKind(system);
  const result: MeasurementSelection[] = [];

  for (const group of specGroups(system)) {
    const lengthList = group.specs.length_m;
    if (!lengthList) continue;
    const length = primary(lengthList);

    if (kind === 'missile') {
      const diameterList = group.specs.diameter_mm;
      if (!diameterList) continue;
      const diameter = primary(diameterList);

      const modelable = canModel(system.slug, {
        length_m: length.value,
        diameter_mm: diameter.value
      });

      result.push({
        group,
        dimensions: {
          kind: 'missile',
          lengthM: length.value,
          diameterMm: diameter.value
        },
        sources: [length, diameter],
        ...modelable
      });
      continue;
    }

    const wingspanList = group.specs.wingspan_m;
    if (!wingspanList) continue;
    const wingspan = primary(wingspanList);

    const heightList = group.specs.height_m;
    const height = heightList ? primary(heightList) : undefined;

    const modelable = canModel(system.slug, {
      length_m: length.value,
      wingspan_m: wingspan.value,
      height_m: height?.value
    });

    result.push({
      group,
      dimensions: {
        kind: 'aircraft',
        lengthM: length.value,
        wingspanM: wingspan.value,
        heightM: height?.value
      },
      sources: [length, wingspan, ...(height ? [height] : [])],
      ...modelable
    });
  }

  return result;
}

/**
 * Gosterim icin tek bir grup secilir. Birden fazla grup varsa en guvenilir
 * olani; esitlikte ilk grup (aile duzeyi oncelikli degil, specGroups sirasi).
 */
export function primarySelection(
  selections: readonly MeasurementSelection[]
): MeasurementSelection | undefined {
  if (selections.length === 0) return undefined;
  return selections[0];
}
