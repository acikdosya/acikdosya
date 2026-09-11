import {
  panelPointToFrame,
  panelSection,
  sectionExtent,
  vec3,
  type BoomPart,
  type DiscPart,
  type Part,
  type PanelPart,
  type StrutPart,
  type Vec3
} from './parts';

/**
 * Parca listesinin ORTOGRAFIK izdusumu.
 *
 * Iki boyutlu sema, uc boyutlu modelle ayni parca listesinden turer; iki
 * katman ayrisamaz (specs/system-silhouette). Bu modul `three` ICE
 * AKTARMAZ — izdusum sunucuda calisiyor ve §6 butcesi 3B kutuphanesini
 * oraya sokmaya izin vermez.
 *
 * Izdusum perspektif DEGILDIR. Bu bir uslup karari degil: sayfanin butun
 * iddiasi olcunun okunabilir olmasi, perspektif ise olcuyu derinlige gore
 * bozar. Ureticinin perspektif render'larindan oran okumanin neden
 * gecersiz oldugunu anlatan bir sayfa, kendi semasini perspektifle
 * cizemez.
 *
 * Ekran cerceve: +u saga, +v ASAGI (SVG yerlisi). Model cerceve
 * lib/geometry/parts.ts ile ayni: +Y govde ekseni, +X yukari, ±Z yanal.
 */

export type ViewAxis = 'front' | 'side' | 'top';

interface Basis {
  /** Ekranda saga giden model yonu. */
  u: Vec3;
  /** Ekranda ASAGI giden model yonu. */
  v: Vec3;
  /** Bakis dogrultusu — bu eksende derinlik yok. */
  normal: Vec3;
}

/**
 * Uc kardinal gorunus.
 *
 * `side` govde eksenini yatay serer, burun solda. `top` ayni sekilde ama
 * yukaridan. `front` burun ucuna bakar: yatay eksen aciklik, dikey eksen
 * yukseklik — ureticinin yayimladigi on gorunusle ayni kadraj.
 */
const BASES: Record<ViewAxis, Basis> = {
  side: {u: vec3(0, 1, 0), v: vec3(-1, 0, 0), normal: vec3(0, 0, 1)},
  top: {u: vec3(0, 1, 0), v: vec3(0, 0, 1), normal: vec3(1, 0, 0)},
  front: {u: vec3(0, 0, 1), v: vec3(-1, 0, 0), normal: vec3(0, 1, 0)}
};

export interface Point2 {
  u: number;
  v: number;
}

export interface Box2 {
  minU: number;
  minV: number;
  maxU: number;
  maxV: number;
}

/** Bir parcanin izdusumu: kapali bir ya da birkac cokgen. */
export interface PartOutline {
  id: string;
  kind: Part['kind'];
  /** SVG yolu, metre cinsinden. Olcekleme cagirana ait. */
  path: string;
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function project(point: Vec3, basis: Basis): Point2 {
  return {u: dot(point, basis.u), v: dot(point, basis.v)};
}

function add(a: Vec3, b: Vec3, scale = 1): Vec3 {
  return vec3(a.x + b.x * scale, a.y + b.y * scale, a.z + b.z * scale);
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function polygonPath(points: readonly Point2[]): string {
  if (points.length === 0) return '';
  const [first, ...rest] = points;
  return [
    `M ${round(first.u)} ${round(first.v)}`,
    ...rest.map((point) => `L ${round(point.u)} ${round(point.v)}`),
    'Z'
  ].join(' ');
}

/**
 * Iki boyutlu disbukey zarf — Andrew monoton zinciri.
 *
 * Panel, cubuk ve disk izdusumleri disbukey oldugu icin zarf dogru
 * siluettir. Govde icin KULLANILMAZ: icbukey bir profil (burun omuzu,
 * kuyruk konisi) zarfa girince duzlesir.
 */
function hull(points: readonly Point2[]): Point2[] {
  if (points.length < 3) return [...points];
  const sorted = [...points].sort((a, b) => a.u - b.u || a.v - b.v);
  const cross = (o: Point2, a: Point2, b: Point2) =>
    (a.u - o.u) * (b.v - o.v) - (a.v - o.v) * (b.u - o.u);

  const build = (list: readonly Point2[]) => {
    const out: Point2[] = [];
    for (const point of list) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], point) <= 0) {
        out.pop();
      }
      out.push(point);
    }
    out.pop();
    return out;
  };

  return [...build(sorted), ...build([...sorted].reverse())];
}

