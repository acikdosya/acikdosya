import {chosen, measured, reading} from './ratio';
import {wingedProduct} from './winged';

/**
 * AKINCI dis profili.
 *
 * OLCEK KAYNAKLI, BICIM DEGIL. Modelin olcegi iki yayimlanmis sayidan
 * gelir: uzunluk ve kanat acikligi — content/systems/akinci.json.
 * Asagidaki oranlarin hicbiri yayimlanmis bir sayi degildir.
 *
 * Oranlar olcekten bagimsizdir: uzunluk 12,2 m'den 12,3 m'ye guncellenince
 * (urun brosuru, bkz. revisions) mesh kendiliginden buyudu, bu dosyada
 * bir sey degismedi. Yorumlardaki metre degerleri 12,3 m'ye gore yazili.
 *
 * IZDUSUM SINAVI — 11.09.2026.
 *
 * Oranlarin cogu ureticinin yayimladigi goruntulerden okunmustu ve
 * 'olculmus' sayiliyordu. Sinav yapilinca ikisi ortaya cikti:
 *
 *  1. On gorunus render'i PERSPEKTIF. Ayni karede burun inis takimi ana
 *     tekerleklerden daha asagi projeksiyona dusuyor, ki gercek ucakta
 *     boyle degil. Kanat acikligina (20 m) kalibre edildiginde dikey
 *     stabilize govde ekseninin 3,71 m ustunde cikiyor; yan gorunusten
 *     okunan deger 2,50 m ve yayimlanan 4,1 m toplam yukseklikle o deger
 *     tutuyor. Fark derinlikten: kalibrasyon kanat duzleminde yapiliyor,
 *     kuyruk ~6 m arkada, inis takimi ~2 m onde.
 *  2. "Iki kare %0,2 icinde ortustu" bir ortografiklik kaniti DEGIL.
 *     Iki kare ayni 360° gosterinin kareleri, yani ayni kamerayi
 *     paylasiyorlar. Birbirleriyle tutarli olmalari beklenen sey.
 *
 * Sonuc: yalnizca KANAT DUZLEMI derinligindeki okumalar 'measured'
 * kaldi — uc tane. Baska derinlikten okunanlar ve yan gorunusten gelenler
 * 'reading'e dustu: kaynak adresi ve tarihi duruyor, sinav yapilmadi.
 * Sinavi yapilip gecilmeyen ve gorselden hic cikarilamayanlar 'chosen'.
 *
 * Bu bir duzeltme kaydi DOGURMAZ: revisions yayimlanmis olcu degerleri
 * icindir; bunlar icerik degil kod. Degisen sey degerler degil, degerler
 * hakkindaki iddiamiz.
 *
 * Gorsellerin kendisi depoya GIRMEZ ve saklanmaz — telif BAYKAR'da.
 * Alinan sey goruntu degil, orandir.
 *
 * Kuyruk: tek dikey stabilize ve dibinden cikan yatay stabilize. Ilk
 * surumde V kuyruk cizilmisti; ureticinin on gorunus karesi tek dikey
 * yuzey ile ayri bir yatay yuzey gosteriyor, duzeltildi.
 *
 * Bu topoloji 11.09.2026'da BAGIMSIZ olarak dogrulandi: ucus halindeki
 * bir PT-5 karesi (alttan-arkadan) ve pistte arkadan cekilmis bir kare,
 * tek dikey stabilizeyi ve tabanindan cikan asagi sapan yatay
 * stabilizeyi acikca gosteriyor; ikincisi kanat uclarinin yukari
 * dondugunu de dogruluyor. Fotograflar perspektif ve bilinen bir
 * referans olcu tasimiyor, yani ORAN CIKARILAMAZ — ama bir topoloji
 * iddiasi olcek gerektirmez. Kuyrugun kac yuzeyden olustugu artik uc
 * ayri kameradan geliyor.
 */

/** Ureticinin on gorunus render'i. Perspektif — bkz. dosya basi. */
const FRONT =
  'https://cdn.baykartech.com/media/upload/userFormUpload/RqpaU6eZjeknYwWcpdMVAXYMLRcyuvT3.png';
/** Urun sayfasindaki 360° gosterinin kareleri. */
const TURNTABLE =
  'https://cdn.baykartech.com/static/assets/libs/keyshotxr/img/bayraktar-akinci/';
const SEEN = '2026-09-11';

/** Kanat duzlemi derinliginde okunan oranlarin ortak sinav notu. */
const WING_PLANE = {
  tr: 'Ön görünüş render’ı perspektif: burun iniş takımı ana tekerleklerden daha aşağı projeksiyona düşüyor. Kalibrasyon kanat açıklığına (20 m) yapıldığı için yalnızca kanat düzlemi derinliğindeki okumalar geçerli kalıyor. Bu oran o düzlemde ve bağımsız yeniden okumayla doğrulandı.',
  en: 'The front-view render is perspective: the nose gear projects lower than the main wheels. Calibration is against the 20 m wingspan, so only readings at the wing-plane depth stay valid. This ratio lies in that plane and was confirmed by an independent re-reading.'
};

