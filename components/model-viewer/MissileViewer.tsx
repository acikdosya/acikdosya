'use client';

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore
} from 'react';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import * as THREE from 'three';
import {ContactShadows, Html, OrbitControls} from '@react-three/drei';
import {
  annotationPosition,
  buildMissile,
  SCHEMATIC,
  type MissileSpec
} from '@/lib/geometry/missile';
import type {Confidence} from '@/lib/schema';

export interface ViewerAnnotation {
  id: string;
  /** Gövde boyunca oran, 0 = burun ucu, 1 = kuyruk. */
  t: number;
  /** Radyal açı, derece. */
  angle: number;
  /** Dile göre çözülmüş etiket — bu bileşen mesaj paketi taşımaz. */
  label: string;
  confidence: Confidence;
  /** "resmî" / "basın" / "tahmin" — sunucuda çevrildi. */
  confidenceLabel: string;
}

interface Props {
  spec: MissileSpec;
  annotations: ViewerAnnotation[];
  /**
   * Odaklanilacak bolumun govde orani. null ise genel gorunum.
   * Deger annotation verisinden gelir; elle yazilmis kamera konumu yok.
   */
  focusT: number | null;
  /** WebGL yoksa gösterilecek içerik — sayfa ScaleSilhouette veriyor. */
  fallback: React.ReactNode;
  label: string;
  /**
   * Görüntüleyici kurulduğunda bir kez çağrılır. Parametre, WebGL2 bulunup
   * bulunmadığını söyler: false ise sahne değil silüet gösteriliyor.
   * Kararlı bir başvuru bekler — her render'da yeni işlev verilirse
   * yeniden çağrılır.
   */
  onReady?: (webgl: boolean) => void;
}

function Missile({
  spec,
  annotations
}: Pick<Props, 'spec' | 'annotations'>) {
  // CSS pikseli, cihaz pikseli degil: mobil 48, masaustu 72 segment.
  const width = useThree((state) => state.size.width);
  const invalidate = useThree((state) => state.invalidate);
  const isMobile = width < 700;

  const {lengthM, diameterMm} = spec;

  // Bagimliliklar primitif: sayfa her render'da yeni spec nesnesi verse bile
  // olcu degismedikce geometri yeniden kurulmaz.
  const {group, dimensions, dispose} = useMemo(
    () =>
      buildMissile({
        lengthM,
        diameterMm,
        radialSegments: isMobile ? 48 : 72
      }),
    [lengthM, diameterMm, isMobile]
  );

  // Varyant degisince onceki geometri ve materyal bellekten duser.
  useEffect(() => dispose, [dispose]);

  // frameloop="demand" halinde yeni geometri kendiliginden cizilmez;
  // hareket azaltilmis kullanici bos bir kutu gormesin.
  useEffect(() => {
    invalidate();
  }, [group, invalidate]);

  return (
    // uzun eksen ekranda yatay dursun
    <group rotation={[0, 0, Math.PI / 2]} position={[lengthM / 2, 0, 0]}>
      <primitive object={group} />
      {annotations.map((annotation) => (
        <Html
          key={annotation.id}
          position={annotationPosition(
            annotation.t,
            annotation.angle,
            dimensions
          )}
          center
          occlude
          style={{pointerEvents: 'none'}}
        >
          <span className="hotspot">
            {annotation.label}
            <span className={`chip conf-${annotation.confidence}`}>
              {annotation.confidenceLabel}
            </span>
          </span>
        </Html>
      ))}
    </group>
  );
}

type OrbitLike = {target: THREE.Vector3; update: () => void} | null;

interface Goal {
  target: THREE.Vector3;
  position: THREE.Vector3;
}

/**
 * Kamera konumu da olcuden turer. Genel gorunumde model sahne genisliginin
 * ~%80'ini kaplar; bir bolume odaklanildiginda cerceve capin katidir.
 * Model yatay durdugu icin t orani dunya ekseninde x = L * (0.5 - t) olur.
 */
function goalFor(
  lengthM: number,
  diameterMm: number,
  focusT: number | null,
  fov: number,
  aspect: number
): Goal {
  const radius = diameterMm / 2000;
  const tan = Math.tan(((fov * Math.PI) / 180) / 2);

  if (focusT === null) {
    const distance = Math.max(
      lengthM / (2 * tan * aspect * 0.8),
      lengthM * 0.55
    );
    return {
      target: new THREE.Vector3(0, 0, 0),
      position: new THREE.Vector3(0, lengthM * 0.18, distance)
    };
  }

  const x = lengthM * (0.5 - focusT);
  const distance = Math.max((radius * 7) / (2 * tan), radius * 3);
  return {
    target: new THREE.Vector3(x, 0, 0),
    position: new THREE.Vector3(x, radius * 1.2, distance)
  };
}

