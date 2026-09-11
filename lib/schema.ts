import {z} from 'zod';

/**
 * Veri sozlesmesi — CLAUDE.md §3.
 *
 * Iki kural sema seviyesinde zorlanir:
 *  1. confidence alani olmayan sayi yok.
 *  2. Her sayisal alan dizidir; celisen degerler ayni dizide yasar,
 *     UI hangisini gosterecegini kendisi secmez.
 */

export const confidenceSchema = z.enum(['official', 'press', 'estimate']);
export type Confidence = z.infer<typeof confidenceSchema>;

/** CLAUDE.md §3'teki isaretler — ASCII karsiliklari kabul edilmez. */
export const operatorSchema = z.enum(['>', '<', '≤', '≥', '~']);
export type Operator = z.infer<typeof operatorSchema>;

const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'kucuk harf, rakam ve tire');

/**
 * Bugun, UTC. Sunucu ve gelistirici makinesi ayni gunu gormeli — yerel
 * saat dilimi kullanan bir kontrol, tarih sinirinda derlemeyi kirardi.
 */
const today = () => new Date().toISOString().slice(0, 10);

/** Tam ISO tarihi: YYYY-MM-DD, gecerli ve gelecekte degil. */
const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD bekleniyor')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'gecersiz tarih')
  .refine(
    (value) => Date.parse(value) <= Date.now(),
    'gelecek tarih — verified_at dogrulamanin yapildigi gundur'
  );

/**
 * SHA-256 ozeti: 64 kucuk harf onaltilik basamak. Buyuk harfli ya da kisa
 * bir dize sessizce kabul edilirse dogrulama hic calismaz.
 */
const sha256Schema = z
  .string()
  .regex(/^[0-9a-f]{64}$/, '64 basamakli kucuk harf onaltilik SHA-256 bekleniyor');

/** Takvim olaylari icin: gun bilinmiyorsa YYYY-MM, ay da bilinmiyorsa YYYY. */
const partialIsoDateSchema = z
  .string()
  .regex(/^\d{4}(?:-\d{2}(?:-\d{2})?)?$/, 'YYYY, YYYY-MM veya YYYY-MM-DD');

/** AR eklenince buraya optional alan gelir; RTL'i baştan kirma. */
export const localizedTextSchema = z.strictObject({
  tr: z.string().min(1),
  en: z.string().min(1)
});
export type LocalizedText = z.infer<typeof localizedTextSchema>;

/** Doldurulmayi bekleyen alanlarin acik kaydi — uydurma deger yerine bu. */
const todoSchema = z.array(z.string().min(3)).min(1);

/**
 * Deger nasil elde edildi — CLAUDE.md §3.
 *
 * confidence ile scope DIK EKSENLERDIR ve birbirinin yerine gecmez:
 *   confidence  KIM soyledi (resmi merci / basin / bagimsiz degerlendirme)
 *   scope       NASIL elde edildi (beyan / test / olcum / tahmin)
 * Bir deger ayni anda confidence 'press' (haber aktardi) ve scope 'olcum'
 * (fuar fotografindan olculdu) olabilir. scope 'tahmin' ile confidence
 * 'estimate' de ayni sey degildir: basinin baskasinin tahminini aktarmasi
 * scope 'tahmin' + confidence 'press' olur.
 *
 * Mekan bildiren bir deger ('sergi' gibi) yok: gecit toreni fotografindan
 * fotogrametriyle cikarilan olcu ile fuarda serilen govdeden alinan olcu
 * epistemik olarak ayni kategoridir.
 */
export const scopeSchema = z.enum(['beyan', 'test', 'olcum', 'tahmin']);
export type Scope = z.infer<typeof scopeSchema>;

