import {axialProduct} from './axial';
import {chosen, measured} from './ratio';

/**
 * ATMACA dis profili.
 *
 * OLCEK KAYNAKLI. Olcek uzunluk ve govde capindan gelir —
 * content/systems/atmaca.json. Oranlar ureticinin YAYIMLADIGI TEKNIK
 * CIZIMDEN olculdu.
 *
 * IZDUSUM SINAVI — 11.09.2026, GECTI.
 *
 * Kaynak, ROKETSAN 2024 deniz sistemleri katalogundaki ust gorunus
 * cizgi cizimi. Cizimin ortografik oldugu dogrudan sinandi:
 *
 *   govde eni eksen boyunca      105,2 px ± 1,4 px  (%1,4 sapma)
 *   govde ekseni                 y = 259, kaymiyor
 *   ust ve alt yuzeyler          1 px icinde ayna simetrik
 *
 * Perspektif bir gorunuste uzak uc daralir ve eksen kayar; ikisi de
 * olmuyor. Bu, projedeki ILK ortografik kaynak — AKINCI'nin oranlari
 * bu sinavdan gecemedigi icin 'reading' olarak duruyor.
 *
 * OLCEK KONTROLU. Cizimde govde uzunlugu govde capinin 11,65 kati.
 * Yayimlanan cap 370 mm ise govde 4,31 m eder; icerik dosyasindaki
 * birincil deger 4,3 m. Kataloğun metninde gecen 5,2 m ise cizimde
 * govdenin kuyruk arkasinda kalan baglanti parcasiyla birlikte olculen
 * degere daha yakin. Iki deger de icerik dosyasinda kayitli; burada
 * secilen, cizimin kendisiyle tutarli olan govde olcusudur.
 *
 * BICIM. ATMACA'nin IKI yuzey grubu var: govde ortasinda dort kanat ve
 * kuyrukta dort kanatcik. Onceki surumde yalniz kuyruk kanatciklari
 * ciziliyordu ve onlar da gercegin yaklasik iki buçuk kati veche ile
 * duruyordu. Govde ortasi kanatlar bu sistemin baskin yuzeyleri.
 *
 * Cizimin kendisi depoya GIRMEZ ve saklanmaz — telif ROKETSAN'da.
 * Alinan sey goruntu degil, orandir.
 *
 * Katalogda hedef tipi ve harp basligi bilgisi de var; ikisi de bu
 * projeye ALINMAZ (CLAUDE.md §5.2, §5.3). Buradan yalniz dis geometri
 * cikarildi.
 */

const CATALOGUE =
  'https://www.roketsan.com.tr/uploads/docs/kataloglar/TR/2024/1726595374_atmaca.pdf';
const SEEN = '2026-09-11';

/** Ortografiklik sinavinin sonucu — olculen her oranin yaninda durur. */
const ORTHO = {
  tr: 'Çizimin ortografik olduğu doğrudan sınandı: gövde eni eksen boyunca 105,2 px ± 1,4 px (%1,4), gövde ekseni kaymıyor, üst ve alt yüzeyler 1 piksel içinde ayna simetrik. Perspektif bir görünüşte uzak uç daralır ve eksen kayardı.',
  en: 'The drawing was directly checked for orthographic projection: body width holds at 105.2 px ± 1.4 px (1.4%) along its length, the body axis does not drift, and the upper and lower surfaces mirror within one pixel. A perspective view would taper toward the far end and the axis would wander.'
};

/** Sayim izdusumden bagimsizdir; ayri bir gerekce tasir. */
const COUNT_CHECK = {
  tr: 'Sayım izdüşümden bağımsızdır: perspektif bir görüntüde de dört yüzey dörttür. Sayı, aynı katalogdaki üreticinin 3B görselinden alındı; üst görünüş çizimi yan çiftin dış hattını gösteriyor.',
  en: 'A count does not depend on projection: four surfaces are four in any view. The number was taken from the manufacturer’s 3D illustration in the same catalogue; the top-view drawing shows the outline of the lateral pair.'
};

