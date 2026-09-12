'use client';

import dynamic from 'next/dynamic';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore
} from 'react';
import {EVENTS, track} from '@/lib/analytics';
import type {SelectedDimensions} from '@/lib/geometry/measurements';
import type {Confidence} from '@/lib/schema';
import {ArButton} from './ArButton';
import type {ViewerAnnotation, ViewSpec} from './ModelViewer';
import styles from './ModelSection.module.css';

export interface ModelVariant {
  id: string;
  label: string;
  /** Olcu verisi — geometri yalnizca bundan turer. */
  dimensions: SelectedDimensions;
  /** Sistem slug'i — hangi dis profilin uygulanacagini belirler. */
  systemSlug: string;
  /** Olcu verisinin guven seviyesi; butondaki chip bunu gosterir. */
  confidence: Confidence;
  confidenceLabel: string;
  annotations: ViewerAnnotation[];
  /** Mutlak GLB adresi — Scene Viewer goreli adres kabul etmez. */
  modelUrl: string;
  ariaLabel: string;
}

interface Copy {
  loading: string;
  hint: string;
  ar: string;
  overview: string;
  front: string;
  fullscreen: string;
  exitFullscreen: string;
}

/** Dinamik chunk inerken gosterilir; yukseklik sahneyle ayni, sayfa kaymaz. */
function ViewerSkeleton() {
  return <div className="viewer-skeleton" aria-hidden />;
}

const ModelViewer = dynamic(() => import('./ModelViewer'), {
  ssr: false,
  loading: ViewerSkeleton
});

type FullscreenState = 'unsupported' | 'off' | 'on';

function subscribeFullscreen(onChange: () => void) {
  document.addEventListener('fullscreenchange', onChange);
  return () => document.removeEventListener('fullscreenchange', onChange);
}

function readFullscreen(): FullscreenState {
  if (!document.fullscreenEnabled) return 'unsupported';
  return document.fullscreenElement ? 'on' : 'off';
}

/** Destek yoksa buton hic basilmaz; calismayan kontrol gostermeyiz. */
function useFullscreen(): FullscreenState {
  return useSyncExternalStore(
    subscribeFullscreen,
    readFullscreen,
    () => 'unsupported' as const
  );
}

/**
 * three + drei ~450 KB. Dinamik import tek basina yetmez: bilesen mount
 * olur olmaz chunk inerdi. Bu yuzden model ancak bolum goruntuye
 * yaklasinca yuklenir — CLAUDE.md §6, RangeEnvelope ile ayni desen.
 */
export function ModelSection({
  variants,
  fallback,
  copy
}: {
  variants: ModelVariant[];
  fallback: React.ReactNode;
  copy: Copy;
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [activeId, setActiveId] = useState(variants[0]?.id);
  const [viewId, setViewId] = useState('overview');
  const fullscreen = useFullscreen();

  /*
   * Olcum: 3D bolumu gercekten kuruldu mu, kuruldugunda WebGL var miydi.
   * Bolume inildigi halde silüete dusuluyorsa bunu bilmek isteriz —
   * agir chunk bosa inmis demektir (CLAUDE.md §6).
   */
  const reported = useRef(false);

  const handleReady = useCallback((webgl: boolean) => {
    if (reported.current) return;
    reported.current = true;
    track(EVENTS.model, {webgl});
  }, []);

  useEffect(() => {
    const element = wrapper.current;
    if (!element || inView) return;

    // Destek yoksa modeli gizlemektense hemen yukle.
    if (typeof IntersectionObserver === 'undefined') {
      const timer = setTimeout(() => setInView(true), 0);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      {rootMargin: '300px'}
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [inView]);

  const active = variants.find((variant) => variant.id === activeId);
  if (!active) return null;

  /*
   * Gorunum on ayarlari veriden turer: etiketlerin kendi parca ve
   * oranlari. Iki sabit on ayar var — genel gorunum ve on gorunus.
   * On gorunus, ureticinin yayimladigi on gorunusle ve iki boyutlu
   * semanin 'front' izdusumuyle ayni ekseni kullanir.
   */
  const views: Array<{id: string; label: string; spec: ViewSpec}> = [
    {id: 'overview', label: copy.overview, spec: {kind: 'overview'}},
    {id: 'front', label: copy.front, spec: {kind: 'front'}},
    ...active.annotations.map((annotation) => ({
      id: annotation.id,
      label: annotation.label,
      spec: {
        kind: 'focus' as const,
        part: annotation.part,
        t: annotation.t,
        angle: annotation.angle
      }
    }))
  ];
  const view = views.find((item) => item.id === viewId) ?? views[0];

  function toggleFullscreen() {
    // Tarayici istegi reddedebilir (izin, kullanici hareketi yok). Sessizce gec.
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      return;
    }
    wrapper.current?.requestFullscreen().catch(() => {});
  }

  return (
    <div ref={wrapper} className={styles.wrapper}>
      {inView ? (
        <ModelViewer
          systemSlug={active.systemSlug}
          variantId={active.id}
          dimensions={active.dimensions}
          annotations={active.annotations}
          view={view.spec}
          fallback={fallback}
          label={active.ariaLabel}
          onReady={handleReady}
        />
      ) : (
        <div className="viewer-skeleton" aria-hidden>
          {copy.loading}
        </div>
      )}

      <div className={styles.bar}>
        {variants.length > 1
          ? variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                className={styles.button}
                aria-pressed={variant.id === active.id}
                onClick={() => {
                  setActiveId(variant.id);
                  track(EVENTS.variant, {varyant: variant.id});
                }}
              >
                {variant.label}
                <span className={`chip conf-${variant.confidence}`}>
                  {variant.confidenceLabel}
                </span>
              </button>
            ))
          : null}

        <ArButton
          modelUrl={active.modelUrl}
          title={active.label}
          label={copy.ar}
        />

        {fullscreen === 'unsupported' ? null : (
          <button
            type="button"
            className={styles.button}
            aria-pressed={fullscreen === 'on'}
            onClick={toggleFullscreen}
          >
            {fullscreen === 'on' ? copy.exitFullscreen : copy.fullscreen}
          </button>
        )}
      </div>

      <div className={styles.views}>
        {views.map((item) => (
          <button
            key={item.id}
            type="button"
            className={styles.button}
            aria-pressed={item.id === view.id}
            onClick={() => setViewId(item.id)}
          >
            {item.label}
          </button>
        ))}
        <span className={styles.hint}>{copy.hint}</span>
      </div>
    </div>
  );
}