export const measurementSchema = z.strictObject({
  value: z.number().finite(),
  operator: operatorSchema.optional(),
  /**
   * Aralikli degerler icin ust sinir. ROKETSAN web sayfasindaki
   * "4,3-5,2 m" gibi tek kaynakta iki deger varsa burada tutulur.
   */
  upper_value: z.number().finite().optional(),
  upper_operator: operatorSchema.optional(),
  /**
   * Kaynagin kendi belirsizligi, ± ve alan birimiyle. "±3 km" diyen bir
   * kaynak icin 3.
   *
   * VARSAYILAN DEGIL, GECERSIZ KILICI. Ondalik yazilmis her deger zaten
   * ortuk bir bant tasir: yazilan son basamagin yarisi (12,3 → ±0,05,
   * lib/measurement/divergence.ts). Bu alan o kurali ve `~` isaretinin
   * %10'luk bandini birlikte ezer — kaynak belirsizligi kendisi
   * yaziyorsa tahmin etmeye gerek yok.
   *
   * Bugun hicbir kayitta dolu degil. Alan simdiden duruyor ki gerektiginde
   * operatoru zorlamak yerine dogru yere yazilsin.
   */
  uncertainty: z.number().finite().nonnegative().optional(),
  confidence: confidenceSchema,
  /**
   * Deger neyi olcuyor. Iki sayi kiyaslanmadan once bu sorulur: test
   * atisinda kat edilen mesafe ile beyan edilen azami menzil ayni alan
   * adini tasisa bile ayni seyi olcmez, dolayisiyla celisemezler.
   */
  scope: scopeSchema.optional(),
  /**
   * Deger hangi varyanta ait. Olcum zaten bir varyantin icinde durur;
   * bu alan kaydin BASKA bir varyanti tarif ettigi durumu isaretler
   * (kaynak "TAYFUN" dedi ama sayi BLOK-4'e ait gibi).
   */
  variant_id: slugSchema.optional(),
  /**
   * Aciklamanin yapildigi tarih. verified_at ile karistirilmamali:
   * o bizim kontrol tarihimiz, bu kaynagin konusma tarihi. 2022'de
   * yapilmis bir aciklama ile 2025'te yapilmis olani ayni anda dogru
   * olabilir; kiyaslanmalari icin once bu ayrim gorunur olmali.
   */
  stated_at: partialIsoDateSchema.optional(),
  /** Insan okuyabilir kaynak adi. Ikincil hedef kitle yabanci okuyucu, bu yuzden cift dilli. */
  source: localizedTextSchema,
  source_url: z.url().optional(),
  /**
   * Belgenin hangi surumunden okundugu — "2024 katalogu" gibi.
   *
   * Bir urun karti sessizce guncellenir ve ayni adreste baska sayilar
   * cikar. Surum adi olmadan "bu sayi bu adreste yaziyordu" iddiasi bir
   * yil sonra dogrulanamaz hale gelir.
   *
   * Dosya yukleme damgasi (adresteki sayi, dosya tarihi) BU DEGILDIR ve
   * beyan tarihi olarak da kullanilmaz: bir belgenin sunucuya ne zaman
   * konuldugu, icindeki sayinin ne zaman aciklandigini soylemez.
   */
  document_version: localizedTextSchema.optional(),
  /**
   * Belgeye ne zaman eristigimiz. verified_at ile ayni gun olabilir ama
   * ayni sey degil: biri kaydi kontrol ettigimiz gun, oteki belgeyi
   * indirdigimiz gun. Bag curudugunde "o tarihte su adreste duruyordu"
   * demenin dayanagi budur.
   */
  accessed_at: isoDateSchema.optional(),
  /**
   * Okudugumuz belgenin SHA-256 ozeti.
   *
   * Bag curudugunde ya da belge sessizce degistiginde "okudugumuz belge
   * buydu" demenin dayanagi. Belgeyi yeniden yayimlamadan dogrulanabilir
   * bir kayit birakir: ayni dosyayi bulan herkes ozeti kendisi hesaplar.
   *
   * Belgenin kopyasini kendi alan adimizdan SERVIS ETMIYORUZ. Uretici
   * kartlari yayimlamadigimiz alanlar tasiyor (§5.2 hedef tipi, §5.3 harp
   * basligi) ve uretici markasini tasiyor (§10). Kaynak gostermek ile
   * kaynagi yeniden yayimlamak ayni sey degil; ozet ve ucuncu taraf arsiv
   * bu ayrimi koruyarak dogrulanabilirligi saglar.
   */
  source_sha256: sha256Schema.optional(),
  /**
   * Ucuncu taraf arsiv kopyasi. Bizim degil: aynasi bizde durmadigi icin
   * §5 ve §10 sinirlarina girmez, ama adres oldugunde okuyucu belgeye
   * yine ulasir.
   */
  archive_url: z.url().optional(),
  /**
   * Varyant, yuk veya uçuş koşulu belirsizliğini açıklayan kısa not.
   * Tek kayıt olsa da okuyucunun aynı kapsamda olup olmadığını anlamasına
   * yarar; `scope` ve `variant_id`nin yerine geçmez.
   */
  context_note: localizedTextSchema.optional(),
  /** "Bu sayi 6 ay sonra nereden geldi" sorusunun cevabi. */
  verified_at: isoDateSchema
})
  /*
   * Belge surumu ve erisim tarihi bir ADRESE dair iddialardir. Adres
   * olmadan ikisi de dogrulanamaz, yani kaydin degerini artirmaz;
   * dogrulanabilir gorunen bir kayit uretirler, ki bu daha kotusudur.
   */
  .refine(
    (measurement) =>
      (!measurement.document_version &&
        !measurement.accessed_at &&
        !measurement.source_sha256 &&
        !measurement.archive_url) ||
      measurement.source_url !== undefined,
    {
      error:
        'document_version ve accessed_at source_url olmadan yazilmaz — neye dair oldugu belirsiz kalir',
      path: ['source_url']
    }
  )
  .refine((measurement) => !measurement.stated_at || measurement.stated_at <= today(), {
    error: 'gelecek tarih — stated_at aciklamanin yapildigi gundur',
    path: ['stated_at']
  })
  /*
   * Aciklama bizim kontrolumuzden sonra yapilmis olamaz. Kismi tarih
   * (YYYY / YYYY-MM) ISO'da bastan siralanir, bu yuzden dize kiyasi
   * dogru cevabi verir: "2026" <= "2026-09-10".
   */
  .refine(
    (measurement) =>
      !measurement.stated_at || measurement.stated_at <= measurement.verified_at,
    {
      error: 'stated_at verified_at\'ten sonra olamaz — kaynak biz baktiktan sonra konusmus gorunuyor',
      path: ['stated_at']
    }
  )
  .refine(
    (measurement) =>
      measurement.upper_value === undefined || measurement.upper_value >= measurement.value,
    {
      error: 'upper_value value\'dan kucuk olamaz',
      path: ['upper_value']
    }
  )
  .refine(
    (measurement) =>
      measurement.upper_operator === undefined || measurement.upper_value !== undefined,
    {
      error: 'upper_operator upper_value olmadan yazilmaz',
      path: ['upper_operator']
    }
  )
  /*
   * Belirsizlik acik uclu bir sinirla yazilamaz. "> 280 ± 5" ne demek
   * belli degil: acik ucun zaten siniri yok, bant hangi uca uygulanacak?
   * Sessizce yok saymak yerine reddediyoruz — yazilmis ama ise yaramayan
   * bir alan, olmayan alandan daha kotudur.
   */
  .refine(
    (measurement) =>
      measurement.uncertainty === undefined ||
      measurement.operator === undefined ||
      measurement.operator === '~',
    {
      error:
        'uncertainty acik uclu operatorle (> < ≤ ≥) birlikte yazilamaz — bandin hangi uca uygulanacagi tanimsiz',
      path: ['uncertainty']
    }
  )
  /*
   * Aralik zaten iki uc veriyor; ustune bant yazmak ikinci bir
   * belirsizlik tanimi olurdu ve hangisinin gecerli oldugu belirsiz kalirdi.
   */
  .refine(
    (measurement) =>
      measurement.uncertainty === undefined || measurement.upper_value === undefined,
    {
      error: 'uncertainty aralikli kayitla (upper_value) birlikte yazilmaz',
      path: ['uncertainty']
    }
  );