/** Parcanin yerel dik eksenleri — lib/geometry/parts.ts ile ayni kural. */
function localFrame(orientation: 'along' | 'lateral' | 'vertical') {
  switch (orientation) {
    case 'along':
      return {axis: vec3(0, 1, 0), u: vec3(1, 0, 0), v: vec3(0, 0, 1)};
    case 'lateral':
      return {axis: vec3(0, 0, 1), u: vec3(1, 0, 0), v: vec3(0, 1, 0)};
    case 'vertical':
      return {axis: vec3(1, 0, 0), u: vec3(0, 1, 0), v: vec3(0, 0, 1)};
  }
}

/** Elips cokgen yaklasimi — SVG yolu yay tasimasin, olcekleme basit kalsin. */
const ELLIPSE_STEPS = 48;

/**
 * Donel yuzeyin izdusumu.
 *
 * Iki hal var. Eksen bakis dogrultusuna DIK ise siluet, istasyon
 * yaricaplarinin ust ve alt zarfidir — burun omuzu ve kuyruk konisi
 * oldugu gibi cikar. Eksen bakis dogrultusuna PARALEL ise yuzey uctan
 * gorunur ve siluet en genis istasyonun elipsidir.
 */
function latheOutline(
  part: Extract<Part, {kind: 'body' | 'pod'}>,
  basis: Basis
): Point2[] {
  const local = localFrame(part.orientation);
  const endOn = Math.abs(dot(local.axis, basis.normal)) > 0.999;
  const extent = sectionExtent(part.spec);

  /*
   * Kesitin ekran eksenlerine katkisi. `local.u` kesitin DIKEY ekseni,
   * `local.v` yatay ekseni. Profil simetrik olmadigi icin yukari ve
   * asagi ayri ayri tasinir — govde oval degil, damla bicimli.
   */
  const pushU = (r: number, sign: 1 | -1) =>
    Math.abs(dot(local.u, basis.u)) * r * (sign > 0 ? extent.up : extent.down) +
    Math.abs(dot(local.v, basis.u)) * r * extent.width;
  const pushV = (r: number, sign: 1 | -1) =>
    Math.abs(dot(local.u, basis.v)) * r * (sign > 0 ? extent.up : extent.down) +
    Math.abs(dot(local.v, basis.v)) * r * extent.width;

  if (endOn) {
    // Uctan gorunus: kesit profilinin kendisi.
    const radius = Math.max(...part.spec.stations.map((s) => s.radius));
    const centre = project(part.origin, basis);
    const profile = part.spec.section;

    if (profile && profile.length > 1) {
      const ring: Array<{v: number; w: number}> = [
        ...profile,
        ...profile.slice(1, -1).reverse().map((p) => ({v: p.v, w: -p.w}))
      ];
      return ring.map((point) => {
        const up = local.u;
        const side = local.v;
        const offset = add(
          add(part.origin, up, point.v * radius),
          side,
          point.w * radius
        );
        return project(offset, basis);
      });
    }

    const points: Point2[] = [];
    for (let i = 0; i < ELLIPSE_STEPS; i++) {
      const angle = (i / ELLIPSE_STEPS) * Math.PI * 2;
      const sign: 1 | -1 = Math.cos(angle) >= 0 ? 1 : -1;
      points.push({
        u: centre.u + Math.cos(angle) * pushU(radius, sign),
        v: centre.v + Math.sin(angle) * pushV(radius, sign)
      });
    }
    return points;
  }

  const upper: Point2[] = [];
  const lower: Point2[] = [];
  for (const station of part.spec.stations) {
    const centre = project(add(part.origin, local.axis, station.y), basis);
    upper.push({u: centre.u, v: centre.v - pushV(station.radius, 1)});
    lower.push({u: centre.u, v: centre.v + pushV(station.radius, -1)});
  }
  return [...upper, ...lower.reverse()];
}

