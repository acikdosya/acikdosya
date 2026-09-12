'use client';

import type {
  GeoJSONSource,
  LineLayerSpecification,
  Map as MapLibreMap,
  Marker,
  StyleSpecification
} from 'maplibre-gl';
import {useCallback, useEffect, useRef, useState} from 'react';
import {Badge} from '@/components/confidence-badge/ConfidenceBadge';
import type {Locale} from '@/i18n/routing';
import {EVENTS, track} from '@/lib/analytics';
import {
  MAP_DEFAULT_CENTER,
  MAP_DEFAULT_ZOOM,
  MAP_STYLE_URL
} from '@/lib/config';
import {formatNumber} from '@/lib/format';
import {clampLngLat, geodesicRing, type LngLat} from '@/lib/geo';
import type {Confidence} from '@/lib/schema';
import {PALETTE} from '@/lib/tokens';
import type {RangeCopy} from './copy';
import type {Ring} from './rings';
import styles from './RangeEnvelope.module.css';
import 'maplibre-gl/dist/maplibre-gl.css';

type Props = {
  rings: Ring[];
  locale: Locale;
  copy: RangeCopy;
};

/**
 * Halka cizgisi rozetlerle ayni dili konusur:
 * duz resmi, kesikli basin, seyrek noktali tahmin.
 */
type RingStyle = {color: string; dash?: number[]};

function ringStyles(): Record<Confidence, RingStyle> {
  const root = getComputedStyle(document.documentElement);
  const token = (name: string) => root.getPropertyValue(name).trim();

  return {
    official: {color: token('--ink')},
    press: {color: token('--ink-2'), dash: [3, 3]},
    estimate: {color: token('--signal'), dash: [1, 2]}
  };
}

/**
 * PMTiles protokolu bir kez kaydedilir. Ornek modul duzeyinde duruyor
 * cunku ic onbellegi (arsiv basligi, dizin sayfalari) sayfalar arasi
 * gezinmede korunuyor: ayni haritaya donen okuyucu basligi yeniden
 * indirmez.
 */
let pmtilesReady = false;

async function registerPmtiles(maplibre: typeof import('maplibre-gl')) {
  if (pmtilesReady) return;
  const {Protocol} = await import('pmtiles');
  maplibre.addProtocol('pmtiles', new Protocol().tile);
  pmtilesReady = true;
}

/** [minLon, minLat, maxLon, maxLat] — stil metadata'siyla ayni sira. */
type Bbox = [number, number, number, number];

/**
 * Stili cozer.
 *
 * MapLibre glif adresini goreli kabul ediyor ama sprite adresini etmiyor:
 * "Invalid sprite URL, must be absolute" diye reddediyor. Stil dosyasi
 * statik uretiliyor ve hangi origin'de servis edilecegini bilemez (yerelde
 * localhost, yayinda acikdosya.org), bu yuzden mutlaklastirma burada,
 * calisma aninda yapiliyor.
 *
 * Ek istek maliyeti yok: stili nesne olarak veriyoruz, MapLibre ayni
 * dosyayi bir daha indirmiyor.
 */
async function loadStyle(
  url: string,
  locale: Locale
): Promise<StyleSpecification | string> {
  if (/^https?:/i.test(url)) return url;

  const style = (await fetch(url).then((response) =>
    response.json()
  )) as StyleSpecification;

  if (typeof style.sprite === 'string' && style.sprite.startsWith('/')) {
    style.sprite = new URL(style.sprite, window.location.origin).toString();
  }

  /*
   * Etiket dili okuyucunun dili. Paket tek: ad alanlarinin hepsi tile'in
   * icinde duruyor, degisen yalnizca hangisinin once denendigi. Iki ayri
   * paket uretmek 66 MB'i ikiye katlardi.
   *
   * Stil dosyasi TR sirasiyla uretiliyor (scripts/build-tiles.mjs), burada
   * yalnizca diger diller icin sira degistiriliyor.
   */
  if (locale !== 'tr') {
    for (const layer of style.layers) {
      if (!('layout' in layer) || !layer.layout) continue;
      const field = (layer.layout as {'text-field'?: unknown})['text-field'];
      if (!Array.isArray(field) || field[0] !== 'coalesce') continue;

      (layer.layout as {'text-field'?: unknown})['text-field'] = [
        'coalesce',
        ['get', `name:${locale}`],
        ['get', 'name:tr']
      ];
    }
  }

  return style;
}

const REF_PARAM = 'ref';
const RINGS_PARAM = 'halkalar';

