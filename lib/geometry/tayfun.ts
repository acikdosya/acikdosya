import {axialProduct} from './axial';
import {chosen} from './ratio';

/**
 * TAYFUN dis profili.
 *
 * OLCEK KAYNAKLI, BICIM DEGIL. Modelin olcegi iki yayimlanmis sayidan
 * gelir: uzunluk ve govde capi — content/systems/tayfun.json. Asagidaki
 * oranlarin hicbiri yayimlanmis bir sayi degildir.
 *
 * HEPSI SECILMIS. AKINCI'da oranlarin bir kismi ureticinin yayimladigi
 * gorsellerden olculmustu; TAYFUN icin boyle bir gorsel kullanilmadi.
 * Elimizde gecit toreni ve test atisi kareleri var ama hicbiri
 * ortografik degil ve hicbirinde bilinen bir referans olcu yok — yani
 * piksel okumasi yapilamiyor (specs/model-provenance, izdusum sinavi).
 *
 * Bu yuzden govde okunabilir bir seyir/balistik fuze semasidir, teknik
 * cizim degil. Sayfadaki koken kaydi bunu okuyucuya da soyler.
 */
export const TAYFUN = axialProduct({
  slug: 'tayfun',
  category: 'balistik-fuze',
  ratios: {
    noseRatio: chosen(0.22, {
      note: {
        tr: 'Balistik füzelerde yaygın, gövdeye teğet geçen ogive burun oranı. Yayımlanmış bir görselden ölçülmedi.',
        en: 'A nose ratio common on ballistic missiles, tangent to the body. Not measured from any published image.'
      }
    }),
    shoulderT: chosen(0.88, {
      note: {
        tr: 'Gövde çapının korunduğu son nokta. Kuyruk daralmasının nerede başladığı açık kaynakta yok; okunabilir bir siluet için seçildi.',
        en: 'The last point at which the body keeps full diameter. Where the boattail begins is not in open sources; chosen for a readable silhouette.'
      }
    }),
    boattail: chosen(0.94, {
      note: {
        tr: 'Kuyruk ucu çapının gövde çapına oranı. Hafif bir daralma seçildi; keskin bir daralma sahip olmadığımız bir biçim iddiası olurdu.',
        en: 'Tail diameter as a fraction of body diameter. A slight taper was chosen; a sharp one would claim a shape we do not have.'
      }
    }),
    finCount: chosen(4, {
      note: {
        tr: 'Dört kanatçık dizilimi. Sayı yayımlanmış bir beyan değil, bu sınıfta yaygın olan düzen.',
        en: 'A four-fin arrangement. The count is not a published statement, but the common layout in this class.'
      }
    }),
    finChordRatio: chosen(0.14, {
      note: {
        tr: 'Kanatçık kök veçhesinin toplam uzunluğa oranı. Seçilmiş; kuyruk bölümünün oranları açık kaynakta yok.',
        en: 'Fin root chord as a fraction of total length. Chosen; tail section proportions are not in open sources.'
      }
    }),
    finTaper: chosen(0.42, {
      note: {
        tr: 'Uç veçhenin kök veçheye oranı. Seçilmiş; hücum kenarı ok açısı bu iki veçheden türer, ayrı bir oran tutulmaz.',
        en: 'Tip chord as a fraction of root chord. Chosen; leading-edge sweep derives from the two chords rather than being a separate ratio.'
      }
    }),
    finRakeDeg: chosen(0, {
      note: {
        tr: 'Kanatçığın firar kenarı gövde eksenine dik: uca doğru öne veya arkaya kaçmıyor. Seçilmiş; hücum kenarı ok açısı bu karardan ve iki veçheden türer, ayrı bir sayı olarak tutulmaz.',
        en: 'The fin trailing edge stays perpendicular to the body axis, raking neither forward nor aft toward the tip. Chosen; the leading-edge sweep follows from this decision and the two chords rather than being held as a separate number.'
      }
    }),
    finTrailingT: chosen(1, {
      note: {
        tr: 'Kanatçığın firar kenarı gövdenin tam kuyruğunda. Seçilmiş; kuyruk bölümünün ayrıntısı açık kaynakta yok.',
        en: 'The fin trailing edge sits at the very tail of the body. Chosen; the tail section detail is not in open sources.'
      }
    }),
    finSpanRatio: chosen(1.9, {
      note: {
        tr: 'Kanatçık ucunun gövde yarıçapına oranı. Seçilmiş. Kadraj da bu değeri okur; model bundan genişse kanatçık kesilir.',
        en: 'Fin tip radius as a multiple of body radius. Chosen. Framing reads the same value; a model wider than this would have its fins clipped.'
      }
    }),
    finThicknessRatio: chosen(0.03, {
      note: {
        tr: 'Kalınlığın YEREL veçheye oranı. Seçilmiş; ince bir plaka şematik dili korur. Önceki sürümde oran gövde yarıçapına göre yazılıydı ve açıklık boyunca sabit kalınlık veriyordu; yüzeyler artık veçheyle birlikte inceldiği için tanım da veçheye bağlandı, çizilen kalınlık aynı kaldı.',
        en: 'Thickness as a fraction of LOCAL chord. Chosen; a thin plate keeps the schematic language. The previous version expressed it against body radius and gave constant thickness across the span; surfaces now thin with the chord, so the definition follows the chord and the drawn thickness is unchanged.'
      }
    })
  }
});
