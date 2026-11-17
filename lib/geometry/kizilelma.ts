import {wingStations} from './panel';
import type {LatheStation, Part, SectionPoint} from './parts';
import {partsBounds, vec3} from './parts';
import {defineProduct} from './product';
import {chosen, reading, type RatioAxis} from './ratio';

/**
 * Bayraktar KIZILELMA dış profili.
 *
 * Ölçek güncel ürün sayfasındaki 14,5 m uzunluk, 10 m kanat açıklığı ve
 * 3,5 m yükseklikten gelir. KeyShotXR bir model dosyası sunmuyor; 18 PNG
 * karesi var (1919×1199, saydam zemin, 20° adım, 0_0 arka, 0_9 ön).
 *
 * Okuma yöntemi: 18 karenin silüetinden GÖRSEL ZARF kuruldu — her karede
 * silüete düşmeyen hacim oyuldu. Zarf her kareye geri izdüşürüldüğünde
 * örtüşme 0,955–0,984; kamera ortografik, yatay, dönme ekseni 959. sütun.
 * Zarf yan profili ve gövde kesitlerini verir; kanat ve kanard planformunu
 * VERMEZ (kamera yukarıdan bakmıyor, kanat hep kenarından görünüyor). Uç
 * köşeleri karelerin uç noktalarından üçgenlendi: bir köşe en az iki
 * karede, fark ≤ 7 px.
 *
 * Okuma ölçeği: burun ucundan en arka noktaya 1482 px, kanat açıklığı
 * 1013 px. Boyuna ve dikey oranlar 1482'ye, yanal oranlar açıklığa
 * bölünür. Dikey konumlar 561. satıra göredir: gövdenin en derin kesitinin
 * (üst 490, alt 632 px) ortası. Zemin karelerde 760. satır.
 *
 * Kareler aynı döner gösteriden; §9 aynı gösterinin karelerini izdüşüm
 * sınavı saymıyor. Okumalar 'reading', görülemeyenler 'chosen'. Yükseklik
 * dış uyumu düşüyor: karelerde 374 px, uzunluk ölçeğiyle 3,66 m (+%4,6),
 * açıklık ölçeğiyle 3,69 m (+%5,4); yayımlanan 3,5 m. Takım boyu
 * yayımlanan yükseklikten türer (TB2 gibi). Kaynak görseller depoya
 * alınmaz; yalnızca oranlar ve adresleri kalır.
 */
const FRAMES =
  'https://cdn.baykartech.com/static/assets/libs/keyshotxr/img/bayraktar-kizilelma/';
const REAR = `${FRAMES}0_0.png`;
const QUARTER = `${FRAMES}0_1.png`;
const OBLIQUE = `${FRAMES}0_7.png`;
const SIDE = `${FRAMES}0_4.png`;
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

/** Okuma ölçeği, piksel. */
const LENGTH_PX = 1482;
const SPAN_PX = 1013;
/** Dikey referans satırı: en derin kesitin ortası. */
const REF_ROW = 561;
const DEPTH_PX = 632 - 490;
const BOX_PX = 228;
const DOME_PX = 176;
const CHINE_PX = 252;

/**
 * Gövde, istasyon istasyon — görsel zarfın dikey kesitlerinden.
 *
 * `a` burun ucundan geriye px; satırlar görüntü satırı (aşağı artar);
 * enler orta çizgiden yarım en, px. Üst ve alt hat orta çizgide okundu.
 * Kubbe tabanı, köşe (chine) ve kutu üstü satırları kesitlerde okunan
 * kademeler; zarf burada kanadın da içinden geçtiği için kademe satırı
 * ±4 px belirsiz. Burun bölgesindeki enler zarfın 20°'lik kenarı — gerçek
 * en bundan büyük olamaz, küçük olabilir.
 */
