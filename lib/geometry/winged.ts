import {wingStations, type RootBlend, type TipBlend} from './panel';
import type {Part, SectionPoint, Vec3} from './parts';
import {sectionExtent, sectionLowerAt, vec3} from './parts';
import {defineProduct, type Category, type ProductDefinition} from './product';
import type {RatioTable, ValueTable} from './ratio';

/**
 * Kanatli hava araci — govde, kanat, kanat ucu kivrimi, kuyruk yuzeyleri.
 *
 * Olcek IKI yayimlanmis sayidan gelir: govde uzunlugu ve kanat acikligi.
 * Bu ikisi degisirse parca listesi degisir. Geri kalan oranlar yayimlanmis
 * sayi DEGILDIR; her biri kendi koken beyanini tasir — bir kismi
 * ureticinin yayimladigi gorsellerden olculmus, bir kismi okunabilir bir
 * sema icin secilmistir (lib/geometry/ratio.ts, specs/model-provenance).
 *
 * Bu dosya TOPOLOJIYI tanimlar: tek govde, iki kanat yarisi, iki kanat ucu,
 * tek dikey stabilize, iki yatay stabilize. Cift kirisli ya da V kuyruklu
 * bir duzen bu dosyayi degistirmez; kendi urun tanimini yazar ve ayni
 * parca kitini kullanir.
 *
 * Yan-adlandirma yapilmaz. Parcalar `wing-1` / `wing-2` diye anilir,
 * `sol` / `sag` diye degil: cerceve yonelimi bir bicim iddiasi tasimasin.
 */

export type WingedRatioKey =
  // govde
  | 'fuselageRatio'
  | 'noseRatio'
  | 'tailConeRatio'
  | 'tailTipRatio'
  | 'shoulderRatio'
  | 'shoulderSpread'
  // kanat
  | 'wingPositionT'
  | 'wingChordRatio'
  | 'wingHeightRatio'
  | 'wingRootDropRatio'
  | 'wingRootReachRatio'
  | 'wingRootExponent'
  | 'wingTaper'
  | 'wingRakeDeg'
  | 'wingThicknessRatio'
  | 'filletRatio'
  // kanat ucu kivrimi
  | 'tipReachRatio'
  | 'tipRiseRatio'
  | 'tipExponent'
  // dikey stabilize
  | 'finPositionT'
  | 'finHeightRatio'
  | 'finChordRatio'
  | 'finTaper'
  | 'finSweepDeg'
  // yatay stabilize
  | 'stabPositionT'
  | 'stabSpanRatio'
  | 'stabChordRatio'
  | 'stabAnhedralDeg'
  | 'stabRakeDeg';

/** Gövde kesiti — dönel değilse. */
export type WingedBodyKey =
  | 'crossAspect'
  | 'bodySectionLowerRatio'
  | 'bodySectionUpperRatio';

/** Motor gondolu ve pervane. Tasimayan urunde bu anahtarlar hic yok. */
export type WingedEngineKey =
  | 'nacelleCount'
  | 'nacelleSpanRatio'
  | 'nacelleDiameterRatio'
  | 'nacelleLengthRatio'
  | 'nacelleDropRatio'
  | 'nacellePositionT'
  | 'propDiameterRatio'
  | 'propBladeCount'
  | 'propHubRatio'
  | 'propChordRatio';

/** Inis takimi. Boyu yayimlanan yukseklikten TURER, oran tasimaz. */
export type WingedGearKey =
  | 'mainGearSpanRatio'
  | 'mainGearAttachRatio'
  | 'mainGearPositionT'
  | 'noseGearPositionT'
  | 'strutRadiusRatio'
  | 'wheelDiameterRatio';

/** Yuk istasyonlari — ciplak pilon. Mühimmat modellenmez. */
export type WingedPylonKey =
  | 'pylonPositionT'
  | 'pylonLengthRatio'
  | 'pylonRadiusRatio'
  | 'pylonSpanInnerRatio'
  | 'pylonSpanMiddleRatio'
  | 'pylonSpanOuterRatio';

export type WingedExtraKey =
  | WingedBodyKey
  | WingedEngineKey
  | WingedGearKey
  | WingedPylonKey;

