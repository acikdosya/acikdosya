import {axialProduct} from './axial';
import {chosen, measured} from './ratio';

/**
 * SIPER URUN-2 dis profili.
 *
 * KAYNAK: ROKETSAN SIPER urun brosurundeki cizgi gorunus, 12.09.2026'da
 * goruldu. Dosya depoya ALINMADI; alinan sey goruntu degil orandir.
 *
 * IZDUSUM SINAVI GECILDI — iki kosul da. Cizim kendi icinde ortografik:
 * govde eni kanatsiz bolgelerde 69,0 px'de duruyor, sapma %0,5 (ATMACA'da
 * kabul edilen %1,4 olcutunun altinda). Ve cizilen incelik yayimlanan
 * olculerle uyusuyor: cizimde L/D 15,58, katalogda 6,3 m / 420 mm = 15,00,
 * fark %3,9 — cizgi kalinligi mertebesinde.
 *
 * Bu yuzden okunan oranlar 'measured'. URUN-1 boyle degil: onun cizimi
 * ayni ortografiklik sinavini geciyor ama yayimlanan olcuyle %39
 * ayrisiyor ve oranlari 'reading' kaliyor (lib/geometry/siper-urun-1.ts).
 *
 * BICIM URUN-1'DEN FARKLI. Ayrilabilir itici ve orta kanat yok; bunun
 * yerine govde boyunca uzanan dort strake ve kuyrukta dort buyuk ok acili
 * yuzey var. Iki varyanti tek oran tablosuyla cizmek bu kanitla
 * celisirdi (specs/variant-geometry).
 *
 * NE MODELLENIYOR: yalnizca fuze. Atici arac, kanister, radar ve komuta
 * unsurlari cizilmiyor (CLAUDE.md §9). Brosurdeki hedef tipi ve harp
 * basligi alanlari alinmadi (§5.2, §5.3).
 */

const DRAWING =
  'https://www.roketsan.com.tr/uploads/docs/kataloglar/TR/2024/1726595695_siper.pdf';
const SEEN = '2026-09-12';

/** Izdusum sinavinin iki kosulu — olculen her oranin yaninda durur. */
const ORTHO = {
  tr: 'İzdüşüm sınavı iki koşulda da geçildi. İç tutarlılık: gövde eni kanatsız bölgelerde 69,0 px, eksen boyunca sapma 0,37 px (%0,5). Dış uyum: çizilen uzunluk/çap oranı 15,58, yayımlanan 6,3 m / 420 mm oranı 15,00; fark %3,9, yani çizgi kalınlığı mertebesinde. Perspektif bir görünüşte uzak uç daralır ve gövde eni eksen boyunca kayardı.',
  en: 'Both conditions of the projection check passed. Internal consistency: body width holds at 69.0 px in fin-free regions, deviating 0.37 px (0.5%) along the axis. External agreement: the drawn length-to-diameter ratio is 15.58 against 15.00 for the published 6.3 m / 420 mm; the 3.9% gap is of the order of the line width. A perspective view would taper toward the far end and the body width would drift.'
};

/** Sayim izdusumden bagimsizdir; ayri gerekce tasir. */
const COUNT_NOTE = {
  tr: 'Sayım izdüşümden bağımsızdır: perspektif bir görüntüde de dört yüzey dörttür. Çizimde arka kanat ve strake gruplarında dörder yüzey sayılıyor; üst ve alt çift doğrudan, yan çift açılı görünüşlerinden.',
  en: 'A count does not depend on projection: four surfaces are four in any view. Four surfaces are counted in both the aft fin and strake groups; the upper and lower pair directly, the lateral pair from their angled outlines.'
};