interface BodyRow {
  a: number;
  top: number;
  domeBase: number;
  chine: number;
  boxTop: number;
  bottom: number;
  domeW: number;
  chineW: number;
  boxW: number;
}
const BODY: BodyRow[] = [
  {a: 20, top: 544, domeBase: 550, chine: 555, boxTop: 558, bottom: 562, domeW: 6, chineW: 8, boxW: 5},
  {a: 40, top: 538, domeBase: 548, chine: 555, boxTop: 560, bottom: 570, domeW: 13, chineW: 16, boxW: 10},
  {a: 60, top: 532, domeBase: 547, chine: 555, boxTop: 562, bottom: 576, domeW: 20, chineW: 24, boxW: 15},
  {a: 100, top: 522, domeBase: 546, chine: 555, boxTop: 566, bottom: 588, domeW: 35, chineW: 38, boxW: 24},
  {a: 140, top: 508, domeBase: 545, chine: 555, boxTop: 570, bottom: 598, domeW: 50, chineW: 52, boxW: 30},
  {a: 180, top: 502, domeBase: 544, chine: 552, boxTop: 560, bottom: 624, domeW: 62, chineW: 66, boxW: 45},
  {a: 220, top: 500, domeBase: 544, chine: 550, boxTop: 558, bottom: 622, domeW: 79, chineW: 82, boxW: 54},
  {a: 280, top: 496, domeBase: 544, chine: 550, boxTop: 558, bottom: 620, domeW: 88, chineW: 104, boxW: 76},
  {a: 340, top: 490, domeBase: 544, chine: 550, boxTop: 558, bottom: 628, domeW: 88, chineW: 126, boxW: 98},
  {a: 400, top: 490, domeBase: 544, chine: 550, boxTop: 558, bottom: 628, domeW: 88, chineW: 126, boxW: 114},
  {a: 620, top: 498, domeBase: 544, chine: 550, boxTop: 558, bottom: 628, domeW: 88, chineW: 126, boxW: 114},
  {a: 820, top: 508, domeBase: 544, chine: 550, boxTop: 558, bottom: 632, domeW: 88, chineW: 126, boxW: 114},
  {a: 1020, top: 516, domeBase: 544, chine: 550, boxTop: 558, bottom: 634, domeW: 88, chineW: 126, boxW: 114},
  {a: 1180, top: 520, domeBase: 544, chine: 550, boxTop: 558, bottom: 636, domeW: 88, chineW: 126, boxW: 114},
  {a: 1240, top: 520, domeBase: 544, chine: 550, boxTop: 558, bottom: 630, domeW: 88, chineW: 104, boxW: 114},
  {a: 1300, top: 522, domeBase: 546, chine: 552, boxTop: 560, bottom: 626, domeW: 79, chineW: 82, boxW: 113},
  {a: 1360, top: 522, domeBase: 548, chine: 554, boxTop: 562, bottom: 622, domeW: 57, chineW: 61, boxW: 110},
  {a: 1420, top: 526, domeBase: 550, chine: 556, boxTop: 564, bottom: 618, domeW: 35, chineW: 40, boxW: 100}
];
/**
 * Yüzey kökünün gövde yanına göre konumu. Bir biçim değil bir birleşim
 * payı: kök yüzeyin hemen içinde başlar ki iki parça arasında açıklık
 * kalmasın.
 */
const ROOT_INSET = 0.9;
/** Gövdenin bittiği yer: zarfta 1420 px'te gövde var, 1440 px'te yalnız alt uzantı. */
const BODY_END_A = 1432;

/**
 * Kubbenin omuz eğrisi — seçilmiş. Kesitlerde kubbe elips gibi
 * kapanıyor; taban ile tepe arasında iki ara nokta elipsten.
 */
const DOME_STEPS: Array<{h: number; w: number}> = [
  {h: 0.55, w: Math.sqrt(1 - 0.55 * 0.55)},
  {h: 0.85, w: Math.sqrt(1 - 0.85 * 0.85)}
];

