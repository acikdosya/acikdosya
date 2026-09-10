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

/** Tam ISO tarihi: YYYY-MM-DD, gecerli ve gelecekte degil. */
const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD bekleniyor')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'gecersiz tarih')
  .refine(
    (value) => Date.parse(value) <= Date.now(),
    'gelecek tarih — verified_at dogrulamanin yapildigi gundur'
  );

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

export const measurementSchema = z.strictObject({
  value: z.number().finite(),
  operator: operatorSchema.optional(),
  confidence: confidenceSchema,
  /** Insan okuyabilir kaynak adi. Ikincil hedef kitle yabanci okuyucu, bu yuzden cift dilli. */
  source: localizedTextSchema,
  source_url: z.url().optional(),
  /** "Bu sayi 6 ay sonra nereden geldi" sorusunun cevabi. */
  verified_at: isoDateSchema
});
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
  'cep_m'
] as const;
export type SpecKey = (typeof specKeys)[number];

export const specsSchema = z.strictObject({
  length_m: measurementListSchema.optional(),
  diameter_mm: measurementListSchema.optional(),
  mass_kg: measurementListSchema.optional(),
  range_km: measurementListSchema.optional(),
  cep_m: measurementListSchema.optional()
});
export type Specs = z.infer<typeof specsSchema>;

/** Sayisal olmayan, metinsel ozellik. Yine de guven seviyesi zorunlu. */
export const attributeSchema = z.strictObject({
  value: localizedTextSchema,
  confidence: confidenceSchema,
  source: localizedTextSchema.optional(),
  source_url: z.url().optional(),
  verified_at: isoDateSchema.optional()
});
export type Attribute = z.infer<typeof attributeSchema>;

export const attributeKeys = ['guidance', 'propellant', 'stages'] as const;
export type AttributeKey = (typeof attributeKeys)[number];

export const attributesSchema = z.strictObject({
  guidance: attributeSchema.optional(),
  propellant: attributeSchema.optional(),
  stages: attributeSchema.optional()
});

/**
 * 3D modelin dis bolum etiketi — CLAUDE.md §9.
 * Konum mutlak koordinat degil orandir: olcu verisi guncellenince
 * etiket kendiliginden dogru yerde kalir. Kesit ve ic bilesen yok,
 * bu yuzden yalnizca dis bolumler etiketlenir.
 */
export const annotationSchema = z.strictObject({
  id: slugSchema,
  /** Govde boyunca oran, 0 = burun ucu, 1 = kuyruk. */
  t: z.number().min(0).max(1),
  /** Radyal aci, derece. */
  angle: z.number().finite(),
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
export const revisionSchema = z.strictObject({
  /** Duzeltmenin yapildigi gun. */
  date: isoDateSchema,
  /**
   * Degisen alan. Bilinen bir olcum ya da ozellik anahtari olabilir
   * (range_km, guidance) ya da serbest metin — sayfa basligi, ozet gibi
   * sema disinda kalan yerler de duzeltilir.
   */
  field: z.string().min(1),
  /** Eski ve yeni deger, okunabilir bicimde. Bos birakilamaz: */
  from: z.string().min(1),
  to: z.string().min(1),
  /** Neden degisti. Tek cumle yeter, ama zorunlu. */
  reason: localizedTextSchema,
  /** Duzeltmenin dayandigi kaynak. Kaynaksiz duzeltme de olur (hesap hatasi). */
  source: localizedTextSchema.optional(),
  source_url: z.url().optional()
});
export type Revision = z.infer<typeof revisionSchema>;

/** Yeni kategori eklerken bilincli karar olsun diye enum. */
export const categorySchema = z.enum(['balistik-fuze']);

export const statusSchema = z.enum([
  'gelistirme',
  'test',
  'seri-uretim',
  'envanterde'
]);

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
    (system) =>
      system.variants.some((variant) => variant.specs.range_km !== undefined),
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
