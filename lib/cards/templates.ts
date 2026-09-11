import type {CardTemplate} from '../urls';

/**
 * Sablon adi ile mesaj anahtari arasindaki tek eslesme.
 *
 * Sablon adi bir DOSYA YOLUDUR (app/[locale]/kart/<sablon>/route.tsx) ve
 * kebab-case; mesaj anahtarlari camelCase. Eslesme turetilmiyor, acikca
 * yaziliyor: iki isimlendirme birbirinden bagimsiz degisebilmeli.
 *
 * lib/measurement/labels.ts ile ayni desen ve ayni gerekce: orada durum
 * adlari, burada sablon adlari. lib/messages.test.ts ikisini de
 * dogruluyor — yeni bir sablon eklenip mesaji yazilmazsa test duser.
 */
export const TEMPLATE_MESSAGE_KEY = {
  'kaynak-zinciri': 'kaynakZinciri',
  'deger-kapsam': 'degerKapsam',
  olcek: 'olcek',
  duzeltme: 'duzeltme'
} as const satisfies Record<CardTemplate, string>;

export function templateKey(template: CardTemplate): string {
  return `template_${TEMPLATE_MESSAGE_KEY[template]}`;
}
