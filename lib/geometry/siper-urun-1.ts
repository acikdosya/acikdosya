import {axialProduct} from './axial';
import {chosen, reading} from './ratio';

/**
 * SIPER URUN-1 dis profili.
 *
 * KAYNAK: ROKETSAN SIPER urun brosurundeki cizgi gorunus, 12.09.2026'da
 * goruldu. Dosya depoya ALINMADI; alinan sey goruntu degil orandir
 * (specs/model-provenance). Kayit content/assets.json icinde.
 *
 * IZDUSUM SINAVI GECILMEDI — ikinci kosulda. Cizim kendi icinde
 * ortografik: govde eni eksen boyunca 50,0 px'de sabit, sapma yok. Ama
 * cizilen incelik yayimlanan olculerle uyusmuyor: cizimde L/D 20,30,
 * katalogda 5,4 m / 370 mm = 14,59. Fark %39.
 *
 * Farkin iki acikasi var ve ikisi de dogrulanamadi. Ya cizim duzgun
 * bicimde ince cizilmis bir tanitim illustrasyonu — o zaman butun oranlar
 * gecerli. Ya da cizim yayimlanan 5,4 m'den baska bir uzanimi gosteriyor
 * (ayrilabilir itici dahil) — o zaman boyuna oranlar 5,4 m uzerine
 * oturmaz. Itici hipotezi sayiyla da tutmuyor: gecis konisinin onu 5,4 m
 * sayilsa L/D 16,71, arka kanadin onu sayilsa 17,11 cikiyor; hicbiri
 * 14,59'a inmiyor.
 *
 * Bu yuzden okunan her oran 'reading'. Okunamayanlar 'chosen' kalir ve
 * neden okunamadigi notunda yazar.
 *
 * NE MODELLENIYOR: yalnizca fuze. Atici arac, kanister, radar ve komuta
 * unsurlari cizilmiyor — hicbiri icin olcu kaydimiz yok (CLAUDE.md §9).
 * Iticinin AYRILABILIR oldugu bilgisi modelden anlasilmaz; sayfadaki
 * aciklama bunu soyler.
 *
 * Brosurde hedef tipi ve harp basligi alanlari da var; ikisi de
 * alinmadi (CLAUDE.md §5.2, §5.3).
 */

const DRAWING =
  'https://www.roketsan.com.tr/uploads/docs/kataloglar/TR/2024/1726595695_siper.pdf';
const SEEN = '2026-09-12';

/** Cizimden okunan her oranin yaninda duran sinav sonucu. */
const READ_NOTE = {
  tr: 'ROKETSAN ürün broşüründeki çizgi görünüşten okundu. Çizim kendi içinde ortografik (gövde eni eksen boyunca 50,0 px, sapma yok) ama çizilen L/D 20,30 iken yayımlanan 5,4 m / 370 mm oranı 14,59; %39 fark izdüşüm sınavının ikinci koşulunu düşürüyor. Bu yüzden ölçülmüş değil, okuma.',
  en: 'Read from the line drawing in the ROKETSAN product brochure. The drawing is internally orthographic (body width holds at 50.0 px along the axis, no deviation) but its drawn L/D of 20.30 does not match the published 5.4 m / 370 mm ratio of 14.59; the 39% gap fails the second condition of the projection check. It is therefore a reading, not a measurement.'
};

/** Sayim izdusumden bagimsizdir; ayri gerekce tasir. */
const COUNT_NOTE = {
  tr: 'Sayım izdüşümden bağımsızdır: çizim ölçek sınavını geçmese de dört yüzey dörttür. Çizimde arka, kontrol ve orta gruplarda dörder yüzey sayılıyor; üst ve alt çift doğrudan, yan çift açılı görünüşlerinden.',
  en: 'A count does not depend on projection: four surfaces are four even where the drawing fails the scale check. Four surfaces are counted in the aft, control and mid groups; the upper and lower pair directly, the lateral pair from their angled outlines.'
};

