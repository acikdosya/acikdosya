'use client';

import type {
  GeoJSONSource,
  LineLayerSpecification,
  Map as MapLibreMap,
  Marker
} from 'maplibre-gl';
import {useCallback, useEffect, useRef, useState} from 'react';
import {Badge} from '@/components/confidence-badge/ConfidenceBadge';
import type {Locale} from '@/i18n/routing';
import {
  MAP_ATTRIBUTION,
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

  // Harita geri cagrilari render disinda calisir, guncel degeri buradan alir.
  const originRef = useRef(origin);
  const visibleRef = useRef(visible);

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
      if (disposed || !container.current || map.current) return;

      const instance = new maplibre.Map({
        container: container.current,
        style: MAP_STYLE_URL,
        center: start,
        zoom: MAP_DEFAULT_ZOOM,
        attributionControl: {compact: true, customAttribution: MAP_ATTRIBUTION}
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
        touched.current = true;
        setState((current) => ({...current, origin: originRef.current}));
      });

      instance.on('load', () => {
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
  }, [copy.markerHint, redraw, rings]);

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
    touched.current = true;
    setState((current) => {
      const next = new Set(current.visible);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return {...current, visible: next};
    });
  };

  const moveTo = (axis: 0 | 1, value: number) => {
    if (!Number.isFinite(value)) return;
    touched.current = true;
    setState((current) => {
      const next: LngLat =
        axis === 0
          ? [value, current.origin[1]]
          : [current.origin[0], value];
      return {...current, origin: clampLngLat(next)};
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
            min="-85"
            max="85"
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
            min="-180"
            max="180"
            value={Number(origin[0].toFixed(4))}
            onChange={(event) => moveTo(0, event.target.valueAsNumber)}
          />
        </label>
      </div>

      <p className={styles.legend}>{copy.legend}</p>
    </div>
  );
}