export const KIZILELMA = defineProduct({
  slug: 'kizilelma',
  category: 'insansiz-hava-araci',
  requires: ['length_m', 'wingspan_m'],
  dimensionOffsetRatio: 3.2,
  omitted: [
    {
      tr: 'İniş takımının karelerdeki boyunun bir kısmı çizilmedi. Model zemini yayımlanan 3,5 m yükseklikten türetir (kuyruk ucundan aşağı). Üreticinin döner gösterisinde aynı ölçek yükseklik için 3,66 m veriyor (uzunluk ölçeğiyle; açıklık ölçeğiyle 3,69 m), yani %4,6 fazla; fark takım bacağında kalıyor ve bacaklar karelerdekinden 0,16 m kısa.',
      en: 'Part of the landing gear’s height in the frames is not drawn. The model takes the ground from the published 3.5 m height (measured down from the tail tip). At the same scale the manufacturer’s turntable gives 3.66 m (length scale; 3.69 m at span scale), 4.6 percent more; the difference sits in the gear legs, which are 0.16 m shorter than in the frames.'
    },
    {
      tr: 'Açık iniş takımı kapakları çizilmedi. Karelerde burun ve ana takım yuvalarının kapakları açık; kapak bir biçim değil bir duruş ve şematik modelde takımın kendisi yeterli.',
      en: 'The open landing-gear doors are not drawn. In the frames the nose and main gear bay doors stand open; a door is a pose rather than a shape, and the gear itself is enough in a schematic model.'
    },
    {
      tr: 'Hava alığı ağızları ve lülenin içi çizilmedi. Karelerde bunlar gövdedeki açıklıklar; mat gri şematik yüzeyde gösterilemezler. Alıkların dış hacmi alt gövdenin içinde.',
      en: 'The intake mouths and the inside of the nozzle are not drawn. In the frames they are openings in the body and cannot be shown on a matte grey schematic surface. The outer volume of the intakes is part of the lower body.'
    },
    {
      tr: 'Burun altındaki ve sırttaki küçük çıkıntılar (anten, sensör penceresi) çizilmedi; karelerde biçimleri birkaç pikselden küçük.',
      en: 'The small protrusions under the nose and along the spine (antennas, sensor window) are not drawn; in the frames they are only a few pixels across.'
    }
  ],
  ratios: {
    /* ------------------------------------------------------------ gövde */
    bodyDepthRatio: observed(
      DEPTH_PX / LENGTH_PX,
      'vertical',
      SIDE,
      'Gövdenin en derin kesiti görsel zarfın orta çizgisinde 142 px (sırt 490, taban 632); 1482 px uzunluğa oranı 0,096. Üst ve alt hat istasyon istasyon lib/geometry/kizilelma.ts içindeki BODY dizisinde; biçim olduğu için tek sayı olarak duramıyor, kökeni bu kayıtta.',
      'The deepest fuselage section reads 142 px on the centre line of the visual hull (spine 490, floor 632), 0.096 of the 1482 px length. The upper and lower lines station by station live in the BODY array in lib/geometry/kizilelma.ts; being a shape it cannot sit in the table as one number, so its origin is recorded here.'
    ),
    bodyWidthRatio: observed(
      BOX_PX / SPAN_PX,
      'lateral',
      REAR,
      'Alt gövde (hava alıkları dahil) zarfın dikey kesitlerinde 596–624. satırlarda 228 px en; açıklığa (1013 px) oranı 0,225. Taban düz. Burun bölgesindeki daralma zarfın 20°lik kenarı: gerçek en bundan büyük olamaz.',
      'The lower body (intakes included) reads 228 px wide on rows 596–624 of the hull’s vertical cuts, 0.225 of the 1013 px span. The floor is flat. The narrowing in the nose region is the hull’s 20° edge: the true width cannot be larger.'
    ),
    domeWidthRatio: observed(
      DOME_PX / SPAN_PX,
      'lateral',
      REAR,
      'Sırt kubbesi tabanında (544. satır) 176 px en; açıklığa oranı 0,174. Kubbe 1240 px’ten sonra lüleye doğru daralıyor. Tepe ile taban arası elips gibi kapanıyor; ara noktalar seçilmiş.',
      'The dorsal dome is 176 px wide at its base (row 544), 0.174 of the span. It narrows towards the nozzle after 1240 px. Between base and top it closes like an ellipse; the intermediate points are chosen.'
    ),
    chineWidthRatio: observed(
      CHINE_PX / SPAN_PX,
      'lateral',
      REAR,
      'Köşe (chine) çizgisi 548–552. satırlarda, kubbe tabanı ile alt gövde arasında 252 px en; alt gövdeden her yanda ~12 px taşıyor ve burundan kanat köküne uzanıyor. Kanat kökü de bu satırlarda olduğu için ±4 px belirsiz.',
      'The chine line sits on rows 548–552 between the dome base and the lower body, 252 px wide; it stands out ~12 px beyond the lower body on each side and runs from the nose to the wing root. The wing root shares these rows, so it is uncertain by ±4 px.'
    ),
    /* ------------------------------------------------------------ kanat */
    wingHeightRatio: observed(
      (REF_ROW - 570) / LENGTH_PX,
      'vertical',
      REAR,
      'Kanadın orta düzlemi arka görünüşte 570. satırda ve açıklık boyunca düz: kökte 556–580, uçta 568–572 satır. Dihedral ya da anhedral okunmuyor; kalınlık uca doğru incelir.',
      'In the rear view the wing’s mid-plane sits on row 570 and stays flat along the span: rows 556–580 at the root, 568–572 at the tip. No dihedral or anhedral reads; the thickness tapers towards the tip.'
    ),
    wingTipLeadingT: observed(
      1066 / LENGTH_PX,
      'along',
      QUARTER,
      'Kanat ucunun hücum kenarı köşesi 0_1 ve 0_8 karelerinin sağ uç noktalarından üçgenlendi: burun ucundan 1066 px (iki kare arası 1,3 px). Uç orta çizgiden 506,5 px.',
      'The wing tip’s leading-edge corner was triangulated from the right-hand extreme points of frames 0_1 and 0_8: 1066 px aft of the nose tip (1.3 px apart between the two frames). The tip is 506.5 px from the centre line.'
    ),
    wingTipChordRatio: observed(
      105 / LENGTH_PX,
      'along',
      QUARTER,
      'Uç firar kenarı köşesi dört karenin sol uç noktalarından üçgenlendi (0_1, 0_2, 0_7, 0_8: 1168–1175 px); uç veçhesi ~105 px.',
      'The tip trailing-edge corner was triangulated from the left-hand extreme points of four frames (0_1, 0_2, 0_7, 0_8: 1168–1175 px); the tip chord is about 105 px.'
    ),
    wingSweepDeg: observed(
      44.5,
      'along',
      OBLIQUE,
      'Kamera yukarıdan bakmadığı için planform silüetten okunamıyor. 0_7 karesinde kanadın hücum kenarı açık renkli bir çizgi olarak gövdeye u ≈ −64 px’te giriyor (aynası 0_11 ile 4 px içinde). Giriş noktası köşe çizgisinin yarım eninde (126 px) varsayılırsa burun ucundan 691 px; uca kadar ok 44,5°. Varsayım bu okumanın parçası.',
      'The camera never looks down, so the planform cannot be read from the silhouette. In frame 0_7 the wing’s leading edge shows as a light line meeting the body at u ≈ −64 px (its mirror 0_11 agrees within 4 px). Taking the junction at the chine’s half-width (126 px) places it 691 px aft of the nose tip, giving 44.5° of sweep to the tip. That assumption is part of this reading.'
    ),
    wingTrailingSweepDeg: chosen(0, {
      note: {
        tr: 'Firar kenarı düz (oksuz) seçildi. Uç firar kenarı okunuyor, kökteki gövdenin arkasında kalıyor; karelerde firar kenarında kırık görülmüyor.',
        en: 'The trailing edge is chosen straight (unswept). The tip trailing edge reads; the root one is hidden behind the body; no crank shows in the trailing edge in the frames.'
      }
    }),
    wingThicknessRatio: observed(
      0.065,
      'vertical',
      REAR,
      'Arka görünüşte kanat kalınlığı açıklık boyunca 24 → 16 → 8 px (orta çizgiden 236, 375, 464 px); okunan planformla yerel veçheye oranı 0,054–0,068, ortalama 0,065. Belirli bir profil iddia edilmez.',
      'In the rear view the wing thickness runs 24 → 16 → 8 px along the span (236, 375, 464 px from the centre line); against the read planform that is 0.054–0.068 of the local chord, 0.065 on average. No particular aerofoil is claimed.'
    ),
    /* ----------------------------------------------------------- kanard */
    canardHeightRatio: observed(
      (REF_ROW - 547) / LENGTH_PX,
      'vertical',
      REAR,
      'Kanard arka ve ön görünüşte 544–551. satırlarda, köşe çizgisinin hizasında; orta düzlem 547.',
      'In the rear and front views the canard sits on rows 544–551, level with the chine; mid-plane at 547.'
    ),
    canardSpanRatio: observed(
      513 / SPAN_PX,
      'lateral',
      REAR,
      'Kanard uçları arka görünüşte orta çizgiden ±256 px (318 ve −194 px, eksen kayması düzeltildi); uçtan uca 513 px, açıklığa oranı 0,506.',
      'In the rear view the canard tips lie ±256 px from the centre line (318 and −194 px, axis offset corrected); 513 px tip to tip, 0.506 of the span.'
    ),
    canardTipLeadingT: observed(
      525 / LENGTH_PX,
      'along',
      QUARTER,
      'Kanard ucunun hücum kenarı köşesi 0_1 ve 0_8 karelerinin 544. satırdaki uç noktalarından üçgenlendi: burun ucundan 523–527 px.',
      'The canard tip’s leading-edge corner was triangulated from the extreme points of frames 0_1 and 0_8 on row 544: 523–527 px aft of the nose tip.'
    ),
    canardSweepDeg: observed(
      52,
      'along',
      OBLIQUE,
      'Kanardın hücum kenarı 0_7 karesinde gövde yanından uca uzanan parlak bir çizgi: kökte u = 178 px (orta çizgiden ~110 px, burun ucundan ~338 px), uçta u = −54 px. Uca kadar ok 52°.',
      'The canard’s leading edge shows in frame 0_7 as a bright line from the body side to the tip: u = 178 px at the root (~110 px from the centre line, ~338 px aft of the nose tip), u = −54 px at the tip. 52° of sweep to the tip.'
    ),
    canardTipChordRatio: chosen(50 / LENGTH_PX, {
      note: {
        tr: 'Kanard uç veçhesi seçildi (~0,49 m). Firar kenarı köşesi karelerde kuyruk kökleriyle aynı satırlarda kalıyor ve uç noktalardan ayrılamıyor.',
        en: 'The canard tip chord is chosen (~0.49 m). Its trailing-edge corner shares rows with the tail roots in the frames and cannot be separated from the extreme points.'
      }
    }),
    canardTrailingSweepDeg: chosen(0, {
      note: {
        tr: 'Kanardın firar kenarı düz (oksuz) seçildi; karelerde kenarından görünüyor ve kökü gövdenin arkasında.',
        en: 'The canard trailing edge is chosen straight (unswept); in the frames it is seen edge-on and its root is behind the body.'
      }
    }),
    canardThicknessRatio: observed(
      0.03,
      'vertical',
      REAR,
      'Ön görünüşte kanard orta çizgiden 142–248 px arasında 4–6 px kalınlıkta; okunan hücum kenarı ve seçilmiş firar kenarıyla yerel veçheye oranı ~0,03.',
      'In the front view the canard is 4–6 px thick between 142 and 248 px from the centre line; against the read leading edge and chosen trailing edge that is ~0.03 of the local chord.'
    ),
    /* ----------------------------------------------------------- kuyruk */
    tailPositionT: observed(
      1182 / LENGTH_PX,
      'along',
      SIDE,
      'Hücum kenarı zarfın yan görünüşünde 388–520. satırlar arasında düz (520. satırda 1197 px). Altı sırt kubbesinin arkasında kalıyor; kenar aynı doğruyla köke (545. satır) uzatıldı: burun ucundan 1182 px.',
      'In the hull’s side view the leading edge is straight between rows 388 and 520 (1197 px on row 520). Below that it is hidden behind the dorsal dome; the same line was extended to the root (row 545): 1182 px aft of the nose tip.'
    ),
    tailRootHeightRatio: observed(
      (REF_ROW - 545) / LENGTH_PX,
      'vertical',
      REAR,
      'Kuyruk kökü köşe çizgisinin rafında, 545. satırda: arka görünüşte dış kenar 542. satırda 145 px ve kuyruklar bu satırın altında rafa iniyor. Yan izdüşümde 520. satırın altı kubbenin arkasında kaldığı için ilk okuma kökü 25 satır yukarıda başlatıyordu; 0_2 karesinde kök ile gövde arasında boşluk kalıyordu.',
      'The tail root sits on the chine shelf, on row 545: in the rear view the outer edge is 145 px out on row 542 and the tails come down to the shelf below it. In the side projection everything below row 520 is hidden behind the dome, so the first reading started the root 25 rows too high, leaving a gap between root and body in frame 0_2.'
    ),
    tailRootSpanRatio: observed(
      276 / SPAN_PX,
      'lateral',
      REAR,
      'İki kuyruk kökü arka görünüşte orta çizgiden ±138 px (dış kenar 542. satırda 145 px, kalınlığın yarısı düşüldü); açıklığa oranı 0,272.',
      'In the rear view the two tail roots lie ±138 px from the centre line (outer edge 145 px on row 542, less half the thickness); 0.272 of the span.'
    ),
    tailTipHeightRatio: observed(
      (REF_ROW - 389) / LENGTH_PX,
      'vertical',
      REAR,
      'Kuyruk uçları arka görünüşte 386–392. satırlarda; tepe 389.',
      'In the rear view the tail tips lie on rows 386–392; the top at 389.'
    ),
    tailCantDeg: observed(
      29,
      'lateral',
      REAR,
      'Arka görünüşte kuyrukların dış kenarı 520. satırda 158 px, 389. satırda 230,5 px: 131 satırda 72,5 px dışa açılıyor, dikeyden 29°.',
      'In the rear view the tails’ outer edge is 158 px out on row 520 and 230.5 px on row 389: 72.5 px outwards over 131 rows, 29° from the vertical.'
    ),
    tailChordRatio: observed(
      224 / LENGTH_PX,
      'along',
      SIDE,
      'Kök veçhesi 545. satırda 1182 → 1406 px, 224 px. Firar kenarı yan görünüşte 388–520. satırlar arasında 1376–1406 px, neredeyse dik; köke aynı doğruyla uzatıldı.',
      'The root chord on row 545 is 1182 → 1406 px, 224 px. In the side view the trailing edge runs 1376–1406 px between rows 388 and 520, nearly upright; it was extended to the root along the same line.'
    ),
    tailTaper: observed(
      129 / 224,
      'along',
      QUARTER,
      'Uç köşeleri 0_1 ve 0_8 karelerinden üçgenlendi: hücum kenarı 1275–1276 px, firar kenarı 1403–1404 px; uç veçhesi 129 px, köke oranı 0,58.',
      'The tip corners were triangulated from frames 0_1 and 0_8: leading edge 1275–1276 px, trailing edge 1403–1404 px; a 129 px tip chord, 0.58 of the root.'
    ),
    tailSweepDeg: observed(
      27.5,
      'along',
      SIDE,
      'Hücum kenarı kökten uca 78 px geriye gidiyor; yüzey 29° yatık olduğu için 131 satırlık yükseklik yüzey üzerinde 150 px. Yüzey düzleminde ok 27,5°.',
      'The leading edge moves 78 px aft from root to tip; with the surface canted 29°, the 131-row height is 150 px along the surface. 27.5° of sweep in the surface plane.'
    ),
    tailThicknessRatio: chosen(0.05, {
      note: {
        tr: 'Kuyruk kalınlığı seçildi; arka görünüşte yatık yüzeyin kalınlığı birkaç piksel ve kanat kökü satırlarına karışıyor.',
        en: 'The tail thickness is chosen; in the rear view the canted surface is only a few pixels thick and mixes with the wing-root rows.'
      }
    }),
    /* ------------------------------------------------------ lüle, uzantı */
    nozzleHeightRatio: observed(
      (REF_ROW - 572) / LENGTH_PX,
      'vertical',
      REAR,
      'Lülenin koyu içi arka görünüşte orta sütunda 548–596. satırlar; merkez 572.',
      'The nozzle’s dark interior spans rows 548–596 on the centre column of the rear view; centre at 572.'
    ),
    nozzleRadiusRatio: observed(
      30 / LENGTH_PX,
      'vertical',
      REAR,
      'Koyu iç bölge 48 px çapında; dış yarıçap dudak payıyla 30 px. Dudak payı (6 px) seçilmiş.',
      'The dark interior is 48 px across; the outer radius with the lip is 30 px. The lip allowance (6 px) is chosen.'
    ),
    deckHeightRatio: observed(
      (REF_ROW - 602) / LENGTH_PX,
      'vertical',
      SIDE,
      'Gövdenin arkasında, lülenin altında ince yatay bir uzantı: zarfta 1440 px’ten sonra yalnız 598–606. satırlar dolu; 0_4 ve 0_5 karelerinin en arka noktası da 601–603. satırda.',
      'Behind the body, under the nozzle, a thin horizontal extension: past 1440 px only rows 598–606 are filled in the hull; the aftmost points of frames 0_4 and 0_5 also lie on rows 601–603.'
    ),
    deckSpanRatio: observed(
      160 / SPAN_PX,
      'lateral',
      REAR,
      'Uzantı zarfın 1440 px kesitinde orta çizgiden ±80 px; açıklığa oranı 0,158.',
      'The extension reads ±80 px from the centre line in the hull’s 1440 px cut; 0.158 of the span.'
    ),
    deckPositionT: chosen(1400 / LENGTH_PX, {
      note: {
        tr: 'Uzantının başladığı yer seçildi: gövdenin içinde kalıyor, yalnız arka ucu (uzunluğun sonu) okunuyor.',
        en: 'Where the extension starts is chosen: it is inside the body; only its aft end (the end of the length) reads.'
      }
    }),
    /* ------------------------------------------------------ iniş takımı */
    noseGearPositionT: observed(
      341 / LENGTH_PX,
      'along',
      SIDE,
      'Burun tekeri zarfın yan görünüşünde 324–358 px arasında; merkez burun ucundan 341 px.',
      'The nose wheel reads between 324 and 358 px in the hull’s side view; its centre is 341 px aft of the nose tip.'
    ),
    noseWheelDiameterRatio: observed(
      38 / LENGTH_PX,
      'along',
      SIDE,
      'Burun tekeri 730. satırda 34 px en, zemin 760. satır; daire olarak çapı ~38 px.',
      'The nose wheel is 34 px wide on row 730 with the ground on row 760; as a circle its diameter is ~38 px.'
    ),
    mainGearPositionT: observed(
      899 / LENGTH_PX,
      'along',
      SIDE,
      'Ana tekerlekler zarfın yan görünüşünde 870–928 px arasında; merkez burun ucundan 899 px.',
      'The main wheels read between 870 and 928 px in the hull’s side view; their centre is 899 px aft of the nose tip.'
    ),
    mainGearSpanRatio: observed(
      293 / SPAN_PX,
      'lateral',
      REAR,
      'Ana tekerlekler arka görünüşte 715–745. satırlarda orta çizgiden 136,5–156,5 px; merkezler arası 293 px, açıklığa oranı 0,289.',
      'In the rear view the main wheels lie 136.5–156.5 px from the centre line on rows 715–745; 293 px between centres, 0.289 of the span.'
    ),
    wheelDiameterRatio: observed(
      58 / LENGTH_PX,
      'along',
      SIDE,
      'Ana tekerlek 730. satırda 58 px en ve zemine (760) değiyor; çap 58 px.',
      'The main wheel is 58 px wide on row 730 and touches the ground (760); diameter 58 px.'
    ),
    strutRadiusRatio: chosen(0.004, {
      note: {
        tr: 'Bacak kalınlığı seçildi; karelerde bacaklar açık kapakların arkasında kalıyor.',
        en: 'The strut thickness is chosen; in the frames the legs are behind the open doors.'
      }
    })
  },
  build({dims, extra, ratios}): Part[] {
    const L = dims.length_m;
    const span = dims.wingspan_m;
    const halfSpan = span / 2;

    /* ------------------------------------------------------------ gövde */
    const along = (a: number) => (a / LENGTH_PX) * L;
    const vScale = (L * ratios.bodyDepthRatio) / DEPTH_PX;
    const up = (row: number) => (REF_ROW - row) * vScale;
    const boxScale = (span * ratios.bodyWidthRatio) / BOX_PX;
    const domeScale = (span * ratios.domeWidthRatio) / DOME_PX;
    const chineScale = (span * ratios.chineWidthRatio) / CHINE_PX;
    const boxHalf = (BOX_PX * boxScale) / 2;

    /*
     * Her istasyon kendi anahtar kesitini taşır: dokuz nokta, alttan
     * üste — taban ortası, taban köşesi, kutu yanı (alt, üst), köşe,
     * kubbe tabanı, iki kubbe noktası, sırt. Nokta i her istasyonda aynı
     * kenar; burunda kutu daralır ve kesit elmasa döner.
     */
    const sectionOf = (row: BodyRow) => {
      const box = row.boxW * boxScale;
      const chine = row.chineW * chineScale;
      const dome = row.domeW * domeScale;
      const top = up(row.top);
      const bottom = up(row.bottom);
      const base = up(row.domeBase);
      const absolute: Array<{x: number; w: number}> = [
        {x: bottom, w: 0},
        {x: bottom, w: box * 0.92},
        {x: bottom + (up(row.boxTop) - bottom) * 0.08, w: box},
        {x: up(row.boxTop), w: box},
        {x: up(row.chine), w: chine},
        {x: base, w: dome},
        ...DOME_STEPS.map((step) => ({
          x: base + (top - base) * step.h,
          w: dome * step.w
        })),
        {x: top, w: 0}
      ];
      const radius = Math.max(box, chine, dome);
      const lift = (top + bottom) / 2;
      const section: SectionPoint[] = absolute.map((point) => ({
        v: (point.x - lift) / radius,
        w: point.w / radius
      }));
      return {radius, lift, section};
    };

    const first = sectionOf(BODY[0]);
    const last = BODY[BODY.length - 1];
    const nozzleX = L * ratios.nozzleHeightRatio;
    const stations: LatheStation[] = [
      // Burun ucu: kesit ilk istasyonun biçiminde, bir noktaya kapanır.
      {y: 0, radius: 0.0005, lift: up(553), section: first.section},
      ...BODY.map((row) => {
        const {radius, lift, section} = sectionOf(row);
        return {y: along(row.a), radius, lift, section};
      }),
      // Küt uç: son kesit lüle merkezine kapanan düz bir yüzey.
      {
        y: along(BODY_END_A),
        radius: 0.0005,
        lift: nozzleX,
        section: sectionOf(last).section
      }
    ];

    const parts: Part[] = [
      {
        kind: 'body',
        id: 'body',
        orientation: 'along',
        origin: vec3(),
        spec: {aspect: 1, stations, nominalRadius: boxHalf}
      }
    ];

    /* ------------------------------------------------------------ kanat */
    /*
     * Kök gövde yanında, orta çizgide değil. Ok açılı bir yüzeyin gövde
     * içindeki hücum kenarı buruna doğru uzanır; şema yalnız dış hat
     * çizdiği için o gizli kenar gövdenin içinde bir üçgen olarak
     * görünürdü. Kök alt gövdenin yanının biraz içinde başlar ki yüzey
     * ile gövde arasında açıklık kalmasın.
     *
     * Hücum kenarı uçtan geriye ok açısıyla, firar kenarı uçtan geriye
     * kendi açısıyla kurulur: okunan iki köşe ve iki açı yamuğu tam
     * tanımlar.
     */
    const wingRootZ = boxHalf * ROOT_INSET;
    const wingTipLe = L * ratios.wingTipLeadingT;
    const wingTipChord = L * ratios.wingTipChordRatio;
    const wingSpan = halfSpan - wingRootZ;
    const wingRootLe =
      wingTipLe - wingSpan * Math.tan((ratios.wingSweepDeg * Math.PI) / 180);
    const wingRootTe =
      wingTipLe +
      wingTipChord -
      wingSpan * Math.tan((ratios.wingTrailingSweepDeg * Math.PI) / 180);
    const wingProfile = wingStations({
      span: wingSpan,
      rootChord: wingRootTe - wingRootLe,
      tipChord: wingTipChord,
      sweepDeg: ratios.wingSweepDeg,
      thicknessRatio: ratios.wingThicknessRatio,
      closeTip: false
    });
    for (const mirror of [false, true]) {
      parts.push({
        kind: 'panel',
        id: mirror ? 'wing-2' : 'wing-1',
        // Aynasız yüzey -Z yanında; açıklık da oraya.
        root: vec3(L * ratios.wingHeightRatio, wingRootLe, -wingRootZ),
        angleDeg: 90,
        mirror,
        stations: wingProfile,
        rootFillet: 0
      });
    }

    /* ----------------------------------------------------------- kanard */
    // Kanard köşe rafının üstünde, kubbe tabanının yanından çıkar.
    const canardRootZ = ((DOME_PX * domeScale) / 2) * ROOT_INSET;
    const canardSpan = (span * ratios.canardSpanRatio) / 2 - canardRootZ;
    const canardTipLe = L * ratios.canardTipLeadingT;
    const canardTipChord = L * ratios.canardTipChordRatio;
    const canardRootLe =
      canardTipLe - canardSpan * Math.tan((ratios.canardSweepDeg * Math.PI) / 180);
    const canardRootTe =
      canardTipLe +
      canardTipChord -
      canardSpan * Math.tan((ratios.canardTrailingSweepDeg * Math.PI) / 180);
    const canardProfile = wingStations({
      span: canardSpan,
      rootChord: canardRootTe - canardRootLe,
      tipChord: canardTipChord,
      sweepDeg: ratios.canardSweepDeg,
      thicknessRatio: ratios.canardThicknessRatio,
      closeTip: false
    });
    for (const mirror of [false, true]) {
      parts.push({
        kind: 'panel',
        id: mirror ? 'canard-2' : 'canard-1',
        root: vec3(L * ratios.canardHeightRatio, canardRootLe, -canardRootZ),
        angleDeg: 90,
        mirror,
        stations: canardProfile,
        rootFillet: 0
      });
    }

    /* ----------------------------------------------------------- kuyruk */
    /*
     * Dışa yatık çift kuyruk. Açıklık yüzey boyunca ölçülür: okunan
     * yükseklik farkı yatıklığın kosinüsüne bölünür.
     */
    const cant = (ratios.tailCantDeg * Math.PI) / 180;
    const tailRootX = L * ratios.tailRootHeightRatio;
    const tailSpan = (L * ratios.tailTipHeightRatio - tailRootX) / Math.cos(cant);
    const tailRootChord = L * ratios.tailChordRatio;
    const tailProfile = wingStations({
      span: tailSpan,
      rootChord: tailRootChord,
      tipChord: tailRootChord * ratios.tailTaper,
      sweepDeg: ratios.tailSweepDeg,
      thicknessRatio: ratios.tailThicknessRatio,
      closeTip: false
    });
    const tailRootZ = (span * ratios.tailRootSpanRatio) / 2;
    for (const mirror of [false, true]) {
      parts.push({
        kind: 'panel',
        id: mirror ? 'tail-2' : 'tail-1',
        // Aynasız yüzey -Z yanında; açı açıklığı oraya, yani dışa yatırır.
        root: vec3(tailRootX, L * ratios.tailPositionT, -tailRootZ),
        angleDeg: ratios.tailCantDeg,
        mirror,
        stations: tailProfile,
        rootFillet: 0
      });
    }

    /* ------------------------------------------------------ lüle, uzantı */
    const nozzleRadius = L * ratios.nozzleRadiusRatio;
    parts.push({
      kind: 'pod',
      id: 'nozzle',
      orientation: 'along',
      origin: vec3(nozzleX, along(BODY_END_A) - nozzleRadius * 1.6, 0),
      spec: {
        aspect: 1,
        stations: [
          {y: 0, radius: nozzleRadius * 0.9},
          {y: nozzleRadius * 1.6, radius: nozzleRadius},
          {y: nozzleRadius * 1.6 + 1e-4, radius: 0.0005}
        ]
      }
    });

    const deckStart = L * ratios.deckPositionT;
    const deckProfile = wingStations({
      span: (span * ratios.deckSpanRatio) / 2,
      rootChord: L - deckStart,
      tipChord: L - deckStart,
      sweepDeg: 0,
      thicknessRatio: 0.06,
      closeTip: false,
      steps: 2
    });
    for (const mirror of [false, true]) {
      parts.push({
        kind: 'panel',
        id: mirror ? 'deck-2' : 'deck-1',
        root: vec3(L * ratios.deckHeightRatio, deckStart, 0),
        angleDeg: 90,
        mirror,
        stations: deckProfile,
        rootFillet: 0
      });
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
      const noseY = L * ratios.noseGearPositionT;
      const floorAt = (a: number) => {
        const index = BODY.findIndex((row) => row.a >= a);
        const row = BODY[Math.max(0, index)];
        return up(row.bottom);
      };
      parts.push({
        kind: 'strut',
        id: 'gear-nose',
        from: vec3(floorAt(341), noseY, 0),
        to: vec3(groundX + noseRadius, noseY, 0),
        radius: strutRadius
      });
      wheel('nose', noseY, 0, noseRadius);

      const mainRadius = (L * ratios.wheelDiameterRatio) / 2;
      const mainY = L * ratios.mainGearPositionT;
      const mainZ = (span * ratios.mainGearSpanRatio) / 2;
      // Bacak alt gövdenin taban köşesinden iner.
      const rootZ = boxHalf * 0.92;
      for (const side of [1, -1]) {
        const suffix = side > 0 ? 'a' : 'b';
        parts.push({
          kind: 'strut',
          id: `gear-main-${suffix}`,
          from: vec3(floorAt(899), mainY, rootZ * side),
          to: vec3(groundX + mainRadius, mainY, mainZ * side),
          radius: strutRadius
        });
        wheel(`main-${suffix}`, mainY, mainZ * side, mainRadius);
      }
    }

    return parts;
  }
});