/** Yuzeyin butun istasyon konturlari — izdusum bunlarin zarfini alir. */
function panelPoints(part: PanelPart): Vec3[] {
  const points = part.stations.flatMap(panelSection).map((point) =>
    panelPointToFrame(part, point)
  );

  const root = part.stations[0];
  if (part.rootFillet > 0 && root) {
    for (const z of [-root.thickness / 2, root.thickness / 2]) {
      points.push(
        panelPointToFrame(
          part,
          vec3(
            root.span + part.rootFillet,
            root.offset + root.chord / 2,
            root.rise + z
          )
        )
      );
    }
  }
  return points;
}

/**
 * Pervanenin izdusumu: gobek ve kanatlar AYRI cokgenler.
 *
 * Disbukey zarf alinsa disk dolu bir daire olurdu — sayfada pervane
 * yerine bir tabak. Donel yuzeyin izi bir daire degil, kanatlarin
 * taradigi bir yildizdir; siluet de onu gostermeli.
 */
function discPolygons(part: DiscPart, basis: Basis): Point2[][] {
  const local = localFrame(part.orientation);
  const half = part.thickness / 2;

  const at = (radius: number, angle: number, side: number) =>
    project(
      add(
        add(add(part.center, local.axis, side), local.u, Math.cos(angle) * radius),
        local.v,
        Math.sin(angle) * radius
      ),
      basis
    );

  const polygons: Point2[][] = [];

  // Gobek: kucuk bir elips.
  const hub: Point2[] = [];
  for (let i = 0; i < ELLIPSE_STEPS; i++) {
    hub.push(at(part.hubRadius, (i / ELLIPSE_STEPS) * Math.PI * 2, 0));
  }
  polygons.push(hub);

  // Kanatlar: gobekten uca uzanan ince dortgenler.
  const halfChord = part.bladeChord / 2 / Math.max(part.radius, 1e-9);
  for (let i = 0; i < part.bladeCount; i++) {
    const angle = (i / Math.max(part.bladeCount, 1)) * Math.PI * 2;
    polygons.push([
      at(part.hubRadius, angle - halfChord, half),
      at(part.radius, angle - halfChord * 0.45, half),
      at(part.radius, angle + halfChord * 0.45, -half),
      at(part.hubRadius, angle + halfChord, -half)
    ]);
  }

  return polygons;
}

/**
 * Cubugun izdusumu icin kesit noktalari.
 *
 * Onceki surumde iki ucta eksen hizali birer KUTU orneklenip zarfi
 * aliniyordu; egik bir cubukta bu, kalinligi kok iki katina kadar
 * sisiriyordu. Kesit artik cubugun kendi eksenine DIK bir daire, yani
 * gorunen kalinlik gercek kalinlik.
 */
function capsulePoints(from: Vec3, to: Vec3, radius: number): Vec3[] {
  const axis = vec3(to.x - from.x, to.y - from.y, to.z - from.z);
  const length = Math.hypot(axis.x, axis.y, axis.z);
  if (length < 1e-9) return [from, to];

  const dir = vec3(axis.x / length, axis.y / length, axis.z / length);
  // Eksene dik iki birim vektor.
  const seed =
    Math.abs(dir.x) < 0.9 ? vec3(1, 0, 0) : vec3(0, 1, 0);
  const u = normalise(cross(dir, seed));
  const v = cross(dir, u);

  const points: Vec3[] = [];
  const steps = 10;
  for (const centre of [from, to]) {
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      points.push(
        add(
          add(centre, u, Math.cos(angle) * radius),
          v,
          Math.sin(angle) * radius
        )
      );
    }
  }
  return points;
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return vec3(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x
  );
}

function normalise(a: Vec3): Vec3 {
  const length = Math.hypot(a.x, a.y, a.z) || 1;
  return vec3(a.x / length, a.y / length, a.z / length);
}

function strutPoints(part: StrutPart): Vec3[] {
  return capsulePoints(part.from, part.to, part.radius);
}