/**
 * Sayim izdusumden bagimsizdir; ayri bir gerekce tasir.
 *
 * Bir sayiyi perspektif bozamaz: dort gondol perspektifte de dorttur.
 * Bu yuzden sayim, kalibrasyon duzleminin disinda kalsa bile olculmus
 * sayilir.
 */
const COUNT_CHECK = {
  tr: 'Sayım izdüşümden bağımsızdır: perspektif bir görüntüde de sayı değişmez. Bu yüzden kalibrasyon düzleminin dışında kalan bir sayım da ölçülmüş sayılır.',
  en: 'A count does not depend on projection: a perspective image does not change it. So a count outside the calibration plane still counts as measured.'
};

/** Yan gorunusten okunan, sinavi yapilmamis oranlarin ortak durumu. */
const SIDE_NOTE_TR =
  'Üreticinin yan görünüş karesinden okundu. O karenin ortografik olduğu hiç sınanmadı, bu yüzden ölçülmüş sayılmıyor.';
const SIDE_NOTE_EN =
  'Read from the manufacturer’s side-view frame. That frame was never checked for orthographic projection, so it does not count as measured.';

/**
 * Govde kesitinin yarim genislik profili — OVAL DEGIL.
 *
 * `v` dikey konum, `w` yarim genislik; ikisi de en genis noktadaki yarim
 * ene gore normalize. Alttan uste sirali.
 *
 * ALT YARI OLCULDU. Ureticinin on gorunusunde govdenin sol ve sag kenari
 * kanadin altinda kesintisiz gorunuyor; on yedi satirda okundu. Cikan
 * sekil elips DEGIL: ayni uzanimdaki bir elipsten 0,26 yarim ene kadar
 * dar, yani asagi dogru daha hizli daralan bir damla.
 *
 * UST YARI SECILDI. On gorunuste govdenin ustu kanat kokü fairing'i,
 * sirt cikintisi ve dikey stabilize ile ust uste biniyor; hangisinin
 * nerede bittigi bu izdusumden ayrilamiyor. Ust yari, en genis noktadan
 * yukari dogru eliptik olarak kapatildi.
 */
const BODY_SECTION = [
  {v: -1.31, w: 0},
  {v: -1.268, w: 0.089},
  {v: -1.188, w: 0.158},
  {v: -1.11, w: 0.297},
  {v: -1.03, w: 0.396},
  {v: -0.952, w: 0.485},
  {v: -0.872, w: 0.565},
  {v: -0.792, w: 0.623},
  {v: -0.714, w: 0.684},
  {v: -0.634, w: 0.732},
  {v: -0.556, w: 0.792},
  {v: -0.476, w: 0.822},
  {v: -0.396, w: 0.861},
  {v: -0.318, w: 0.901},
  {v: -0.238, w: 0.931},
  {v: -0.16, w: 0.95},
  {v: -0.08, w: 0.98},
  {v: 0, w: 1},
  {v: 0.32, w: 0.968},
  {v: 0.64, w: 0.866},
  {v: 0.96, w: 0.661},
  {v: 1.15, w: 0.439},
  {v: 1.28, w: 0}
];