export type WingedRatios = ValueTable<WingedRatioKey> &
  Partial<ValueTable<WingedExtraKey>>;

export type WingedProduct = ProductDefinition<
  'length_m' | 'wingspan_m',
  WingedRatioKey | WingedExtraKey
>;

/** Burun ve kuyruk ornekleme adimi. Bicim degil cozunurluk. */
const AXIAL_STEPS = 24;
/** Omuz bolgesine ek ornekleme; yuzey yeterince yumusak olsun. */
const SHOULDER_STEPS = 18;

/** Govde yaricapi, metre. Kadraj hesabi mesh kurmadan buna bakar. */
export function fuselageRadius(lengthM: number, ratios: WingedRatios): number {
  return (lengthM * ratios.fuselageRatio) / 2;
}

/**
 * Govde yaricapi her y konumunda.
 *
 * Burun yarim elips, orta bolum silindirik, kuyruk konik. Kanat kokunde
 * govde capi yerel olarak artar (omuz/fairing): kanat govdeyle duz bir
 * kesisim yerine yumusak bir gecis olusturur.
 */
export function fuselageRadiusAt(
  y: number,
  L: number,
  R: number,
  ratios: WingedRatios
): number {
  const nose = L * ratios.noseRatio;
  const cone = L * ratios.tailConeRatio;

  // Burun: yarim elips, govde capina teget.
  if (y <= nose) {
    if (nose === 0) return R;
    const k = (nose - y) / nose;
    return R * Math.sqrt(Math.max(0, 1 - k * k));
  }

  // Kuyruk konisi: govde capindan koni ucuna dogru dogrusal.
  if (y >= L - cone) {
    if (cone === 0) return R * ratios.tailTipRatio;
    const k = (y - (L - cone)) / cone;
    return R * (1 - k) + R * ratios.tailTipRatio * k;
  }

  // Kanat omuzu: kanat kokunun onune ve arkasina yayilan yumusak sisme.
  const wingStart = L * ratios.wingPositionT;
  const wingChord = L * ratios.wingChordRatio;
  const shoulderR = R * ratios.shoulderRatio;
  const spread = wingChord * ratios.shoulderSpread;
  const shoulderStart = Math.max(nose, wingStart - spread);
  const shoulderEnd = Math.min(L - cone, wingStart + wingChord + spread);

  if (y < shoulderStart || y > shoulderEnd) return R;

  const t = (y - shoulderStart) / (shoulderEnd - shoulderStart);
  const blend = 0.5 * (1 - Math.cos(t * Math.PI));
  return R + (shoulderR - R) * Math.sin(blend * Math.PI);
}

function fuselageStations(L: number, R: number, ratios: WingedRatios) {
  const nose = L * ratios.noseRatio;
  const cone = L * ratios.tailConeRatio;
  const wingStart = L * ratios.wingPositionT;
  const wingChord = L * ratios.wingChordRatio;
  const spread = wingChord * ratios.shoulderSpread;
  const shoulderStart = Math.max(nose, wingStart - spread);
  const shoulderEnd = Math.min(L - cone, wingStart + wingChord + spread);

  const stations: Array<{y: number; radius: number}> = [];

  for (let i = 0; i <= AXIAL_STEPS; i++) {
    const y = (i / AXIAL_STEPS) * nose;
    stations.push({y, radius: Math.max(fuselageRadiusAt(y, L, R, ratios), 0.0005)});
  }

  for (let i = 1; i <= SHOULDER_STEPS; i++) {
    const y = shoulderStart + (i / SHOULDER_STEPS) * (shoulderEnd - shoulderStart);
    stations.push({y, radius: fuselageRadiusAt(y, L, R, ratios)});
  }

  for (let i = 0; i <= AXIAL_STEPS; i++) {
    const y = shoulderEnd + (i / AXIAL_STEPS) * (L - shoulderEnd);
    stations.push({y, radius: Math.max(fuselageRadiusAt(y, L, R, ratios), 0.0005)});
  }

  return stations;
}

