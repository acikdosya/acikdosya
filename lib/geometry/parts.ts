/**
 * Parca kiti — islenmemis bicim tanimi.
 *
 * Bu modul three ICE AKTARMAZ ve bir sahne nesnesi URETMEZ. Parcalar
 * metre cinsinden somut geometridir; iki ayri tuketici onlari okur:
 *
 *      urun tanimi (oranlar) + yayimlanmis olculer
 *                      |
 *                      v
 *                   Part[]            <- burasi
 *                   /     \
 *            build3d       project2d
 *          THREE.Group      SVG yol
 *
 * Ayrim gerekli, cunku iki boyutlu yol sunucuda calisiyor ve three'yi
 * oraya sokmak §6 butcesini riske atardi. Ikinci fayda: iki katman ayni
 * listeden turedigi icin ayrisamaz (specs/system-silhouette).
 *
 * ORTAK CERCEVE — lib/geometry/result.ts'ten devralindi:
 *   +Y   govde ekseni, burun 0, kuyruk L
 *   +X   yukari
 *   ±Z   yanal (kanat acikligi)
 * Sahne ve GLB pisirici ayni 90° cevirmeyi uyguladigi icin butun urunler
 * tek kurali paylasir.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export function vec3(x = 0, y = 0, z = 0): Vec3 {
  return {x, y, z};
}

/** Parcanin kendi ekseninin cerceve icindeki yonu. */
export type PartAxis = 'along' | 'lateral' | 'vertical';

/** Eksen boyunca (konum, yaricap) cifti. Konum parcanin YEREL ekseninde. */
export interface LatheStation {
  /** Yerel eksen boyunca konum, metre. */
  y: number;
  /** Yaricap, metre. */
  radius: number;
}

/**
 * Donel ya da eliptik kesitli yuzey.
 *
 * `aspect` dikey yaricapin yatay yaricaba orani. 1 donel govdedir; AKINCI
 * on gorunuste 1,13 m en ve ~1,45 m boy olcüldugu icin donel degil
 * (specs/system-geometry). Eliptik kesit ayri bir ilkel degil, bu alanin
 * 1'den farkli oldugu hal.
 */
/**
 * Kesitin yarim genislik profili — govde OVAL DEGILSE.
 *
 * `v` dikey konum, `w` yarim genislik; ikisi de YARIM ENE gore normalize.
 * Dizi alttan uste siralidir ve iki ucta w = 0 ile kapanir. Sol ve sag
 * ayna oldugu icin yalniz yarim profil tutulur.
 *
 * AKINCI on gorunusunde govde elips DEGIL: alt yari, ayni uzanimdaki bir
 * elipsten 0,26 yarim ene kadar dar. Damla bicimli, asagi dogru daha
 * hizli daralan bir kesit. Profil verilmezse `aspect` ile elips cizilir.
 */
export interface SectionPoint {
  v: number;
  w: number;
}

export interface LatheSpec {
  stations: LatheStation[];
  aspect: number;
  /** Verilirse `aspect` yerine gecer. */
  section?: SectionPoint[];
  /**
   * Govdenin ANMA yaricapi, metre.
   *
   * En genis istasyon degil: AKINCI'da kanat kokundeki omuz sismesi
   * govde capini yerel olarak %18 buyutuyor, ama govdenin yaricapi o
   * degil. Golge duzlemi, en yakin zoom siniri ve olcu cizgisinin ofseti
   * bu sayiyi okur; yerel bir sismenin kadraji kaydirmamasi icin ayri
   * tutulur. Verilmezse en genis istasyona dusulur.
   */
  nominalRadius?: number;
}

interface PlacedLathe {
  id: string;
  spec: LatheSpec;
  /** Yerel eksenin baslangici, cerceve koordinatinda. */
  origin: Vec3;
  orientation: PartAxis;
}

/**
 * Birincil govde.
 *
 * `pod` ile geometrisi ayni, ROLU farkli: olcu cizgisi, kadrajin govde
 * yaricapi ve etiketin varsayilan ekseni yalniz buradan gelir. Ikisini tek
 * ilkele indirmek bu rolu kaybettirirdi.
 */