export const AKINCI = wingedProduct({
  slug: 'akinci',
  category: 'insansiz-hava-araci',
  section: BODY_SECTION,
  ratios: {
    /* --------------------------------------------------------- govde */
    fuselageRatio: measured(0.09, {
      axis: 'lateral',
      source_url: FRONT,
      seen_at: SEEN,
      projection_check: WING_PLANE,
      note: {
        tr: 'Gövde eni. Ön görünüşte 1,13 m okundu; 0,09 × 12,3 m = 1,11 m, %2 içinde. Kanat kökü hizasında, yani kalibrasyon düzleminde.',
        en: 'Fuselage width. The front view reads 1.13 m; 0.09 × 12.3 m = 1.11 m, within 2%. Taken at the wing root station, inside the calibration plane.'
      }
    }),
    noseRatio: reading(0.14, {
      axis: 'along',
      source_url: TURNTABLE,
      seen_at: SEEN,
      note: {
        tr: `Gövdenin tam çapa ulaştığı nokta, t ≈ 0,14. ${SIDE_NOTE_TR}`,
        en: `The station at which the body reaches full diameter, t ≈ 0.14. ${SIDE_NOTE_EN}`
      }
    }),
    tailConeRatio: reading(0.45, {
      axis: 'along',
      source_url: TURNTABLE,
      seen_at: SEEN,
      note: {
        tr: `Daralma t ≈ 0,55'te başlıyor ve kuyruğa kadar sürüyor. ${SIDE_NOTE_TR}`,
        en: `The taper begins at t ≈ 0.55 and runs to the tail. ${SIDE_NOTE_EN}`
      }
    }),
    tailTipRatio: reading(0.22, {
      axis: 'vertical',
      source_url: TURNTABLE,
      seen_at: SEEN,
      note: {
        tr: `Kuyruk ucu çapı gövde çapının yaklaşık beşte biri. ${SIDE_NOTE_TR}`,
        en: `Tail tip diameter is roughly a fifth of the body diameter. ${SIDE_NOTE_EN}`
      }
    }),
    shoulderRatio: chosen(1.18, {
      note: {
        tr: 'Kanat kökündeki omuz şişmesinin gövde yarıçapına oranı. Fairing’in gerçek profili yayımlanmış görsellerden çıkarılamıyor; kanadın gövdeyle düz bir kesişim yerine yumuşak bir geçiş yapması için seçildi.',
        en: 'The wing-root shoulder bulge as a multiple of body radius. The real fairing profile cannot be extracted from published imagery; chosen so the wing meets the body as a soft transition rather than a flat intersection.'
      }
    }),
    shoulderSpread: chosen(0.5, {
      note: {
        tr: 'Omuz şişmesinin kanat veçhesinin önüne ve arkasına yayıldığı pay. Görselden okunamıyor; şişme kanat köküne göre simetrik olsun diye seçildi.',
        en: 'How far the shoulder bulge spreads fore and aft of the wing chord. Not readable from imagery; chosen so the bulge stays symmetric about the wing root.'
      }
    }),

    /* --------------------------------------------------------- kanat */
    wingPositionT: reading(0.27, {
      axis: 'along',
      source_url: TURNTABLE,
      seen_at: SEEN,
      note: {
        tr: `Kanat kökünün hücum kenarı, t ≈ 0,27. ${SIDE_NOTE_TR}`,
        en: `The wing root leading edge sits at t ≈ 0.27. ${SIDE_NOTE_EN}`
      }
    }),
    wingHeightRatio: measured(0.0544, {
      axis: 'vertical',
      source_url: FRONT,
      seen_at: SEEN,
      projection_check: WING_PLANE,
      note: {
        tr: 'Kanat veçhe düzleminin gövde ekseninden dik yüksekliği. Ön görünüşte kanadın orta çizgisi, gövdenin dışında kalan sekiz istasyonda gövde ekseninin 0,669 ± 0,008 m üstünde okundu. Kanat gövdenin ÜZERİNE oturmuyor: bu yükseklik gövdenin üst yüzeyinin biraz altında, yani kanat kanat kökü fairing’inin içinden çıkıyor. Önceki sürümde kanat gövde yüzeyine oturtuluyordu ve omuz şişmesi de eklendiği için açıklığın tamamında 0,36 m yukarıda duruyordu.',
        en: 'Height of the wing chord plane above the body axis. In the front view the wing centreline reads 0.669 ± 0.008 m above the body axis across eight stations outboard of the fuselage. The wing does not sit ON TOP of the body: that height is slightly below the upper surface, so the wing emerges from within the root fairing. The previous version seated the wing on the body surface and added the shoulder bulge, leaving it 0.36 m high across the whole span.'
      }
    }),
    wingRootDropRatio: measured(0.05, {
      axis: 'vertical',
      source_url: FRONT,
      seen_at: SEEN,
      projection_check: WING_PLANE,
      note: {
        tr: 'Kanat gövdeye DÜZ girmiyor. Ön görünüşte orta çizgi gövdenin yanında seyir yüksekliğinin 0,50 m altında başlıyor ve dışa doğru tırmanıyor: 0,93 m açıklıkta 0,40 m, 1,64 m’de 0,57 m, 2,85 m’de 0,71 m. Yarım açıklığa oranı 0,05. Önceki sürümde kanat kökten uca dümdüzdü ve gövde birleşimi gerçeğine benzemiyordu.',
        en: 'The wing does not meet the body level. In the front view the centreline starts 0.50 m below cruise height beside the fuselage and climbs outboard: 0.40 m at 0.93 m of span, 0.57 m at 1.64 m, 0.71 m at 2.85 m. As a fraction of half-span that is 0.05. The previous version ran the wing dead straight from root to tip and the junction did not resemble the real one.'
      }
    }),
    wingRootReachRatio: measured(0.26, {
      axis: 'lateral',
      source_url: FRONT,
      seen_at: SEEN,
      projection_check: WING_PLANE,
      note: {
        tr: 'Kök bağlantısının düzleştiği açıklık. Orta çizgi 2,6 m açıklıkta seyir yüksekliğine oturuyor; yarım açıklığın %26’sı. Ondan sonra kanat kanat ucu kıvrımına kadar düz gidiyor.',
        en: 'The span over which the root joint levels out. The centreline settles at cruise height by 2.6 m of span, 26% of the half-span. Beyond that the wing runs straight until the tip curve.'
      }
    }),
    wingRootExponent: chosen(1.3, {
      note: {
        tr: 'Kök bağlantı eğrisinin üssü. Ölçülen dört istasyona uydurulmuş; üs 1,16 ile 1,57 arasında çıkıyor, ortası alındı. Uydurulan eğri ölçülen noktalardan en çok 0,03 m sapıyor. Değerin kendisi ölçülmüş bir sayı değil, eğrinin parametresi.',
        en: 'Exponent of the root joint curve. Fitted to four measured stations, where it comes out between 1.16 and 1.57, and the middle was taken. The fitted curve departs from the measured points by at most 0.03 m. The number itself is not a measurement but a parameter of the curve.'
      }
    }),
    wingChordRatio: reading(0.22, {
      axis: 'along',
      source_url: TURNTABLE,
      seen_at: SEEN,
      note: {
        tr: `Kök veçhe yaklaşık 2,7 m. ${SIDE_NOTE_TR}`,
        en: `The root chord is about 2.7 m. ${SIDE_NOTE_EN}`
      }
    }),
    wingTaper: reading(0.35, {
      axis: 'along',
      source_url: TURNTABLE,
      seen_at: SEEN,
      note: {
        tr: `Uç veçhe kök veçhenin üçte birinden biraz fazlası. ${SIDE_NOTE_TR}`,
        en: `The tip chord is a little over a third of the root chord. ${SIDE_NOTE_EN}`
      }
    }),
    wingRakeDeg: chosen(0, {
      note: {
        tr: 'Kanadın firar kenarı gövde eksenine dik alındı. Ok açısı yalnız üst görünüşten okunur; 360° gösteri yatay yörüngede dönüyor ve üst kare yok, bu yüzden ne hücum ne firar kenarının eğimi ölçülebiliyor. Temiz bir üst görünüş bulunursa ölçülebilir.',
        en: 'The wing trailing edge is taken as perpendicular to the body axis. Sweep can only be read from a top view; the 360-degree viewer orbits horizontally and has no top frame, so neither edge can be measured. A clean top view would settle it.'
      }
    }),
    wingThicknessRatio: measured(0.152, {
      axis: 'vertical',
      source_url: FRONT,
      seen_at: SEEN,
      projection_check: WING_PLANE,
      note: {
        tr: 'Kalınlığın YEREL veçheye oranı. Ön görünüşte kanat kalınlığı kökte 0,32 m, 9,3 m açıklıkta 0,15 m; on ayrı istasyonda yerel veçheye bölündüğünde oran 0,152 ± 0,004 çıkıyor, yani açıklık boyunca sabit. Önceki sürümde 0,09 seçilmiş bir değerdi ve kök veçhesine uygulanıp açıklığın tamamında SABİT kalınlık veriyordu; ölçüm bunun iki ucu birden tutturamadığını gösterdi. Kuyruk yüzeyleri bu oranı devralıyor: ölçüm kanatta yapıldı, dikey ve yatay stabilizenin kesiti için ayrı bir okuma yok.',
        en: 'Thickness as a fraction of LOCAL chord. The front view reads 0.32 m at the root and 0.15 m at 9.3 m of span; divided by the local chord at ten separate stations the ratio comes out at 0.152 ± 0.004, constant across the span. The previous value of 0.09 was chosen, applied to the root chord and gave CONSTANT thickness across the whole span; the measurement shows that cannot match both ends. The tail surfaces inherit this ratio: it was measured on the wing, and no separate reading of the fin or stabiliser section exists.'
      }
    }),
    filletRatio: chosen(0.55, {
      note: {
        tr: 'Kanat kökündeki yuvarlatmanın kalınlığa oranı. Görselden çıkarılamıyor; gövdeyle yumuşak bir geçiş için seçildi.',
        en: 'Root fillet radius as a fraction of thickness. Not extractable from imagery; chosen for a soft transition into the body.'
      }
    }),

    /* ---------------------------------------------- kanat ucu kivrimi */
    tipReachRatio: measured(0.125, {
      axis: 'lateral',
      source_url: FRONT,
      seen_at: SEEN,
      projection_check: WING_PLANE,
      note: {
        tr: 'Kanat ucu kıvrımının kapladığı yatay pay. Ön görünüşte kanadın orta çizgisi 8,73 m açıklığa kadar düz gidiyor, oradan uca (9,98 m) doğru yükseliyor — yani kıvrım son 1,25 m’de, yarım açıklığın %12,5’inde. Önceki sürümde %7 yazıyordu ve kıvrım tek bir sert köşeydi.',
        en: 'Horizontal extent of the wing tip curve. In the front view the wing centreline runs flat out to 8.73 m of span, then rises toward the tip at 9.98 m, so the curve occupies the last 1.25 m, 12.5% of the half-span. The previous value was 7% and the curve was a single sharp corner.'
      }
    }),
    tipRiseRatio: measured(0.0518, {
      axis: 'vertical',
      source_url: FRONT,
      seen_at: SEEN,
      projection_check: WING_PLANE,
      note: {
        tr: 'Kanat ucunun toplam dik yükselişi, yarım açıklığa oranla. Ön görünüşte orta çizgi 8,73 m’den uca kadar 0,518 m yükseliyor. Dikey bir okuma ama kanat düzlemi derinliğinde, yani perspektiften etkilenmiyor.',
        en: 'Total rise of the wing tip, as a fraction of half-span. In the front view the centreline climbs 0.518 m from 8.73 m of span to the tip. A vertical reading, but at wing-plane depth and so unaffected by perspective.'
      }
    }),
    tipExponent: chosen(2.7, {
      note: {
        tr: 'Kıvrım eğrisinin üssü. Ölçülen yükseliş profiline uydurulmuş: yedi istasyonda üs 2,5 ile 2,9 arasında çıkıyor, ortası alındı. Değerin kendisi ölçülmüş bir sayı değil, ölçülen noktalara geçirilen eğrinin parametresi — bu yüzden seçilmiş sayılıyor.',
        en: 'Exponent of the tip curve. Fitted to the measured rise profile: across seven stations the exponent comes out between 2.5 and 2.9, and the middle was taken. The number itself is not a measurement but a parameter of the curve fitted through measured points, so it counts as chosen.'
      }
    }),

    /* ---------------------------------------------- dikey stabilize */
    finPositionT: reading(0.8, {
      axis: 'along',
      source_url: TURNTABLE,
      seen_at: SEEN,
      note: {
        tr: `Dikey stabilizenin kök hücum kenarı, t ≈ 0,80. ${SIDE_NOTE_TR}`,
        en: `The fin root leading edge sits at t ≈ 0.80. ${SIDE_NOTE_EN}`
      }
    }),
    finHeightRatio: reading(0.203, {
      axis: 'vertical',
      source_url: TURNTABLE,
      seen_at: SEEN,
      note: {
        tr: `Üst kenar gövde ekseninin 2,50 m üstünde. Değer yayımlanan 4,1 m toplam yükseklikle tutuyor (2,50 + yerden gövde eksenine 1,60 m), ama bu tutarlılık karenin ortografik olduğunu göstermez. Ön görünüşten okunduğunda 3,71 m çıkıyor; aradaki fark perspektiften. ${SIDE_NOTE_TR}`,
        en: `The top edge sits 2.50 m above the body axis. The value reconciles with the published 4.1 m overall height (2.50 plus 1.60 m from ground to axis), but that consistency does not prove the frame is orthographic. Read off the front view it comes out at 3.71 m; the gap is perspective. ${SIDE_NOTE_EN}`
      }
    }),
    finChordRatio: reading(0.18, {
      axis: 'along',
      source_url: TURNTABLE,
      seen_at: SEEN,
      note: {
        tr: `Kök veçhe t 0,80–0,98 arası, yaklaşık 2,2 m. ${SIDE_NOTE_TR}`,
        en: `The root chord spans t 0.80 to 0.98, about 2.2 m. ${SIDE_NOTE_EN}`
      }
    }),
    finTaper: reading(0.45, {
      axis: 'along',
      source_url: TURNTABLE,
      seen_at: SEEN,
      note: {
        tr: `Uç veçhe t 0,88–0,96 arası, yaklaşık 1,0 m. ${SIDE_NOTE_TR}`,
        en: `The tip chord spans t 0.88 to 0.96, about 1.0 m. ${SIDE_NOTE_EN}`
      }
    }),
    finSweepDeg: reading(22, {
      axis: 'vertical',
      source_url: TURNTABLE,
      seen_at: SEEN,
      note: {
        tr: `Dikey stabilizenin HÜCUM kenarı 2,50 m yükselirken 0,99 m geri kaçıyor. Ölçülen kenar bu olduğu için ok açısı olarak kaydediliyor; firar kenarına çevirmek ölçümü bir dönüşümden geçirip kaynağından koparırdı. ${SIDE_NOTE_TR}`,
        en: `The fin LEADING edge sweeps back 0.99 m while rising 2.50 m. That is the edge that was read, so it is recorded as sweep; converting it to a trailing-edge rake would put the measurement through a transform and cut it from its source. ${SIDE_NOTE_EN}`
      }
    }),

    /* ---------------------------------------------- yatay stabilize */
    stabPositionT: chosen(0.84, {
      note: {
        tr: 'Yatay stabilizenin gövde boyunca yeri yan görünüşte dikey stabilizenin arkasında kalıyor, okunamıyor. Dikey stabilizenin kök veçhesi içine denk gelecek bir değer alındı.',
        en: 'In side view the horizontal stabiliser hides behind the fin and cannot be read. A value falling inside the fin root chord was taken.'
      }
    }),
    stabSpanRatio: reading(0.25, {
      axis: 'lateral',
      source_url: FRONT,
      seen_at: SEEN,
      note: {
        tr: 'Ön görünüşte açıklık 5,10 m okundu; 0,25 × 20 m = 5,00 m. Yatay bir okuma ama kuyruk kalibrasyon düzleminin yaklaşık 6 m arkasında, bu yüzden sınav geçmiş sayılmıyor.',
        en: 'The front view reads a 5.10 m span; 0.25 × 20 m = 5.00 m. A horizontal reading, but the tail sits about 6 m behind the calibration plane, so the check does not pass.'
      }
    }),
    stabChordRatio: chosen(0.11, {
      note: {
        tr: 'Veçhe yan görünüşte gövdenin arkasında kalıyor. Dikey stabilizenin kök veçhesinin üçte ikisi kadar alındı.',
        en: 'The chord is hidden behind the body in side view. It was taken as two thirds of the fin root chord.'
      }
    }),
    stabRakeDeg: chosen(0, {
      note: {
        tr: 'Yatay stabilizenin firar kenarı gövde eksenine dik alındı. Yan görünüşte stabilize dikey stabilizenin arkasında kalıyor, ön görünüşte ise veçhe okunamıyor.',
        en: 'The horizontal stabiliser trailing edge is taken as perpendicular to the body axis. In side view it hides behind the fin, and a front view cannot show chord.'
      }
    }),
    stabAnhedralDeg: reading(6.5, {
      axis: 'vertical',
      source_url: FRONT,
      seen_at: SEEN,
      note: {
        tr: 'Ön görünüşte uç, köke göre 0,22 m aşağıda; bağımsız yeniden okuma 5,5° verdi. Kuyruk kalibrasyon düzleminin dışında olduğu için sınav geçmiş sayılmıyor.',
        en: 'In the front view the tip sits 0.22 m below the root; an independent re-reading gives 5.5 degrees. The tail lies outside the calibration plane, so the check does not pass.'
      }
    })
  },
  extras: {
    /* ------------------------------------------------ govde kesiti */
    bodySectionLowerRatio: measured(1.31, {
      axis: 'vertical',
      source_url: FRONT,
      seen_at: SEEN,
      projection_check: WING_PLANE,
      note: {
        tr: 'Gövde kesitinin en geniş noktasından aşağı uzanımı, yarım ene oranla. Ön görünüşte gövdenin iki kenarı kanadın altında kesintisiz görünüyor ve on yedi satırda okundu. Çıkan şekil ELİPS DEĞİL: aynı uzanımdaki bir elipsten 0,26 yarım ene kadar dar, yani aşağı doğru daha hızlı daralan bir damla. Profilin tamamı lib/geometry/akinci.ts içindeki BODY_SECTION dizisinde; bir oran değil bir biçim olduğu için oran tablosunda tek sayı olarak duramıyor, kökeni bu kayıtta.',
        en: 'Downward extent of the body section from its widest point, as a fraction of half-width. In the front view both sides of the body are visible without a break below the wing and were read across seventeen rows. The resulting shape is NOT an ellipse: it is up to 0.26 half-widths narrower than one of the same extent, a teardrop that narrows faster toward the bottom. The full profile lives in the BODY_SECTION array in lib/geometry/akinci.ts; being a shape rather than a ratio it cannot sit in the table as one number, so its origin is recorded here.'
      }
    }),
    bodySectionUpperRatio: chosen(1.28, {
      note: {
        tr: 'Kesitin en geniş noktasından yukarı uzanımı. Ön görünüşte gövdenin üstü kanat kökü fairing’i, sırt çıkıntısı ve dikey stabilize ile üst üste biniyor; hangisinin nerede bittiği bu izdüşümden ayrılamıyor. Üst yarı en geniş noktadan yukarı eliptik olarak kapatıldı. Temiz bir arka veya yan görünüş bulunursa ölçülebilir.',
        en: 'Upward extent of the section from its widest point. In the front view the top of the body overlaps the wing-root fairing, the dorsal spine and the fin, and this projection cannot separate where each one ends. The upper half was closed elliptically from the widest point. A clean rear or side view would settle it.'
      }
    }),
    crossAspect: reading(1.28, {
      axis: 'vertical',
      source_url: FRONT,
      seen_at: SEEN,
      note: {
        tr: 'Gövde dönel değil: ön görünüşte 1,13 m en, ~1,45 m boy. Oran kalibrasyon düzleminde okundu ama gövdenin ÜST kenarı kanat kökü omuz şişmesinin altında kalıyor, yani okunan yükseklik bir ÜST SINIR. Gerçek oran 1,28’den küçük olabilir; dairesel kesit ise açıkça yanlış — yerden çekilmiş bir burun fotoğrafı da gövdeyi yuvarlak değil, dikeyde uzamış gösteriyor.',
        en: 'The body is not a solid of revolution: the front view gives 1.13 m of width and about 1.45 m of height. The ratio was read in the calibration plane, but the body’s upper edge hides under the wing-root shoulder, so the height is an UPPER BOUND. The true ratio may be below 1.28; a circular section is clearly wrong.'
      }
    }),

    /* ------------------------------------------- motor ve pervane */
    nacelleCount: measured(2, {
      axis: 'lateral',
      source_url: FRONT,
      seen_at: SEEN,
      projection_check: COUNT_CHECK,
      note: {
        tr: 'İki motor gondolu, kanadın altında.',
        en: 'Two engine nacelles, under the wing.'
      }
    }),
    nacelleSpanRatio: measured(0.22, {
      axis: 'lateral',
      source_url: FRONT,
      seen_at: SEEN,
      projection_check: WING_PLANE,
      note: {
        tr: 'Gondol merkezleri merkez hattından ±2,20 m, yani yarım açıklığın %22’si. Kanat düzleminde, kalibrasyonun tam üstünde.',
        en: 'Nacelle centres sit ±2.20 m from the centreline, 22% of the half-span. In the wing plane, right on the calibration.'
      }
    }),
    nacelleDiameterRatio: measured(0.0545, {
      axis: 'lateral',
      source_url: FRONT,
      seen_at: SEEN,
      projection_check: WING_PLANE,
      note: {
        tr: 'Gondol eni 0,67 m; gövde boyunun %5,45’i.',
        en: 'Nacelle width measures 0.67 m, 5.45% of body length.'
      }
    }),
    nacelleDropRatio: measured(0.048, {
      axis: 'vertical',
      source_url: FRONT,
      seen_at: SEEN,
      projection_check: WING_PLANE,
      note: {
        tr: 'Gondol ekseni kanat düzleminin 0,59 m altında. Dikey bir okuma ama kanat düzlemi derinliğinde, yani perspektiften etkilenmiyor.',
        en: 'The nacelle axis sits 0.59 m below the wing plane. A vertical reading, but at wing-plane depth and so unaffected by perspective.'
      }
    }),
    nacelleLengthRatio: chosen(0.17, {
      note: {
        tr: 'Gondol boyu ön görünüşten okunamaz — o izdüşümde gondol uçtan görünüyor. Kanat kök veçhesini örtecek bir uzunluk seçildi.',
        en: 'Nacelle length cannot be read from a front view, where the nacelle is seen end-on. A length that covers the wing root chord was chosen.'
      }
    }),
    nacellePositionT: chosen(0.22, {
      note: {
        tr: 'Gondolun gövde boyunca yeri ön görünüşten okunamaz. Kanat hücum kenarının biraz önünde başlayacak bir değer alındı.',
        en: 'The nacelle station along the body cannot be read from a front view. A value starting slightly ahead of the wing leading edge was taken.'
      }
    }),
    propDiameterRatio: reading(0.163, {
      axis: 'lateral',
      source_url: FRONT,
      seen_at: SEEN,
      note: {
        tr: 'Kanat uçları göbekten en uzak 1,01 m’de okundu, yani ~2,0 m çap. Pervane diski kanat düzleminin ÖNÜNDE döndüğü için kalibrasyon orada geçerli değil; okuma kayda geçiyor ama ölçülmüş sayılmıyor.',
        en: 'Blade tips read at most 1.01 m from the hub, so about 2.0 m across. The propeller disc turns AHEAD of the wing plane, where the calibration does not hold; the reading is recorded but does not count as measured.'
      }
    }),
    propBladeCount: measured(5, {
      axis: 'lateral',
      source_url: FRONT,
      seen_at: SEEN,
      projection_check: COUNT_CHECK,
      note: {
        tr: 'Beş kanat, göbek etrafında eşit aralıklı. Ölçülen açı farkları 63°–81° arasında, beş kanadın beklediği 72°’nin etrafında. Sayım BAĞIMSIZ olarak doğrulandı: park halindeki bir uçağın yerden çekilmiş fotoğrafında da beş kanat sayılıyor. İki ayrı kamera, aynı sayı.',
        en: 'Five blades, evenly spaced about the hub. Measured angular gaps run 63 to 81 degrees, around the 72 degrees five blades imply. The count was confirmed INDEPENDENTLY: a ground-level photograph of a parked aircraft also shows five blades. Two separate cameras, the same number.'
      }
    }),
    propHubRatio: chosen(0.14, {
      note: {
        tr: 'Göbek çapının disk yarıçapına oranı. Görselde göbek kaportanın içinde kalıyor; okunabilir bir şema için seçildi.',
        en: 'Hub diameter as a fraction of disc radius. In the image the hub sits inside its cowling; chosen for a readable schematic.'
      }
    }),
    propChordRatio: chosen(0.1, {
      note: {
        tr: 'Kanat veçhesinin disk yarıçapına oranı. Kanat profili modellenmiyor; ince bir plaka şematik dili koruyor.',
        en: 'Blade chord as a fraction of disc radius. The blade aerofoil is not modelled; a thin plate keeps the schematic language.'
      }
    }),

    /* --------------------------------------------- yuk istasyonu */
    pylonSpanInnerRatio: measured(0.37, {
      axis: 'lateral',
      source_url: FRONT,
      seen_at: SEEN,
      projection_check: WING_PLANE,
      note: {
        tr: 'İç yük istasyonu merkez hattından 3,70 m. Yalnızca pilon çizilir; taşınan mühimmat modellenmez (CLAUDE.md §5.4, §5.7).',
        en: 'The inner load station sits 3.70 m from the centreline. Only the pylon is drawn; carried stores are not modelled.'
      }
    }),
    pylonSpanMiddleRatio: measured(0.45, {
      axis: 'lateral',
      source_url: FRONT,
      seen_at: SEEN,
      projection_check: WING_PLANE,
      note: {
        tr: 'Orta yük istasyonu merkez hattından 4,50 m.',
        en: 'The middle load station sits 4.50 m from the centreline.'
      }
    }),
    pylonSpanOuterRatio: measured(0.489, {
      axis: 'lateral',
      source_url: FRONT,
      seen_at: SEEN,
      projection_check: WING_PLANE,
      note: {
        tr: 'Dış yük istasyonu merkez hattından 4,89 m.',
        en: 'The outer load station sits 4.89 m from the centreline.'
      }
    }),
    pylonPositionT: chosen(0.33, {
      note: {
        tr: 'Pilonun gövde boyunca yeri ön görünüşten okunamaz. Kanat veçhesinin içine denk gelen bir değer alındı.',
        en: 'The pylon station along the body cannot be read from a front view. A value falling inside the wing chord was taken.'
      }
    }),
    pylonLengthRatio: chosen(0.022, {
      note: {
        tr: 'Pilonun kanat altına sarkma payı. Mühimmat çizilmediği için pilon kısa tutuldu; uzun bir pilon olmayan bir yükü ima ederdi.',
        en: 'How far the pylon hangs below the wing. Since no store is drawn the pylon is kept short; a long one would imply a load that is not there.'
      }
    }),
    pylonRadiusRatio: chosen(0.004, {
      note: {
        tr: 'Pilon kalınlığı. Görselde mühimmatın arkasında kalıyor; ince bir çubuk seçildi.',
        en: 'Pylon thickness. In the image it hides behind the stores; a thin rod was chosen.'
      }
    }),

    /* ------------------------------------------------ inis takimi */
    mainGearSpanRatio: reading(0.137, {
      axis: 'lateral',
      source_url: FRONT,
      seen_at: SEEN,
      note: {
        tr: 'Ana tekerlekler merkez hattından ±1,37 m. Takım kalibrasyon düzleminin önünde ve altında kaldığı için okuma sınavı geçmiyor; önceki sürümde yanlışlıkla ölçülmüş sayılıyordu.',
        en: 'The main wheels sit ±1.37 m from the centreline. The gear lies ahead of and below the calibration plane, so the reading does not pass the check; the previous version wrongly counted it as measured.'
      }
    }),
    mainGearAttachRatio: reading(0.055, {
      axis: 'lateral',
      source_url: FRONT,
      seen_at: SEEN,
      note: {
        tr: 'Bacağın gövdeye bağlandığı yanal konum. Ön görünüşte bacak izlendiğinde yukarıda 0,73 m, aşağıda 1,26 m yanal duruyor: aşağı inerken DIŞA açılıyor. Yukarı doğru uzatıldığında gövde yanına, 0,55 m’ye denk geliyor. Park halindeki uçağın burun fotoğrafı da aynı düzeni gösteriyor — bacaklar gövdenin yanından çıkıp tekerleklere doğru yayılıyor. Önceki sürümde bacak gondola bağlanmış ve tekerleğe doğru İÇE eğilmişti; bu yanlıştı.',
        en: 'Lateral station where the leg meets the body. Tracking the leg in the front view it sits 0.73 m out at the top and 1.26 m out at the bottom: it splays OUTWARD as it descends. Extrapolated upward it meets the body side at 0.55 m. The nose-on photograph of a parked aircraft shows the same arrangement, the legs emerging beside the fuselage and spreading toward the wheels. The previous version attached the leg to the nacelle and raked it INWARD toward the wheel, which was wrong.'
      }
    }),
    mainGearPositionT: chosen(0.36, {
      note: {
        tr: 'Ana takımın gövde boyunca yeri ön görünüşten okunamaz. Gondolların arkasına denk gelen bir değer alındı.',
        en: 'The main gear station along the body cannot be read from a front view. A value behind the nacelles was taken.'
      }
    }),
    noseGearPositionT: chosen(0.14, {
      note: {
        tr: 'Burun takımının gövde boyunca yeri ön görünüşten okunamaz. Burun bölümünün bittiği yere denk gelen bir değer alındı.',
        en: 'The nose gear station cannot be read from a front view. A value at the end of the nose section was taken.'
      }
    }),
    strutRadiusRatio: reading(0.0073, {
      axis: 'lateral',
      source_url: FRONT,
      seen_at: SEEN,
      note: {
        tr: 'Bacak kalınlığı ön görünüşte 0,18 m okundu. Burun takımı kalibrasyon düzleminin yaklaşık 2 m önünde, o yüzden ölçülmüş sayılmıyor.',
        en: 'Strut thickness reads 0.18 m in the front view. The nose gear sits about 2 m ahead of the calibration plane, so it does not count as measured.'
      }
    }),
    wheelDiameterRatio: reading(0.0252, {
      axis: 'vertical',
      source_url: FRONT,
      seen_at: SEEN,
      note: {
        tr: 'Tekerlek çapı 0,31 m okundu. Takım kalibrasyon düzleminin altında ve önünde; okuma kayda geçiyor ama sınavdan geçmiyor.',
        en: 'Wheel diameter reads 0.31 m. The gear sits below and ahead of the calibration plane; the reading is recorded but does not pass the check.'
      }
    })
  }
});