interface PanelPlan {
  id: string;
  span: number;
  rootChord: number;
  tipChord: number;
  /** Firar kenari egimi, derece. 0 ise govde eksenine dik. */
  rakeDeg?: number;
  /** Hucum kenari ok acisi, derece. rakeDeg yerine kullanilir. */
  sweepDeg?: number;
  /** Kalinligin YEREL vecheye orani. */
  thicknessRatio: number;
  rootY: number;
  rootZ?: number;
  angleDeg: number;
  rootFillet?: number;
  /** Kanat ucu kivrimi. Yoksa yuzey duz biter. */
  tip?: TipBlend;
  /** Govde baglantisi. Yoksa yuzey kokten duz cikar. */
  root?: RootBlend;
  /** Karsi yuzey: merkez duzlemde yansitilir, dondurulmez. */
  mirror?: boolean;
  /** Yatay yuzeyleri govde yuzeyine oturtur; dikey yuzey merkezde kalir. */
  mount?: 'center' | 'high' | 'low';
  /**
   * Kok duzleminin govde ekseninden dik yuksekligi, metre.
   *
   * Verilirse `mount` yerine gecer. Kanat icin bu OLCULEN bir sayi:
   * kanat govdenin uzerine OTURMUYOR, fairing'in icinden cikiyor.
   * Govde yuzeyine oturtmak kanadi 0,36 m yukari kaldiriyordu.
   */
  mountX?: number;
}