export interface BodyPart extends PlacedLathe {
  kind: 'body';
}

/** Eksen disi ikincil govde: motor gondolu, tekerlek, burun kubbesi. */
export interface PodPart extends PlacedLathe {
  kind: 'pod';
}

/**
 * Bir yuzeyin aciklik boyunca tek kesiti.
 *
 * Yuzeyler artik duz bir plaka DEGIL: her istasyonun kendi vechesi ve
 * kalinligi var, aralari lofting ile baglaniyor. Sebep olculebilir —
 * AKINCI'nin on gorunusunde kanat kalinligi kokte 0,32 m, ucta 0,15 m
 * ve yerel vecheye orani acikligin tamaminda 0,152 ± 0,004 sabit. Sabit
 * kalinlikli bir plaka bu olcumun ikisini birden karsilayamaz.
 *
 * `rise` kanat ucu kivrimini tasir: istasyonun aciklik yonunden DIK
 * sapmasi. Onceki surumde uc, ayri bir panel 30° cevrilerek yapiliyordu
 * ve birlesme yerinde sert bir kose ile dikey bir basamak birakiyordu;
 * olculen egri ise duzgun, us alan bir kivrim.
 */
export interface PanelStation {
  /** Kok duzleminden aciklik yonunde mesafe, metre. */
  span: number;
  /** Aciklik yonunden dik sapma, metre. Kanat ucu kivrimi. */
  rise: number;
  /** Hucum kenarinin eksen boyunca kaymasi, metre. Ok acisi buradan. */
  offset: number;
  chord: number;
  thickness: number;
}

/**
 * Yuzey: kanat yarisi, kanatcik, dikey/yatay stabilize, V kuyruk yuzeyi.
 *
 * Yerel cerceve: +x aciklik, +y veche yonu (govde ekseniyle ayni), +z
 * kalinlik VE kivrim yonu. `angleDeg` yerel +x'i cerceve icinde +Y
 * etrafinda dondurur: 0 dik yukari (+X), 90 ise -Z. Yatay bir kanatta
 * yerel +z cerceve +X'e, yani yukariya gelir — kivrim de kalinlik da
 * ayni eksende, ki dogrusu bu.
 */
export interface PanelPart {
  kind: 'panel';
  id: string;
  /** Kok noktasinin cerceve icindeki konumu. */
  root: Vec3;
  angleDeg: number;
  /**
   * Yuzeyi z = 0 duzleminde AYNALA.
   *
   * Karsi kanat bir DONUS degil, bir yansimadir. -90° donus acikligi +Z'ye
   * tasir ama "yukari" yonunu de ters cevirir; duz bir plakada bu gorunmez,
   * kanat ucu kivrimi eklenince sag kanat asagi bakar. Ayna iki yuzeyi
   * gercekten simetrik yapar.
   */
  mirror?: boolean;
  /** Kokten uca en az iki istasyon. */
  stations: PanelStation[];
  /** Kok kenarinin govdeye yumusak gecisi. 0 ise duz kesisim. */
  rootFillet: number;
}

/**
 * Donel yuzey izi — pervane.
 *
 * Kanat sayisi cizilir ama disk yaricapi asil bilgidir; §9 geregi yuzey
 * sematik kalir. Segment sayisi govdeden BAGIMSIZ tutulur, yoksa pervane
 * gövde cozunurlugunu tasimak zorunda kalir (design.md §9).
 */
export interface DiscPart {
  kind: 'disc';
  id: string;
  center: Vec3;
  /** Disk normali. */
  orientation: PartAxis;
  radius: number;
  hubRadius: number;
  bladeCount: number;
  bladeChord: number;
  thickness: number;
}

/** Cubuk: inis takimi bacagi, pilon. Iki ucu cerceve koordinatinda. */
export interface StrutPart {
  kind: 'strut';
  id: string;
  from: Vec3;
  to: Vec3;
  radius: number;
}

