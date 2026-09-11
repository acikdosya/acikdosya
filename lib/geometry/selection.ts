import type {AircraftProfile} from './aircraft';
import {AKINCI_PROFILE} from './akinci';
import {ATMACA_PROFILE} from './atmaca';
import type {MissileSpec} from './missile';

/**
 * Sistem slug'ina gore dis profil parametreleri.
 *
 * Bunlar yapisal olcu verisi degil, govde biciminin genel hatlaridir.
 * ATMACA'nin kanatcik ve burun profili TAYFUN'dan farkli, AKINCI ise
 * bambaska bir govde; bu dosya farkliligi tek yerde toplar.
 *
 * Tanimsiz slug icin varsayilan profil DONMEZ. Bilmedigimiz bir
 * sistemi TAYFUN geometrisiyle cizmek, olcusu olmayan alani ortalama
 * bir sayiyla doldurmakla ayni sey olurdu (CLAUDE.md §9).
 */
export type SystemProfile =
  | {kind: 'missile'; spec: Partial<MissileSpec>}
  | {kind: 'aircraft'; spec: AircraftProfile};

const PROFILES: Record<string, SystemProfile> = {
  atmaca: {kind: 'missile', spec: ATMACA_PROFILE},
  tayfun: {
    kind: 'missile',
    spec: {
      noseRatio: 0.22,
      boattail: 0.94,
      finCount: 4
    }
  },
  akinci: {kind: 'aircraft', spec: AKINCI_PROFILE}
};

export function specFor(systemSlug: string): SystemProfile | undefined {
  return PROFILES[systemSlug];
}

/**
 * Bu sistem icin, istenen turde bir dis profil tanimli mi.
 *
 * Tur de sorulur: fuze profili olan bir slug'a ucak olcusu gelirse
 * model yine uretilemez. Olcu verisi olmak yetmez — profili olmayan
 * sistem icin model uretilmez. Secim asamasi bunu bilmeli, yoksa
 * sayfa modelin cizilecegini varsayip bos bir bolum acar.
 */
export function hasProfile(
  systemSlug: string,
  kind: SystemProfile['kind']
): boolean {
  return PROFILES[systemSlug]?.kind === kind;
}