export function wingedProduct(options: {
  slug: string;
  category: Category;
  ratios: RatioTable<WingedRatioKey>;
  /** Gövde kesiti, motor, iniş takımı ve pilon grupları — hepsi isteğe bağlı. */
  extras?: Partial<RatioTable<WingedExtraKey>>;
  /**
   * Gövde kesitinin yarım genişlik profili. Verilmezse `crossAspect` ile
   * elips çizilir. Bir ORAN değil bir BİÇİM olduğu için oran tablosunda
   * durmaz; kökeni `bodySectionLowerRatio` notunda yazılı.
   */
  section?: SectionPoint[];
}): WingedProduct {
  return defineProduct({
    slug: options.slug,
    category: options.category,
    requires: ['length_m', 'wingspan_m'],
    // Ince govde: cizgi govdeye yapisik gorunmesin.
    dimensionOffsetRatio: 3.2,
    ratios: {
      ...options.ratios,
      ...(options.extras ?? {})
    } as RatioTable<WingedRatioKey | WingedExtraKey>,
    build({dims, extra, ratios}): Part[] {
      const L = dims.length_m;
      const halfSpan = dims.wingspan_m / 2;
      const R = fuselageRadius(L, ratios);
      /*
       * Kesit orani: 1 donel govde. AKINCI'nin on gorunusu govdenin
       * dikeyde daha uzun oldugunu gosteriyor; oran 1'den buyuk olunca
       * lathe tek eksende olceklenir.
       */
      const aspect = ratios.crossAspect ?? 1;

      const parts: Part[] = [
        {
          kind: 'body',
          id: 'body',
          orientation: 'along',
          origin: vec3(),
          spec: {
            aspect,
            section: options.section,
            stations: fuselageStations(L, R, ratios),
            nominalRadius: R
          }
        }
      ];

      function addPanel(plan: PanelPlan) {
        const stations = wingStations({
          span: plan.span,
          rootChord: plan.rootChord,
          tipChord: plan.tipChord,
          rakeDeg: plan.rakeDeg,
          sweepDeg: plan.sweepDeg,
          thicknessRatio: plan.thicknessRatio,
          tip: plan.tip,
          root: plan.root
        });

        /*
         * Yatay paneli govde yuzeyine oturt: kalinligin ic yuzu govdeye
         * degmeli. Kok noktasi veche ORTASINDA olculur, cunku govde capi
         * kanat boyunca degisiyor.
         *
         * Eliptik govdede kok yaricapi ACIYA BAGLI: ustten oturan kanat
         * dikey yaricapi (aspect'li), yandan bakan bir parca yatay
         * yaricapi gorur. Donel govdede ikisi ayni sayi.
         */
        const rootCenterY = plan.rootY + plan.rootChord / 2;
        const localR = fuselageRadiusAt(rootCenterY, L, R, ratios) * aspect;
        const rootThickness = stations[0]?.thickness ?? 0;
        let x = 0;
        if (plan.mountX !== undefined) x = plan.mountX;
        else if (plan.mount === 'high') x = localR + rootThickness / 2;
        else if (plan.mount === 'low') x = -localR - rootThickness / 2;

        parts.push({
          kind: 'panel',
          id: plan.id,
          root: vec3(x, plan.rootY, plan.rootZ ?? 0),
          angleDeg: plan.angleDeg,
          mirror: plan.mirror,
          stations,
          rootFillet: plan.rootFillet ?? 0
        });
      }

      /*
       * Kanat TEK parca. Onceki surumde ana panel ve yukari donen uc
       * ayri iki paneldi; birlesme yerinde sert bir kose ve (ikisi ayri
       * govde yaricapina oturdugu icin) dikey bir basamak birakiyordu.
       * Uc kivrimi artik istasyonlarin `rise` degerinde ve olculen egriyi
       * izliyor. Kanat acikligi kaynakli oldugu icin yatay uzanim tam
       * olarak yarim aciklik: kivrim dik yonde, aciklik yonunde degil.
       */
      const wingChord = L * ratios.wingChordRatio;
      const wingY = L * ratios.wingPositionT;
      const wingTipChord = wingChord * ratios.wingTaper;
      const rootThickness = wingChord * ratios.wingThicknessRatio;

      const wingPlan = {
        span: halfSpan,
        rootChord: wingChord,
        tipChord: wingTipChord,
        rakeDeg: ratios.wingRakeDeg,
        thicknessRatio: ratios.wingThicknessRatio,
        /*
         * Kanadin dik konumu OLCULEN bir sayi. Onceki surumde kanat
         * govde yuzeyine oturtuluyordu ve omuz sismesi de hesaba
         * katildigi icin acikligin tamaminda 0,36 m yukarida kaliyordu.
         * Gercekte kanat govdenin uzerine oturmuyor, fairing'in icinden
         * cikiyor.
         */
        mountX: L * ratios.wingHeightRatio,
        rootFillet: rootThickness * ratios.filletRatio,
        rootY: wingY,
        tip: {
          reachRatio: ratios.tipReachRatio,
          riseRatio: ratios.tipRiseRatio,
          exponent: ratios.tipExponent
        },
        root: {
          dropRatio: ratios.wingRootDropRatio,
          reachRatio: ratios.wingRootReachRatio,
          exponent: ratios.wingRootExponent
        }
      };

      /*
       * Iki kanat ayni acida; ikincisi YANSITILIR. Donusle yapilsaydi
       * kanat ucu kivrimi bir yanda yukari, otekinde asagi bakardi.
       */
      addPanel({...wingPlan, id: 'wing-1', angleDeg: 90});
      addPanel({...wingPlan, id: 'wing-2', angleDeg: 90, mirror: true});

      /*
       * Kuyruk iki ayri yuzey: tek dikey stabilize ve onun dibinden cikan
       * yatay stabilize. V kuyruk DEGIL.
       */
      const finChord = L * ratios.finChordRatio;
      addPanel({
        id: 'fin',
        span: L * ratios.finHeightRatio,
        rootChord: finChord,
        tipChord: finChord * ratios.finTaper,
        sweepDeg: ratios.finSweepDeg,
        thicknessRatio: ratios.wingThicknessRatio,
        rootY: L * ratios.finPositionT,
        angleDeg: 0
      });

      /*
       * Yatay stabilize ucu asagi bakiyor (anhedral). Olculen sey
       * acikligi; panel boyu acidan turer, boylece yatay erisim olculen
       * degerde kalir.
       */
      const stabChord = L * ratios.stabChordRatio;
      const anhedral = (ratios.stabAnhedralDeg * Math.PI) / 180;
      const stabHalfSpan = (dims.wingspan_m * ratios.stabSpanRatio) / 2;
      const stabPlan = {
        span: stabHalfSpan / Math.cos(anhedral),
        rootChord: stabChord,
        tipChord: stabChord * ratios.wingTaper,
        rakeDeg: ratios.stabRakeDeg,
        thicknessRatio: ratios.wingThicknessRatio,
        rootY: L * ratios.stabPositionT
      };
      addPanel({
        ...stabPlan,
        id: 'stab-1',
        angleDeg: 90 + ratios.stabAnhedralDeg
      });
      addPanel({
        ...stabPlan,
        id: 'stab-2',
        angleDeg: 90 + ratios.stabAnhedralDeg,
        mirror: true
      });

      /* ------------------------------------------- motor ve pervane */

      /** Kanadin alt yuzeyi, gondolun asildigi istasyonda. */
      const wingUnderside =
        fuselageRadiusAt(wingY + wingChord / 2, L, R, ratios) * aspect;

      if (ratios.nacelleCount) {
        const nacelleRadius = (L * (ratios.nacelleDiameterRatio ?? 0)) / 2;
        const nacelleLength = L * (ratios.nacelleLengthRatio ?? 0);
        const nacelleY = L * (ratios.nacellePositionT ?? 0);
        const nacelleX = wingUnderside - L * (ratios.nacelleDropRatio ?? 0);
        const propRadius = (L * (ratios.propDiameterRatio ?? 0)) / 2;

        for (let i = 0; i < ratios.nacelleCount; i++) {
          // Cift sayida gondol: merkez hattinin iki yaninda esit.
          const side = i % 2 === 0 ? 1 : -1;
          const rank = Math.floor(i / 2) + 1;
          const z = halfSpan * (ratios.nacelleSpanRatio ?? 0) * side;
          const suffix = `${rank}-${side > 0 ? 'a' : 'b'}`;

          parts.push({
            kind: 'pod',
            id: `nacelle-${suffix}`,
            orientation: 'along',
            origin: vec3(nacelleX, nacelleY, z),
            spec: {
              aspect: 1,
              nominalRadius: nacelleRadius,
              // Yuvarlak on, silindirik orta, hafif daralan arka.
              stations: [
                {y: 0, radius: nacelleRadius * 0.55},
                {y: nacelleLength * 0.12, radius: nacelleRadius},
                {y: nacelleLength * 0.72, radius: nacelleRadius},
                {y: nacelleLength, radius: nacelleRadius * 0.62}
              ]
            }
          });

          if (propRadius > 0) {
            parts.push({
              kind: 'disc',
              id: `propeller-${suffix}`,
              orientation: 'along',
              center: vec3(nacelleX, nacelleY, z),
              radius: propRadius,
              hubRadius: propRadius * (ratios.propHubRatio ?? 0.12),
              bladeCount: ratios.propBladeCount ?? 0,
              bladeChord: propRadius * (ratios.propChordRatio ?? 0.12),
              thickness: nacelleRadius * 0.18
            });
          }
        }
      }

      /* ----------------------------------------------- yuk istasyonu */

      if (ratios.pylonPositionT !== undefined) {
        const pylonY = L * ratios.pylonPositionT;
        const pylonDrop = L * (ratios.pylonLengthRatio ?? 0);
        const stations = [
          ratios.pylonSpanInnerRatio,
          ratios.pylonSpanMiddleRatio,
          ratios.pylonSpanOuterRatio
        ];

        stations.forEach((ratio, index) => {
          if (ratio === undefined) return;
          for (const side of [1, -1]) {
            const z = halfSpan * ratio * side;
            parts.push({
              kind: 'strut',
              id: `pylon-${index + 1}-${side > 0 ? 'a' : 'b'}`,
              from: vec3(wingUnderside, pylonY, z),
              to: vec3(wingUnderside - pylonDrop, pylonY, z),
              radius: L * (ratios.pylonRadiusRatio ?? 0)
            });
          }
        });
      }

      /* ------------------------------------------------ inis takimi */

      /*
       * Takim boyu UYDURULMAZ, yayimlanan yukseklikten TUREIR:
       *
       *   yayimlanan toplam yukseklik            height_m
       * - dikey stabilize ucu, govde ekseninden  L * finHeightRatio
       * = govde ekseni yerden                    zemin duzlemi
       *
       * Boylece height_m, bugune kadar hicbir cizime girmeyen bir alan
       * olmaktan cikip modelin bir parcasini belirleyen kaynakli sayi
       * oluyor. Deger yoksa takim CIZILMEZ — varsayilan bir boy verilmez.
       */
      const publishedHeight = extra.height_m;
      if (publishedHeight !== undefined && ratios.strutRadiusRatio !== undefined) {
        const finTop = L * ratios.finHeightRatio;
        const groundX = -(publishedHeight - finTop);

        if (groundX < 0) {
          const strutRadius = L * ratios.strutRadiusRatio;
          const wheelRadius = (L * (ratios.wheelDiameterRatio ?? 0)) / 2;

          /**
           * Bacagin ust ucu. Burun takimi merkez hattindan iner; ANA
           * takim govdenin yanindan iner ve tekerlege dogru DISA acilir.
           *
           * Iki kez duzeltildi. Once iki bacak da govdeden DIMDIK
           * iniyordu. Sonra "fotograflarda gondoldan cikiyor" diye
           * gondola baglandi ve tekerlege dogru ICE egildi — bu da
           * yanlisti. Olcum tersini soyluyor: on gorunuste bacak
           * yukarida 0,73 m yanal, asagida 1,26 m; yani asagi inerken
           * DISA aciliyor. Park halindeki ucagin burun fotografi da
           * bacaklarin govde yanindan cikip tekerleklere dogru
           * yayildigini gosteriyor.
           */
          const leg = (
            id: string,
            y: number,
            z: number,
            top?: Vec3
          ) => {
            const axleX = groundX + wheelRadius;
            parts.push({
              kind: 'strut',
              id: `gear-${id}`,
              from: top ?? vec3(-fuselageRadiusAt(y, L, R, ratios) * aspect, y, z),
              to: vec3(axleX, y, z),
              radius: strutRadius
            });
            /*
             * Tekerlek ekseni YANAL ve lathe kendi ekseninde 0'dan
             * baslar; bacagin uzerine ortalamak icin yarim boy geri
             * kaydirilir. Kaydirma iki tarafta da ayni: lathe her zaman
             * +Z yonunde uzadigi icin ayni cikarma iki tekerlegi de
             * bacaginin uzerine oturtur.
             */
            parts.push({
              kind: 'pod',
              id: `wheel-${id}`,
              orientation: 'lateral',
              origin: vec3(axleX, y, z - wheelRadius * 0.35),
              spec: {
                aspect: 1,
                nominalRadius: wheelRadius,
                stations: [
                  {y: 0, radius: wheelRadius * 0.82},
                  {y: wheelRadius * 0.18, radius: wheelRadius},
                  {y: wheelRadius * 0.52, radius: wheelRadius},
                  {y: wheelRadius * 0.7, radius: wheelRadius * 0.82}
                ]
              }
            });
          };

          leg('nose', L * (ratios.noseGearPositionT ?? 0), 0);

          const mainY = L * (ratios.mainGearPositionT ?? 0);
          // Baglanti noktasi govdenin yaninda, tekerlekten ICERIDE.
          const attachZ = halfSpan * (ratios.mainGearAttachRatio ?? 0);

          /*
           * Baglanti noktasi govdenin YUZEYINDE. Onceki surumde bacagin
           * ust ucu govdenin en alt noktasi kadar asagida ama yanal
           * olarak disaridaydi; yani govdeye degmiyor, altinda boslukta
           * duruyordu. Kesit profili verildiginde nokta profilin uzerine
           * oturtulur.
           */
          const attachR = fuselageRadiusAt(mainY, L, R, ratios);
          const bodySpec = {
            aspect,
            section: options.section,
            stations: [],
            nominalRadius: R
          };
          const halfWidth = attachR * sectionExtent(bodySpec).width;
          const attachX =
            attachR * sectionLowerAt(bodySpec, Math.min(1, attachZ / halfWidth));

          for (const side of [1, -1]) {
            leg(
              `main-${side > 0 ? 'a' : 'b'}`,
              mainY,
              halfSpan * (ratios.mainGearSpanRatio ?? 0) * side,
              vec3(attachX, mainY, attachZ * side)
            );
          }
        }
      }

      return parts;
    }
  });
}