/**
 * Govdeye paralel ikincil kiris.
 *
 * TB2 ve ANKA'nin cift kirisli duzeni bu ilkelle ifade edilir; yeni bir
 * tip dali acilmasi gerekmez (specs/system-geometry).
 */
export interface BoomPart {
  kind: 'boom';
  id: string;
  /** Kirisin on ucu. */
  start: Vec3;
  length: number;
  radius: number;
}

export type Part =
  | BodyPart
  | PodPart
  | PanelPart
  | DiscPart
  | StrutPart
  | BoomPart;

export type PartKind = Part['kind'];

/** Kitin tamami. Yeni bir urun bu kumenin disina cikmamali. */
export const PART_KINDS: readonly PartKind[] = [
  'body',
  'pod',
  'panel',
  'disc',
  'strut',
  'boom'
] as const;

/* ---------------------------------------------------------------- sinirlar */

export interface Bounds {
  min: Vec3;
  max: Vec3;
}

export function emptyBounds(): Bounds {
  return {
    min: vec3(Infinity, Infinity, Infinity),
    max: vec3(-Infinity, -Infinity, -Infinity)
  };
}

export function isEmptyBounds(bounds: Bounds): boolean {
  return !(bounds.min.x <= bounds.max.x);
}

export function growBounds(bounds: Bounds, point: Vec3): Bounds {
  bounds.min.x = Math.min(bounds.min.x, point.x);
  bounds.min.y = Math.min(bounds.min.y, point.y);
  bounds.min.z = Math.min(bounds.min.z, point.z);
  bounds.max.x = Math.max(bounds.max.x, point.x);
  bounds.max.y = Math.max(bounds.max.y, point.y);
  bounds.max.z = Math.max(bounds.max.z, point.z);
  return bounds;
}

export function boundsSize(bounds: Bounds): Vec3 {
  return vec3(
    bounds.max.x - bounds.min.x,
    bounds.max.y - bounds.min.y,
    bounds.max.z - bounds.min.z
  );
}

export function boundsCenter(bounds: Bounds): Vec3 {
  return vec3(
    (bounds.min.x + bounds.max.x) / 2,
    (bounds.min.y + bounds.max.y) / 2,
    (bounds.min.z + bounds.max.z) / 2
  );
}

/**
 * Yerel eksen yonundeki birim vektor ve ona dik iki eksen.
 *
 * `along` yerel +y'yi cerceve +Y'sine tasir — yani hicbir sey yapmaz.
 * Oteki ikisi tek bir 90° cevirmedir; serbest donus gerekmiyor, cunku
 * kitteki her parca ya govde eksenine paralel ya da ona dik duruyor.
 */
function frame(orientation: PartAxis): {
  axis: Vec3;
  u: Vec3;
  v: Vec3;
} {
  switch (orientation) {
    case 'along':
      return {axis: vec3(0, 1, 0), u: vec3(1, 0, 0), v: vec3(0, 0, 1)};
    case 'lateral':
      return {axis: vec3(0, 0, 1), u: vec3(1, 0, 0), v: vec3(0, 1, 0)};
    case 'vertical':
      return {axis: vec3(1, 0, 0), u: vec3(0, 1, 0), v: vec3(0, 0, 1)};
  }
}

function add(a: Vec3, b: Vec3, scale = 1): Vec3 {
  return vec3(a.x + b.x * scale, a.y + b.y * scale, a.z + b.z * scale);
}

/**
 * Donel yuzeyin sinirlari.
 *
 * `u` ekseni kesitin DIKEY yariçapini tasir (aspect burada uygulanir),
 * `v` yatay yaricapi. Donel gövdede ikisi esittir.
 */
/**
 * Kesitin dikey uzanimi ve en genis noktasi, yarim en birimiyle.
 * Profil yoksa elips: iki yona da `aspect`.
 */