export type Measurement = z.infer<typeof measurementSchema>;

/** Bir alanda birden fazla deger olabilir; bos dizi olamaz. */
const measurementListSchema = z.array(measurementSchema).min(1);

/**
 * Bilinen olcum alanlari. Birim anahtarin icinde tasinir, ayri alan yok —
 * boylece m/mm karisikligi sema seviyesinde imkansiz.
 * Yeni alan eklerken lib/format.ts icindeki etiket tablosuna da ekle.
 */
export const specKeys = [
  'length_m',
  'diameter_mm',
  'mass_kg',
  'range_km',
  'cep_m',
  'warhead_weight_kg',
  'wingspan_m',
  'height_m',
  'mtow_kg',
  'payload_kg',
  'endurance_h',
  'service_ceiling_ft',
  'operating_altitude_ft',
  'cruise_speed_ktas',
  'max_speed_ktas',
  'operational_range_km'
] as const;
export type SpecKey = (typeof specKeys)[number];

export const specsSchema = z.strictObject({
  length_m: measurementListSchema.optional(),
  diameter_mm: measurementListSchema.optional(),
  mass_kg: measurementListSchema.optional(),
  range_km: measurementListSchema.optional(),
  cep_m: measurementListSchema.optional(),
  warhead_weight_kg: measurementListSchema.optional(),
  wingspan_m: measurementListSchema.optional(),
  height_m: measurementListSchema.optional(),
  mtow_kg: measurementListSchema.optional(),
  payload_kg: measurementListSchema.optional(),
  endurance_h: measurementListSchema.optional(),
  service_ceiling_ft: measurementListSchema.optional(),
  operating_altitude_ft: measurementListSchema.optional(),
  cruise_speed_ktas: measurementListSchema.optional(),
  max_speed_ktas: measurementListSchema.optional(),
  operational_range_km: measurementListSchema.optional()
});
export type Specs = z.infer<typeof specsSchema>;