export const SIPER_URUN_2 = axialProduct({
  slug: 'siper',
  category: 'hava-savunma-sistemi',
  // Arka kanat ucu 2,52 yaricapta; olcu cizgisi onun da disinda kalmali.
  dimensionOffsetRatio: 3.0,
  body: {
    noseRatio: measured(0.189, {
      axis: 'along',
      source_url: DRAWING,
      seen_at: SEEN,
      projection_check: ORTHO,
      note: {
        tr: 'Burun bölümünün toplam uzunluğa oranı. Gövde eni çizimde x = 0,811’de tam değerine ulaşıyor, ucu 1,0’da. Çizim burnun kökünde bir kesit çizgisi gösteriyor (x = 0,804, yani burun/gövde birleşimiyle aynı yerde); ayrı bir çap değişimi değil, bölüm sınırı.',
        en: 'Nose section as a fraction of total length. Body width reaches its full value at x = 0.811 in the drawing, with the tip at 1.0. The drawing shows a section line at the base of the nose (x = 0.804, coincident with the nose-to-body junction); it marks a section boundary, not a change of diameter.'
      }
    }),
    shoulderT: chosen(1, {
      note: {
        tr: 'Gövde çapının korunduğu son nokta. 1 yazılı: çizimde gövde burundan kuyruğa tek çapta, ayrı bir omuz daralması yok.',
        en: 'The last point at which the body keeps full diameter. Set to 1: in the drawing the body holds one diameter from nose to tail, with no separate shoulder taper.'
      }
    }),
    boattail: chosen(0.9, {
      note: {
        tr: 'Kuyruk ucu çapının gövde çapına oranı. ÇİZİMDEN OKUNAMADI: çizimdeki arka kapak yuvarlatılmış bir kapanış, torna yüzeyi ise düz bir daralma çiziyor; kapağın kenarından okunan sayı kapağın kendisini değil izdüşümünü verirdi. Okunabilir bir kapanış için seçildi.',
        en: 'Tail diameter as a fraction of body diameter. NOT READABLE FROM THE DRAWING: the drawn aft cap is a rounded closure while the lathe surface draws a straight taper, so a figure read off the cap edge would describe its projection rather than the cap. Chosen for a readable closure.'
      }
    })
  },
  groups: [
    {
      id: 'fin-aft',
      prefix: 'finAft',
      ratios: {
        count: measured(4, {
          axis: 'lateral',
          source_url: DRAWING,
          seen_at: SEEN,
          projection_check: COUNT_NOTE,
          note: COUNT_NOTE
        }),
        chordRatio: measured(0.06, {
          axis: 'along',
          source_url: DRAWING,
          seen_at: SEEN,
          projection_check: ORTHO,
          note: {
            tr: 'Arka kanadın kök veçhesinin toplam uzunluğa oranı. Çizimde 65 px / 1075 px.',
            en: 'Aft fin root chord as a fraction of total length. 65 px of 1075 px in the drawing.'
          }
        }),
        taper: measured(0.34, {
          axis: 'along',
          source_url: DRAWING,
          seen_at: SEEN,
          projection_check: ORTHO,
          note: {
            tr: 'Uç veçhenin kök veçheye oranı. Çizimde 22 px / 65 px; yüzey uca doğru belirgin biçimde daralıyor.',
            en: 'Tip chord as a fraction of root chord. 22 px of 65 px in the drawing; the surface narrows markedly toward the tip.'
          }
        }),
        spanRatio: measured(2.52, {
          axis: 'lateral',
          source_url: DRAWING,
          seen_at: SEEN,
          projection_check: ORTHO,
          note: {
            tr: 'Kanat ucunun gövde yarıçapına oranı. Çizimde zarf tepe değeri 173 px, gövde 69 px.',
            en: 'Fin tip radius as a multiple of body radius. The envelope peaks at 173 px against 69 px for the body.'
          }
        }),
        rakeDeg: measured(-22, {
          axis: 'along',
          source_url: DRAWING,
          seen_at: SEEN,
          projection_check: ORTHO,
          note: {
            tr: 'Firar kenarı dik DEĞİL: uca doğru buruna yaklaşıyor. Çizimde ucun arka ucu kökünkinden 21 px önde, 52 px açıklıkta; açı arctan(21/52).',
            en: 'The trailing edge is not perpendicular: it moves toward the nose at the tip. In the drawing the tip trailing edge sits 21 px forward of the root across a 52 px span; the angle is arctan(21/52).'
          }
        }),
        trailingT: measured(0.989, {
          axis: 'along',
          source_url: DRAWING,
          seen_at: SEEN,
          projection_check: ORTHO,
          note: {
            tr: 'Firar kenarının gövde üzerindeki yeri, burundan. Çizimde kanat x = 0,011’de bitiyor.',
            en: 'Position of the trailing edge along the body, from the nose. The fin ends at x = 0.011 in the drawing.'
          }
        }),
        thicknessRatio: chosen(0.03, {
          note: {
            tr: 'Kalınlığın yerel veçheye oranı. ÇİZİMDEN OKUNAMAZ: çizgi görünüş yüzey kalınlığı taşımıyor. İnce bir plaka şematik dili korur.',
            en: 'Thickness as a fraction of local chord. NOT READABLE FROM THE DRAWING: a line view carries no surface thickness. A thin plate keeps the schematic language.'
          }
        })
      }
    },
    {
      id: 'strake',
      prefix: 'strake',
      ratios: {
        count: measured(4, {
          axis: 'lateral',
          source_url: DRAWING,
          seen_at: SEEN,
          projection_check: COUNT_NOTE,
          note: COUNT_NOTE
        }),
        chordRatio: measured(0.364, {
          axis: 'along',
          source_url: DRAWING,
          seen_at: SEEN,
          projection_check: ORTHO,
          note: {
            tr: 'Strake kök veçhesinin toplam uzunluğa oranı. Çizimde 391 px / 1075 px; gövdenin üçte birinden fazlası boyunca uzanıyor.',
            en: 'Strake root chord as a fraction of total length. 391 px of 1075 px in the drawing; it runs along more than a third of the body.'
          }
        }),
        taper: measured(0.9, {
          axis: 'along',
          source_url: DRAWING,
          seen_at: SEEN,
          projection_check: ORTHO,
          note: {
            tr: 'Uç veçhenin kök veçheye oranı. Çizimde 352 px / 391 px; strake uca doğru çok az daralıyor.',
            en: 'Tip chord as a fraction of root chord. 352 px of 391 px in the drawing; the strake narrows only slightly toward the tip.'
          }
        }),
        spanRatio: measured(1.42, {
          axis: 'lateral',
          source_url: DRAWING,
          seen_at: SEEN,
          projection_check: ORTHO,
          note: {
            tr: 'Uç yarıçapının gövde yarıçapına oranı. Çizimde zarf tepe değeri 97 px, gövde 69 px. Açıklık kısa, veçhe uzun: strake bir kanat değil, gövde boyunca uzanan alçak bir yüzey.',
            en: 'Tip radius as a multiple of body radius. The envelope peaks at 97 px against 69 px for the body. Short span, long chord: the strake is not a wing but a low surface running along the body.'
          }
        }),
        rakeDeg: measured(-54, {
          axis: 'along',
          source_url: DRAWING,
          seen_at: SEEN,
          projection_check: ORTHO,
          note: {
            tr: 'Firar kenarı dik DEĞİL. Çizimde ucun arka ucu kökünkinden 19 px önde, 14 px açıklıkta; açı arctan(19/14). Açıklık kısa olduğu için küçük bir veçhe kayması büyük bir açı veriyor.',
            en: 'The trailing edge is not perpendicular. In the drawing the tip trailing edge sits 19 px forward of the root across a 14 px span; the angle is arctan(19/14). Because the span is short, a small chordwise offset produces a large angle.'
          }
        }),
        trailingT: measured(0.846, {
          axis: 'along',
          source_url: DRAWING,
          seen_at: SEEN,
          projection_check: ORTHO,
          note: {
            tr: 'Firar kenarının yeri. Çizimde x = 0,154, yani arka kanat grubunun hemen önünde biterek gövdenin ortasına kadar uzanıyor.',
            en: 'Position of the trailing edge. At x = 0.154 in the drawing, ending just forward of the aft fin group and reaching to mid-body.'
          }
        }),
        thicknessRatio: chosen(0.03, {
          note: {
            tr: 'Kalınlığın yerel veçheye oranı. ÇİZİMDEN OKUNAMAZ: çizgi görünüş yüzey kalınlığı taşımıyor.',
            en: 'Thickness as a fraction of local chord. NOT READABLE FROM THE DRAWING: a line view carries no surface thickness.'
          }
        })
      }
    }
  ]
});
