import {wingStations} from './panel';
import type {LatheStation, Part, SectionPoint} from './parts';
import {partsBounds, vec3} from './parts';
import {defineProduct} from './product';
import {chosen, measured, reading, type RatioAxis} from './ratio';

/**
 * Bayraktar TB2 dış profili.
 *
 * Ölçek güncel ürün sayfasındaki 6,4 m uzunluk, 12 m kanat açıklığı ve
 * 2,2 m yükseklikten gelir. KeyShotXR bir model dosyası sunmuyor; 16 PNG
 * karesi var. Bu yüzden hazır mesh alınmadı, dış oranlar karelerden okundu.
 *
 * Okuma ölçeği: yan görünüşte (0_4) burun ucundan kiriş ucuna 947 px, ön
 * görünüşte (0_8) kanat açıklığı 1798 px. Boyuna ve dikey oranlar 947'ye,
 * yanal oranlar açıklığa bölünür. Dikey konumlar gövde ORTA ÇİZGİSİNE
 * göredir: en derin kesitin (üst 362, alt 480 px) ortası, 421 px.
 *
 * Kareler aynı çevrimsel gösteriden; zıt yönlerden alınan kare çiftleri
 * birbirinin aynası (ön↔arka, 45° çiftleri, %0,4 içinde) ve bu yalnız
 * ortografik kamerada olur. Yine de §9 aynı gösterinin karelerini sınav
 * saymıyor: okumalar 'reading', görülemeyenler 'chosen'. Kayıtta yaklaşık
 * 0,26° yatış var — ön görünüşte sağ kanat ucu 8 px yukarıda; iki yanın
 * ortalaması alındı. Kaynak görseller depoya alınmaz; yalnızca oranlar ve
 * adresleri kalır.
 */
const FRAMES =
  'https://cdn.baykartech.com/static/assets/libs/keyshotxr/img/bayraktar-tb2/';
const SIDE = `${FRAMES}0_4.png`;
const REAR = `${FRAMES}0_0.png`;
const FRONT = `${FRAMES}0_8.png`;
const OBLIQUE = `${FRAMES}0_2.png`;
const SEEN = '2026-11-17';

function observed(
  value: number,
  axis: RatioAxis,
  source_url: string,
  tr: string,
  en: string
) {
  return reading(value, {axis, source_url, seen_at: SEEN, note: {tr, en}});
}

const COUNT_CHECK = {
  tr: 'Sayım izdüşümden bağımsızdır: kamera açısı kiriş, pervane kanadı veya pilon sayısını değiştirmez.',
  en: 'A count is projection-independent: camera angle does not change the number of booms, propeller blades, or pylons.'
};

/**
 * Gövde kesiti, yarım derinlik (v) ve yarım en (w) birimiyle.
 *
 * Üst yarı ön görünüşteki satır genişliklerinden: tepede dar, omuzda
 * yuvarlanan bir sırt (362 → 380 px arasında yarım en 0 → 0,76). Alt yarı
 * kanat-gövde kaplamasının arkasında kalıyor; yalnız taban okunuyor (480
 * px'te 0,95 yarım en, düz). Arası seçilmiş: düz yanlar, yuvarlatılmış
 * alt köşe.
 */
const BODY_SECTION: SectionPoint[] = [
  {v: -1, w: 0},
  {v: -1, w: 0.8},
  {v: -0.985, w: 0.9},
  {v: -0.95, w: 0.96},
  {v: -0.86, w: 0.99},
  {v: -0.6, w: 1},
  {v: 0.1, w: 1},
  {v: 0.27, w: 0.96},
  {v: 0.5, w: 0.88},
  {v: 0.695, w: 0.755},
  {v: 0.78, w: 0.713},
  {v: 0.864, w: 0.628},
  {v: 0.949, w: 0.415},
  {v: 0.985, w: 0.22},
  {v: 1, w: 0}
];

function smoothstep(t: number): number {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
}