/** Sayisal olmayan, metinsel ozellik. Yine de guven seviyesi zorunlu. */
export const attributeSchema = z
  .strictObject({
    value: localizedTextSchema,
    confidence: confidenceSchema,
    source: localizedTextSchema.optional(),
    source_url: z.url().optional(),
    /** Olcumdeki ile ayni anlam — atif bicimi alan turune gore degismez. */
    document_version: localizedTextSchema.optional(),
    accessed_at: isoDateSchema.optional(),
    source_sha256: sha256Schema.optional(),
    archive_url: z.url().optional(),
    verified_at: isoDateSchema.optional()
  })
  .refine(
    (attribute) =>
      (!attribute.document_version &&
        !attribute.accessed_at &&
        !attribute.source_sha256 &&
        !attribute.archive_url) ||
      attribute.source_url !== undefined,
    {
      error:
        'belge alanlari (document_version, accessed_at, source_sha256, archive_url) source_url olmadan yazilmaz — neye dair olduklari belirsiz kalir',
      path: ['source_url']
    }
  );
export type Attribute = z.infer<typeof attributeSchema>;

export const attributeKeys = [
  'guidance',
  'propellant',
  'stages',
  'power_system',
  'communications',
  'variant_names'
] as const;
export type AttributeKey = (typeof attributeKeys)[number];

export const attributesSchema = z.strictObject({
  guidance: attributeSchema.optional(),
  propellant: attributeSchema.optional(),
  stages: attributeSchema.optional(),
  power_system: attributeSchema.optional(),
  communications: attributeSchema.optional(),
  variant_names: attributeSchema.optional()
});

/**
 * 3D modelin dis bolum etiketi — CLAUDE.md §9.
 * Konum mutlak koordinat degil orandir: olcu verisi guncellenince
 * etiket kendiliginden dogru yerde kalir. Kesit ve ic bilesen yok,
 * bu yuzden yalnizca dis bolumler etiketlenir.
 */
export const annotationSchema = z.strictObject({
  id: slugSchema,
  /**
   * Etiketin bagli oldugu PARCA — lib/geometry/parts.ts kimligi.
   *
   * Onceki surumde konum govde ekseninde kutupsaldi ({t, angle}) ve
   * kanat ucu gibi eksen disi bir parcayi gosteremiyordu; AKINCI bu
   * yuzden bos bir etiket dizisi tasiyordu. Parca kimligi verilmesi
   * zorunlu: varsayilan olarak govdeye dusmek, etiketi sessizce yanlis
   * yere koymak olurdu.
   */
  part: slugSchema,
  /** Parca uzerinde oran, 0 = bas, 1 = son. */
  t: z.number().min(0).max(1),
  /**
   * Radyal aci, derece. Yalnizca donel govdede anlamli; kanat ya da
   * cubuk gibi parcalarda yok sayilir, o yuzden istege bagli.
   */
  angle: z.number().finite().optional(),
  label: localizedTextSchema,
  /** Etiketin kendi guven seviyesi — gorsel dil tabloyla ayni. */
  confidence: confidenceSchema
});
export type Annotation = z.infer<typeof annotationSchema>;