function boomPoints(part: BoomPart): Vec3[] {
  return capsulePoints(
    part.start,
    add(part.start, vec3(0, 1, 0), part.length),
    part.radius
  );
}

/** Tek parcanin izdusum yolu. */
export function projectPart(part: Part, axis: ViewAxis): PartOutline {
  const basis = BASES[axis];

  if (part.kind === 'body' || part.kind === 'pod') {
    return {id: part.id, kind: part.kind, path: polygonPath(latheOutline(part, basis))};
  }

  if (part.kind === 'disc') {
    return {
      id: part.id,
      kind: part.kind,
      path: discPolygons(part, basis).map(polygonPath).join(' ')
    };
  }

  const points =
    part.kind === 'panel'
      ? panelPoints(part)
      : part.kind === 'strut'
        ? strutPoints(part)
        : boomPoints(part);

  return {
    id: part.id,
    kind: part.kind,
    path: polygonPath(hull(points.map((point) => project(point, basis))))
  };
}

/**
 * Butun parcalarin izdusumu.
 *
 * Sira parca listesindeki sira: govde once, yuzeyler sonra. Cizim
 * sirasinin anlami var, yuzeyler govdenin uzerine biner.
 */
export function projectParts(
  parts: readonly Part[],
  axis: ViewAxis
): PartOutline[] {
  return parts.map((part) => projectPart(part, axis));
}

/**
 * Izdusumun sinir kutusu.
 *
 * Yerlesim bunu okur. Uc boyutlu sinir kutusunun ayni eksendeki
 * izdusumuyle ortusmeli — testler bunu siniyor (specs/system-silhouette).
 */
export function projectBounds(
  parts: readonly Part[],
  axis: ViewAxis
): Box2 | undefined {
  const basis = BASES[axis];
  let minU = Infinity;
  let minV = Infinity;
  let maxU = -Infinity;
  let maxV = -Infinity;

  const consume = (point: Point2) => {
    minU = Math.min(minU, point.u);
    minV = Math.min(minV, point.v);
    maxU = Math.max(maxU, point.u);
    maxV = Math.max(maxV, point.v);
  };

  for (const part of parts) {
    if (part.kind === 'body' || part.kind === 'pod') {
      latheOutline(part, basis).forEach(consume);
      continue;
    }
    if (part.kind === 'disc') {
      for (const polygon of discPolygons(part, basis)) polygon.forEach(consume);
      continue;
    }
    const points =
      part.kind === 'panel'
        ? panelPoints(part)
        : part.kind === 'strut'
          ? strutPoints(part)
          : boomPoints(part);
    points.forEach((point) => consume(project(point, basis)));
  }

  if (!(minU <= maxU)) return undefined;
  return {minU, minV, maxU, maxV};
}

/**
 * Izdusum yolunu cizim uzayina tasir.
 *
 * Izdusum metre cinsinden ve modelin kendi cercevesinde uretilir; SVG
 * yerlesimi olcek carpanini ve konumu bilir. Ikisini ayri tutmak, ayni
 * izdusumun hem sayfada hem paylasim gorselinde farkli olceklerle
 * kullanilabilmesini saglar.
 *
 * `swap` ekran eksenlerini takas eder: ucak ust gorunusu sayfada dik
 * seriliyor (uzunluk asagi, aciklik yana) ama izdusum uzunlugu yatay
 * veriyor. Takas bir bicim iddiasi tasimaz, yalnizca yerlesimdir.
 */
export function transformPath(
  path: string,
  options: {
    scale: number;
    offsetU: number;
    offsetV: number;
    swap?: boolean;
    round?: number;
  }
): string {
  const digits = options.round ?? 2;
  const factor = 10 ** digits;
  const fix = (value: number) => Math.round(value * factor) / factor;

  return path.replace(
    /(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g,
    (_match, rawU: string, rawV: string) => {
      const u = Number(rawU);
      const v = Number(rawV);
      const [su, sv] = options.swap ? [v, u] : [u, v];
      return `${fix(options.offsetU + su * options.scale)} ${fix(
        options.offsetV + sv * options.scale
      )}`;
    }
  );
}