export const TB2 = defineProduct({
  slug: 'tb2',
  category: 'insansiz-hava-araci',
  requires: ['length_m', 'wingspan_m'],
  dimensionOffsetRatio: 3.2,
  ratios: {
    /* ------------------------------------------------------------ gövde */
    bodyDepthRatio: observed(
      0.1246,
      'vertical',
      SIDE,
      'Gövdenin en derin kesiti yan görünüşte 118 px (üst 362, alt 480); 947 px uzunluğa oranı 0,125. Ön görünüşte de üst sınır 362 px.',
      'The deepest fuselage section reads 118 px in side view (top 362, bottom 480), 0.125 of the 947 px length. The front view shows the same top at 362 px.'
    ),
    bodyWidthRatio: observed(
      0.051,
      'lateral',
      FRONT,
      'Gövde eni ön görünüşte kanadın üstünde 87–90 px, tabanda 89 px; açıklığa (1798 px) oranı yaklaşık 0,051. 420–470 px arası kanat-gövde kaplamasının arkasında, orada okunamıyor.',
      'The fuselage reads 87–90 px wide above the wing and 89 px at the floor in front view, about 0.051 of the 1798 px span. Between 420 and 470 px it is hidden behind the wing-body fairing.'
    ),
    noseTipDropRatio: observed(
      0.0422,
      'vertical',
      SIDE,
      'Burun ucu gövde orta çizgisinin 40 px altında; burun sarkık, üst çizgi uca doğru uzun bir eğriyle iniyor.',
      'The nose tip sits 40 px below the fuselage mid-line; the nose droops and the upper line falls to it in a long curve.'
    ),
    topRiseEndT: observed(
      0.5,
      'along',
      SIDE,
      'Üst çizgi burundan itibaren yükseliyor ve uzunluğun yarısında (930 px sütunu) en yüksek noktaya ulaşıyor.',
      'The upper line rises from the nose and reaches its highest point at half the length (column 930 px).'
    ),
    noseTopExponent: chosen(0.5, {
      note: {
        tr: 'Üst çizgi yan görünüşte 40 sütunda okundu; burundan en yüksek noktaya kadar karekök eğrisi noktaları 2 px içinde tutuyor (tek tek uydurulan üs 0,43–0,53). Sayı ölçüm değil, ölçülen noktalardan geçen eğrinin parametresi.',
        en: 'The upper line was read at 40 columns in side view; a square-root curve from the nose to the highest point stays within 2 px of them (per-point exponents 0.43–0.53). The number is not a measurement but a parameter of the curve through measured points.'
      }
    }),
    noseBottomT: observed(
      0.12,
      'along',
      SIDE,
      'Alt çizgi burun ucundan çeyrek elips biçiminde iniyor ve uzunluğun %12’sinde düz tabana ulaşıyor; beş sütunda elipsten sapma 2 px’ten az.',
      'The lower line falls from the nose tip as a quarter ellipse and reaches the flat floor at 12 percent of length; five columns depart from the ellipse by under 2 px.'
    ),
    aftTopStartT: observed(
      0.586,
      'along',
      SIDE,
      'Üst çizgi uzunluğun %59’undan sonra gövde sonuna kadar 1–2 px iniyor (362 → 364 px); göbeğe doğru alçalmıyor, gövde küt bitiyor.',
      'After 59 percent of length the upper line drops only 1–2 px to the fuselage end (362 → 364 px); it does not descend to the hub, the fuselage ends bluntly.'
    ),
    bodyEndT: observed(
      0.6,
      'along',
      SIDE,
      'Gri gövde 837 px sütununda küt bitiyor (karşı yan 0_12’de aynası), burundan 3,84 m, %60; arkasında beyaz göbek konisi başlıyor. Kuyruk yüzeylerini yalnız kirişler taşıyor. Önceki okuma koniyi gövdenin daralması sayıp sonu %63,9’a koyuyordu.',
      'The grey fuselage ends bluntly at column 837 px (mirrored in the opposite frame 0_12), 3.84 m from the nose, 60 percent; the white spinner starts behind it. Only the booms carry the tail surfaces. The previous reading took the spinner for the fuselage taper and put the end at 63.9 percent.'
    ),
    bodyEndTopRatio: observed(
      0.0602,
      'vertical',
      SIDE,
      'Gövde sonunda üst çizgi 364 px, orta çizginin 57 px üstünde; arka görünüşte uç yüzeyinin tepesi de 364,5 px.',
      'At the fuselage end the upper line is at 364 px, 57 px above the mid-line; in the rear view the top of the end face is at 364.5 px too.'
    ),
    bodyEndBottomRatio: observed(
      -0.0048,
      'vertical',
      REAR,
      'Gövde sonunun alt kenarı yan görünüşte kirişin arkasında kalıyor. Açıkta kalan alt çizgi (430 → 449 px, 842–860 px sütunları) sona uzatılınca 425,5 px; arka görünüşte uç yüzeyinin koyu alt bandı 423–426 px. Orta çizginin 4,5 px altı.',
      'The lower edge of the fuselage end is hidden behind the boom in side view. The exposed lower line (430 → 449 px over columns 842–860) extended to the end gives 425.5 px; in the rear view the dark lower band of the end face ends at 423–426 px. That is 4.5 px below the mid-line.'
    ),
    bodyEndWidthRatio: observed(
      0.0334,
      'lateral',
      REAR,
      'Arka görünüşte göbek konisini çevreleyen koyu uç yüzeyi göbek yüksekliğine yakın satırlarda merkezden ±29–32 px; 30 px yarım en, 0,40 m tam en, açıklığın %3,34’ü.',
      'In the rear view the dark end face around the spinner reaches ±29–32 px from the centre on rows near hub height; a 30 px half-width, 0.40 m across, 3.34 percent of the span.'
    ),
    aftBottomStartT: chosen(0.55, {
      note: {
        tr: 'Arka gövdenin alt çizgisi büyük ölçüde kanat altındaki dış yüklerin ve iniş takımının arkasında kalıyor; yükselişin başladığı nokta seçildi. Okunan gövde sonuna inen eğri, yan görünüşte açıkta kalan kısma (842–860 px) 3 px içinde oturuyor.',
        en: 'The lower line of the aft fuselage is mostly hidden behind underwing stores and the landing gear; the point where it starts rising was chosen. Running to the read fuselage end, the curve stays within 3 px of the exposed part in side view (842–860 px).'
      }
    }),
    widthFullT: chosen(0.25, {
      note: {
        tr: 'Üst görünüş karesi yok; burnun tam gövde enine ulaştığı nokta seçildi.',
        en: 'There is no top-view frame; the point where the nose reaches full fuselage width was chosen.'
      }
    }),
    aftWidthStartT: chosen(0.5, {
      note: {
        tr: 'Üst görünüş karesi yok; arka gövdenin uç yüzeyine doğru daralmaya başladığı nokta seçildi.',
        en: 'There is no top-view frame; the point where the aft fuselage starts narrowing toward its end face was chosen.'
      }
    }),

    /* ------------------------------------------------------------ kanat */
    wingPositionT: observed(
      0.3516,
      'along',
      SIDE,
      'Yakın kanadın hücum kenarı yan görünüşte iki yükseklikte okunuyor (kök tarafında 357, uçta 395 px); ölçülen ok açısıyla merkez hattına uzatıldığında burundan %35 geride.',
      'The near wing’s leading edge reads at two heights in side view (357 px inboard, 395 px at the tip); extended to the centreline along the measured sweep it sits 35 percent aft of the nose.'
    ),
    wingChordRatio: observed(
      0.1338,
      'along',
      SIDE,
      'Hücum ve firar kenarları merkez hattına uzatıldığında kök veçhesi 127 px; uzunluğa oranı 0,134 (yaklaşık 0,86 m).',
      'With leading and trailing edges extended to the centreline the root chord is 127 px, 0.134 of length (about 0.86 m).'
    ),
    wingTaper: observed(
      0.61,
      'along',
      OBLIQUE,
      'Uç veçhesi 45° karelerinde 75–83 px, yan görünüşte 79 px; kök veçhesine oranı 0,61.',
      'The tip chord reads 75–83 px in the 45° frames and 79 px in side view, 0.61 of the root chord.'
    ),
    wingSweepDeg: observed(
      4.1,
      'along',
      SIDE,
      'Hücum kenarı kökten uca 38 px geriye gidiyor; yaklaşık 4° ok açısı. Firar kenarı neredeyse dik.',
      'The leading edge moves 38 px aft from root to tip, about 4 degrees of sweep. The trailing edge is nearly straight across.'
    ),
    wingHeightRatio: observed(
      -0.02,
      'vertical',
      FRONT,
      'Kanadın veçhe düzlemi ön görünüşte merkez hattına uzatıldığında gövde orta çizgisinin 19 px altında. Kanat yüksek değil; gövdenin orta-alt bölümünden geçiyor.',
      'Extended to the centreline in front view, the wing chord plane sits 19 px below the fuselage mid-line. The wing is not high-mounted; it passes through the lower-middle of the fuselage.'
    ),
    wingDihedralDeg: observed(
      4.9,
      'vertical',
      FRONT,
      'Ön görünüşte sol kanat 4,6°, sağ kanat 5,1° eğimli; fark kayıttaki 0,26° yatıştan. Ortalama 4,9° dihedral, 180 px’ten uca kadar düz bir çizgi.',
      'In front view the left wing slopes 4.6 degrees and the right 5.1; the difference is the 0.26 degree roll in the render. The mean is 4.9 degrees of dihedral, a straight line from 180 px to the tip.'
    ),
    wingThicknessRatio: chosen(0.16, {
      note: {
        tr: 'Ön görünüşteki kanat bandı yerel veçheye bölününce 0,12–0,18 çıkıyor; bant hücum açısını ve kamburluğu da içerdiği için profil kalınlığı ayrılamıyor. Bandı en iyi örten değer seçildi (sekiz karede 0,12 ile 0,18 arasında en iyisi); belirli bir profil iddiası yok. Kuyruk yüzeyleri de bunu kullanır.',
        en: 'The front-view wing band divided by local chord gives 0.12–0.18; the band also contains incidence and camber, so airfoil thickness cannot be separated. The value that best covers the band was chosen (best of 0.12–0.18 across eight frames); no specific airfoil is claimed. The tail surfaces use it too.'
      }
    }),
    filletRatio: chosen(0.7, {
      note: {
        tr: 'Kanat-gövde birleşimindeki fileto yarıçapı ölçülemedi; yumuşak geçiş için seçildi.',
        en: 'The wing-body fillet radius could not be measured; chosen for a smooth transition.'
      }
    }),
    wingFairingSpanRatio: observed(
      0.178,
      'lateral',
      FRONT,
      'Kanat alt yüzeyi gövde tabanına geniş bir V kaplamayla iniyor: alt kenar ön görünüşte ±160 px’ten (440 px yükseklik) gövde yanına (±49 px, 475 px) düz bir çizgi.',
      'The wing underside meets the fuselage floor through a broad V fairing: in front view its lower edge runs in a straight line from ±160 px (at 440 px height) to the fuselage side (±49 px, 475 px).'
    ),
    aileronStartRatio: observed(
      0.62,
      'lateral',
      REAR,
      'Dış kanat kontrol yüzeyi ayrımı açıklığın yaklaşık %62’sinden başlıyor; iç kanat bölümü tek yüzey olarak kalıyor.',
      'The outer control-surface division begins at approximately 62 percent of the span, leaving the inboard wing as one surface.'
    ),
    aileronChordShare: chosen(0.28, {
      note: {
        tr: 'Aileronun yerel veçhedeki payı kaynak karelerden güvenilir ölçülemiyor; firar kenarının %28’i şematik ayrım için seçildi.',
        en: 'The aileron share of local chord cannot be measured reliably; 28 percent of the trailing edge was chosen for the schematic division.'
      }
    }),
    controlSurfaceGapRatio: chosen(0.004, {
      note: {
        tr: 'Ana kanat ile aileron arasındaki görünür ayrım yaklaşık 5 mm çizim boşluğu olarak seçildi; üretim toleransı veya gerçek boşluk iddiası değildir.',
        en: 'The visible division uses an approximately 5 mm drawing gap; it is not a production tolerance or a claim about the real mechanical clearance.'
      }
    }),

    /* ------------------------------------------------------------ kiriş */
    boomOffsetRatio: observed(
      0.1774,
      'lateral',
      REAR,
      'Kuyruk kirişleri arka görünüşte merkezden ±159,5 px; yarım açıklığın %17,7’si.',
      'The tail booms sit ±159.5 px from the centre in the rear view, 17.7 percent of the half-span.'
    ),
    boomStartT: observed(
      0.3636,
      'along',
      SIDE,
      'Kirişler kanadın hücum kenarından başlıyor; kiriş hizasında hücum kenarı burundan %36 geride.',
      'The booms start at the wing leading edge, which sits 36 percent aft of the nose at the boom station.'
    ),
    boomEndT: observed(
      1,
      'along',
      SIDE,
      'Kirişlerin arka ucu ölçülen uzunluğun son noktası; kuyruk firar kenarı 12 px önde bitiyor.',
      'The boom tails are the aftmost point of the measured length; the tail trailing edge ends 12 px ahead of them.'
    ),
    boomHeightRatio: observed(
      -0.009,
      'vertical',
      SIDE,
      'Kirişin gövde arkasında açıkta kalan dört sütundaki orta noktalarından (410, 404,5, 397, 388,5 px) geçen doğru, kanadın hücum kenarında 429,5 px’e uzanıyor: gövde orta çizgisinin 8,5 px altı, kanadın veçhe düzlemiyle aynı yükseklik. Kirişin önü gövde silüetinin içinde kaldığı için doğrudan okunamıyor.',
      'A line through the boom midpoints at the four columns exposed behind the fuselage (410, 404.5, 397, 388.5 px) reaches 429.5 px at the wing leading edge: 8.5 px below the fuselage mid-line, level with the wing chord plane. The forward boom lies inside the fuselage silhouette and cannot be read directly.'
    ),
    boomEndLiftRatio: observed(
      0.0444,
      'vertical',
      SIDE,
      'Aynı doğru kiriş boyunca 42 px yükseliyor; dört noktanın doğrudan sapması 1,5 px’ten az.',
      'The same line climbs 42 px along the boom; the four points depart from it by under 1.5 px.'
    ),
    boomRadiusRatio: observed(
      0.0079,
      'lateral',
      FRONT,
      'Kiriş ön ve arka görünüşte uçtan bakıldığında 12,5–15 px genişliğinde dik bir şerit; yatay yarıçap 7,5 px, uzunluğa oranı 0,008.',
      'Seen end-on in the front and rear views the boom is an upright strip 12.5–15 px wide; a horizontal radius of 7.5 px, 0.008 of length.'
    ),
    boomAspect: observed(
      2.2,
      'vertical',
      SIDE,
      'Kiriş dairesel değil, dik bir oval. Yan görünüşte açıkta kalan dört sütundaki derinlikler (22, 19, 16, 9,5 px) doğrusal daralmaya 1 px içinde oturuyor ve hücum kenarında 33 px’e uzanıyor; uçtan görünüşteki eni 15 px’i geçmiyor.',
      'The boom is not round but an upright oval. Its depths at the four exposed side-view columns (22, 19, 16, 9.5 px) sit within 1 px of a linear taper that reaches 33 px at the leading edge, while its end-on width never exceeds 15 px.'
    ),
    boomTipRatio: observed(
      0.28,
      'vertical',
      SIDE,
      'Aynı doğrusal daralmayla arka uç 9,5 px; ön kesitin %28’i.',
      'On the same linear taper the tail end is 9.5 px, 28 percent of the forward section.'
    ),
    boomFairingLengthRatio: chosen(0.05, {
      note: {
        tr: 'Kiriş kanat hücum kenarında kütle gibi bitmiyor: ön ucu sivrilerek kanada karışıyor (0_5 ve 0_6 karelerinde uç hücum kenarında, yaklaşık 2,35 m). İncelmenin başladığı yer siluet değil gölge sınırı; 0_5’te yaklaşık 0,3 m okunuyor, kesin değil. Uzunluk bu yüzden seçildi; sivri, kirişe teğet bir parabol çizilir.',
        en: 'The boom does not end bluntly at the wing leading edge: its front tapers to a point that blends into the wing (frames 0_5 and 0_6 put the point at the leading edge, about 2.35 m). Where the taper starts is a shading edge, not a silhouette; about 0.3 m in 0_5, not exact. The length is therefore chosen; a pointed parabola tangent to the boom is drawn.'
      }
    }),

    /* ----------------------------------------------------------- kuyruk */
    finPositionT: observed(
      0.8606,
      'along',
      SIDE,
      'Kuyruk yüzeylerinin kök hücum kenarı burundan %86 geride.',
      'The tail-surface root leading edge sits 86 percent aft of the nose.'
    ),
    finChordRatio: observed(
      0.1267,
      'along',
      SIDE,
      'Kuyruk yüzeyi kök veçhesi yan görünüşte 120 px (yaklaşık 0,81 m).',
      'The tail-surface root chord reads 120 px in side view (about 0.81 m).'
    ),
    finTaper: observed(
      0.75,
      'along',
      SIDE,
      'Tepedeki veçhe 90 px; kök veçhesinin %75’i.',
      'The chord at the apex is 90 px, 75 percent of the root chord.'
    ),
    finSweepDeg: observed(
      3.1,
      'along',
      SIDE,
      'Hücum kenarı kökten tepeye 12 px geriye gidiyor; yüzeyin 45° eğimiyle düzlem içinde yaklaşık 3° ok.',
      'The leading edge moves 12 px aft from root to apex; with the surface inclined at 45 degrees that is about 3 degrees of in-plane sweep.'
    ),
    tailAngleDeg: observed(
      45,
      'vertical',
      REAR,
      'İki yüzey kiriş uçlarından merkeze ve yukarı çıkıp tepede birleşiyor; orta çizgi yataydan 45° eğimli ters V.',
      'Both surfaces rise inward from the booms and join at the apex; the centreline forms an inverted V at 45 degrees above horizontal.'
    ),
    tailRootHeightRatio: observed(
      0.0222,
      'vertical',
      FRONT,
      'Kuyruk yüzeyinin orta çizgisi ön görünüşte kiriş hizasına uzatıldığında gövde orta çizgisinin 21 px üstünde. Bu kökten 45° ile merkezde buluşan iki yüzeyin tepesi 234 px’e düşüyor; karede tepe 234 px.',
      'Extended to the boom station in front view, the tail-surface centreline sits 21 px above the fuselage mid-line. Two surfaces rising from there at 45 degrees and meeting at the centre top out at 234 px; the frame shows the apex at 234 px.'
    ),

    /* ---------------------------------------------------------- pervane */
    propPositionT: observed(
      0.617,
      'along',
      SIDE,
      'Yan görünüşte yakın kanat uçtan görünüyor: kesiti göbek konisinin üzerinde 821 px sütununda (karşı yan 0_12’de aynası 1098 px). Burundan 3,95 m, %61,7. Önceki sürüm düzlemi koninin ucuna (%64,3) koyuyordu.',
      'In side view the near blade is seen end-on: its section crosses the spinner at column 821 px (mirrored at 1098 px in the opposite side frame 0_12). That is 3.95 m from the nose, 61.7 percent. The previous version put the plane at the spinner tip (64.3 percent).'
    ),
    propDiameterRatio: observed(
      0.1368,
      'lateral',
      FRONT,
      'Pervane kanatları ön görünüşte yatay duruyor; uçtan uca 246 px, açıklığın %13,7’si (yaklaşık 1,64 m).',
      'The propeller blades stand horizontal in the front view; tip to tip 246 px, 13.7 percent of the span (about 1.64 m).'
    ),
    propHubHeightRatio: observed(
      0.0327,
      'vertical',
      SIDE,
      'Göbek merkezi gövde orta çizgisinin 31 px üstünde: yan görünüşte göbek konisi 382–396 px, ön görünüşte kanat bandı 383–401 px.',
      'The hub centre sits 31 px above the fuselage mid-line: the spinner spans 382–396 px in side view and the blade band 383–401 px in front view.'
    ),
    propBladeCount: measured(2, {
      axis: 'lateral',
      source_url: REAR,
      seen_at: SEEN,
      projection_check: COUNT_CHECK,
      note: {
        tr: 'Arka görünüşte göbeğin iki yanında iki pervane kanadı sayılıyor.',
        en: 'Two propeller blades are visible on opposite sides of the hub in the rear view.'
      }
    }),
    spinnerRadiusRatio: observed(
      0.0238,
      'vertical',
      SIDE,
      'Göbek konisi gövde sonundan 0,15 m yarıçapla çıkıyor: yan görünüşte 833 px’te üst kenar göbek merkezinin 20,5 px üstünde, eğri gövde sonuna uzatılınca 22,5 px. Arka görünüşte beyaz koni ±21–22 px.',
      'The spinner leaves the fuselage end at a 0.15 m radius: in side view its upper edge is 20.5 px above the hub centre at 833 px, 22.5 px when the curve is extended to the fuselage end. In the rear view the white spinner spans ±21–22 px.'
    ),
    spinnerLengthRatio: observed(
      0.0572,
      'along',
      SIDE,
      'Koninin ucu 783 px sütununda, burundan 4,21 m; gövde sonundan 0,37 m.',
      'The spinner tip is at column 783 px, 4.21 m from the nose; 0.37 m behind the fuselage end.'
    ),
    spinnerShapeExponent: observed(
      1.05,
      'along',
      SIDE,
      'Üst kenar r = R·√(1 − sᵖ) eğrisine oturuyor; iki yan karede 108 sütunda karekök ortalama sapma 0,4 px, en büyük 1 px. Üs 1’e çok yakın: koni bir paraboloit.',
      'The upper edge fits r = R·√(1 − sᵖ); over 108 columns in both side frames the root-mean-square deviation is 0.4 px, the largest 1 px. The exponent is close to 1: the spinner is a paraboloid.'
    ),
    propChordRatio: observed(
      0.17,
      'vertical',
      REAR,
      'Arka görünüşte kanat gövdenin dışında kalan iç yarısında 19,75 px yüksek (iki kanat, ön kare 0_8 ile birlikte 256 sütun). Bu, 19° kanat açısıyla eğik görülen veçhe: 0,132 m / cos 19° = 0,14 m, pervane yarıçapının 0,17’si. Yan görünüşte aynı kesit 19 px yüksek, tutarlı.',
      'In the rear view the blade is 19.75 px tall over its inner half outside the fuselage (both blades, with the front frame 0_8: 256 columns). That is the chord seen at the 19 degree blade angle: 0.132 m / cos 19° = 0.14 m, 0.17 of the propeller radius. In side view the same section is 19 px tall, consistent.'
    ),
    propTipChordRatio: observed(
      0.43,
      'vertical',
      REAR,
      'Uçta kanat 8,5 px; en geniş veçhenin %43’ü. Uç kesik, sivri değil.',
      'At the tip the blade is 8.5 px, 43 percent of the widest chord. The tip is cut square, not pointed.'
    ),
    propTaperStartRatio: observed(
      0.46,
      'lateral',
      REAR,
      'Firar kenarı düz (sağ kanatta alt kenar 400–401 px, sol kanatta üst kenar 381 px, 180° döndürülmüş aynı kanat). Hücum kenarı yarıçapın %46’sından sonra geri çekiliyor.',
      'The trailing edge is straight (lower edge 400–401 px on the right blade, upper edge 381 px on the left, the same blade turned 180 degrees). The leading edge recedes after 46 percent of the radius.'
    ),
    propTaperExponent: observed(
      2.2,
      'lateral',
      REAR,
      'Hücum kenarının geri çekilmesi incelme boyunca 2,2 üssüyle büyüyor; 256 sütunda karekök ortalama sapma 0,65 px, en büyük sapma 1,3 px.',
      'The leading-edge recession grows with the 2.2 power along the taper; over 256 columns the root-mean-square deviation is 0.65 px, the largest 1.3 px.'
    ),
    propBladeAngleDeg: observed(
      19,
      'along',
      SIDE,
      'Yan görünüşte uçtan görülen kanat kesiti dikeyden eğik: 0_4’te 19 px boyda 8 px (23°), karşı yan 0_12’de 18 px boyda 5 px (16°); ortalama 19°. Kesit ince bir çizgi, yani kanat boyunca görünür bir burulma yok; burulma çizilmez. Hücum kenarı buruna dönük taraf.',
      'In side view the end-on blade section leans from vertical: 8 px over 19 px in 0_4 (23 degrees), 5 px over 18 px in the opposite frame 0_12 (16 degrees); 19 degrees on average. The section is a thin line, so no twist is visible along the blade; none is drawn. The leading edge is the side facing the nose.'
    ),
    propThicknessRatio: chosen(0.12, {
      note: {
        tr: 'Kanat kalınlığı karelerden ayrılamıyor; okunabilir bir kanat için veçhenin 0,12’si seçildi. Kesit yüzeylerdeki genel kesit: yuvarlak hücum, sivri firar kenarı; belirli bir profil iddiası yok.',
        en: 'Blade thickness cannot be separated in the frames; 0.12 of chord was chosen for a legible blade. The section is the generic surface section: rounded leading edge, sharp trailing edge; no specific airfoil is claimed.'
      }
    }),

    /* ------------------------------------------------------------ taret */
    sensorTurretPositionT: observed(
      0.246,
      'along',
      SIDE,
      'Sensör tareti gövdenin altında, merkezi burundan %25 geride (1172 px sütunu). Önceki sürüm %37 okumuştu.',
      'The sensor turret hangs below the fuselage with its centre 25 percent aft of the nose (column 1172 px). The previous version read 37 percent.'
    ),
    sensorTurretRadiusRatio: observed(
      0.0317,
      'vertical',
      SIDE,
      'Taret yan görünüşte 60 px, ön görünüşte 61 px genişliğinde; yarıçap yaklaşık 0,2 m.',
      'The turret reads 60 px wide in side view and 61 px in front view; a radius of about 0.2 m.'
    ),
    sensorTurretHeightRatio: observed(
      -0.0781,
      'vertical',
      FRONT,
      'Taretin alt noktası 527 px, merkezi 495 px; gövde orta çizgisinin 74 px altında. Üst kısmı gövdenin içinde.',
      'The turret bottoms out at 527 px with its centre at 495 px, 74 px below the fuselage mid-line. Its upper part is inside the fuselage.'
    ),
    sensorWindowRatio: observed(
      0.7,
      'lateral',
      FRONT,
      'Taretin ön yüzündeki koyu optik bölge ön görünüşte yaklaşık 45 px; taret çapının ~%74’ü. Optik veya iç sensör ayrıntısı modellenmez.',
      'The dark optical area on the turret front reads about 45 px in front view, roughly 74 percent of the turret diameter. No optical or internal sensor detail is modelled.'
    ),

    /* ----------------------------------------------- burun altı kaplama */
    ventralFairingPositionT: observed(
      0.037,
      'along',
      SIDE,
      'Burun altında gövde tabanından sarkan uzun, yassı bir kaplama var; ön ucu burundan %3,7 geride (1370 px).',
      'A long, flat fairing hangs below the forward fuselage floor; its front end sits 3.7 percent aft of the nose (1370 px).'
    ),
    ventralFairingLengthRatio: observed(
      0.127,
      'along',
      SIDE,
      'Kaplama yan görünüşte 120 px boyunca uzanıyor (1370 → 1250 px); burun iniş takımı onun altına bağlanıyor.',
      'The fairing runs 120 px in side view (1370 → 1250 px); the nose landing gear attaches beneath it.'
    ),
    ventralFairingDepthRatio: observed(
      0.0127,
      'vertical',
      SIDE,
      'Kaplamanın alt kenarı 492 px; gövde tabanından 12 px aşağıda.',
      'The fairing’s lower edge is at 492 px, 12 px below the fuselage floor.'
    ),
    ventralFairingWidthRatio: chosen(0.7, {
      note: {
        tr: 'Kaplamanın eni taretin önünde kalıyor; ön görünüşteki 61 px’lik band onu aşmadığı için gövde eninin bir payı olarak seçildi.',
        en: 'The fairing width is masked by the turret; the 61 px front-view band does not exceed it, so it was chosen as a share of fuselage width.'
      }
    }),

    /* ------------------------------------------------------ iniş takımı */
    mainGearSpanRatio: observed(
      0.1296,
      'lateral',
      FRONT,
      'Ana tekerlekler ön görünüşte merkezden ±116,5 px; yarım açıklığın %13’ü.',
      'The main wheels sit ±116.5 px from the centre in the front view, 13 percent of the half-span.'
    ),
    mainGearRootSpanRatio: observed(
      0.0662,
      'lateral',
      FRONT,
      'Ana takım bacağı ön görünüşte tekerlekten içe ve yukarı, kanat-gövde kaplamasının altına (±59,5 px, 470 px yükseklik) çıkıyor.',
      'In front view the main-gear leg runs inward and up from the wheel to the underside of the wing-body fairing (±59.5 px, at 470 px height).'
    ),
    mainGearPositionT: observed(
      0.449,
      'along',
      SIDE,
      'Ana tekerlek ekseni burundan %45 geride; bacak yan görünüşte dik. Önceki sürüm %55 okumuştu.',
      'The main-wheel axle sits 45 percent aft of the nose and the leg is vertical in side view. The previous version read 55 percent.'
    ),
    noseGearPositionT: observed(
      0.137,
      'along',
      SIDE,
      'Burun tekerleği ekseni burundan %13,7 geride (1275 px).',
      'The nose-wheel axle sits 13.7 percent aft of the nose (1275 px).'
    ),
    noseGearRakeRatio: observed(
      0.008,
      'along',
      SIDE,
      'Burun takımı bacağının üst bağlantısı tekerlek ekseninin 8 px gerisinde; tekerlek hafifçe önde.',
      'The nose-gear leg attaches 8 px behind the axle; the wheel sits slightly forward.'
    ),
    noseDragStrutRatio: chosen(0.02, {
      note: {
        tr: 'Bacağın arkasındaki kavisli bağlantı yalnız birkaç piksel; ikinci destek bacak bağlantısının biraz gerisinden seçildi.',
        en: 'The curved link behind the leg is only a few pixels wide; the secondary brace was chosen to start slightly behind the leg attachment.'
      }
    }),
    strutRadiusRatio: chosen(0.0025, {
      note: {
        tr: 'Takım bacaklarının kesiti kaynak karelerde birkaç piksel; yapısal boyut iddiası olmadan görünür çubuk için seçildi.',
        en: 'Gear struts are only a few pixels wide in the source frames; chosen for visible rods without claiming a structural dimension.'
      }
    }),
    wheelDiameterRatio: observed(
      0.0422,
      'vertical',
      FRONT,
      'Ana tekerlek çapı ön görünüşte 40 px; uzunluğun %4,2’si (yaklaşık 0,27 m).',
      'The main wheel reads 40 px in diameter in the front view, 4.2 percent of length (about 0.27 m).'
    ),
    noseWheelDiameterRatio: observed(
      0.037,
      'vertical',
      FRONT,
      'Burun tekerleği ana tekerleklerden küçük: ön görünüşte 35 px.',
      'The nose wheel is smaller than the mains: 35 px in the front view.'
    ),

    /* ------------------------------------------------------------ pilon */
    pylonSpanInnerRatio: observed(
      0.2314,
      'lateral',
      FRONT,
      'İç istasyonlar ön görünüşte merkezden ±208 px; yarım açıklığın %23’ü.',
      'The inner stations sit ±208 px from the centre in the front view, 23 percent of the half-span.'
    ),
    pylonSpanOuterRatio: observed(
      0.2937,
      'lateral',
      FRONT,
      'Dış istasyonlar ön görünüşte merkezden ±264 px; yarım açıklığın %29’u.',
      'The outer stations sit ±264 px from the centre in the front view, 29 percent of the half-span.'
    ),
    pylonLengthRatio: observed(
      0.02,
      'vertical',
      FRONT,
      'Pilon kanat alt yüzeyinden asılı yükün üstüne 19 px iniyor; yalnız çıplak istasyon çizilir.',
      'The pylon drops 19 px from the wing underside to the top of the hung store; only the bare station is drawn.'
    ),
    pylonRadiusRatio: observed(
      0.0063,
      'lateral',
      FRONT,
      'Pilon gövdesi ön görünüşte 12 px genişliğinde.',
      'The pylon body reads 12 px wide in the front view.'
    ),
    pylonChordRatio: chosen(0.4, {
      note: {
        tr: 'Pilonun veçhe boyunca konumu dış yüklerin arkasında kalıyor; yerel veçhenin %40’ı seçildi.',
        en: 'The pylon’s chordwise position is hidden behind the stores; 40 percent of local chord was chosen.'
      }
    }),
    pylonChordLengthRatio: chosen(0.047, {
      note: {
        tr: 'Pilonun veçhe boyu dış yüklerin arkasında kalıyor; yaklaşık 0,3 m seçildi.',
        en: 'The pylon length along the chord is hidden behind the stores; about 0.3 m was chosen.'
      }
    })
  },
  build({dims, extra, ratios}): Part[] {
    const L = dims.length_m;
    const span = dims.wingspan_m;
    const halfSpan = span / 2;

    /* ------------------------------------------------------------ gövde */
    const H = (L * ratios.bodyDepthRatio) / 2;
    const W = (span * ratios.bodyWidthRatio) / 2;
    const noseTip = -L * ratios.noseTipDropRatio;
    const propRadius = (span * ratios.propDiameterRatio) / 2;
    const hubX = L * ratios.propHubHeightRatio;
    const bodyEnd = L * ratios.bodyEndT;
    const endTop = L * ratios.bodyEndTopRatio;
    const endBottom = L * ratios.bodyEndBottomRatio;
    const endHalfWidth = (span * ratios.bodyEndWidthRatio) / 2;

    const top = (t: number) => {
      if (t <= ratios.topRiseEndT) {
        return noseTip + (H - noseTip) * Math.pow(t / ratios.topRiseEndT, ratios.noseTopExponent);
      }
      if (t <= ratios.aftTopStartT) return H;
      const k = (t - ratios.aftTopStartT) / (ratios.bodyEndT - ratios.aftTopStartT);
      return H + (endTop - H) * k;
    };
    const bottom = (t: number) => {
      if (t <= ratios.noseBottomT) {
        const k = 1 - t / ratios.noseBottomT;
        return noseTip - (noseTip + H) * Math.sqrt(Math.max(0, 1 - k * k));
      }
      if (t <= ratios.aftBottomStartT) return -H;
      const k = (t - ratios.aftBottomStartT) / (ratios.bodyEndT - ratios.aftBottomStartT);
      return -H + (endBottom + H) * smoothstep(k);
    };
    const halfWidth = (t: number) => {
      if (t <= ratios.widthFullT) {
        const k = 1 - t / ratios.widthFullT;
        return W * Math.sqrt(Math.max(0, 1 - k * k));
      }
      if (t <= ratios.aftWidthStartT) return W;
      const k = (t - ratios.aftWidthStartT) / (ratios.bodyEndT - ratios.aftWidthStartT);
      return W + (endHalfWidth - W) * smoothstep(k);
    };

    // Örnekleme eğrinin olduğu yere yoğunlaşır: burun ucu karekök gibi açılır.
    const ts: number[] = [];
    for (let i = 0; i <= 24; i++) ts.push(ratios.noseBottomT * (i / 24) ** 2);
    for (let i = 1; i <= 20; i++) {
      ts.push(ratios.noseBottomT + (ratios.aftBottomStartT - ratios.noseBottomT) * (i / 20));
    }
    for (let i = 1; i <= 20; i++) {
      ts.push(ratios.aftBottomStartT + (ratios.bodyEndT - ratios.aftBottomStartT) * (i / 20));
    }
    const stations: LatheStation[] = ts.map((t) => {
      const upper = top(t);
      const lower = bottom(t);
      const radius = Math.max(halfWidth(t), 0.0005);
      const scale = (upper - lower) / 2 / radius;
      return {
        y: t * L,
        radius,
        lift: (upper + lower) / 2,
        upperScale: scale,
        lowerScale: scale
      };
    });
    /*
     * Gövde küt biter: son kesit göbek merkezine kapanan düz bir uç yüzeyi.
     * Göbek konisi bu yüzeyden çıkar; arada açık bir halka kalmaz.
     */
    stations.push({y: bodyEnd + 1e-4, radius: 0.0005, lift: hubX});

    const parts: Part[] = [
      {
        kind: 'body',
        id: 'body',
        orientation: 'along',
        origin: vec3(),
        spec: {aspect: 1, section: BODY_SECTION, stations, nominalRadius: W}
      }
    ];

    /* ------------------------------------------------------------ kanat */
    const wingX = L * ratios.wingHeightRatio;
    const wingY = L * ratios.wingPositionT;
    const wingChord = L * ratios.wingChordRatio;
    const dihedral = (ratios.wingDihedralDeg * Math.PI) / 180;
    const sweep = Math.tan((ratios.wingSweepDeg * Math.PI) / 180);
    /*
     * Panel açıklığı dihedral eğimi boyunca ölçülür; yayımlanan açıklık
     * yatay. 4,9°'de fark 4 cm — 12 m'lik ölçüyü sessizce kısaltırdı.
     */
    const panelSpan = halfSpan / Math.cos(dihedral);
    const wingProfile = wingStations({
      span: panelSpan,
      rootChord: wingChord,
      tipChord: wingChord * ratios.wingTaper,
      sweepDeg: ratios.wingSweepDeg,
      thicknessRatio: ratios.wingThicknessRatio
    });
    const aileronStart = panelSpan * ratios.aileronStartRatio;
    const controlGap = wingChord * ratios.controlSurfaceGapRatio;
    const mainWing = wingProfile.map((station) => ({
      ...station,
      chord:
        station.chord *
        (station.span > aileronStart ? 1 - ratios.aileronChordShare : 1)
    }));
    const aileron = wingProfile
      .filter((station) => station.span > aileronStart)
      .map((station) => {
        const chord = Math.max(0, station.chord * ratios.aileronChordShare - controlGap);
        return {
          ...station,
          offset:
            chord > 0
              ? station.offset + station.chord * (1 - ratios.aileronChordShare) + controlGap
              : station.offset,
          chord,
          thickness: station.thickness * 0.85
        };
      });

    for (const mirror of [false, true]) {
      const root = vec3(wingX, wingY, 0);
      const angleDeg = 90 - ratios.wingDihedralDeg;
      parts.push({
        kind: 'panel',
        id: mirror ? 'wing-2' : 'wing-1',
        root,
        angleDeg,
        mirror,
        stations: mainWing,
        rootFillet: wingChord * ratios.wingThicknessRatio * ratios.filletRatio
      });
      parts.push({
        kind: 'panel',
        id: mirror ? 'aileron-2' : 'aileron-1',
        root,
        angleDeg,
        mirror,
        stations: aileron,
        rootFillet: 0
      });
    }

    /** Kanadın verilen yanal konumdaki yerel veçhesi, hücum kenarı ve orta çizgi yüksekliği. */
    const wingAt = (z: number) => {
      const s = Math.abs(z) / Math.cos(dihedral);
      const chord = wingChord + (wingChord * ratios.wingTaper - wingChord) * (s / panelSpan);
      return {
        leading: wingY + s * sweep,
        chord,
        height: wingX + Math.abs(z) * Math.tan(dihedral),
        thickness: chord * ratios.wingThicknessRatio
      };
    };

    /*
     * Kanat-gövde kaplaması. Ön görünüşte kanadın alt yüzeyi gövde
     * tabanına düz kenarlı bir V ile iniyor. Kesit: üst kenar kanadın
     * içinde, alt kenar gövde tabanında gövde eniyle.
     */
    const fairingReach = halfSpan * ratios.wingFairingSpanRatio;
    const fairingDrop = (wingX + H) / fairingReach;
    const fairingRoof = (wingChord * ratios.wingThicknessRatio * 0.3) / fairingReach;
    const fairingFloor = W / fairingReach;
    const fairingSection: SectionPoint[] = [
      {v: -fairingDrop, w: 0},
      {v: -fairingDrop, w: fairingFloor * 0.9},
      {v: -fairingDrop * 0.96, w: fairingFloor},
      {v: -fairingDrop * 0.1, w: 0.93},
      {v: 0, w: 1},
      {v: fairingRoof, w: 0.9},
      {v: fairingRoof, w: 0}
    ];
    // Uçlar kanadın veçhe düzleminde bir noktaya kapanır; açık halka kalmaz.
    const fairingStations: LatheStation[] = [
      [0, 0],
      [0.06, 0.55],
      [0.15, 0.85],
      [0.3, 1],
      [0.7, 1],
      [0.85, 0.8],
      [0.95, 0.5],
      [1, 0]
    ].map(([k, r]) => ({y: wingChord * k, radius: Math.max(fairingReach * r, 0.0005)}));
    parts.push({
      kind: 'pod',
      id: 'wing-fairing',
      orientation: 'along',
      origin: vec3(wingX, wingY, 0),
      spec: {aspect: 1, section: fairingSection, stations: fairingStations}
    });

    /* ------------------------------------------------------------ kiriş */
    const boomZ = halfSpan * ratios.boomOffsetRatio;
    const boomStartY = L * ratios.boomStartT;
    const boomLength = L * (ratios.boomEndT - ratios.boomStartT);
    const boomX = L * ratios.boomHeightRatio;
    const boomLift = L * ratios.boomEndLiftRatio;
    const boomRadius = L * ratios.boomRadiusRatio;
    const boomEndRadius = boomRadius * ratios.boomTipRatio;
    const fairingLength = L * ratios.boomFairingLengthRatio;
    // Okunan kiriş çizgisi hücum kenarından başlar; kaplama onun ilk parçası.
    const boomRadiusAt = (s: number) => boomRadius + ((boomEndRadius - boomRadius) * s) / boomLength;
    const boomLiftAt = (s: number) => (boomLift * s) / boomLength;
    // Dik oval kesit; profil verilince `aspect` okunmadığı için açıkça yazılır.
    const boomSection: SectionPoint[] = Array.from({length: 13}, (_, index) => {
      const angle = -Math.PI / 2 + (Math.PI * index) / 12;
      const w = index === 0 || index === 12 ? 0 : Math.cos(angle);
      return {v: ratios.boomAspect * Math.sin(angle), w};
    });
    // Sivri parabol: uçta açılı başlar, kirişe teğet biter.
    const boomFairingStations: LatheStation[] = Array.from({length: 11}, (_, index) => {
      const t = index / 10;
      const s = fairingLength * t;
      return {
        y: s,
        radius: index === 0 ? 0.0005 : boomRadiusAt(s) * t * (2 - t),
        lift: boomLiftAt(s)
      };
    });
    for (const side of [1, -1]) {
      parts.push(
        {
          kind: 'pod',
          id: side > 0 ? 'boom-fairing-1' : 'boom-fairing-2',
          orientation: 'along',
          origin: vec3(boomX, boomStartY, boomZ * side),
          spec: {aspect: ratios.boomAspect, section: boomSection, stations: boomFairingStations}
        },
        {
          kind: 'boom',
          id: side > 0 ? 'boom-1' : 'boom-2',
          start: vec3(boomX + boomLiftAt(fairingLength), boomStartY + fairingLength, boomZ * side),
          length: boomLength - fairingLength,
          radius: boomRadiusAt(fairingLength),
          endRadius: boomEndRadius,
          aspect: ratios.boomAspect,
          endLift: boomLift - boomLiftAt(fairingLength)
        }
      );
    }

    /* ----------------------------------------------------------- kuyruk */
    const finChord = L * ratios.finChordRatio;
    const tailAngle = (ratios.tailAngleDeg * Math.PI) / 180;
    const tailThickness = finChord * ratios.finTaper * ratios.wingThicknessRatio;
    /*
     * İki yüzey merkezde birleşir: açıklık kiriş aralığından türer. Uçlar
     * kapatılmaz ve yarım kalınlık kadar uzatılır, yoksa tepede iki
     * kapanan ucun arasında bir çentik kalırdı.
     */
    const tailStations = wingStations({
      span: boomZ / Math.cos(tailAngle) + tailThickness / 2,
      rootChord: finChord,
      tipChord: finChord * ratios.finTaper,
      sweepDeg: ratios.finSweepDeg,
      thicknessRatio: ratios.wingThicknessRatio,
      closeTip: false
    });
    for (const mirror of [false, true]) {
      parts.push({
        kind: 'panel',
        id: mirror ? 'tail-2' : 'tail-1',
        root: vec3(L * ratios.tailRootHeightRatio, L * ratios.finPositionT, boomZ),
        angleDeg: ratios.tailAngleDeg,
        mirror,
        stations: tailStations,
        rootFillet: 0
      });
    }

    /* ---------------------------------------------------------- pervane */
    const propY = L * ratios.propPositionT;
    const spinnerRadius = L * ratios.spinnerRadiusRatio;
    const spinnerLength = L * ratios.spinnerLengthRatio;
    const spinnerAt = (s: number) =>
      spinnerRadius *
      Math.sqrt(Math.max(0, 1 - Math.pow(Math.min(1, Math.max(0, s / spinnerLength)), ratios.spinnerShapeExponent)));
    /*
     * Disk ilkeli bir göbek ister; konik kapağın içinde kalacak kadar küçük
     * çizilir. Görünen göbek konidir.
     */
    const hubRadius = spinnerAt(propY - bodyEnd) * 0.6;
    const bladeChord = propRadius * ratios.propChordRatio;
    /*
     * Düz firar kenarı hatve ekseninin yarım veçhe gerisinde; hücum kenarı
     * incelme başlayınca geri çekilir. Kök göbeğin içinde kalır.
     */
    const bladeStations = [0.05, 0.2, 0.35]
      .concat(Array.from({length: 11}, (_, index) => ratios.propTaperStartRatio + ((1 - ratios.propTaperStartRatio) * index) / 10))
      .map((share) => {
        const k = Math.max(0, (share - ratios.propTaperStartRatio) / (1 - ratios.propTaperStartRatio));
        const chord =
          bladeChord * (1 - (1 - ratios.propTipChordRatio) * Math.pow(k, ratios.propTaperExponent));
        return {
          span: propRadius * share,
          rise: 0,
          offset: bladeChord / 2 - chord,
          chord,
          thickness: chord * ratios.propThicknessRatio
        };
      });
    parts.push({
      kind: 'disc',
      id: 'propeller',
      orientation: 'along',
      center: vec3(hubX, propY, 0),
      radius: propRadius,
      hubRadius,
      bladeCount: ratios.propBladeCount,
      // Karelerdeki park duruşu: kanatlar yatay. Biçim değil, duruş.
      bladePhaseDeg: 90,
      bladeChord,
      thickness: hubRadius * 0.6,
      /*
       * Pozitif açı: hücumdan firara veçhe teğet yönünde, firar +Y'ye
       * (arkaya) yatık. 90°'deki +Z kanadında teğet -X: hücum kenarı
       * yukarıda ve burna dönük, yan karelerdeki kesit gibi.
       */
      blade: {stations: bladeStations, angleDeg: ratios.propBladeAngleDeg}
    });
    parts.push({
      kind: 'pod',
      id: 'propeller-spinner',
      orientation: 'along',
      origin: vec3(hubX, bodyEnd, 0),
      spec: {
        aspect: 1,
        // Uca doğru sıklaşan örnekleme: eğri uçta dikleşir.
        stations: Array.from({length: 17}, (_, index) => {
          const s = spinnerLength * (1 - (1 - index / 16) ** 2);
          return {y: s, radius: index === 16 ? 0.0005 : spinnerAt(s)};
        })
      }
    });

    /* ------------------------------------------------------------ taret */
    const sensorRadius = L * ratios.sensorTurretRadiusRatio;
    const sensorY = L * ratios.sensorTurretPositionT;
    const sensorX = L * ratios.sensorTurretHeightRatio;
    const sensorStations = Array.from({length: 13}, (_, index) => {
      const t = index / 12;
      return {
        y: sensorRadius * 2 * t,
        radius: Math.max(sensorRadius * Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2)), 0.0005)
      };
    });
    parts.push({
      kind: 'pod',
      id: 'sensor-turret',
      orientation: 'vertical',
      origin: vec3(sensorX - sensorRadius, sensorY, 0),
      spec: {aspect: 1, stations: sensorStations}
    });
    // Pencere çerçevesi küre yüzeyine oturur: düzlemi pencere boyundan türer.
    const windowRadius = sensorRadius * ratios.sensorWindowRatio;
    const windowY = sensorY - sensorRadius * Math.sqrt(1 - ratios.sensorWindowRatio ** 2);
    parts.push(
      {
        kind: 'disc',
        id: 'sensor-window-rim',
        orientation: 'along',
        center: vec3(sensorX, windowY, 0),
        radius: windowRadius,
        hubRadius: windowRadius,
        bladeCount: 0,
        bladeChord: 0,
        thickness: sensorRadius * 0.1
      },
      {
        kind: 'disc',
        id: 'sensor-window',
        orientation: 'along',
        center: vec3(sensorX, windowY - sensorRadius * 0.06, 0),
        radius: windowRadius * 0.68,
        hubRadius: windowRadius * 0.68,
        bladeCount: 0,
        bladeChord: 0,
        thickness: sensorRadius * 0.12
      }
    );

    /* ----------------------------------------------- burun altı kaplama */
    const ventralY = L * ratios.ventralFairingPositionT;
    const ventralLength = L * ratios.ventralFairingLengthRatio;
    const ventralDepth = L * ratios.ventralFairingDepthRatio;
    const ventralHalfWidth = W * ratios.ventralFairingWidthRatio;
    // Dikey yarıçap: tabandan aşağı sarkan pay ile gövdenin içine giren eşit pay.
    const ventralAspect = ventralDepth / ventralHalfWidth;
    parts.push({
      kind: 'pod',
      id: 'ventral-fairing',
      orientation: 'along',
      origin: vec3(-H, ventralY, 0),
      spec: {
        aspect: ventralAspect,
        stations: [
          {y: 0, radius: 0.0005},
          {y: 0, radius: ventralHalfWidth * 0.35},
          {y: ventralLength * 0.1, radius: ventralHalfWidth * 0.9},
          {y: ventralLength * 0.25, radius: ventralHalfWidth},
          {y: ventralLength * 0.9, radius: ventralHalfWidth},
          {y: ventralLength, radius: ventralHalfWidth * 0.5},
          {y: ventralLength, radius: 0.0005}
        ]
      }
    });

    /* ------------------------------------------------------------ pilon */
    const pylonDrop = L * ratios.pylonLengthRatio;
    const pylonHalfWidth = L * ratios.pylonRadiusRatio;
    const pylonLength = L * ratios.pylonChordLengthRatio;
    for (const [index, spanRatio] of [
      ratios.pylonSpanInnerRatio,
      ratios.pylonSpanOuterRatio
    ].entries()) {
      for (const side of [1, -1]) {
        const z = halfSpan * spanRatio * side;
        const local = wingAt(z);
        const underside = local.height - local.thickness * 0.4;
        const startY = local.leading + local.chord * ratios.pylonChordRatio - pylonLength / 2;
        parts.push({
          kind: 'pod',
          id: `pylon-${index + 1}-${side > 0 ? 'a' : 'b'}`,
          orientation: 'along',
          // Üst kenar kanadın içinde, alt kenar okunan sarkma kadar aşağıda.
          origin: vec3(underside + local.thickness * 0.1 - pylonDrop / 2, startY, z),
          spec: {
            aspect: (pylonDrop / 2 + local.thickness * 0.1) / pylonHalfWidth,
            stations: [
              {y: 0, radius: 0.0005},
              {y: 0, radius: pylonHalfWidth * 0.4},
              {y: pylonLength * 0.2, radius: pylonHalfWidth},
              {y: pylonLength * 0.75, radius: pylonHalfWidth},
              {y: pylonLength, radius: pylonHalfWidth * 0.3},
              {y: pylonLength, radius: 0.0005}
            ]
          }
        });
      }
    }

    /* ------------------------------------------------------ iniş takımı */
    const publishedHeight = extra.height_m;
    if (publishedHeight !== undefined) {
      // Zemin yayımlanan yükseklikten: kuyruk tepesinden aşağı ölçülür.
      const groundX = partsBounds(parts).max.x - publishedHeight;
      const strutRadius = L * ratios.strutRadiusRatio;
      const wheel = (id: string, y: number, z: number, radius: number) => {
        parts.push({
          kind: 'pod',
          id: `wheel-${id}`,
          orientation: 'lateral',
          origin: vec3(groundX + radius, y, z - radius * 0.35),
          spec: {
            aspect: 1,
            // İki yanda kapak: lastik yandan bakınca içi boş görünmesin.
            stations: [
              {y: 0, radius: 0.0005},
              {y: 0, radius: radius * 0.82},
              {y: radius * 0.18, radius},
              {y: radius * 0.52, radius},
              {y: radius * 0.7, radius: radius * 0.82},
              {y: radius * 0.7, radius: 0.0005}
            ]
          }
        });
      };

      const noseRadius = (L * ratios.noseWheelDiameterRatio) / 2;
      const noseAxleY = L * ratios.noseGearPositionT;
      const noseTopY = noseAxleY + L * ratios.noseGearRakeRatio;
      const noseTopX = -H - ventralDepth;
      parts.push(
        {
          kind: 'strut',
          id: 'gear-nose',
          from: vec3(noseTopX, noseTopY, 0),
          to: vec3(groundX + noseRadius, noseAxleY, 0),
          radius: strutRadius
        },
        {
          kind: 'strut',
          id: 'gear-nose-drag',
          from: vec3(noseTopX, noseTopY + L * ratios.noseDragStrutRatio, 0),
          to: vec3(groundX + noseRadius * 2.2, noseAxleY + L * 0.002, 0),
          radius: strutRadius * 0.65
        }
      );
      wheel('nose', noseAxleY, 0, noseRadius);

      const mainRadius = (L * ratios.wheelDiameterRatio) / 2;
      const mainY = L * ratios.mainGearPositionT;
      const mainZ = halfSpan * ratios.mainGearSpanRatio;
      const rootZ = halfSpan * ratios.mainGearRootSpanRatio;
      // Bacak kaplamanın alt kenarına çıkar: V kenarı kökte gövde tabanında.
      const rootX = -H + (wingX + H) * ((rootZ - W) / (fairingReach - W));
      for (const side of [1, -1]) {
        const suffix = side > 0 ? 'a' : 'b';
        parts.push({
          kind: 'strut',
          id: `gear-main-${suffix}`,
          from: vec3(rootX, mainY, rootZ * side),
          to: vec3(groundX + mainRadius, mainY, mainZ * side),
          radius: strutRadius
        });
        wheel(`main-${suffix}`, mainY, mainZ * side, mainRadius);
      }
    }

    if (ratios.boomEndT > 1) throw new Error('TB2 kuyruk kirişi ölçülen uzunluğu aşıyor');
    return parts;
  }
});
