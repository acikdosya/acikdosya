import {z} from 'zod';
import {localizedTextSchema} from '../schema';

/**
 * Oran kokeninin calisma zamani semasi — lib/geometry/ratio.ts tipinin
 * sinanabilir hali.
 *
 * Ayri dosyada, cunku urun tanimlari istemciye gidiyor ve zod oraya
 * girmemeli (CLAUDE.md §6). Bu semayi yalniz testler ve icerik
 * dogrulamasi ice aktarir.
 */

/** Gecerli, gelecekte olmayan ISO tarihi. lib/schema.ts ile ayni kural. */
const seenAtSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD bekleniyor')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'gecersiz tarih')
  .refine(
    (value) => Date.parse(value) <= Date.now(),
    'gelecek tarih — seen_at gorselin gorulduğu gundur'
  );

export const ratioAxisSchema = z.enum(['along', 'lateral', 'vertical']);

/**
 * Olculmus oran: kaynak, tarih, eksen ve izdusum sinavi ZORUNLU.
 *
 * Sinav alani bos birakilamiyor, cunku bir render'dan piksel okumak
 * uretici beyani degil; hangi kontrolun yapildigi yazilmazsa okuma
 * kendinden daha yetkili gorunur (specs/model-provenance).
 */
export const measuredRatioSchema = z.strictObject({
  basis: z.literal('measured'),
  value: z.number().finite(),
  note: localizedTextSchema,
  source_url: z.url(),
  seen_at: seenAtSchema,
  axis: ratioAxisSchema,
  projection_check: localizedTextSchema
});

/**
 * Okunmus ama sinanmamis oran: kaynak ve tarih var, izdusum sinavi YOK.
 *
 * strictObject sinav alanini kabul etmez; dolduruldugu an kayit
 * 'measured' olmalidir, iki durum ayni anda tutulamaz.
 */
export const readingRatioSchema = z.strictObject({
  basis: z.literal('reading'),
  value: z.number().finite(),
  note: localizedTextSchema,
  source_url: z.url(),
  seen_at: seenAtSchema,
  axis: ratioAxisSchema
});

/** Secilmis oran: kaynak alanlari TASIYAMAZ. strictObject bunu zorlar. */
export const chosenRatioSchema = z.strictObject({
  basis: z.literal('chosen'),
  value: z.number().finite(),
  note: localizedTextSchema
});

export const ratioSchema = z.discriminatedUnion('basis', [
  measuredRatioSchema,
  readingRatioSchema,
  chosenRatioSchema
]);

/** Bir urunun oran tablosu: ad → oran. */
export const ratioTableSchema = z.record(z.string(), ratioSchema);