export const variantSchema = z.strictObject({
  id: slugSchema,
  label: z.string().min(1),
  introduced: z.number().int().min(1900).max(2100).optional(),
  specs: specsSchema,
  attributes: attributesSchema,
  /** Model etiketleri. Olcu verisi olmayan varyantta model uretilmez, dizi de bos kalir. */
  annotations: z
    .array(annotationSchema)
    .refine(
      (list) => new Set(list.map((item) => item.id)).size === list.length,
      {error: 'etiket idleri varyant icinde benzersiz olmali'}
    )
    .optional(),
  _todo: todoSchema.optional()
});
export type Variant = z.infer<typeof variantSchema>;

export const timelineEventSchema = z.strictObject({
  date: partialIsoDateSchema,
  title: localizedTextSchema,
  body: localizedTextSchema.optional(),
  confidence: confidenceSchema,
  source: localizedTextSchema.optional(),
  source_url: z.url().optional()
});
export type TimelineEvent = z.infer<typeof timelineEventSchema>;

/**
 * Duzeltme kaydi — yayimlanmis bir degeri neden ve neye dayanarak
 * degistirdigimizin defteri.
 *
 * Neden ayri bir alan: bu proje "sayi verilir, kaynagi gosterilir" diye
 * kuruldu. Sessizce duzeltilen bir sayi o iddiayi bozar; okuyucu dun
 * gordugu degerin nereye gittigini soramaz hale gelir.
 *
 * Takvim (timeline) ile karistirilmamali: orada sistemin kendi tarihi
 * anlatilir, burada BIZIM dosyamizin tarihi.
 */
/**
 * Duzeltme kaydindaki eski/yeni deger.
 *
 * Onceki surumde ikisi de SERBEST METINDI ve yalnizca Turkce yaziliyordu:
 * Ingilizce sayfada "12,2 m" diye, Turkce ondalik ayraciyla duruyordu.
 * Daha kotusu, bir sayi ile bir cumle sema duzeyinde ayirt edilemiyordu —
 * "12,2 m" ile "GNSS / INS" ayni tipteydi, yani hicbir kontrol degerin
 * dosyadaki olcumle tutup tutmadigini soramiyordu.
 *
 * Uc kol var ve ucu de gercek bir durumu karsiliyor:
 *
 *  measurement  Tek bir sayi ve birimi. Dile gore lib/format.ts cizer,
 *               yani kart ve sayfa ayni bicimi kullanir.
 *  removed      Kayit kaldirildi. "kayit yok" diye bir METIN yazmak, o
 *               dizeyi her dile ayri ayri cevirmek demekti; durum bir
 *               deger degil, degerin yoklugu.
 *  text         Sayiya sigmayan her sey: iki degerli bir kayit, varyant
 *               ya da guven niteleyicisi tasiyan bir satir, ozellik
 *               metni. Sayiya ZORLANMAZ — "> 280 km (resmî)" ifadesinin
 *               parantezi hangi kaydin ayakta kaldigini soyluyor ve
 *               sayiya cevrildiginde o bilgi kaybolurdu.
 */
export const revisionValueSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('measurement'),
    value: z.number().finite(),
    operator: operatorSchema.optional(),
    /**
     * Birim, alan adinin icindeki birimle AYNI olmali (lib/format.ts
     * SPEC_UNITS). Sema bunu dogrulayamaz cunku alan adi serbest metin
     * de olabilir; kontrol scripts/validate-content.ts icinde.
     */
    unit: z.string().min(1)
  }),
  z.strictObject({kind: z.literal('removed')}),
  z.strictObject({
    kind: z.literal('text'),
    tr: z.string().min(1),
    en: z.string().min(1)
  })
]);
export type RevisionValue = z.infer<typeof revisionValueSchema>;

