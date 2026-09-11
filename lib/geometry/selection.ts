import {ATMACA_PROFILE} from './atmaca';
import type {MissileSpec} from './missile';

/**
 * Sistem slug'ina gore dis profil parametreleri.
 *
 * Bunlar yapisal olcu verisi degil, govde biciminin genel hatlaridir.
 * ATMACA'nin kanatcik ve burun profili TAYFUN'dan farkli; bu dosya
 * o farkliligi tek yerde toplar. Ileride ozel geometri ureticisi
 * eklendiginde cagiran kod degismez.
 */
export function specFor(systemSlug: string): Partial<MissileSpec> {
  switch (systemSlug) {
    case 'atmaca':
      return ATMACA_PROFILE;
    case 'tayfun':
      return {
        noseRatio: 0.22,
        boattail: 0.94,
        finCount: 4
      };
    default:
      throw new Error(`bilinmeyen sistem profili: ${systemSlug}`);
  }
}
