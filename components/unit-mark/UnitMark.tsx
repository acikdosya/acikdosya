import {isTightUnit, unitLabel} from '@/lib/format';
import type {SpecUnit} from '@/lib/measurement/divergence';

/**
 * Sayinin yanindaki birim isareti.
 *
 * Duz bir <small> ciziyor: cagiran bilesenlerin CSS modulleri birimi
 * `.value small` ile boyutluyor ve o secici bozulmasin diye kendi sinifi
 * yok. Bilesenin tasidigi iki karar var:
 *
 *  Birimsiz buyuklukte HICBIR SEY cizilmez. Bos bir <small> gorunmez ama
 *  kendi sol boslugunu birakir; sayi sagina sebepsiz bir pay alirdi.
 *
 *  Bitisik yazilan simgede (°) sol bosluk kalkar. Kural lib/format.ts'te
 *  tek kaynakta: SI birim simgesinden once bosluk ister, duzlem aci
 *  simgelerini disarida tutar.
 */
export function UnitMark({unit}: {unit: SpecUnit}) {
  const label = unitLabel(unit);
  if (!label) return null;

  return <small data-tight={isTightUnit(unit) ? '' : undefined}>{label}</small>;
}