export const revisionSchema = z.strictObject({
  /** Duzeltmenin yapildigi gun. */
  date: isoDateSchema,
  /**
   * Degisen alan. Bilinen bir olcum ya da ozellik anahtari olabilir
   * (range_km, guidance) ya da serbest metin — sayfa basligi, ozet gibi
   * sema disinda kalan yerler de duzeltilir.
   */
  field: z.string().min(1),
  /** Eski ve yeni deger. Ikisi de ayni ayrimli birlik. */
  from: revisionValueSchema,
  to: revisionValueSchema,
  /** Neden degisti. Tek cumle yeter, ama zorunlu. */
  reason: localizedTextSchema,
  /** Duzeltmenin dayandigi kaynak. Kaynaksiz duzeltme de olur (hesap hatasi). */
  source: localizedTextSchema.optional(),
  source_url: z.url().optional()
});
export type Revision = z.infer<typeof revisionSchema>;

/** Yeni kategori eklerken bilincli karar olsun diye enum. */
export const categorySchema = z.enum([
  'balistik-fuze',
  'seyir-fuzesi',
  'insansiz-hava-araci'
]);
/**
 * Kategori listesi geometri tarafinda da exhaustive kullanilir; buraya
 * bir deger eklenip lib/geometry tarafinda karsiligi yazilmazsa derleme
 * duser (lib/geometry/measurements.ts, lib/geometry/coverage.ts).
 */
export type Category = z.infer<typeof categorySchema>;

export const statusSchema = z.enum([
  'gelistirme',
  'test',
  'seri-uretim',
  'envanterde'
]);

/**
 * Ana sayfa panelinin konusu — ACIK ISARETCI.
 *
 * Onceki surumde paneli kod seciyordu: butun dosyalar taranir, en agir
 * iraksama kazanirdi. Yani sitenin en gorunur bolumu bir siralama
 * kuralinin ciktisiydi ve bir kaynak eklemek konuyu sessizce
 * degistirebiliyordu. Artik hangi dosyanin hangi alani anlatildigi
 * icerikte yaziyor; editoryal bir karar, editoryal bir yerde duruyor.
 *
 * Isaretci en fazla bir dosyada bulunur ve isaret ettigi alan gercekten
 * iraksiyor olmali — ikisini de scripts/validate-content.ts sinar.
 * Isaretci yoksa lib/hero.ts'teki sirali geri cekilme devreye girer.
 */
export const heroMarkerSchema = z.strictObject({
  field: z.enum(specKeys),
  /** Olcu grubu. Yazilmazsa alanin degerini tasiyan ilk grup secilir. */
  variant: slugSchema.optional()
});
export type HeroMarker = z.infer<typeof heroMarkerSchema>;

export const systemSchema = z
  .strictObject({
    $schema_version: z.literal('0.1'),
    id: slugSchema,
    slug: slugSchema,
    name: localizedTextSchema,
    category: categorySchema,
    manufacturer: z.strictObject({
      id: slugSchema,
      name: z.string().min(1)
    }),
    status: statusSchema,
    /** Hero altindaki kisa tanim. */
    summary: localizedTextSchema.optional(),
    /** Ana sayfa paneli bu dosyayi anlatiyorsa hangi alani anlattigi. */
    hero: heroMarkerSchema.optional(),
    /** Aile duzeyindeki beyanlar — varyantlara otomatik kopyalanmaz. */
    specs: specsSchema.optional(),
    variants: z.array(variantSchema).min(1),
    timeline: z.array(timelineEventSchema),
    /**
     * Duzeltme gecmisi. Alan yoksa da olur; bos dizi de gecerlidir ve
     * ikisi de ayni anlama gelir: henuz duzeltme yapilmadi. Sayfa o
     * durumda bolumu hic cizmez — bos bir "Duzeltme gecmisi" basligi,
     * kaydin tutulmadigi izlenimi verir.
     */
    revisions: z.array(revisionSchema).optional(),
    disclaimer: localizedTextSchema,
    _todo: todoSchema.optional()
  })
  .refine(
    (system) => {
      if (system.category === 'insansiz-hava-araci') return true;
      return system.variants.some(
        (variant) => variant.specs.range_km !== undefined
      );
    },
    {
      error: 'en az bir varyantta range_km olmali — menzil zarfi buna dayaniyor',
      path: ['variants']
    }
  )
  .refine(
    (system) => {
      const ids = system.variants.map((variant) => variant.id);
      return new Set(ids).size === ids.length;
    },
    {error: 'varyant idleri benzersiz olmali', path: ['variants']}
  )
  /*
   * variant_id yazim hatasi sessizce "farkli kapsam" uretirdi: iki deger
   * kiyaslanabilir olduklari halde kiyaslanmaz, celiski gorunmez olurdu.
   * Bu yuzden isaret edilen varyant gercekten var olmali.
   */
  .refine(
    (system) => {
      const ids = new Set(system.variants.map((variant) => variant.id));
      return system.variants.every((variant) =>
        specKeys.every((key) =>
          (variant.specs[key] ?? []).every(
            (measurement) =>
              measurement.variant_id === undefined ||
              ids.has(measurement.variant_id)
          )
        )
      );
    },
    {
      error: 'olcumdeki variant_id sistemde tanimli bir varyanti gostermeli',
      path: ['variants']
    }
  );