function Framing({
  lengthM,
  diameterMm,
  focusT,
  reduce
}: {
  lengthM: number;
  diameterMm: number;
  focusT: number | null;
  reduce: boolean;
}) {
  const camera = useThree((state) => state.camera);
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);
  const invalidate = useThree((state) => state.invalidate);
  const controls = useThree((state) => state.controls) as unknown as OrbitLike;
  const moving = useRef(true);

  const goal = useMemo(() => {
    const fov = camera instanceof THREE.PerspectiveCamera ? camera.fov : 38;
    return goalFor(lengthM, diameterMm, focusT, fov, width / height);
  }, [camera, lengthM, diameterMm, focusT, width, height]);

  useEffect(() => {
    // Hedef degisti, yumusatma yeniden baslar.
    moving.current = true;

    if (!reduce) return;
    // Hareket azaltilmissa gecis yok: kamera dogrudan yerine gider.
    camera.position.copy(goal.position);
    controls?.target.copy(goal.target);
    controls?.update();
    moving.current = false;
    invalidate();
  }, [camera, controls, goal, reduce, invalidate]);

  useFrame(() => {
    if (reduce || !moving.current) return;

    camera.position.lerp(goal.position, 0.12);
    controls?.target.lerp(goal.target, 0.12);
    controls?.update();

    // Yeterince yaklasinca birak, aksi halde otomatik donus kilitlenir.
    if (camera.position.distanceTo(goal.position) < lengthM * 0.01) {
      moving.current = false;
    }
  });

  return null;
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/** Kullanici tercihini oturum ortasinda degistirse de yakalanir. */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  );
}

let webgl2: boolean | undefined;

/**
 * WebGL2 destegi. R3F v9 WebGL1 ile calismaz; destek yoksa siluete duseriz.
 * Sonuc modul duzeyinde onbelleklenir — her render'da context acilmasin.
 */
function supportsWebGL2(): boolean {
  if (webgl2 === undefined) {
    try {
      webgl2 = !!document.createElement('canvas').getContext('webgl2');
    } catch {
      webgl2 = false;
    }
  }
  return webgl2;
}

/**
 * Sematik model — CLAUDE.md §9.
 * Geometri icerikteki olcu alanlarindan turer, hazir model yok.
 * Model dekoratiftir: buradaki her bilgi spec tablosunda da vardir.
 */
export default function MissileViewer({
  spec,
  annotations,
  focusT,
  fallback,
  label,
  onReady
}: Props) {
  const reduce = usePrefersReducedMotion();
  const [grabbed, setGrabbed] = useState(false);

  // ssr:false ile yuklendigi icin burasi yalnizca tarayicida calisir.
  const webgl = supportsWebGL2();

  useEffect(() => {
    onReady?.(webgl);
  }, [onReady, webgl]);

  // Kendi kendine donus yalnizca genel gorunumde, kullanici dokunana kadar.
  const autoRotate = !reduce && !grabbed && focusT === null;
  const radius = spec.diameterMm / 2000;

  if (!webgl) return <>{fallback}</>;

  return (
    <div
      className="viewer"
      role="img"
      aria-label={label}
      onPointerDown={() => setGrabbed(true)}
    >
      <Canvas
        // flat: ton esleme kapali. ACES sinematik bir yuzey verirdi;
        // bizim yuzeyimiz mat ve sematik kalmali (CLAUDE.md §9).
        flat
        dpr={[1, 2]}
        camera={{
          fov: 38,
          near: 0.1,
          far: 200,
          position: [0, spec.lengthM * 0.18, spec.lengthM * 1.35]
        }}
        gl={{antialias: true, alpha: true}}
        // Hareket azaltilmissa kare yalnizca kullanici etkilesiminde uretilir.
        frameloop={reduce ? 'demand' : 'always'}
      >
        <hemisphereLight args={[0xffffff, 0xb9bdb8, 1.5]} />
        <directionalLight position={[3, 6, 5]} intensity={1.5} />
        <directionalLight position={[-4, -2, -3]} intensity={0.5} />
        <Framing
          lengthM={spec.lengthM}
          diameterMm={spec.diameterMm}
          focusT={focusT}
          reduce={reduce}
        />
        <Suspense fallback={null}>
          <Missile spec={spec} annotations={annotations} />
          {/* Govdeyi zemine oturtan yumusak golge: isik kurgusu degil,
              derinlik ipucu. Yuzey mat kalir, yansima yok. */}
          <ContactShadows
            position={[0, -radius * 1.9, 0]}
            scale={spec.lengthM * 1.5}
            resolution={256}
            far={radius * 4}
            blur={2.6}
            opacity={0.26}
            color={`#${SCHEMATIC.edge.toString(16).padStart(6, '0')}`}
          />
        </Suspense>
        <OrbitControls
          enablePan={false}
          enableDamping
          autoRotate={autoRotate}
          autoRotateSpeed={0.5}
          minDistance={radius * 2.5}
          maxDistance={spec.lengthM * 5}
          makeDefault
        />
      </Canvas>
    </div>
  );
}

export type {MissileSpec};
