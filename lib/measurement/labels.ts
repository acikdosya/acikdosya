import {scopeSchema, type Scope} from '../schema';
import type {DivergenceKind} from './divergence';

/**
 * Durum adi ile mesaj anahtari arasindaki tek eslesme.
 *
 * Enum degerleri kebab-case ('farkli-aciklama'), mesaj anahtarlari camelCase.
 * Eslesme turetilmiyor, acikca yaziliyor: iki isimlendirme birbirinden
 * bagimsiz degisebilmeli.
 *
 * Neden tek yerde: bu tablo once rozet bileseninde, sonra yontem sayfasinda
 * ayri ayri duruyordu. Dorduncu durum ('belirsiz') eklenince rozet onu
 * ogrendi, yontem sayfasi ogrenmedi ve sayfa arayuzde cikan bir etiketi
 * aciklamaz hale geldi. lib/messages.test.ts artik ikisini birlikte
 * dogruluyor.
 */
export const KIND_MESSAGE_KEY = {
  celiski: 'celiski',
  'farkli-aciklama': 'farkliAciklama',
  'farkli-kapsam': 'farkliKapsam',
  belirsiz: 'belirsiz'
} as const satisfies Record<DivergenceKind, string>;

/** Agirlik sirasiyla — PAIR_ORDER ile ayni sira, yontem sayfasi bunu izler. */
export const KIND_ORDER = [
  'celiski',
  'farkli-aciklama',
  'farkli-kapsam',
  'belirsiz'
] as const satisfies readonly DivergenceKind[];

export const SCOPES = scopeSchema.options satisfies readonly Scope[];
