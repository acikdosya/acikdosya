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

export const variantSchema = z.strictObject({
  id: slugSchema,
  label: z.string().min(1),
  introduced: z.number().int().min(1900).max(2100).optional(),
  specs: specsSchema,
  attributes: attributesSchema,
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
 * Gorsel lisans kaydi — CLAUDE.md §5.6.
 * Lisansi bilinmeyen gorsel commit edilmez, bu yuzden hicbir alan optional degil.
 */
export const assetSchema = z.strictObject({
  file: z.string().min(1),
  license: z.string().min(1),
  source_url: z.url(),
  attribution: z.string().min(1)
});
export type Asset = z.infer<typeof assetSchema>;

export const assetsFileSchema = z.strictObject({
  assets: z.array(assetSchema)
});
export type AssetsFile = z.infer<typeof assetsFileSchema>;