export const ATMACA = axialProduct({
  slug: 'atmaca',
  category: 'seyir-fuzesi',
  // Govde ortasi kanat 2,74 yaricapta; cizgi onun da disinda kalmali.
  dimensionOffsetRatio: 3.3,
  ratios: {
    noseRatio: measured(0.0605, {
      axis: 'along',
      source_url: CATALOGUE,
      seen_at: SEEN,
      projection_check: ORTHO,
      note: {
        tr: 'Burun kapağı. Gövde tam çapa, burun ucundan 74 px sonra ulaşıyor; gövde boyunun %6’sı. Küt bir radome, sivri bir ogive değil.',
        en: 'Nose cap. The body reaches full diameter 74 px aft of the tip, 6% of the body length. A blunt radome rather than a sharp ogive.'
      }
    }),
    shoulderT: measured(1, {
      axis: 'along',
      source_url: CATALOGUE,
      seen_at: SEEN,
      projection_check: ORTHO,
      note: {
        tr: 'Gövde çapı kuyruk yüzüne kadar korunuyor; çizimde daralma yok. Kuyruk arkasındaki kısa parça gövdenin değil, bağlantının bir parçası.',
        en: 'The body holds full diameter all the way to the aft face; the drawing shows no taper. The short piece behind the tail belongs to the interface, not the body.'
      }
    }),
    boattail: measured(1, {
      axis: 'lateral',
      source_url: CATALOGUE,
      seen_at: SEEN,
      projection_check: ORTHO,
      note: {
        tr: 'Kuyruk daralması yok: gövdenin üst ve alt kenarları kuyruk yüzüne kadar paralel.',
        en: 'No boattail: the upper and lower body edges stay parallel to the aft face.'
      }
    }),
    finCount: measured(4, {
      axis: 'lateral',
      source_url: CATALOGUE,
      seen_at: SEEN,
      projection_check: COUNT_CHECK,
      note: {
        tr: 'Kuyrukta dört kanatçık.',
        en: 'Four fins at the tail.'
      }
    }),
    finChordRatio: measured(0.0924, {
      axis: 'along',
      source_url: CATALOGUE,
      seen_at: SEEN,
      projection_check: ORTHO,
      note: {
        tr: 'Kök veçhe, gövde ekseninde 113 px. Çizimde görünen 73 px gövde YÜZEYİNDEKİ veçhe; model kökü eksende başlattığı için iki kenar eksene doğrusal olarak uzatıldı. Önceki sürümde seçilmiş değer %14’tü, ölçülen %9,2.',
        en: 'The root chord measures 113 px at the body axis. The 73 px visible in the drawing is the chord at the body surface; the model roots the panel on the axis, so both edges were extrapolated linearly inward. The previous chosen value was 14%, the measured one is 9.2%.'
      }
    }),
    finTaper: measured(0.319, {
      axis: 'along',
      source_url: CATALOGUE,
      seen_at: SEEN,
      projection_check: ORTHO,
      note: {
        tr: 'Uç veçhe 36 px, eksendeki kök veçhenin yaklaşık üçte biri.',
        en: 'The tip chord measures 36 px, roughly a third of the root chord at the axis.'
      }
    }),
    finSpanRatio: measured(1.98, {
      axis: 'lateral',
      source_url: CATALOGUE,
      seen_at: SEEN,
      projection_check: ORTHO,
      note: {
        tr: 'Kanatçık ucu gövde ekseninden 1,98 yarıçap uzakta. Üst görünüşte yan çift tam açıklığıyla görünüyor; setin yuvarlanma açısı çizimden okunamıyor, dört yüzey simetrik varsayıldı.',
        en: 'The fin tip sits 1.98 radii from the body axis. The top view shows the lateral pair at full span; the roll angle of the set cannot be read from the drawing, so the four surfaces are taken as symmetric.'
      }
    }),
    finRakeDeg: measured(0, {
      axis: 'along',
      source_url: CATALOGUE,
      seen_at: SEEN,
      projection_check: ORTHO,
      note: {
        tr: 'Firar kenarı açıklığın tamamında aynı eksende duruyor: kökten uca x = 569 px, sapma 1 px. Yani gövde eksenine dik. Hücum kenarı 642’den 605’e kaçıyor ve ok açısı bu üç orandan türüyor.',
        en: 'The trailing edge holds the same station across the whole span: x = 569 px from root to tip, within one pixel. So it is perpendicular to the body axis. The leading edge moves from 642 to 605, and the sweep follows from the three ratios.'
      }
    }),
    finTrailingT: measured(0.9812, {
      axis: 'along',
      source_url: CATALOGUE,
      seen_at: SEEN,
      projection_check: ORTHO,
      note: {
        tr: 'Kanatçığın firar kenarı gövdenin tam kuyruğunda değil, %2 önünde.',
        en: 'The fin trailing edge does not sit at the very tail but 2% forward of it.'
      }
    }),
    finThicknessRatio: chosen(0.03, {
      note: {
        tr: 'Kalınlığın YEREL veçheye oranı. Üst görünüşten okunamaz — yüzey o izdüşümde kendi düzlemi içinde. İnce bir plaka şematik dili koruyacak şekilde seçildi.',
        en: 'Thickness as a fraction of LOCAL chord. It cannot be read from a top view, where the surface lies in its own plane. A thin plate was chosen to keep the schematic language.'
      }
    })
  },
  wings: {
    wingCount: measured(4, {
      axis: 'lateral',
      source_url: CATALOGUE,
      seen_at: SEEN,
      projection_check: COUNT_CHECK,
      note: {
        tr: 'Gövde ortasında dört kanat. Bu yüzeyler sistemin baskın yüzeyleri ve önceki sürümde hiç çizilmiyordu.',
        en: 'Four wings at mid-body. These are the system’s dominant surfaces and were not drawn at all in the previous version.'
      }
    }),
    wingChordRatio: measured(0.2679, {
      axis: 'along',
      source_url: CATALOGUE,
      seen_at: SEEN,
      projection_check: ORTHO,
      note: {
        tr: 'Kök veçhe, gövde ekseninde 328 px. Gövde yüzeyinde görünen 229 px; iki kenar eksene doğrusal uzatıldı. Kanatçık veçhesinin yaklaşık üç katı.',
        en: 'The root chord measures 328 px at the body axis. What the drawing shows at the body surface is 229 px; both edges were extrapolated linearly inward. Roughly three times the fin chord.'
      }
    }),
    wingTaper: measured(0.198, {
      axis: 'along',
      source_url: CATALOGUE,
      seen_at: SEEN,
      projection_check: ORTHO,
      note: {
        tr: 'Uç veçhe 65 px, eksendeki kök veçhenin beşte biri. Kanat kökten uca belirgin biçimde daralıyor.',
        en: 'The tip chord measures 65 px, a fifth of the root chord at the axis. The wing tapers sharply from root to tip.'
      }
    }),
    wingSpanRatio: measured(2.74, {
      axis: 'lateral',
      source_url: CATALOGUE,
      seen_at: SEEN,
      projection_check: ORTHO,
      note: {
        tr: 'Kanat ucu gövde ekseninden 2,74 yarıçap uzakta; kanatçık ucundan belirgin biçimde dışarıda. Üst görünüşte yan çift tam açıklığıyla görünüyor.',
        en: 'The wing tip sits 2.74 radii from the body axis, clearly outboard of the fin tip. The top view shows the lateral pair at full span.'
      }
    }),
    wingRakeDeg: measured(-46, {
      axis: 'along',
      source_url: CATALOGUE,
      seen_at: SEEN,
      projection_check: ORTHO,
      note: {
        tr: 'Kanatçıktan farklı olarak firar kenarı dik DEĞİL: uca doğru buruna yaklaşıyor. Kökte x = 951 px, uçta 1100 px, yani 143,85 px açıklıkta 149 px öne kaçıyor. Hücum kenarı ise aksi yönde, 1279’dan 1165’e.',
        en: 'Unlike the fin, the trailing edge is not perpendicular: it moves toward the nose at the tip. It sits at x = 951 px at the root and 1100 px at the tip, 149 px forward across a span of 143.85 px. The leading edge moves the other way, from 1279 to 1165.'
      }
    }),
    wingTrailingT: measured(0.6688, {
      axis: 'along',
      source_url: CATALOGUE,
      seen_at: SEEN,
      projection_check: ORTHO,
      note: {
        tr: 'Kanadın firar kenarı, eksende burundan gövde boyunun %66,9’unda; kanat gövdenin orta bölümünde oturuyor.',
        en: 'At the axis the wing trailing edge sits at 66.9% of body length from the nose; the wing occupies the middle section.'
      }
    }),
    wingThicknessRatio: chosen(0.02, {
      note: {
        tr: 'Kalınlığın YEREL veçheye oranı. Üst görünüşten okunamaz. Kanatçıktan ince seçildi; katlanır bir yüzey olduğu için ince bir plaka makul.',
        en: 'Thickness as a fraction of LOCAL chord. It cannot be read from a top view. Chosen thinner than the fin; a thin plate is reasonable for a folding surface.'
      }
    })
  }
});
