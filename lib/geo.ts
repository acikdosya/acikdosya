/**
 * Jeodezik hesaplar. Turf eklenmiyor — sirf daire cizmek icin tum bundle
 * gelmesin (CLAUDE.md §2).
 *
 * Halkalar buyuk daire (great circle) uzerinde uretilir. Mercator'da duz
 * daire cizmek yuksek enlemlerde ciddi hata verir.
 */

/** WGS84 ortalama yaricap, km. */
export const EARTH_RADIUS_KM = 6371.0088;

export type LngLat = [longitude: number, latitude: number];

export type GeodesicRing = {
  type: 'Feature';
  properties: Record<string, never>;
  geometry: {
    type: 'LineString';
    coordinates: LngLat[];
  };
};

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const toDegrees = (radians: number) => (radians * 180) / Math.PI;

/**
 * Baslangic noktasindan verilen kerteriz ve mesafedeki nokta.
 * bearing radyan, distanceKm km.
 */
export function destination(
  origin: LngLat,
  distanceKm: number,
  bearing: number
): LngLat {
  const angular = distanceKm / EARTH_RADIUS_KM;
  const lat1 = toRadians(origin[1]);
  const lng1 = toRadians(origin[0]);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) +
      Math.cos(lat1) * Math.sin(angular) * Math.cos(bearing)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2)
    );

  return [toDegrees(lng2), toDegrees(lat2)];
}

/**
 * Boylami merkeze gore surekli tutar. Normalize edilmis (-180, 180]
 * degerler antimeridyeni gecen halkalari dunyanin karsi ucuna
 * baglayan cizgiye cevirirdi.
 */
function unwrap(longitude: number, reference: number): number {
  let value = longitude;
  while (value - reference > 180) value -= 360;
  while (value - reference < -180) value += 360;
  return value;
}

/**
 * Merkez etrafinda jeodezik halka. steps arttikca cizgi yumusar;
 * 180 adim 1000 km yaricapta gozle gorulur kirilma birakmiyor.
 */
export function geodesicRing(
  center: LngLat,
  radiusKm: number,
  steps = 180
): GeodesicRing {
  const coordinates: LngLat[] = [];

  for (let index = 0; index <= steps; index += 1) {
    const bearing = (2 * Math.PI * index) / steps;
    const point = destination(center, radiusKm, bearing);
    coordinates.push([unwrap(point[0], center[0]), point[1]]);
  }

  return {
    type: 'Feature',
    properties: {},
    geometry: {type: 'LineString', coordinates}
  };
}

/** Iki nokta arasi buyuk daire mesafesi, km. */
export function distanceKm(from: LngLat, to: LngLat): number {
  const lat1 = toRadians(from[1]);
  const lat2 = toRadians(to[1]);
  const deltaLat = lat2 - lat1;
  const deltaLng = toRadians(to[0] - from[0]);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Enlem/boylam sinirlarina kirpar — surukleme ve URL girdisi icin. */
export function clampLngLat([longitude, latitude]: LngLat): LngLat {
  return [
    Math.max(-180, Math.min(180, longitude)),
    Math.max(-85, Math.min(85, latitude))
  ];
}