function readUrlState(rings: Ring[]): {
  origin: LngLat;
  visible: Set<string>;
} {
  const fallback = {
    origin: MAP_DEFAULT_CENTER as LngLat,
    visible: new Set(rings.filter((ring) => ring.defaultVisible).map((r) => r.id))
  };

  if (typeof window === 'undefined') return fallback;

  const params = new URLSearchParams(window.location.search);
  const reference = params.get(REF_PARAM);
  const selected = params.get(RINGS_PARAM);

  if (reference) {
    const [lat, lng] = reference.split(',').map(Number);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      fallback.origin = clampLngLat([lng, lat]);
    }
  }

  if (selected !== null) {
    const ids = new Set(selected.split(',').filter(Boolean));
    fallback.visible = new Set(
      rings.filter((ring) => ids.has(ring.id)).map((ring) => ring.id)
    );
  }

  return fallback;
}

/** Paylasilan link ayni gorunumu acsin — durum URL'de, depolamada degil. */
function writeUrlState(origin: LngLat, visible: Set<string>) {
  const params = new URLSearchParams(window.location.search);
  params.set(REF_PARAM, `${origin[1].toFixed(4)},${origin[0].toFixed(4)}`);
  params.set(RINGS_PARAM, [...visible].join(','));

  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}?${params.toString()}${window.location.hash}`
  );
}

export default function RangeEnvelopeMap({rings, locale, copy}: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap>(null);
  const marker = useRef<Marker>(null);

  // Baslangic durumu URL'den okunur; sonrasinda state yonetir.
  const [{origin, visible}, setState] = useState(() => readUrlState(rings));

  /*
   * Adres cubugu ancak kullanici bir sey degistirince yazilir. Onceden her
   * mount'ta yaziliyordu: okuyucu haritaya scroll ettigi anda adres
   * uzuyordu, hicbir sey yapmadan. Paylasilan link kullanicinin kendi
   * kurdugu gorunumu tasimali.
   */
  const touched = useRef(false);

  /*
   * Olcum: haritaya dokunuldu mu. Sayfa basina bir kez, ilk dokunusun
   * turuyle. Her surukleme karesini saymak ne bize bir sey soyler ne de
   * ziyaretcinin hakkidir — soru "bu bolum kullaniliyor mu", "nereye
   * bakildi" degil (CLAUDE.md §5.1).
   */
  const reported = useRef(false);

  const interacted = useCallback((kind: 'isaretci' | 'halka' | 'koordinat') => {
    touched.current = true;
    if (reported.current) return;
    reported.current = true;
    track(EVENTS.map, {tur: kind});
  }, []);

  /*
   * Paketin kapsadigi alan. Stil dosyasinin metadata'sindan okunuyor,
   * burada tekrar yazilmiyor: kapsama scripts/build-tiles.mjs icindeki
   * bbox'tan gelir ve iki yerde tutulursa er ya da gec ayrisirlar.
   */
  const [coverage, setCoverage] = useState<Bbox | null>(null);

  // Harita geri cagrilari render disinda calisir, guncel degeri buradan alir.
  const originRef = useRef(origin);
  const visibleRef = useRef(visible);
  const coverageRef = useRef<Bbox | null>(null);

  /** Referans nokta paketin disina cikamaz; disarisi bos harita demek. */
  const clampToCoverage = useCallback((point: LngLat): LngLat => {
    const box = coverageRef.current;
    if (!box) return clampLngLat(point);
    return [
      Math.max(box[0], Math.min(box[2], point[0])),
      Math.max(box[1], Math.min(box[3], point[1]))
    ];
  }, []);

  /** Halkalari mevcut merkeze gore yeniden cizer. */
  const redraw = useCallback(
    (center: LngLat) => {
      const instance = map.current;
      if (!instance) return;

      for (const ring of rings) {
        const source = instance.getSource<GeoJSONSource>(ring.id);
        source?.setData(geodesicRing(center, ring.km));
      }
    },
    [rings]
  );

  useEffect(() => {
    if (!container.current || map.current) return;

    let disposed = false;
    const start = originRef.current;

    /**
     * MapLibre calisma zamaninda yuklenir. Statik import, paketi (~270 KB
     * sikistirilmis) sayfa chunk'ina bagliyor ve ilk yuk butcesini asiyordu.
     */
    void (async () => {
      const maplibre = await import('maplibre-gl');
      await registerPmtiles(maplibre);
      const style = await loadStyle(MAP_STYLE_URL, locale);
      if (disposed || !container.current || map.current) return;

      const instance = new maplibre.Map({
        container: container.current,
        style,
        center: start,
        zoom: MAP_DEFAULT_ZOOM,
        /*
         * Atif stil dosyasindaki kaynak tanimindan geliyor, burada
         * customAttribution ile tekrarlanmiyor. Kontrol kapatilmaz:
         * OSM verisi ODbL geregi atif ister ve bu ekranda gorunur kalir.
         */
        attributionControl: {compact: true}
      });
      map.current = instance;

      instance.addControl(
        new maplibre.NavigationControl({showCompass: false}),
        'top-right'
      );
      instance.keyboard.enable();

      /* MapLibre CSS degiskeni okumuyor; renk lib/tokens.ts'ten geliyor. */
      const pin = new maplibre.Marker({draggable: true, color: PALETTE.signal})
        .setLngLat(start)
        .setPopup(
          new maplibre.Popup({offset: 26, closeButton: false}).setText(
            copy.markerHint
          )
        )
        .addTo(instance);
      marker.current = pin;

      pin.on('drag', () => {
        const next = pin.getLngLat().toArray() as LngLat;
        originRef.current = next;
        redraw(next);
      });
      pin.on('dragend', () => {
        interacted('isaretci');
        const next = clampToCoverage(originRef.current);
        originRef.current = next;
        setState((current) => ({...current, origin: next}));
      });

      instance.on('load', () => {
        /*
         * Kapsama disina pan yapilmaz. Paket Turkiye ve cevresini iceriyor;
         * disarisi bos zemin olarak gorunurdu ve okuyucu haritanin
         * bozuldugunu sanardi.
         */
        const metadata = instance.getStyle().metadata as
          | {'acikdosya:bbox'?: number[]}
          | undefined;
        const box = metadata?.['acikdosya:bbox'];
        if (box?.length === 4) {
          const bbox = box as Bbox;
          instance.setMaxBounds([
            [bbox[0], bbox[1]],
            [bbox[2], bbox[3]]
          ]);
          coverageRef.current = bbox;
          setCoverage(bbox);
        }

        const palette = ringStyles();

        for (const ring of rings) {
          instance.addSource(ring.id, {
            type: 'geojson',
            data: geodesicRing(start, ring.km)
          });

          const style = palette[ring.confidence];
          const paint: LineLayerSpecification['paint'] = {
            'line-color': style.color,
            'line-width': 1.8
          };
          if (style.dash) paint['line-dasharray'] = style.dash;

          instance.addLayer({
            id: ring.id,
            type: 'line',
            source: ring.id,
            layout: {
              visibility: visibleRef.current.has(ring.id) ? 'visible' : 'none',
              'line-cap': 'round'
            },
            paint
          });
        }
      });
    })();

    return () => {
      disposed = true;
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, [clampToCoverage, copy.markerHint, interacted, locale, redraw, rings]);

  // Merkez veya secim degisince halkalar, isaretci ve URL esitlenir.
  useEffect(() => {
    originRef.current = origin;
    visibleRef.current = visible;
    marker.current?.setLngLat(origin);
    redraw(origin);

    const instance = map.current;
    if (instance) {
      for (const ring of rings) {
        if (!instance.getLayer(ring.id)) continue;
        instance.setLayoutProperty(
          ring.id,
          'visibility',
          visible.has(ring.id) ? 'visible' : 'none'
        );
      }
    }

    if (touched.current) writeUrlState(origin, visible);
  }, [origin, redraw, rings, visible]);

  const toggle = (id: string) => {
    interacted('halka');
    setState((current) => {
      const next = new Set(current.visible);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return {...current, visible: next};
    });
  };

  const moveTo = (axis: 0 | 1, value: number) => {
    if (!Number.isFinite(value)) return;
    interacted('koordinat');
    setState((current) => {
      const next: LngLat =
        axis === 0
          ? [value, current.origin[1]]
          : [current.origin[0], value];
      return {...current, origin: clampToCoverage(next)};
    });
  };

  return (
    <div>
      <div className={styles.controls}>
        {rings.map((ring) => (
          <button
            type="button"
            key={ring.id}
            className={styles.toggle}
            aria-pressed={visible.has(ring.id)}
            onClick={() => toggle(ring.id)}
          >
            <Badge
              confidence={ring.confidence}
              label={copy.confidence[ring.confidence]}
            />
            <span>
              {ring.variantLabel} ·{' '}
              {ring.operator ? `${ring.operator} ` : ''}
              {formatNumber(ring.km, locale)} km
            </span>
          </button>
        ))}
      </div>

      <div
        ref={container}
        className={styles.map}
        role="application"
        aria-label={copy.mapLabel}
      />

      {/* Isaretciyi surukleyemeyenler icin klavyeyle ayni islem. */}
      <div className={styles.coordinates}>
        <label>
          {copy.latitude}
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            /* Sinirlar paketin kapsamasindan; paket yuklenmeden once dunya. */
            min={coverage ? coverage[1] : -85}
            max={coverage ? coverage[3] : 85}
            value={Number(origin[1].toFixed(4))}
            onChange={(event) => moveTo(1, event.target.valueAsNumber)}
          />
        </label>
        <label>
          {copy.longitude}
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            min={coverage ? coverage[0] : -180}
            max={coverage ? coverage[2] : 180}
            value={Number(origin[0].toFixed(4))}
            onChange={(event) => moveTo(0, event.target.valueAsNumber)}
          />
        </label>
      </div>

      <p className={styles.legend}>{copy.legend}</p>
      {copy.altitudeNote ? (
        <p className={styles.legend}>{copy.altitudeNote}</p>
      ) : null}
    </div>
  );
}