export function sectionExtent(spec: LatheSpec): {
  up: number;
  down: number;
  width: number;
} {
  if (!spec.section || spec.section.length === 0) {
    return {up: spec.aspect, down: spec.aspect, width: 1};
  }
  let up = -Infinity;
  let down = -Infinity;
  let width = 0;
  for (const point of spec.section) {
    up = Math.max(up, point.v);
    down = Math.max(down, -point.v);
    width = Math.max(width, point.w);
  }
  return {up, down, width};
}

/** Profilin verilen yarim genislikteki ALT yuzey konumu. Baglanti noktalari icin. */
export function sectionLowerAt(spec: LatheSpec, w: number): number {
  if (!spec.section || spec.section.length === 0) {
    // Elips: v = -aspect * sqrt(1 - w²)
    return -spec.aspect * Math.sqrt(Math.max(0, 1 - w * w));
  }
  const lower = spec.section.filter((point) => point.v <= 0);
  let best = lower[0];
  for (const point of lower) {
    if (Math.abs(point.w - w) < Math.abs(best.w - w)) best = point;
  }
  return best?.v ?? 0;
}

function latheBounds(part: PlacedLathe, into: Bounds): Bounds {
  const {axis, u, v} = frame(part.orientation);
  const extent = sectionExtent(part.spec);

  for (const station of part.spec.stations) {
    const center = add(part.origin, axis, station.y);
    const rv = station.radius * extent.width;

    for (const sv of [-1, 1]) {
      growBounds(into, add(add(center, u, station.radius * extent.up), v, rv * sv));
      growBounds(
        into,
        add(add(center, u, -station.radius * extent.down), v, rv * sv)
      );
    }
  }

  return into;
}

/**
 * Yuzey kesitinin yarim kalinlik profili, 0..1 veche oraninda.
 *
 * Yuvarlak hucum kenari, %30 vechede en kalin nokta, sivri firar kenari.
 * Belirli bir kanat profili DEGIL ve oyle sunulmuyor: ic geometriye dair
 * kaynakli verimiz yok. Bu yalnizca duz bir plakadan daha az yanlis olan
 * sematik bir kesit — duz plaka, hicbir ucakta bulunmayan bir bicim.
 */
const SECTION_PEAK = 0.3;

export function sectionHalfThickness(t: number): number {
  if (t <= 0 || t >= 1) return 0;
  if (t <= SECTION_PEAK) {
    const k = (SECTION_PEAK - t) / SECTION_PEAK;
    return 0.5 * Math.sqrt(Math.max(0, 1 - k * k));
  }
  return (0.5 * (1 - t)) / (1 - SECTION_PEAK);
}

/** Kesit adim sayisi — ust yuzey icin; alt yuzey aynasi. */
export const SECTION_STEPS = 14;

/**
 * Tek istasyonun kapali kesit konturu, panelin YEREL cercevesinde:
 * x aciklik, y veche, z kalinlik ve kivrim.
 */
export function panelSection(station: PanelStation): Vec3[] {
  /*
   * En kalin nokta ornek kumesine ACIKCA eklenir. Yalniz i/N orneklense
   * tepe iki ornegin arasina duserdi ve cizilen kalinlik anma degerinin
   * binde biri kadar altinda kalirdi — gorunmeyen ama olculebilen bir
   * sapma, ve olcum bu projenin konusu.
   */
  const ts = [...Array(SECTION_STEPS + 1).keys()].map((i) => i / SECTION_STEPS);
  if (!ts.includes(SECTION_PEAK)) {
    ts.push(SECTION_PEAK);
    ts.sort((a, b) => a - b);
  }

  const points: Vec3[] = [];
  for (const t of ts) {
    points.push(
      vec3(
        station.span,
        station.offset + t * station.chord,
        station.rise + sectionHalfThickness(t) * station.thickness
      )
    );
  }
  for (let i = ts.length - 2; i >= 1; i--) {
    const t = ts[i];
    points.push(
      vec3(
        station.span,
        station.offset + t * station.chord,
        station.rise - sectionHalfThickness(t) * station.thickness
      )
    );
  }
  return points;
}