export const SIPER_URUN_1 = axialProduct({
  slug: 'siper',
  category: 'hava-savunma-sistemi',
  // Arka kanat ucu 2,38 yaricapta; olcu cizgisi onun da disinda kalmali.
  dimensionOffsetRatio: 2.9,
  body: {
    noseRatio: reading(0.288, {
      axis: 'along',
      source_url: DRAWING,
      seen_at: SEEN,
      note: {
        tr: `Burun bölümünün toplam uzunluğa oranı. Gövde eni çizimde x = 0,712'de tam değerine ulaşıyor, ucu 1,0'da. ${READ_NOTE.tr} Çizim burun içinde ayrıca hafif bir kesit kademesi gösteriyor (gövde eni 44,5 px'ten 43,0 px'e); tek bir ogive bunu üretmez ve modelde yok.`,
        en: `Nose section as a fraction of total length. Body width reaches its full value at x = 0.712 in the drawing, with the tip at 1.0. ${READ_NOTE.en} The drawing also shows a slight section step inside the nose (body width from 44.5 px to 43.0 px); a single ogive does not reproduce it and the model does not carry it.`
      }
    }),
    shoulderT: chosen(1, {
      note: {
        tr: 'Gövde çapının korunduğu son nokta. 1 yazılı, yani ayrı bir omuz daralması yok: gövdenin nerede değiştiği aşağıdaki çap istasyonlarında bildiriliyor.',
        en: 'The last point at which the body keeps full diameter. Set to 1, so there is no separate shoulder taper: where the body changes is declared in the diameter stations below.'
      }
    }),
    boattail: chosen(0.9, {
      note: {
        tr: 'Kuyruk ucu çapının itici çapına oranı. ÇİZİMDEN OKUNAMADI: çizimdeki arka kapak yuvarlatılmış bir kapanış, torna yüzeyi ise düz bir daralma çiziyor; kapağın kenarından okunan sayı kapağın kendisini değil izdüşümünü verirdi. Okunabilir bir kapanış için seçildi.',
        en: 'Tail diameter as a fraction of booster diameter. NOT READABLE FROM THE DRAWING: the drawn aft cap is a rounded closure while the lathe surface draws a straight taper, so a figure read off the cap edge would describe its projection rather than the cap. Chosen for a readable closure.'
      }
    })
  },
  /*
   * Kademeli govde: itici ana govdeden kalin ve arasinda bir gecis var.
   * Cizim bunu acikca gosteriyor; iki istasyon gecisin iki ucudur.
   */
  stations: [
    {
      id: 'step',
      ratios: {
        t: reading(0.823, {
          axis: 'along',
          source_url: DRAWING,
          seen_at: SEEN,
          note: {
            tr: `Geçişin ön ucu — gövdenin hâlâ ana çapta olduğu son nokta. Çizimde x = 0,177. ${READ_NOTE.tr}`,
            en: `Forward end of the transition — the last point where the body is still at main diameter. At x = 0.177 in the drawing. ${READ_NOTE.en}`
          }
        }),
        radiusRatio: reading(1, {
          axis: 'lateral',
          source_url: DRAWING,
          seen_at: SEEN,
          note: {
            tr: `Geçişin ön ucunda yarıçap ana gövdeninkiyle aynı. ${READ_NOTE.tr}`,
            en: `At the forward end of the transition the radius equals that of the main body. ${READ_NOTE.en}`
          }
        })
      }
    },
    {
      id: 'booster',
      ratios: {
        t: reading(0.843, {
          axis: 'along',
          source_url: DRAWING,
          seen_at: SEEN,
          note: {
            tr: `İticinin tam çapa ulaştığı nokta. Çizimde x = 0,157. ${READ_NOTE.tr}`,
            en: `The point at which the booster reaches full diameter. At x = 0.157 in the drawing. ${READ_NOTE.en}`
          }
        }),
        radiusRatio: reading(1.14, {
          axis: 'lateral',
          source_url: DRAWING,
          seen_at: SEEN,
          note: {
            tr: `İtici yarıçapının ana gövde yarıçapına oranı. Çizimde itici gövdesinin dış hattı 52,5 px, ana gövde 46,0 px. Okuma bandı geniş: iticinin kanat kökleriyle örtüşen bölgesinde iç ve dış kontur ayrımı 1,09 ile 1,18 arasında değişiyor, ortası alındı. ${READ_NOTE.tr}`,
            en: `Booster radius as a fraction of main body radius. In the drawing the booster outline spans 52.5 px against 46.0 px for the main body. The reading band is wide: where the booster overlaps the fin roots, the inner and outer contour give between 1.09 and 1.18, and the middle was taken. ${READ_NOTE.en}`
          }
        })
      }
    }
  ],
  groups: [
    {
      id: 'fin-aft',
      prefix: 'finAft',
      ratios: {
        count: reading(4, {
          axis: 'lateral',
          source_url: DRAWING,
          seen_at: SEEN,
          note: COUNT_NOTE
        }),
        chordRatio: reading(0.15, {
          axis: 'along',
          source_url: DRAWING,
          seen_at: SEEN,
          note: {
            tr: `Arka kanadın kök veçhesinin toplam uzunluğa oranı. Çizimde 152 px / 1015 px. ${READ_NOTE.tr}`,
            en: `Aft fin root chord as a fraction of total length. 152 px of 1015 px in the drawing. ${READ_NOTE.en}`
          }
        }),
        taper: reading(0.86, {
          axis: 'along',
          source_url: DRAWING,
          seen_at: SEEN,
          note: {
            tr: `Uç veçhenin kök veçheye oranı. Çizimde 130 px / 152 px. ${READ_NOTE.tr}`,
            en: `Tip chord as a fraction of root chord. 130 px of 152 px in the drawing. ${READ_NOTE.en}`
          }
        }),
        spanRatio: reading(2.38, {
          axis: 'lateral',
          source_url: DRAWING,
          seen_at: SEEN,
          note: {
            tr: `Kanat ucunun ana gövde yarıçapına oranı. Çizimde zarf tepe değeri 118 px, ana gövde 50 px. Bu oran tamamen radyal: iki ölçü de aynı eksende, yani çizimin boy ölçeğinden bağımsız. ${READ_NOTE.tr}`,
            en: `Fin tip radius as a multiple of main body radius. The envelope peaks at 118 px against 50 px for the main body. The ratio is purely radial: both measurements share an axis, so it does not depend on the drawing's length scale. ${READ_NOTE.en}`
          }
        }),
        rakeDeg: reading(0, {
          axis: 'along',
          source_url: DRAWING,
          seen_at: SEEN,
          note: {
            tr: `Firar kenarı gövde eksenine dik. Çizimde ucun arka ucu kökünkinden 1 px önde, 34 px açıklıkta; çizgi kalınlığının içinde kalıyor. ${READ_NOTE.tr}`,
            en: `The trailing edge is perpendicular to the body axis. In the drawing the tip trailing edge sits 1 px forward of the root across a 34 px span, within the line width. ${READ_NOTE.en}`
          }
        }),
        trailingT: reading(0.992, {
          axis: 'along',
          source_url: DRAWING,
          seen_at: SEEN,
          note: {
            tr: `Firar kenarının gövde üzerindeki yeri, burundan. Çizimde kanat x = 0,008'de bitiyor. ${READ_NOTE.tr}`,
            en: `Position of the trailing edge along the body, from the nose. The fin ends at x = 0.008 in the drawing. ${READ_NOTE.en}`
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
      id: 'fin-control',
      prefix: 'finControl',
      ratios: {
        count: reading(4, {
          axis: 'lateral',
          source_url: DRAWING,
          seen_at: SEEN,
          note: COUNT_NOTE
        }),
        chordRatio: reading(0.058, {
          axis: 'along',
          source_url: DRAWING,
          seen_at: SEEN,
          note: {
            tr: `Kontrol yüzeyinin kök veçhesinin toplam uzunluğa oranı. Çizimde 59 px / 1015 px. ${READ_NOTE.tr}`,
            en: `Control surface root chord as a fraction of total length. 59 px of 1015 px in the drawing. ${READ_NOTE.en}`
          }
        }),
        taper: reading(0.95, {
          axis: 'along',
          source_url: DRAWING,
          seen_at: SEEN,
          note: {
            tr: `Uç veçhenin kök veçheye oranı. Çizimde 56 px / 59 px; yüzey neredeyse dikdörtgen. ${READ_NOTE.tr}`,
            en: `Tip chord as a fraction of root chord. 56 px of 59 px in the drawing; the surface is nearly rectangular. ${READ_NOTE.en}`
          }
        }),
        spanRatio: reading(1.74, {
          axis: 'lateral',
          source_url: DRAWING,
          seen_at: SEEN,
          note: {
            tr: `Uç yarıçapının ana gövde yarıçapına oranı. Çizimde zarf tepe değeri 87 px, gövde 50 px. ${READ_NOTE.tr}`,
            en: `Tip radius as a multiple of main body radius. The envelope peaks at 87 px against 50 px for the body. ${READ_NOTE.en}`
          }
        }),
        rakeDeg: reading(0, {
          axis: 'along',
          source_url: DRAWING,
          seen_at: SEEN,
          note: {
            tr: `Firar kenarı gövde eksenine dik. Çizimde ucun arka ucu kökle aynı sütunda. ${READ_NOTE.tr}`,
            en: `The trailing edge is perpendicular to the body axis. In the drawing the tip trailing edge shares a column with the root. ${READ_NOTE.en}`
          }
        }),
        trailingT: reading(0.823, {
          axis: 'along',
          source_url: DRAWING,
          seen_at: SEEN,
          note: {
            tr: `Firar kenarının yeri. Çizimde x = 0,177, yani geçiş konisinin hemen önünde. ${READ_NOTE.tr}`,
            en: `Position of the trailing edge. At x = 0.177 in the drawing, just forward of the transition cone. ${READ_NOTE.en}`
          }
        }),
        thicknessRatio: chosen(0.03, {
          note: {
            tr: 'Kalınlığın yerel veçheye oranı. ÇİZİMDEN OKUNAMAZ: çizgi görünüş yüzey kalınlığı taşımıyor.',
            en: 'Thickness as a fraction of local chord. NOT READABLE FROM THE DRAWING: a line view carries no surface thickness.'
          }
        })
      }
    },
    {
      id: 'wing-mid',
      prefix: 'wingMid',
      ratios: {
        count: reading(4, {
          axis: 'lateral',
          source_url: DRAWING,
          seen_at: SEEN,
          note: COUNT_NOTE
        }),
        chordRatio: reading(0.112, {
          axis: 'along',
          source_url: DRAWING,
          seen_at: SEEN,
          note: {
            tr: `Orta kanadın kök veçhesinin toplam uzunluğa oranı. Çizimde 114 px / 1015 px. ${READ_NOTE.tr}`,
            en: `Mid wing root chord as a fraction of total length. 114 px of 1015 px in the drawing. ${READ_NOTE.en}`
          }
        }),
        taper: reading(0.83, {
          axis: 'along',
          source_url: DRAWING,
          seen_at: SEEN,
          note: {
            tr: `Uç veçhenin kök veçheye oranı. Çizimde 95 px / 114 px. ${READ_NOTE.tr}`,
            en: `Tip chord as a fraction of root chord. 95 px of 114 px in the drawing. ${READ_NOTE.en}`
          }
        }),
        spanRatio: reading(1.74, {
          axis: 'lateral',
          source_url: DRAWING,
          seen_at: SEEN,
          note: {
            tr: `Uç yarıçapının gövde yarıçapına oranı. Çizimde zarf tepe değeri 86 px, gövde 50 px. ${READ_NOTE.tr}`,
            en: `Tip radius as a multiple of body radius. The envelope peaks at 86 px against 50 px for the body. ${READ_NOTE.en}`
          }
        }),
        rakeDeg: reading(-29, {
          axis: 'along',
          source_url: DRAWING,
          seen_at: SEEN,
          note: {
            tr: `Firar kenarı dik DEĞİL: uca doğru buruna yaklaşıyor. Çizimde ucun arka ucu kökünkinden 10 px önde, 18 px açıklıkta; açı arctan(10/18). ${READ_NOTE.tr}`,
            en: `The trailing edge is not perpendicular: it moves toward the nose at the tip. In the drawing the tip trailing edge sits 10 px forward of the root across an 18 px span; the angle is arctan(10/18). ${READ_NOTE.en}`
          }
        }),
        trailingT: reading(0.583, {
          axis: 'along',
          source_url: DRAWING,
          seen_at: SEEN,
          note: {
            tr: `Firar kenarının yeri. Çizimde x = 0,417. ${READ_NOTE.tr}`,
            en: `Position of the trailing edge. At x = 0.417 in the drawing. ${READ_NOTE.en}`
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