export type System = z.infer<typeof systemSchema>;

/**
 * Varlik lisans kaydi — CLAUDE.md §5.6 ve §10.
 * Lisansi bilinmeyen varlik commit edilmez, bu yuzden hicbir alan optional degil.
 * Bilinmeyen deger null ile yazilir; alanin kendisi silinmez, cunku "sorulmadi"
 * ile "bakildi ve yok" ayri seylerdir.
 */
export const assetKindSchema = z.enum([
  'logo',
  'font',
  'image',
  '3d',
  'map-data',
  'reference'
]);

export const assetOriginSchema = z.enum([
  'own',
  'public-domain',
  'cc',
  'press-kit'
]);

/**
 * Dosya repoda duruyor mu:
 *  committed — diskte, git'te. Kaydi varsa dosyasi da olmali.
 *  generated — build uretiyor (bake-glb), git'te yok. Varlik kontrolu yapilmaz;
 *              file bir dizin yolu olabilir, altindaki her sey kayda dahildir.
 *  absent    — repoya girmedi ya da henuz uretilmedi. Gerekcesi notes'ta yazar.
 */
export const assetPresenceSchema = z.enum(['committed', 'generated', 'absent']);

export const assetSchema = z
  .strictObject({
    id: slugSchema,
    file: z.string().min(1).nullable(),
    kind: assetKindSchema,
    origin: assetOriginSchema,
    presence: assetPresenceSchema,
    license: z.string().min(1),
    author: z.string().min(1).nullable(),
    source_url: z.url().nullable(),
    attribution_required: z.boolean(),
    attribution_text: z.string().min(1).nullable(),
    commercial_use: z.boolean(),
    modifications_allowed: z.boolean(),
    acquired_at: isoDateSchema,
    used_in: z.array(z.string().min(1)),
    notes: z.string().min(1).nullable()
  })
  .refine((asset) => !asset.attribution_required || asset.attribution_text, {
    error: 'attribution_required true ise attribution_text yazilmali',
    path: ['attribution_text']
  })
  .refine((asset) => asset.origin === 'own' || asset.source_url !== null, {
    error: 'kendi urettigimiz disindaki her varlik nereden geldigini gostermeli',
    path: ['source_url']
  })
  .refine((asset) => asset.presence !== 'absent' || asset.notes, {
    error: 'repoda olmayan varlik neden olmadigini notes icinde soylemeli',
    path: ['notes']
  })
  .refine((asset) => asset.presence === 'absent' || asset.file !== null, {
    error: 'diskte ya da build ciktisinda duran varligin dosya yolu olmali',
    path: ['file']
  });
export type Asset = z.infer<typeof assetSchema>;

/** Bakildi ve alinmadi. Neden alinmadigi kayitta kalir — §5.6. */
export const rejectedAssetSchema = z.strictObject({
  id: slugSchema,
  source_url: z.string().min(1),
  reason: z.string().min(1),
  date: isoDateSchema
});
export type RejectedAsset = z.infer<typeof rejectedAssetSchema>;

export const assetsFileSchema = z
  .strictObject({
    $schema_version: z.string().min(1),
    _rule: z.string().min(1),
    assets: z.array(assetSchema),
    rejected: z.array(rejectedAssetSchema)
  })
  .refine(
    (file) => {
      const ids = file.assets.map((asset) => asset.id);
      return new Set(ids).size === ids.length;
    },
    {error: 'varlik idleri benzersiz olmali', path: ['assets']}
  );
export type AssetsFile = z.infer<typeof assetsFileSchema>;