/** Butun istasyonlarin kontur noktalari — sinir ve izdusum bunu okur. */
function panelPoints(part: PanelPart): Vec3[] {
  const points = part.stations.flatMap(panelSection);
  // Fileto yayi kok kenarindan acikliga dogru tasar.
  const root = part.stations[0];
  if (part.rootFillet > 0 && root) {
    for (const z of [-root.thickness / 2, root.thickness / 2]) {
      points.push(
        vec3(
          root.span + part.rootFillet,
          root.offset + root.chord / 2,
          root.rise + z
        )
      );
    }
  }
  return points;
}

/**
 * Yerel panel noktasini cerceveye tasi.
 *
 * Donus +Y etrafinda: (x, y, z) -> (x cos + z sin, y, -x sin + z cos).
 * Three'nin Object3D.rotation.y ile ayni; tasimadan onceki gorunum bu
 * esitlige bagli.
 */
export function panelPointToFrame(part: PanelPart, local: Vec3): Vec3 {
  const a = (part.angleDeg * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  const point = vec3(
    part.root.x + local.x * cos + local.z * sin,
    part.root.y + local.y,
    part.root.z + -local.x * sin + local.z * cos
  );
  // Yansima merkez duzlemde: aciklik yon degistirir, "yukari" degismez.
  return part.mirror ? vec3(point.x, point.y, -point.z) : point;
}

function discBounds(part: DiscPart, into: Bounds): Bounds {
  const {axis, u, v} = frame(part.orientation);
  const half = part.thickness / 2;

  for (const sa of [-1, 1]) {
    const center = add(part.center, axis, half * sa);
    for (const su of [-1, 1]) {
      for (const sv of [-1, 1]) {
        growBounds(
          into,
          add(add(center, u, part.radius * su), v, part.radius * sv)
        );
      }
    }
  }
  return into;
}

function capsuleBounds(from: Vec3, to: Vec3, radius: number, into: Bounds) {
  for (const point of [from, to]) {
    growBounds(into, vec3(point.x - radius, point.y - radius, point.z - radius));
    growBounds(into, vec3(point.x + radius, point.y + radius, point.z + radius));
  }
  return into;
}

/** Tek parcanin sinirlari. Kadraj ve iki boyutlu yerlesim ayni sayiyi okur. */
export function partBounds(part: Part, into: Bounds = emptyBounds()): Bounds {
  switch (part.kind) {
    case 'body':
    case 'pod':
      return latheBounds(part, into);
    case 'panel': {
      for (const point of panelPoints(part)) {
        growBounds(into, panelPointToFrame(part, point));
      }
      return into;
    }
    case 'disc':
      return discBounds(part, into);
    case 'strut':
      return capsuleBounds(part.from, part.to, part.radius, into);
    case 'boom':
      return capsuleBounds(
        part.start,
        add(part.start, vec3(0, 1, 0), part.length),
        part.radius,
        into
      );
  }
}

/**
 * Butun parcalarin sinirlari.
 *
 * Kadraj bunu kullanir; elle yazilmis ikinci bir hesap TUTULMAZ. Kanat
 * acikligi govdesinden uzun bir sistemde kanat ucunun kesilmemesinin
 * sebebi bu (specs/system-geometry).
 */
export function partsBounds(parts: readonly Part[]): Bounds {
  const bounds = emptyBounds();
  for (const part of parts) partBounds(part, bounds);
  return bounds;
}

/* -------------------------------------------------------------- tutamaklar */

/** Parcanin kendi uzanimi boyunca ilerleyen eksen; etiket bunu kullanir. */
export function partExtent(part: Part): {from: Vec3; to: Vec3} {
  switch (part.kind) {
    case 'body':
    case 'pod': {
      const {axis} = frame(part.orientation);
      const stations = part.spec.stations;
      const first = stations[0]?.y ?? 0;
      const last = stations[stations.length - 1]?.y ?? 0;
      return {
        from: add(part.origin, axis, first),
        to: add(part.origin, axis, last)
      };
    }
    case 'panel': {
      const first = part.stations[0];
      const last = part.stations[part.stations.length - 1];
      return {
        from: panelPointToFrame(
          part,
          vec3(first.span, first.offset + first.chord / 2, first.rise)
        ),
        to: panelPointToFrame(
          part,
          vec3(last.span, last.offset + last.chord / 2, last.rise)
        )
      };
    }
    case 'disc': {
      const {u} = frame(part.orientation);
      return {from: part.center, to: add(part.center, u, part.radius)};
    }
    case 'strut':
      return {from: part.from, to: part.to};
    case 'boom':
      return {
        from: part.start,
        to: add(part.start, vec3(0, 1, 0), part.length)
      };
  }
}

/** Parcanin o noktadaki yaricapi — etiket ofseti bunu kullanir. */
function radiusAt(part: Part, t: number): number {
  switch (part.kind) {
    case 'body':
    case 'pod': {
      const stations = part.spec.stations;
      if (stations.length === 0) return 0;
      const first = stations[0].y;
      const last = stations[stations.length - 1].y;
      const y = first + (last - first) * t;
      let best = stations[0];
      for (const station of stations) {
        if (Math.abs(station.y - y) < Math.abs(best.y - y)) best = station;
      }
      return best.radius;
    }
    case 'panel':
      // Etiket ofseti: kok kalinligi, yuzeyin kendi olcegi.
      return part.stations[0]?.thickness ?? 0;
    case 'disc':
      return part.thickness;
    case 'strut':
    case 'boom':
      return part.radius;
  }
}

/**
 * Etiket konumu.
 *
 * Konum mutlak koordinat DEGIL, parca uzerindeki orandir: olculer
 * guncellenince etiket kendiliginden dogru yerde kalir (CLAUDE.md §9).
 * `angle` yalniz donel govdede anlamli; oteki parcalarda yok sayilir,
 * cunku bir kanadin "radyal acisi" yoktur.
 */
export function partAnchor(
  part: Part,
  t: number,
  angleDeg?: number,
  offset = 1.6
): Vec3 {
  const {from, to} = partExtent(part);
  const base = vec3(
    from.x + (to.x - from.x) * t,
    from.y + (to.y - from.y) * t,
    from.z + (to.z - from.z) * t
  );

  const radius = radiusAt(part, t) * offset;

  if ((part.kind === 'body' || part.kind === 'pod') && angleDeg !== undefined) {
    const {u, v} = frame(part.orientation);
    const extent = sectionExtent(part.spec);
    const a = (angleDeg * Math.PI) / 180;
    const cos = Math.cos(a);
    return add(
      add(base, u, cos * radius * (cos >= 0 ? extent.up : extent.down)),
      v,
      Math.sin(a) * radius * extent.width
    );
  }

  // Donel olmayan parcada etiket parcadan disariya, +X yonunde tasinir.
  return add(base, vec3(1, 0, 0), radius);
}

/** Kimlige gore parca. Etiket cozumlemesi bunu kullanir. */
export function findPart(
  parts: readonly Part[],
  id: string
): Part | undefined {
  return parts.find((part) => part.id === id);
}

/**
 * Govdenin anma yaricapi. Tanimli degilse en genis istasyona dusulur.
 *
 * Ayrim kadraji etkiler: yerel bir fairing sismesi golge duzlemini
 * asagi, zoom sinirini disari iterdi.
 */
export function bodyRadiusOf(part: BodyPart | PodPart): number {
  return (
    part.spec.nominalRadius ??
    Math.max(...part.spec.stations.map((station) => station.radius))
  );
}

/**
 * Birincil govde — olcu cizgisi ve kadrajin govde yaricapi buradan gelir.
 * Yoksa undefined: her urunun bir govdesi olmak zorunda degil.
 */
export function primaryBody(parts: readonly Part[]): BodyPart | undefined {
  return parts.find((part): part is BodyPart => part.kind === 'body');
}
